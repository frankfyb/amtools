/**
 * 频率限制服务实现
 * 
 * 基于Redis实现的频率限制服务，用于防止暴力破解和恶意请求
 * 支持滑动窗口和固定窗口两种限制策略
 */

import { Injectable, Inject } from '../../core/di/decorators';
import { EXTERNAL_TOKENS } from '../../core/di/tokens';
import Redis from 'ioredis';

/**
 * 频率限制服务接口
 */
export interface IRateLimiterService {
  /**
   * 检查是否被限制
   * @param key 限制键
   * @param maxAttempts 最大尝试次数
   * @param windowSeconds 时间窗口（秒）
   * @returns 是否被限制
   */
  isLimited(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean>;

  /**
   * 增加尝试次数
   * @param key 限制键
   * @param windowSeconds 时间窗口（秒）
   * @returns 当前尝试次数
   */
  increment(key: string, windowSeconds?: number): Promise<number>;

  /**
   * 获取当前尝试次数
   * @param key 限制键
   * @returns 当前尝试次数
   */
  getCount(key: string): Promise<number>;

  /**
   * 清除限制记录
   * @param key 限制键
   */
  clear(key: string): Promise<void>;

  /**
   * 获取剩余时间
   * @param key 限制键
   * @returns 剩余时间（秒），-1表示无限制
   */
  getTTL(key: string): Promise<number>;
}

/**
 * 频率限制结果
 */
export interface RateLimitResult {
  /** 是否被限制 */
  isLimited: boolean;
  /** 当前尝试次数 */
  currentAttempts: number;
  /** 最大允许次数 */
  maxAttempts: number;
  /** 剩余时间（秒） */
  remainingTime: number;
  /** 重置时间 */
  resetTime: Date;
}

@Injectable()
export class RateLimiterService implements IRateLimiterService {
  private readonly PREFIX = 'rate_limit:';
  
  constructor(
    @Inject(EXTERNAL_TOKENS.REDIS_CLIENT)
    private readonly redisClient: Redis
  ) {}

  /**
   * 检查是否被限制
   */
  async isLimited(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const current = await this.redisClient.get(fullKey);
      
      if (!current) {
        return false;
      }
      
      const attempts = parseInt(current);
      return attempts >= maxAttempts;
    } catch (error) {
      console.error('检查频率限制失败:', error);
      // 如果Redis不可用，为了安全起见，不进行限制
      return false;
    }
  }

  /**
   * 增加尝试次数
   */
  async increment(key: string, windowSeconds: number = 900): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      
      // 使用Lua脚本确保原子性
      const luaScript = `
        local key = KEYS[1]
        local window = ARGV[1]
        local current = redis.call('GET', key)
        
        if current == false then
          redis.call('SET', key, 1)
          redis.call('EXPIRE', key, window)
          return 1
        else
          local count = redis.call('INCR', key)
          local ttl = redis.call('TTL', key)
          if ttl == -1 then
            redis.call('EXPIRE', key, window)
          end
          return count
        end
      `;
      
      const result = await this.redisClient.eval(
        luaScript,
        1,
        fullKey,
        windowSeconds.toString()
      ) as number;
      
      return result;
    } catch (error) {
      console.error('增加频率限制计数失败:', error);
      return 0;
    }
  }

  /**
   * 获取当前尝试次数
   */
  async getCount(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const current = await this.redisClient.get(fullKey);
      return current ? parseInt(current) : 0;
    } catch (error) {
      console.error('获取频率限制计数失败:', error);
      return 0;
    }
  }

  /**
   * 清除限制记录
   */
  async clear(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.redisClient.del(fullKey);
    } catch (error) {
      console.error('清除频率限制记录失败:', error);
    }
  }

  /**
   * 获取剩余时间
   */
  async getTTL(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const ttl = await this.redisClient.ttl(fullKey);
      return ttl;
    } catch (error) {
      console.error('获取频率限制TTL失败:', error);
      return -1;
    }
  }

  /**
   * 检查并增加计数（组合操作）
   */
  async checkAndIncrement(
    key: string, 
    maxAttempts: number, 
    windowSeconds: number
  ): Promise<RateLimitResult> {
    try {
      const fullKey = this.getFullKey(key);
      
      // 使用Lua脚本确保原子性
      const luaScript = `
        local key = KEYS[1]
        local max_attempts = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        
        local current = redis.call('GET', key)
        local count = 0
        
        if current == false then
          redis.call('SET', key, 1)
          redis.call('EXPIRE', key, window)
          count = 1
        else
          count = redis.call('INCR', key)
          local ttl = redis.call('TTL', key)
          if ttl == -1 then
            redis.call('EXPIRE', key, window)
          end
        end
        
        local ttl = redis.call('TTL', key)
        local is_limited = count > max_attempts and 1 or 0
        
        return {count, ttl, is_limited}
      `;
      
      const result = await this.redisClient.eval(
        luaScript,
        1,
        fullKey,
        maxAttempts.toString(),
        windowSeconds.toString()
      ) as [number, number, number];
      
      const [currentAttempts, remainingTime, isLimitedFlag] = result;
      const resetTime = new Date(Date.now() + (remainingTime * 1000));
      
      return {
        isLimited: isLimitedFlag === 1,
        currentAttempts,
        maxAttempts,
        remainingTime,
        resetTime
      };
    } catch (error) {
      console.error('检查并增加频率限制失败:', error);
      
      // 降级处理
      return {
        isLimited: false,
        currentAttempts: 0,
        maxAttempts,
        remainingTime: 0,
        resetTime: new Date()
      };
    }
  }

  /**
   * 滑动窗口频率限制
   */
  async slidingWindowLimit(
    key: string,
    maxAttempts: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    try {
      const fullKey = this.getFullKey(key);
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);
      
      // 使用有序集合实现滑动窗口
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window_start = tonumber(ARGV[2])
        local max_attempts = tonumber(ARGV[3])
        local window_seconds = tonumber(ARGV[4])
        
        -- 清理过期记录
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
        
        -- 获取当前窗口内的请求数
        local current_count = redis.call('ZCARD', key)
        
        -- 添加当前请求
        redis.call('ZADD', key, now, now)
        current_count = current_count + 1
        
        -- 设置过期时间
        redis.call('EXPIRE', key, window_seconds)
        
        local is_limited = current_count > max_attempts and 1 or 0
        
        return {current_count, is_limited}
      `;
      
      const result = await this.redisClient.eval(
        luaScript,
        1,
        fullKey,
        now.toString(),
        windowStart.toString(),
        maxAttempts.toString(),
        windowSeconds.toString()
      ) as [number, number];
      
      const [currentAttempts, isLimitedFlag] = result;
      
      return {
        isLimited: isLimitedFlag === 1,
        currentAttempts,
        maxAttempts,
        remainingTime: windowSeconds,
        resetTime: new Date(now + (windowSeconds * 1000))
      };
    } catch (error) {
      console.error('滑动窗口频率限制失败:', error);
      
      return {
        isLimited: false,
        currentAttempts: 0,
        maxAttempts,
        remainingTime: 0,
        resetTime: new Date()
      };
    }
  }

  /**
   * 批量检查频率限制
   */
  async batchCheck(
    keys: string[],
    maxAttempts: number,
    windowSeconds: number
  ): Promise<Map<string, RateLimitResult>> {
    const results = new Map<string, RateLimitResult>();
    
    // 并发检查所有键
    const promises = keys.map(async (key) => {
      const result = await this.checkAndIncrement(key, maxAttempts, windowSeconds);
      return { key, result };
    });
    
    const resolvedResults = await Promise.allSettled(promises);
    
    resolvedResults.forEach((promiseResult, index) => {
      const key = keys[index];
      
      if (promiseResult.status === 'fulfilled') {
        results.set(key, promiseResult.value.result);
      } else {
        // 失败时返回默认值
        results.set(key, {
          isLimited: false,
          currentAttempts: 0,
          maxAttempts,
          remainingTime: 0,
          resetTime: new Date()
        });
      }
    });
    
    return results;
  }

  /**
   * 获取完整的Redis键
   */
  private getFullKey(key: string): string {
    return `${this.PREFIX}${key}`;
  }
}
