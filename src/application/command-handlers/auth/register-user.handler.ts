/**
 * 注册用户命令处理器
 */

import { Injectable, Inject } from '../../../core/di/decorators';
import { CommandHandler } from '../../../core/cqrs/decorators';
import { ICommandHandler, IEventBus, CommandResult } from '../../../core/cqrs/types';
import { REPOSITORY_TOKENS, SERVICE_TOKENS, CQRS_TOKENS } from '../../../core/di/tokens';
import { RegisterUserCommand } from '../../commands/auth/register-user.command';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Username } from '../../../domain/value-objects/username.vo';
import { UserRegisteredEvent } from '../../../domain/events/user.events';
import { VerificationCodeType } from '../../../shared/types/auth.types';
import { AUTH_ERROR_CODES } from '../../../shared/constants/auth.constants';

// 验证码服务接口
interface IVerificationCodeService {
  verifyCode(email: string, code: string, type: VerificationCodeType): Promise<{
    success: boolean;
    message: string;
    isExpired?: boolean;
  }>;
}

// 邮件服务接口
interface IEmailService {
  sendWelcomeEmail(email: string, username: string): Promise<void>;
}

// JWT服务接口
interface IJWTService {
  generateTokens(userId: string, email: string, username: string, role: string, permissions?: string[]): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

@CommandHandler(RegisterUserCommand)
@Injectable()
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand, CommandResult> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.VERIFICATION_CODE_SERVICE)
    private readonly verificationCodeService: IVerificationCodeService,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: IJWTService,
    @Inject(CQRS_TOKENS.EVENT_BUS)
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: RegisterUserCommand): Promise<CommandResult> {
    try {
      // 1. 验证验证码
      const codeVerification = await this.verificationCodeService.verifyCode(
        command.email,
        command.verificationCode,
        VerificationCodeType.EMAIL_VERIFICATION
      );

      if (!codeVerification.success) {
        return {
          success: false,
          errors: [{
            field: 'verificationCode',
            message: codeVerification.message,
            code: codeVerification.isExpired ? 
              AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED : 
              AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE
          }]
        };
      }

      // 2. 检查邮箱是否已存在
      const email = Email.create(command.email);
      const emailExists = await this.userRepository.existsByEmail(email);
      if (emailExists) {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: '该邮箱已被注册',
            code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS
          }]
        };
      }

      // 3. 检查用户名是否已存在
      const username = Username.create(command.username);
      const usernameExists = await this.userRepository.existsByUsername(username);
      if (usernameExists) {
        return {
          success: false,
          errors: [{
            field: 'username',
            message: '该用户名已被使用',
            code: AUTH_ERROR_CODES.USERNAME_ALREADY_EXISTS
          }]
        };
      }

      // 4. 创建用户实体
      const user = await User.create({
        email: command.email,
        username: command.username,
        password: command.password,
        firstName: command.firstName,
        lastName: command.lastName,
        role: command.role
      });

      // 5. 验证邮箱（因为验证码已经验证成功）
      user.verifyEmail();

      // 6. 保存用户到数据库
      await this.userRepository.save(user);

      // 6. 发布用户注册事件
      const userRegisteredEvent = new UserRegisteredEvent(user.id, {
        email: user.email.value,
        username: user.username.value,
        firstName: command.firstName,
        lastName: command.lastName,
        role: user.role,
        registrationSource: 'web',
        utmData: command.getUtmData()
      });

      await this.eventBus.publish(userRegisteredEvent);

      // 7. 生成 JWT 令牌
      const tokens = this.jwtService.generateTokens(
        user.id,
        user.email.value,
        user.username.value,
        user.role,
        [] // 权限列表，暂时为空
      );

      // 8. 发送欢迎邮件（异步，不阻塞响应）
      this.sendWelcomeEmailAsync(user.email.value, user.username.value);

      // 9. 返回成功结果
      return {
        success: true,
        data: {
          tokens,
          user: {
            userId: user.id,
            email: user.email.value,
            username: user.username.value,
            displayName: user.getDisplayName(),
            role: user.role,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          }
        },
        events: [userRegisteredEvent]
      };

    } catch (error) {
      console.error('Register user command failed:', error);
      
      // 根据错误类型返回不同的错误信息
      if (error.name === 'InvalidEmailError') {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: error.message,
            code: AUTH_ERROR_CODES.INVALID_EMAIL_FORMAT
          }]
        };
      }

      if (error.name === 'InvalidUsernameError') {
        return {
          success: false,
          errors: [{
            field: 'username',
            message: error.message,
            code: AUTH_ERROR_CODES.INVALID_USERNAME_FORMAT
          }]
        };
      }

      if (error.name === 'InvalidPasswordError') {
        return {
          success: false,
          errors: [{
            field: 'password',
            message: error.message,
            code: AUTH_ERROR_CODES.WEAK_PASSWORD
          }]
        };
      }

      // 通用错误
      return {
        success: false,
        errors: [{
          field: 'general',
          message: '注册失败，请稍后重试',
          code: 'REGISTRATION_FAILED'
        }]
      };
    }
  }

  /**
   * 异步发送欢迎邮件
   */
  private async sendWelcomeEmailAsync(email: string, username: string): Promise<void> {
    try {
      await this.emailService.sendWelcomeEmail(email, username);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // 邮件发送失败不应该影响注册流程
    }
  }
}
