/**
 * 发送验证码命令
 */

import { ICommand, ValidationResult, ValidationError } from '../../../core/cqrs/types';
import { ValidationUtil } from '../../../shared/utils/validation.util';
import { CryptoUtil } from '../../../shared/utils/crypto.util';
import { VerificationCodeType } from '../../../shared/types/auth.types';

export class SendVerificationCodeCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly email: string,
    public readonly type: VerificationCodeType,
    public readonly captcha?: string,
    public readonly forceResend: boolean = false
  ) {
    this.commandId = CryptoUtil.generateUUID();
    this.timestamp = new Date();
  }

  /**
   * 验证命令数据
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证邮箱
    const emailError = ValidationUtil.validateRequired(this.email, 'email');
    if (emailError) {
      errors.push(emailError);
    } else if (!ValidationUtil.isValidEmail(this.email)) {
      errors.push(ValidationUtil.createValidationError(
        'email',
        '邮箱格式不正确',
        'INVALID_EMAIL_FORMAT'
      ));
    }

    // 验证验证码类型
    if (!Object.values(VerificationCodeType).includes(this.type)) {
      errors.push(ValidationUtil.createValidationError(
        'type',
        '无效的验证码类型',
        'INVALID_VERIFICATION_TYPE'
      ));
    }

    // 验证人机验证码（如果提供）
    if (this.captcha && this.captcha.length < 4) {
      errors.push(ValidationUtil.createValidationError(
        'captcha',
        '人机验证码格式不正确',
        'INVALID_CAPTCHA'
      ));
    }

    return ValidationUtil.createValidationResult(errors.length === 0, errors);
  }

  /**
   * 获取验证码类型的中文描述
   */
  getTypeDescription(): string {
    const typeMap = {
      [VerificationCodeType.EMAIL_VERIFICATION]: '邮箱验证',
      [VerificationCodeType.PASSWORD_RESET]: '密码重置',
      [VerificationCodeType.LOGIN_VERIFICATION]: '登录验证',
      [VerificationCodeType.PHONE_VERIFICATION]: '手机验证'
    };

    return typeMap[this.type] || '未知类型';
  }

  /**
   * 检查是否需要人机验证
   */
  requiresCaptcha(): boolean {
    // 密码重置和登录验证通常需要人机验证
    return [
      VerificationCodeType.PASSWORD_RESET,
      VerificationCodeType.LOGIN_VERIFICATION
    ].includes(this.type);
  }

  /**
   * 转换为普通对象（用于日志记录等）
   */
  toPlainObject(): any {
    return {
      commandId: this.commandId,
      timestamp: this.timestamp,
      email: this.email,
      type: this.type,
      typeDescription: this.getTypeDescription(),
      forceResend: this.forceResend,
      requiresCaptcha: this.requiresCaptcha(),
      hasCaptcha: !!this.captcha
    };
  }
}
