/**
 * 用户名值对象
 */

import { ValidationUtil } from '../../shared/utils/validation.util';

export class Username {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.trim();
  }

  private validate(value: string): void {
    if (!value) {
      throw new InvalidUsernameError('用户名不能为空');
    }

    if (!ValidationUtil.isValidUsername(value)) {
      throw new InvalidUsernameError('用户名格式不正确');
    }
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: Username): boolean {
    return this._value.toLowerCase() === other._value.toLowerCase();
  }

  /**
   * 创建用户名值对象
   */
  static create(value: string): Username {
    return new Username(value);
  }

  /**
   * 验证用户名格式（不创建对象）
   */
  static isValid(value: string): boolean {
    try {
      new Username(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取用户名的长度
   */
  getLength(): number {
    return this._value.length;
  }

  /**
   * 检查是否包含特定字符
   */
  contains(substring: string): boolean {
    return this._value.toLowerCase().includes(substring.toLowerCase());
  }

  /**
   * 获取用户名的首字母
   */
  getInitial(): string {
    return this._value.charAt(0).toUpperCase();
  }
}

export class InvalidUsernameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUsernameError';
  }
}
