/**
 * 刷新令牌命令处理器
 * 
 * 处理JWT令牌刷新请求，包括令牌验证、黑名单检查、用户状态验证和新令牌生成
 * 实现安全的令牌轮换机制，防止令牌重放攻击
 */

import { CommandHandler, ICommandHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { JWTService } from '../../../infrastructure/auth/jwt.service';
import { ITokenBlacklistService } from '../../../domain/services/token-blacklist.service.interface';
import { RefreshTokenCommand } from '../../commands/auth/refresh-token.command';
import { CommandResult } from '../../../shared/types/cqrs.types';
import { AuthTokens } from '../../../shared/types/auth.types';
import { User } from '../../../domain/entities/user.entity';
import { 
  InvalidTokenException,
  TokenExpiredException,
  UserNotFoundException
} from '../../../shared/exceptions/auth.exceptions';

/**
 * 刷新令牌结果接口
 */
interface RefreshTokenResult {
  /** 新的认证令牌 */
  tokens: AuthTokens;
  /** 用户信息 */
  user: User;
  /** 刷新时间 */
  refreshTime: Date;
}

@CommandHandler(RefreshTokenCommand)
@Injectable()
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: JWTService,
    @Inject(SERVICE_TOKENS.TOKEN_BLACKLIST_SERVICE)
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  /**
   * 执行刷新令牌命令
   */
  async execute(command: RefreshTokenCommand): Promise<CommandResult<RefreshTokenResult>> {
    try {
      // 1. 验证命令参数
      const validation = command.validate();
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new InvalidTokenException(errorMessages);
      }

      // 2. 检查令牌是否在黑名单中
      await this.checkTokenBlacklist(command);

      // 3. 验证刷新令牌
      const decodedToken = await this.verifyRefreshToken(command);

      // 4. 获取用户信息
      const user = await this.getUserFromToken(decodedToken);

      // 5. 检查用户状态
      this.checkUserStatus(user);

      // 6. 将旧的刷新令牌加入黑名单
      await this.blacklistOldToken(command, decodedToken);

      // 7. 生成新的令牌对
      const newTokens = await this.generateNewTokens(user);

      const refreshTime = new Date();

      return {
        success: true,
        data: {
          tokens: newTokens,
          user,
          refreshTime
        }
      };
    } catch (error) {
      // 记录令牌刷新失败日志
      console.error('令牌刷新失败:', {
        userId: command.getUserIdFromToken(),
        ipAddress: command.ipAddress,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * 检查令牌是否在黑名单中
   */
  private async checkTokenBlacklist(command: RefreshTokenCommand): Promise<void> {
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(command.refreshToken);
    if (isBlacklisted) {
      throw new InvalidTokenException('刷新令牌已失效，请重新登录');
    }

    // 检查用户级别的黑名单
    const userId = command.getUserIdFromToken();
    if (userId) {
      const payload = command.getTokenPayload();
      const tokenIssuedAt = payload?.iat ? new Date(payload.iat * 1000) : new Date(0);
      
      const isUserBlacklisted = await this.tokenBlacklistService.isUserBlacklisted(
        userId, 
        tokenIssuedAt
      );
      
      if (isUserBlacklisted) {
        throw new InvalidTokenException('用户令牌已被全局撤销，请重新登录');
      }
    }
  }

  /**
   * 验证刷新令牌
   */
  private async verifyRefreshToken(command: RefreshTokenCommand): Promise<any> {
    try {
      // 使用JWT服务验证令牌
      const decoded = this.jwtService.verifyRefreshToken(command.refreshToken);
      
      // 额外检查令牌类型
      if (decoded.type !== 'refresh') {
        throw new InvalidTokenException('令牌类型不正确');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException('刷新令牌已过期，请重新登录');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new InvalidTokenException('刷新令牌格式不正确');
      }
      if (error.name === 'NotBeforeError') {
        throw new InvalidTokenException('刷新令牌尚未生效');
      }
      
      throw new InvalidTokenException('刷新令牌验证失败');
    }
  }

  /**
   * 从令牌获取用户信息
   */
  private async getUserFromToken(decodedToken: any): Promise<User> {
    const userId = decodedToken.sub || decodedToken.userId;
    if (!userId) {
      throw new InvalidTokenException('令牌中缺少用户标识');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException('用户不存在或已被删除');
    }

    return user;
  }

  /**
   * 检查用户状态
   */
  private checkUserStatus(user: User): void {
    if (!user.canLogin()) {
      throw new InvalidTokenException('用户状态异常，无法刷新令牌');
    }

    if (user.status === 'suspended') {
      throw new InvalidTokenException('账户已被暂停，无法刷新令牌');
    }

    if (user.status === 'inactive') {
      throw new InvalidTokenException('账户已被停用，无法刷新令牌');
    }
  }

  /**
   * 将旧的刷新令牌加入黑名单
   */
  private async blacklistOldToken(command: RefreshTokenCommand, decodedToken: any): Promise<void> {
    try {
      const expiresAt = decodedToken.exp ? new Date(decodedToken.exp * 1000) : new Date(Date.now() + 86400000); // 默认24小时后过期
      
      await this.tokenBlacklistService.addToBlacklist(
        command.refreshToken,
        expiresAt
      );
    } catch (error) {
      console.error('将旧令牌加入黑名单失败:', error);
      // 不抛出错误，因为这不应该阻止令牌刷新
    }
  }

  /**
   * 生成新的令牌对
   */
  private async generateNewTokens(user: User): Promise<AuthTokens> {
    try {
      return this.jwtService.generateTokens(
        user.id,
        user.email.value,
        user.username.value,
        user.role,
        user.permissions || [],
        {
          accessTokenExpiresIn: 3600, // 1小时
          refreshTokenExpiresIn: 604800, // 7天
          audience: 'amtools-web',
          issuer: 'amtools-auth'
        }
      );
    } catch (error) {
      console.error('生成新令牌失败:', error);
      throw new Error('令牌刷新失败，请重新登录');
    }
  }
}
