/**
 * 发送验证码命令处理器
 */

import { Injectable, Inject } from '../../../core/di/decorators';
import { CommandHandler } from '../../../core/cqrs/decorators';
import { ICommandHandler, CommandResult } from '../../../core/cqrs/types';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../core/di/tokens';
import { SendVerificationCodeCommand } from '../../commands/auth/send-verification-code.command';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { Email } from '../../../domain/value-objects/email.vo';
import { VerificationCodeType } from '../../../shared/types/auth.types';
import { AUTH_ERROR_CODES } from '../../../shared/constants/auth.constants';

// 验证码服务接口
interface IVerificationCodeService {
  sendVerificationCode(
    email: string, 
    type: VerificationCodeType,
    options?: { forceResend?: boolean }
  ): Promise<{
    success: boolean;
    message: string;
    cooldownSeconds?: number;
    attemptsRemaining?: number;
  }>;
}

// 人机验证服务接口
interface ICaptchaService {
  verifyCaptcha(captcha: string, userIp?: string): Promise<boolean>;
}

@CommandHandler(SendVerificationCodeCommand)
@Injectable()
export class SendVerificationCodeHandler implements ICommandHandler<SendVerificationCodeCommand, CommandResult> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.VERIFICATION_CODE_SERVICE)
    private readonly verificationCodeService: IVerificationCodeService,
    @Inject(SERVICE_TOKENS.CAPTCHA_SERVICE)
    private readonly captchaService: ICaptchaService
  ) {}

  async execute(command: SendVerificationCodeCommand): Promise<CommandResult> {
    try {
      // 1. 验证人机验证码（如果需要）
      if (command.requiresCaptcha() && command.captcha) {
        const captchaValid = await this.captchaService.verifyCaptcha(command.captcha);
        if (!captchaValid) {
          return {
            success: false,
            errors: [{
              field: 'captcha',
              message: '人机验证失败',
              code: 'INVALID_CAPTCHA'
            }]
          };
        }
      }

      // 2. 根据验证码类型进行不同的业务逻辑验证
      const businessValidation = await this.validateBusinessRules(command);
      if (!businessValidation.success) {
        return businessValidation;
      }

      // 3. 发送验证码
      const sendResult = await this.verificationCodeService.sendVerificationCode(
        command.email,
        command.type,
        {
          forceResend: command.forceResend
        }
      );

      if (!sendResult.success) {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: sendResult.message,
            code: this.mapSendErrorCode(sendResult)
          }],
          data: {
            cooldownSeconds: sendResult.cooldownSeconds,
            attemptsRemaining: sendResult.attemptsRemaining
          }
        };
      }

      // 4. 返回成功结果
      return {
        success: true,
        data: {
          message: sendResult.message,
          email: command.email,
          type: command.type,
          typeDescription: command.getTypeDescription(),
          attemptsRemaining: sendResult.attemptsRemaining,
          // 仅在开发环境下返回验证码用于测试
          ...(process.env.NODE_ENV === 'development' && (sendResult as any).verificationCode && {
            verificationCode: (sendResult as any).verificationCode
          })
        }
      };

    } catch (error) {
      console.error('Send verification code command failed:', error);
      
      return {
        success: false,
        errors: [{
          field: 'general',
          message: '发送验证码失败，请稍后重试',
          code: AUTH_ERROR_CODES.VERIFICATION_CODE_SEND_FAILED
        }]
      };
    }
  }

  /**
   * 验证业务规则
   */
  private async validateBusinessRules(command: SendVerificationCodeCommand): Promise<CommandResult> {
    const email = Email.create(command.email);

    switch (command.type) {
      case VerificationCodeType.EMAIL_VERIFICATION:
        return this.validateEmailVerification(email);
      
      case VerificationCodeType.PASSWORD_RESET:
        return this.validatePasswordReset(email);
      
      case VerificationCodeType.LOGIN_VERIFICATION:
        return this.validateLoginVerification(email);
      
      default:
        return { success: true };
    }
  }

  /**
   * 验证邮箱验证业务规则
   */
  private async validateEmailVerification(email: Email): Promise<CommandResult> {
    // 邮箱验证码：检查邮箱是否已被注册
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

    return { success: true };
  }

  /**
   * 验证密码重置业务规则
   */
  private async validatePasswordReset(email: Email): Promise<CommandResult> {
    // 密码重置：检查用户是否存在
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return {
        success: false,
        errors: [{
          field: 'email',
          message: '该邮箱未注册',
          code: AUTH_ERROR_CODES.USER_NOT_FOUND
        }]
      };
    }

    // 检查用户状态
    if (!user.canLogin()) {
      return {
        success: false,
        errors: [{
          field: 'email',
          message: '账户状态异常，无法重置密码',
          code: AUTH_ERROR_CODES.ACCOUNT_SUSPENDED
        }]
      };
    }

    return { success: true };
  }

  /**
   * 验证登录验证业务规则
   */
  private async validateLoginVerification(email: Email): Promise<CommandResult> {
    // 登录验证：检查用户是否存在
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return {
        success: false,
        errors: [{
          field: 'email',
          message: '该邮箱未注册',
          code: AUTH_ERROR_CODES.USER_NOT_FOUND
        }]
      };
    }

    return { success: true };
  }

  /**
   * 映射发送错误代码
   */
  private mapSendErrorCode(sendResult: any): string {
    if (sendResult.cooldownSeconds) {
      return AUTH_ERROR_CODES.VERIFICATION_CODE_COOLDOWN;
    }
    
    if (sendResult.attemptsRemaining === 0) {
      return AUTH_ERROR_CODES.VERIFICATION_CODE_LIMIT_EXCEEDED;
    }
    
    return AUTH_ERROR_CODES.VERIFICATION_CODE_SEND_FAILED;
  }
}
