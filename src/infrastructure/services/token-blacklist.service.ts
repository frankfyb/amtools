/**
 * 令牌黑名单服务实现
 * 
 * 基于Redis实现的令牌黑名单服务，提供高性能的令牌撤销和验证功能
 * 支持单个令牌黑名单和用户级别的令牌撤销
 */

import { Injectable, Inject } from '../../core/di/decorators';
import { EXTERNAL_TOKENS } from '../../core/di/tokens';
import { 
  ITokenBlacklistService, 
  BlacklistStats, 
  BlacklistServiceError,
  TokenBlacklistServiceException 
} from '../../domain/services/token-blacklist.service.interface';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class TokenBlacklistService implements ITokenBlacklistService {
  private readonly TOKEN_PREFIX = 'blacklist:token:';
  private readonly USER_PREFIX = 'blacklist:user:';
  private readonly STATS_KEY = 'blacklist:stats';
  
  constructor(
    @Inject(EXTERNAL_TOKENS.REDIS_CLIENT)
    private readonly redisClient: Redis
  ) {}

  /**
   * 将令牌加入黑名单
   */
  async addToBlacklist(token: string, expiresAt: Date): Promise<void> {
    try {
      const key = this.getTokenBlacklistKey(token);
      const ttl = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      
      if (ttl > 0) {
        // 存储令牌黑名单记录
        await this.redisClient.setex(key, ttl, JSON.stringify({
          blacklistedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString()
        }));
        
        // 更新统计信息
        await this.updateStats('tokenAdded');
      }
    } catch (error) {
      throw new TokenBlacklistServiceException(
        BlacklistServiceError.STORAGE_UNAVAILABLE,
        '无法将令牌加入黑名单',
        error
      );
    }
  }

  /**
   * 检查令牌是否在黑名单中
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.getTokenBlacklistKey(token);
      const result = await this.redisClient.get(key);
      return result !== null;
    } catch (error) {
      // 如果Redis不可用，为了安全起见，假设令牌未被撤销
      console.error('检查令牌黑名单失败:', error);
      return false;
    }
  }

  /**
   * 将用户的所有令牌加入黑名单
   */
  async blacklistAllUserTokens(userId: string): Promise<void> {
    try {
      const userKey = this.getUserBlacklistKey(userId);
      const timestamp = Date.now().toString();
      
      // 设置用户级别的黑名单标记，有效期24小时
      // 所有在此时间戳之前签发的令牌都将被视为无效
      await this.redisClient.setex(userKey, 86400, timestamp);
      
      // 更新统计信息
      await this.updateStats('userBlacklisted');
    } catch (error) {
      throw new TokenBlacklistServiceException(
        BlacklistServiceError.STORAGE_UNAVAILABLE,
        '无法撤销用户的所有令牌',
        error
      );
    }
  }

  /**
   * 检查用户是否被全局撤销令牌
   */
  async isUserBlacklisted(userId: string, tokenIssuedAt: Date): Promise<boolean> {
    try {
      const userKey = this.getUserBlacklistKey(userId);
      const blacklistTimestamp = await this.redisClient.get(userKey);
      
      if (!blacklistTimestamp) {
        return false;
      }
      
      // 如果令牌签发时间早于黑名单时间，则令牌无效
      const blacklistTime = parseInt(blacklistTimestamp);
      return tokenIssuedAt.getTime() < blacklistTime;
    } catch (error) {
      console.error('检查用户黑名单失败:', error);
      return false;
    }
  }

  /**
   * 清理过期的黑名单记录
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      // Redis会自动清理过期的键，这里主要是清理统计信息
      const pattern = `${this.TOKEN_PREFIX}*`;
      const keys = await this.redisClient.keys(pattern);
      
      let cleanedCount = 0;
      const pipeline = this.redisClient.pipeline();
      
      for (const key of keys) {
        const ttl = await this.redisClient.ttl(key);
        if (ttl === -1) { // 没有过期时间的键
          pipeline.del(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        await pipeline.exec();
      }
      
      // 更新最后清理时间
      await this.redisClient.hset(this.STATS_KEY, 'lastCleanupTime', new Date().toISOString());
      
      return cleanedCount;
    } catch (error) {
      throw new TokenBlacklistServiceException(
        BlacklistServiceError.OPERATION_TIMEOUT,
        '清理过期令牌失败',
        error
      );
    }
  }

  /**
   * 获取黑名单统计信息
   */
  async getBlacklistStats(): Promise<BlacklistStats> {
    try {
      const stats = await this.redisClient.hmget(
        this.STATS_KEY,
        'totalTokens',
        'totalUsers',
        'todayTokens',
        'lastCleanupTime'
      );
      
      // 计算当前活跃的黑名单令牌数量
      const tokenPattern = `${this.TOKEN_PREFIX}*`;
      const userPattern = `${this.USER_PREFIX}*`;
      
      const [tokenKeys, userKeys] = await Promise.all([
        this.redisClient.keys(tokenPattern),
        this.redisClient.keys(userPattern)
      ]);
      
      return {
        totalBlacklistedTokens: tokenKeys.length,
        totalBlacklistedUsers: userKeys.length,
        todayBlacklistedTokens: parseInt(stats[2] || '0'),
        estimatedStorageUsage: this.estimateStorageUsage(tokenKeys.length, userKeys.length),
        lastCleanupTime: stats[3] ? new Date(stats[3]) : undefined
      };
    } catch (error) {
      throw new TokenBlacklistServiceException(
        BlacklistServiceError.STORAGE_UNAVAILABLE,
        '获取黑名单统计信息失败',
        error
      );
    }
  }

  /**
   * 批量检查令牌是否在黑名单中
   */
  async batchCheckBlacklist(tokens: string[]): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    
    if (tokens.length === 0) {
      return result;
    }
    
    try {
      const pipeline = this.redisClient.pipeline();
      const keys = tokens.map(token => this.getTokenBlacklistKey(token));
      
      keys.forEach(key => {
        pipeline.exists(key);
      });
      
      const results = await pipeline.exec();
      
      tokens.forEach((token, index) => {
        const exists = results?.[index]?.[1] as number;
        result.set(token, exists === 1);
      });
      
      return result;
    } catch (error) {
      // 如果批量检查失败，逐个检查
      for (const token of tokens) {
        try {
          const isBlacklisted = await this.isBlacklisted(token);
          result.set(token, isBlacklisted);
        } catch {
          result.set(token, false); // 默认为未撤销
        }
      }
      
      return result;
    }
  }

  /**
   * 生成令牌黑名单键
   */
  private getTokenBlacklistKey(token: string): string {
    // 使用SHA256哈希避免存储完整令牌
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return `${this.TOKEN_PREFIX}${hash}`;
  }

  /**
   * 生成用户黑名单键
   */
  private getUserBlacklistKey(userId: string): string {
    return `${this.USER_PREFIX}${userId}`;
  }

  /**
   * 更新统计信息
   */
  private async updateStats(operation: 'tokenAdded' | 'userBlacklisted'): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const pipeline = this.redisClient.pipeline();
      
      if (operation === 'tokenAdded') {
        pipeline.hincrby(this.STATS_KEY, 'totalTokens', 1);
        pipeline.hincrby(this.STATS_KEY, `todayTokens:${today}`, 1);
      } else if (operation === 'userBlacklisted') {
        pipeline.hincrby(this.STATS_KEY, 'totalUsers', 1);
      }
      
      await pipeline.exec();
    } catch (error) {
      // 统计信息更新失败不应该影响主要功能
      console.warn('更新黑名单统计信息失败:', error);
    }
  }

  /**
   * 估算存储使用量
   */
  private estimateStorageUsage(tokenCount: number, userCount: number): number {
    // 每个令牌记录大约100字节，每个用户记录大约50字节
    return (tokenCount * 100) + (userCount * 50);
  }
}
