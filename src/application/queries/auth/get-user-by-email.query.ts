/**
 * 根据邮箱获取用户查询
 */

import { IQuery, ValidationResult, ValidationError } from '../../../core/cqrs/types';
import { ValidationUtil } from '../../../shared/utils/validation.util';
import { CryptoUtil } from '../../../shared/utils/crypto.util';

export class GetUserByEmailQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly email: string,
    public readonly includeDeleted: boolean = false
  ) {
    this.queryId = CryptoUtil.generateUUID();
    this.timestamp = new Date();
  }

  /**
   * 验证查询参数
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

    return ValidationUtil.createValidationResult(errors.length === 0, errors);
  }

  /**
   * 转换为普通对象
   */
  toPlainObject(): any {
    return {
      queryId: this.queryId,
      timestamp: this.timestamp,
      email: this.email,
      includeDeleted: this.includeDeleted
    };
  }
}
