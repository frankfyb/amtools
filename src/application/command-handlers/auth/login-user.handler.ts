/**
 * 用户登录命令处理器
 * 
 * 处理用户登录请求，包括安全验证、频率限制、密码验证和令牌生成
 * 遵循CQRS架构模式，实现安全的用户认证流程
 */

import { CommandHandler, ICommandHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { JWTService } from '../../../infrastructure/auth/jwt.service';
import { IRateLimiterService } from '../../../infrastructure/services/rate-limiter.service';
import { LoginUserCommand } from '../../commands/auth/login-user.command';
import { CommandResult } from '../../../shared/types/cqrs.types';
import { AuthTokens } from '../../../shared/types/auth.types';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Username } from '../../../domain/value-objects/username.vo';
import {
  InvalidCredentialsException,
  AccountNotVerifiedException,
  AccountSuspendedException,
  TooManyAttemptsException,
  UserNotFoundException
} from '../../../shared/exceptions/auth.exceptions';

/**
 * 登录结果接口
 */
interface LoginResult {
  /** 认证令牌 */
  tokens: AuthTokens;
  /** 用户信息 */
  user: User;
  /** 登录时间 */
  loginTime: Date;
}

@CommandHandler(LoginUserCommand)
@Injectable()
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: JWTService,
    @Inject(SERVICE_TOKENS.RATE_LIMITER_SERVICE)
    private readonly rateLimiterService: IRateLimiterService
  ) {}

  /**
   * 执行登录命令
   */
  async execute(command: LoginUserCommand): Promise<CommandResult<LoginResult>> {
    try {
      // 1. 验证命令参数
      const validation = command.validate();
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new InvalidCredentialsException(errorMessages);
      }

      // 2. 检查登录频率限制
      await this.checkRateLimit(command);

      // 3. 查找用户
      const user = await this.findUser(command);
      if (!user) {
        await this.recordFailedAttempt(command);
        throw new InvalidCredentialsException('邮箱/用户名或密码错误');
      }

      // 4. 验证密码
      const isPasswordValid = await this.validatePassword(user, command.password);
      if (!isPasswordValid) {
        await this.recordFailedAttempt(command);
        throw new InvalidCredentialsException('邮箱/用户名或密码错误');
      }

      // 5. 检查账户状态
      this.checkAccountStatus(user);

      // 6. 生成认证令牌
      const tokens = await this.generateTokens(user, command);

      // 7. 更新用户登录信息
      await this.updateUserLoginInfo(user, command);

      // 8. 清除失败记录
      await this.clearFailedAttempts(command);

      const loginTime = new Date();

      return {
        success: true,
        data: {
          tokens,
          user,
          loginTime
        }
      };
    } catch (error) {
      // 记录登录失败日志
      console.error('用户登录失败:', {
        identifier: command.getNormalizedIdentifier(),
        ipAddress: command.ipAddress,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * 检查登录频率限制
   */
  private async checkRateLimit(command: LoginUserCommand): Promise<void> {
    const rateLimitKey = command.getRateLimitKey();
    const maxAttempts = 5; // 5次尝试
    const windowSeconds = 900; // 15分钟窗口

    const result = await this.rateLimiterService.checkAndIncrement(
      rateLimitKey,
      maxAttempts,
      windowSeconds
    );

    if (result.isLimited) {
      throw new TooManyAttemptsException(
        `登录尝试次数过多，请${Math.ceil(result.remainingTime / 60)}分钟后再试`
      );
    }
  }

  /**
   * 查找用户
   */
  private async findUser(command: LoginUserCommand): Promise<User | null> {
    const identifier = command.getNormalizedIdentifier();

    if (command.isEmailLogin()) {
      const email = Email.create(identifier);
      return await this.userRepository.findByEmail(email);
    } else {
      const username = Username.create(identifier);
      return await this.userRepository.findByUsername(username);
    }
  }

  /**
   * 验证密码
   */
  private async validatePassword(user: User, password: string): Promise<boolean> {
    try {
      return await user.validatePassword(password);
    } catch (error) {
      console.error('密码验证失败:', error);
      return false;
    }
  }

  /**
   * 检查账户状态
   */
  private checkAccountStatus(user: User): void {
    if (!user.isEmailVerified) {
      throw new AccountNotVerifiedException('账户邮箱未验证，请先验证邮箱后再登录');
    }

    if (user.status === 'suspended') {
      throw new AccountSuspendedException('账户已被暂停，请联系管理员');
    }

    if (user.status === 'inactive') {
      throw new AccountSuspendedException('账户已被停用，请联系管理员');
    }

    if (!user.canLogin()) {
      throw new AccountSuspendedException('账户状态异常，无法登录');
    }
  }

  /**
   * 生成认证令牌
   */
  private async generateTokens(user: User, command: LoginUserCommand): Promise<AuthTokens> {
    try {
      // 根据"记住我"选项调整令牌有效期
      const accessTokenExpiresIn = 3600; // 1小时
      const refreshTokenExpiresIn = command.rememberMe ? 2592000 : 604800; // 30天 vs 7天

      return this.jwtService.generateTokens(
        user.id,
        user.email.value,
        user.username.value,
        user.role,
        user.permissions || [],
        {
          accessTokenExpiresIn,
          refreshTokenExpiresIn,
          audience: 'amtools-web',
          issuer: 'amtools-auth'
        }
      );
    } catch (error) {
      console.error('生成令牌失败:', error);
      throw new Error('登录失败，请稍后重试');
    }
  }

  /**
   * 更新用户登录信息
   */
  private async updateUserLoginInfo(user: User, command: LoginUserCommand): Promise<void> {
    try {
      // 记录登录信息
      user.recordLogin();
      
      // 更新最后登录IP和用户代理（如果用户实体支持）
      if (typeof user.updateLoginInfo === 'function') {
        user.updateLoginInfo({
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          loginTime: new Date()
        });
      }

      // 保存用户信息
      await this.userRepository.save(user);
    } catch (error) {
      console.error('更新用户登录信息失败:', error);
      // 不抛出错误，因为登录已经成功
    }
  }

  /**
   * 记录失败尝试
   */
  private async recordFailedAttempt(command: LoginUserCommand): Promise<void> {
    try {
      const rateLimitKey = command.getRateLimitKey();
      await this.rateLimiterService.increment(rateLimitKey, 900); // 15分钟窗口
    } catch (error) {
      console.error('记录失败尝试失败:', error);
    }
  }

  /**
   * 清除失败记录
   */
  private async clearFailedAttempts(command: LoginUserCommand): Promise<void> {
    try {
      const rateLimitKey = command.getRateLimitKey();
      await this.rateLimiterService.clear(rateLimitKey);
    } catch (error) {
      console.error('清除失败记录失败:', error);
    }
  }
}
