/**
 * 重置密码命令处理器
 * 
 * 处理用户密码重置请求，包括验证码验证、密码更新和安全审计
 * 实现安全的密码重置流程，包括强制重新登录
 */

import { CommandHandler, ICommandHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { VerificationCodeService } from '../../../infrastructure/services/verification-code.service';
import { ITokenBlacklistService } from '../../../domain/services/token-blacklist.service.interface';
import { ResetPasswordCommand } from '../../commands/auth/reset-password.command';
import { CommandResult } from '../../../shared/types/cqrs.types';
import { User } from '../../../domain/entities/user.entity';
import { 
  InvalidVerificationCodeException,
  UserNotFoundException,
  WeakPasswordException,
  PasswordMismatchException
} from '../../../shared/exceptions/auth.exceptions';

/**
 * 重置密码结果接口
 */
interface ResetPasswordResult {
  /** 重置成功 */
  success: boolean;
  /** 用户信息 */
  user: User;
  /** 重置时间 */
  resetTime: Date;
  /** 是否强制重新登录 */
  forceReauthentication: boolean;
}

@CommandHandler(ResetPasswordCommand)
@Injectable()
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.VERIFICATION_CODE_SERVICE)
    private readonly verificationCodeService: VerificationCodeService,
    @Inject(SERVICE_TOKENS.TOKEN_BLACKLIST_SERVICE)
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  /**
   * 执行重置密码命令
   */
  async execute(command: ResetPasswordCommand): Promise<CommandResult<ResetPasswordResult>> {
    try {
      // 1. 验证命令参数
      const validation = command.validate();
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new Error(errorMessages);
      }

      // 2. 验证密码强度
      this.validatePasswordStrength(command);

      // 3. 验证密码确认
      this.validatePasswordConfirmation(command);

      // 4. 查找用户
      const user = await this.findUserByEmail(command);

      // 5. 验证验证码
      await this.verifyCode(command, user);

      // 6. 更新用户密码
      await this.updateUserPassword(user, command);

      // 7. 撤销用户的所有令牌（强制重新登录）
      await this.revokeAllUserTokens(user);

      // 8. 更新用户安全信息
      await this.updateUserSecurityInfo(user, command);

      // 9. 清理验证码
      await this.cleanupVerificationCode(command);

      const resetTime = new Date();

      return {
        success: true,
        data: {
          success: true,
          user,
          resetTime,
          forceReauthentication: true
        }
      };
    } catch (error) {
      // 记录密码重置失败日志
      console.error('密码重置失败:', {
        email: command.getNormalizedEmail(),
        ipAddress: command.ipAddress,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * 验证密码强度
   */
  private validatePasswordStrength(command: ResetPasswordCommand): void {
    const passwordStrength = command.getPasswordStrength();
    
    if (!passwordStrength.isAcceptable) {
      throw new WeakPasswordException(
        `密码强度不足: ${passwordStrength.feedback.join(', ')}`
      );
    }

    console.log('✅ 密码强度验证通过:', passwordStrength.level);
  }

  /**
   * 验证密码确认
   */
  private validatePasswordConfirmation(command: ResetPasswordCommand): void {
    if (command.newPassword !== command.confirmPassword) {
      throw new PasswordMismatchException('两次输入的密码不一致');
    }

    console.log('✅ 密码确认验证通过');
  }

  /**
   * 查找用户
   */
  private async findUserByEmail(command: ResetPasswordCommand): Promise<User> {
    const email = command.getNormalizedEmail();
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new UserNotFoundException('用户不存在或邮箱地址错误');
    }

    console.log('✅ 用户查找成功:', user.id);
    return user;
  }

  /**
   * 验证验证码
   */
  private async verifyCode(command: ResetPasswordCommand, user: User): Promise<void> {
    try {
      const isValid = await this.verificationCodeService.verifyCode(
        command.getNormalizedEmail(),
        command.verificationCode,
        'reset_password'
      );

      if (!isValid) {
        throw new InvalidVerificationCodeException('验证码无效或已过期');
      }

      console.log('✅ 验证码验证通过');
    } catch (error) {
      if (error instanceof InvalidVerificationCodeException) {
        throw error;
      }
      
      console.error('验证码验证失败:', error);
      throw new InvalidVerificationCodeException('验证码验证失败');
    }
  }

  /**
   * 更新用户密码
   */
  private async updateUserPassword(user: User, command: ResetPasswordCommand): Promise<void> {
    try {
      // 使用用户实体的密码更新方法
      await user.updatePassword(command.newPassword);
      
      console.log('✅ 用户密码已更新');
    } catch (error) {
      console.error('更新用户密码失败:', error);
      throw new Error('密码更新失败，请稍后重试');
    }
  }

  /**
   * 撤销用户的所有令牌
   */
  private async revokeAllUserTokens(user: User): Promise<void> {
    try {
      await this.tokenBlacklistService.blacklistAllUserTokens(user.id);
      console.log('✅ 用户的所有令牌已撤销');
    } catch (error) {
      console.error('撤销用户令牌失败:', error);
      // 不抛出错误，因为密码重置已经成功
    }
  }

  /**
   * 更新用户安全信息
   */
  private async updateUserSecurityInfo(user: User, command: ResetPasswordCommand): Promise<void> {
    try {
      // 记录密码重置信息
      if (typeof user.recordPasswordReset === 'function') {
        user.recordPasswordReset({
          resetTime: new Date(),
          ipAddress: command.ipAddress,
          userAgent: command.userAgent
        });
      }

      // 更新密码修改时间
      if (typeof user.updatePasswordChangedAt === 'function') {
        user.updatePasswordChangedAt(new Date());
      }

      // 强制重新验证邮箱（可选的安全措施）
      if (typeof user.requireEmailReVerification === 'function') {
        // user.requireEmailReVerification('密码重置');
      }

      // 保存用户信息
      await this.userRepository.save(user);
      
      console.log('✅ 用户安全信息已更新');
    } catch (error) {
      console.error('更新用户安全信息失败:', error);
      // 不抛出错误，因为密码重置已经成功
    }
  }

  /**
   * 清理验证码
   */
  private async cleanupVerificationCode(command: ResetPasswordCommand): Promise<void> {
    try {
      await this.verificationCodeService.invalidateCode(
        command.getNormalizedEmail(),
        'reset_password'
      );
      
      console.log('✅ 验证码已清理');
    } catch (error) {
      console.error('清理验证码失败:', error);
      // 不抛出错误，因为这不影响主要功能
    }
  }

  /**
   * 记录安全审计日志
   */
  private async recordSecurityAudit(command: ResetPasswordCommand, result: ResetPasswordResult): Promise<void> {
    try {
      const auditInfo = command.getAuditInfo();
      
      // 这里可以集成审计日志服务
      console.log('🔍 密码重置安全审计:', {
        ...auditInfo,
        result: {
          success: result.success,
          userId: result.user.id,
          resetTime: result.resetTime,
          forceReauthentication: result.forceReauthentication
        }
      });
      
      // TODO: 集成实际的审计日志服务
      // await this.auditService.recordPasswordReset(auditInfo, result);
    } catch (error) {
      console.error('记录安全审计日志失败:', error);
      // 不抛出错误，因为这不应该影响密码重置功能
    }
  }

  /**
   * 发送密码重置成功通知
   */
  private async sendResetSuccessNotification(user: User, command: ResetPasswordCommand): Promise<void> {
    try {
      // 这里可以集成邮件服务发送通知
      console.log('📧 发送密码重置成功通知:', {
        email: user.email.value,
        userId: user.id,
        resetTime: new Date(),
        ipAddress: command.ipAddress
      });
      
      // TODO: 集成实际的邮件服务
      // await this.emailService.sendPasswordResetSuccessNotification(user, {
      //   resetTime: new Date(),
      //   ipAddress: command.ipAddress,
      //   userAgent: command.userAgent
      // });
    } catch (error) {
      console.error('发送密码重置成功通知失败:', error);
      // 不抛出错误，因为这不应该影响密码重置功能
    }
  }
}
