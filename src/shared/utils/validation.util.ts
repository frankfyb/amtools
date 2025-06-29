/**
 * 验证工具函数
 */

import { EMAIL, PASSWORD, USERNAME } from '../constants/auth.constants';
import { PasswordStrength } from '../types/auth.types';
import { ValidationResult, ValidationError } from '../../core/cqrs/types';

export class ValidationUtil {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    if (!email || email.length > EMAIL.MAX_LENGTH) {
      return false;
    }
    return EMAIL.REGEX.test(email);
  }

  /**
   * 检查是否为一次性邮箱
   */
  static isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return EMAIL.DISPOSABLE_DOMAINS.includes(domain);
  }

  /**
   * 验证用户名格式
   */
  static isValidUsername(username: string): boolean {
    if (!username || 
        username.length < USERNAME.MIN_LENGTH || 
        username.length > USERNAME.MAX_LENGTH) {
      return false;
    }
    
    if (!USERNAME.ALLOWED_CHARS.test(username)) {
      return false;
    }
    
    if (USERNAME.RESERVED_NAMES.includes(username.toLowerCase())) {
      return false;
    }
    
    return true;
  }

  /**
   * 验证密码强度
   */
  static validatePassword(password: string): PasswordStrength {
    const feedback: string[] = [];
    const requirements = {
      minLength: password.length >= PASSWORD.MIN_LENGTH,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: new RegExp(`[${PASSWORD.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)
    };

    let score = 0;

    // 检查长度
    if (!requirements.minLength) {
      feedback.push(`密码长度至少${PASSWORD.MIN_LENGTH}位`);
    } else {
      score += 1;
    }

    // 检查大写字母
    if (PASSWORD.REQUIRE_UPPERCASE && !requirements.hasUppercase) {
      feedback.push('密码必须包含大写字母');
    } else if (requirements.hasUppercase) {
      score += 1;
    }

    // 检查小写字母
    if (PASSWORD.REQUIRE_LOWERCASE && !requirements.hasLowercase) {
      feedback.push('密码必须包含小写字母');
    } else if (requirements.hasLowercase) {
      score += 1;
    }

    // 检查数字
    if (PASSWORD.REQUIRE_NUMBERS && !requirements.hasNumbers) {
      feedback.push('密码必须包含数字');
    } else if (requirements.hasNumbers) {
      score += 1;
    }

    // 检查特殊字符
    if (PASSWORD.REQUIRE_SPECIAL_CHARS && !requirements.hasSpecialChars) {
      feedback.push('密码必须包含特殊字符');
    } else if (requirements.hasSpecialChars) {
      score += 1;
    }

    // 检查常见弱密码
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      feedback.push('密码过于简单，请使用更复杂的密码');
      score = Math.max(0, score - 2);
    }

    // 检查重复字符
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('密码不应包含连续重复的字符');
      score = Math.max(0, score - 1);
    }

    const isValid = Object.values(requirements).every(req => req) && feedback.length === 0;

    return {
      score: Math.min(4, score),
      feedback,
      isValid,
      requirements
    };
  }

  /**
   * 验证验证码格式
   */
  static isValidVerificationCode(code: string): boolean {
    if (!code) return false;
    return /^\d{6}$/.test(code);
  }

  /**
   * 创建验证结果
   */
  static createValidationResult(isValid: boolean, errors: ValidationError[] = []): ValidationResult {
    return { isValid, errors };
  }

  /**
   * 创建验证错误
   */
  static createValidationError(field: string, message: string, code: string): ValidationError {
    return { field, message, code };
  }

  /**
   * 验证必填字段
   */
  static validateRequired(value: any, fieldName: string): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return this.createValidationError(fieldName, `${fieldName}是必填项`, 'REQUIRED');
    }
    return null;
  }

  /**
   * 验证字符串长度
   */
  static validateLength(
    value: string, 
    fieldName: string, 
    minLength?: number, 
    maxLength?: number
  ): ValidationError | null {
    if (minLength && value.length < minLength) {
      return this.createValidationError(
        fieldName, 
        `${fieldName}长度不能少于${minLength}位`, 
        'MIN_LENGTH'
      );
    }
    
    if (maxLength && value.length > maxLength) {
      return this.createValidationError(
        fieldName, 
        `${fieldName}长度不能超过${maxLength}位`, 
        'MAX_LENGTH'
      );
    }
    
    return null;
  }

  /**
   * 验证正则表达式
   */
  static validateRegex(
    value: string, 
    fieldName: string, 
    regex: RegExp, 
    message: string
  ): ValidationError | null {
    if (!regex.test(value)) {
      return this.createValidationError(fieldName, message, 'INVALID_FORMAT');
    }
    return null;
  }

  /**
   * 批量验证
   */
  static validateAll(validators: (() => ValidationError | null)[]): ValidationResult {
    const errors: ValidationError[] = [];
    
    for (const validator of validators) {
      const error = validator();
      if (error) {
        errors.push(error);
      }
    }
    
    return this.createValidationResult(errors.length === 0, errors);
  }
}
