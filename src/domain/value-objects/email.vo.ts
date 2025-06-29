/**
 * 邮箱值对象
 */

import { ValidationUtil } from '../../shared/utils/validation.util';

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  private validate(value: string): void {
    if (!value) {
      throw new InvalidEmailError('邮箱不能为空');
    }

    if (!ValidationUtil.isValidEmail(value)) {
      throw new InvalidEmailError('邮箱格式不正确');
    }

    if (ValidationUtil.isDisposableEmail(value)) {
      throw new InvalidEmailError('不支持一次性邮箱');
    }
  }

  get value(): string {
    return this._value;
  }

  get domain(): string {
    return this._value.split('@')[1];
  }

  get localPart(): string {
    return this._value.split('@')[0];
  }

  toString(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  /**
   * 创建邮箱值对象
   */
  static create(value: string): Email {
    return new Email(value);
  }

  /**
   * 验证邮箱格式（不创建对象）
   */
  static isValid(value: string): boolean {
    try {
      new Email(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取邮箱的哈希值（用于隐私保护）
   */
  getHash(): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(this._value).digest('hex');
  }

  /**
   * 获取脱敏的邮箱地址
   */
  getMasked(): string {
    const [localPart, domain] = this._value.split('@');
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : localPart;
    return `${maskedLocal}@${domain}`;
  }
}

export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}
