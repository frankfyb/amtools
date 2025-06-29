/**
 * 验证邮箱命令处理器
 * 
 * 处理用户邮箱验证确认的业务逻辑，包括验证码验证、
 * 用户激活、JWT令牌生成等功能。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { Injectable, Inject } from '../../../core/di/decorators';
import { ICommandHandler, CommandResult } from '../../../core/cqrs/types';
import { CommandHandler } from '../../../core/cqrs/decorators';
import { SERVICE_TOKENS, REPOSITORY_TOKENS, CQRS_TOKENS } from '../../../core/di/tokens';
import { VerifyEmailCommand } from '../../commands/auth/verify-email.command';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { VerificationCodeService } from '../../../infrastructure/services/verification-code.service';
import { JWTService } from '../../../infrastructure/auth/jwt.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { EventBus } from '../../../core/cqrs/event-bus';
import { Email } from '../../../domain/value-objects/email.vo';
import { VerificationCodeType, UserStatus } from '../../../shared/types/auth.types';
import { AUTH_ERROR_CODES } from '../../../shared/constants/auth.constants';
import { ValidationError } from '../../../shared/responses/api-response';

/**
 * 验证邮箱命令处理器
 */
@CommandHandler(VerifyEmailCommand)
@Injectable()
export class VerifyEmailCommandHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.VERIFICATION_CODE_SERVICE)
    private readonly verificationCodeService: VerificationCodeService,
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: JWTService,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: EmailService,
    @Inject(CQRS_TOKENS.EVENT_BUS)
    private readonly eventBus: EventBus
  ) {}

  /**
   * 执行验证邮箱命令
   * 
   * @param command 验证邮箱命令
   * @returns 命令执行结果
   */
  async execute(command: VerifyEmailCommand): Promise<CommandResult<{
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
    };
    user: any;
  }>> {
    try {
      // 1. 验证命令参数
      const validationResult = command.validate();
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }

      // 2. 验证验证码
      const codeVerification = await this.verificationCodeService.verifyCode(
        command.email,
        command.verificationCode,
        VerificationCodeType.EMAIL_VERIFICATION
      );

      if (!codeVerification.success) {
        const errorCode = codeVerification.isExpired ? 
          AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED : 
          AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE;

        return {
          success: false,
          errors: [{
            field: 'verificationCode',
            message: codeVerification.message || '验证码验证失败',
            code: errorCode
          }]
        };
      }

      // 3. 查找用户
      const email = Email.create(command.email);
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: '用户不存在',
            code: AUTH_ERROR_CODES.USER_NOT_FOUND
          }]
        };
      }

      // 4. 检查用户状态
      if (user.isEmailVerified) {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: '邮箱已经验证过了',
            code: 'EMAIL_ALREADY_VERIFIED'
          }]
        };
      }

      if (user.status === UserStatus.SUSPENDED) {
        return {
          success: false,
          errors: [{
            field: 'user',
            message: '账户已被锁定',
            code: 'ACCOUNT_LOCKED'
          }]
        };
      }

      // 5. 验证邮箱并激活用户
      user.verifyEmail();
      user.activate();
      await this.userRepository.save(user);

      // 6. 生成JWT令牌
      const tokens = this.jwtService.generateTokens(
        user.id,
        user.email.value,
        user.username.value,
        user.role,
        [] // 暂时使用空权限数组
      );

      // 7. 发送欢迎邮件
      try {
        await this.emailService.sendWelcomeEmail(
          user.email.value,
          user.username.value
        );
      } catch (emailError) {
        // 邮件发送失败不影响主流程
        console.warn('Welcome email sending failed:', emailError);
      }

      // 8. 发布领域事件（暂时跳过，因为事件类不存在）
      // TODO: 实现EmailVerifiedEvent
      console.log('邮箱验证成功，用户:', user.email.value);

      // 9. 删除已使用的验证码（暂时跳过，因为方法不存在）
      // TODO: 实现deleteCode方法
      console.log('验证码使用完毕，应该删除:', command.email);

      // 10. 返回成功结果
      return {
        success: true,
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            tokenType: tokens.tokenType
          },
          user: {
            id: user.id,
            email: user.email.value,
            username: user.username.value,
            displayName: user.getDisplayName(),
            role: user.role,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          }
        }
      };

    } catch (error) {
      console.error('Verify email command failed:', error);
      
      // 返回通用错误
      return {
        success: false,
        errors: [{
          field: 'general',
          message: '邮箱验证失败，请稍后重试',
          code: 'EMAIL_VERIFICATION_FAILED'
        }]
      };
    }
  }

  /**
   * 获取处理器名称
   * 
   * @returns 处理器名称
   */
  getHandlerName(): string {
    return 'VerifyEmailCommandHandler';
  }

  /**
   * 获取支持的命令类型
   * 
   * @returns 命令类型
   */
  getSupportedCommandType(): string {
    return VerifyEmailCommand.name;
  }

  /**
   * 验证命令是否可以处理
   * 
   * @param command 命令实例
   * @returns 是否可以处理
   */
  canHandle(command: any): boolean {
    return command instanceof VerifyEmailCommand;
  }

  /**
   * 获取处理器描述
   * 
   * @returns 处理器描述
   */
  getDescription(): string {
    return '处理用户邮箱验证确认的命令处理器';
  }

  /**
   * 检查处理器依赖是否就绪
   * 
   * @returns 依赖是否就绪
   */
  isDependenciesReady(): boolean {
    return !!(
      this.userRepository &&
      this.verificationCodeService &&
      this.jwtService &&
      this.emailService &&
      this.eventBus
    );
  }

  /**
   * 获取处理器统计信息
   * 
   * @returns 统计信息
   */
  getStats(): {
    handlerName: string;
    supportedCommandType: string;
    dependenciesReady: boolean;
    lastExecutionTime?: Date;
  } {
    return {
      handlerName: this.getHandlerName(),
      supportedCommandType: this.getSupportedCommandType(),
      dependenciesReady: this.isDependenciesReady(),
      lastExecutionTime: new Date()
    };
  }
}
