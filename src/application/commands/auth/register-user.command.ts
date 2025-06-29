/**
 * 注册用户命令
 */

import { ICommand, ValidationResult, ValidationError } from '../../../core/cqrs/types';
import { ValidationUtil } from '../../../shared/utils/validation.util';
import { CryptoUtil } from '../../../shared/utils/crypto.util';
import { UserRole } from '../../../shared/types/auth.types';

export class RegisterUserCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly password: string,
    public readonly confirmPassword: string,
    public readonly verificationCode: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly rememberMe?: boolean,
    public readonly utmSource?: string,
    public readonly utmMedium?: string,
    public readonly utmCampaign?: string,
    public readonly role: UserRole = UserRole.USER
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

    // 验证用户名
    const usernameError = ValidationUtil.validateRequired(this.username, 'username');
    if (usernameError) {
      errors.push(usernameError);
    } else if (!ValidationUtil.isValidUsername(this.username)) {
      errors.push(ValidationUtil.createValidationError(
        'username',
        '用户名格式不正确',
        'INVALID_USERNAME_FORMAT'
      ));
    }

    // 验证密码
    const passwordError = ValidationUtil.validateRequired(this.password, 'password');
    if (passwordError) {
      errors.push(passwordError);
    } else {
      const passwordStrength = ValidationUtil.validatePassword(this.password);
      if (!passwordStrength.isValid) {
        errors.push(ValidationUtil.createValidationError(
          'password',
          passwordStrength.feedback.join('; '),
          'WEAK_PASSWORD'
        ));
      }
    }

    // 验证确认密码
    const confirmPasswordError = ValidationUtil.validateRequired(this.confirmPassword, 'confirmPassword');
    if (confirmPasswordError) {
      errors.push(confirmPasswordError);
    } else if (this.password !== this.confirmPassword) {
      errors.push(ValidationUtil.createValidationError(
        'confirmPassword',
        '两次输入的密码不一致',
        'PASSWORD_MISMATCH'
      ));
    }

    // 验证验证码
    const verificationCodeError = ValidationUtil.validateRequired(this.verificationCode, 'verificationCode');
    if (verificationCodeError) {
      errors.push(verificationCodeError);
    } else if (!ValidationUtil.isValidVerificationCode(this.verificationCode)) {
      errors.push(ValidationUtil.createValidationError(
        'verificationCode',
        '验证码格式不正确',
        'INVALID_VERIFICATION_CODE'
      ));
    }

    // 验证可选字段
    if (this.firstName) {
      const firstNameLengthError = ValidationUtil.validateLength(this.firstName, 'firstName', 1, 50);
      if (firstNameLengthError) {
        errors.push(firstNameLengthError);
      }
    }

    if (this.lastName) {
      const lastNameLengthError = ValidationUtil.validateLength(this.lastName, 'lastName', 1, 50);
      if (lastNameLengthError) {
        errors.push(lastNameLengthError);
      }
    }

    // 验证UTM参数长度
    if (this.utmSource) {
      const utmSourceError = ValidationUtil.validateLength(this.utmSource, 'utmSource', 1, 100);
      if (utmSourceError) {
        errors.push(utmSourceError);
      }
    }

    if (this.utmMedium) {
      const utmMediumError = ValidationUtil.validateLength(this.utmMedium, 'utmMedium', 1, 100);
      if (utmMediumError) {
        errors.push(utmMediumError);
      }
    }

    if (this.utmCampaign) {
      const utmCampaignError = ValidationUtil.validateLength(this.utmCampaign, 'utmCampaign', 1, 100);
      if (utmCampaignError) {
        errors.push(utmCampaignError);
      }
    }

    return ValidationUtil.createValidationResult(errors.length === 0, errors);
  }

  /**
   * 获取用户显示名称
   */
  getDisplayName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    if (this.firstName) {
      return this.firstName;
    }
    return this.username;
  }

  /**
   * 获取UTM数据
   */
  getUtmData(): { source?: string; medium?: string; campaign?: string } {
    return {
      source: this.utmSource,
      medium: this.utmMedium,
      campaign: this.utmCampaign
    };
  }

  /**
   * 检查是否有UTM数据
   */
  hasUtmData(): boolean {
    return !!(this.utmSource || this.utmMedium || this.utmCampaign);
  }

  /**
   * 获取用户资料数据
   */
  getProfileData(): {
    firstName?: string;
    lastName?: string;
  } {
    return {
      firstName: this.firstName,
      lastName: this.lastName
    };
  }

  /**
   * 转换为普通对象（用于日志记录等）
   */
  toPlainObject(): any {
    return {
      commandId: this.commandId,
      timestamp: this.timestamp,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      rememberMe: this.rememberMe,
      utmData: this.getUtmData(),
      hasUtmData: this.hasUtmData()
      // 注意：不包含密码和验证码等敏感信息
    };
  }
}
