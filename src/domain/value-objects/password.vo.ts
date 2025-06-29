/**
 * 密码值对象
 */

import { ValidationUtil } from '../../shared/utils/validation.util';
import { CryptoUtil } from '../../shared/utils/crypto.util';
import { PasswordStrength } from '../../shared/types/auth.types';

export class Password {
  private readonly _value: string;
  private _hashedValue?: string;

  constructor(value: string, isHashed: boolean = false) {
    if (isHashed) {
      this._hashedValue = value;
      this._value = ''; // 已哈希的密码不保存原始值
    } else {
      this.validate(value);
      this._value = value;
    }
  }

  private validate(value: string): void {
    if (!value) {
      throw new InvalidPasswordError('密码不能为空');
    }

    const strength = ValidationUtil.validatePassword(value);
    if (!strength.isValid) {
      throw new InvalidPasswordError(strength.feedback.join('; '));
    }
  }

  /**
   * 获取密码强度
   */
  getStrength(): PasswordStrength {
    if (!this._value) {
      throw new Error('无法获取已哈希密码的强度');
    }
    return ValidationUtil.validatePassword(this._value);
  }

  /**
   * 哈希密码
   */
  async hash(): Promise<string> {
    if (this._hashedValue) {
      return this._hashedValue;
    }

    if (!this._value) {
      throw new Error('无法哈希空密码');
    }

    this._hashedValue = await CryptoUtil.hashPassword(this._value);
    return this._hashedValue;
  }

  /**
   * 验证密码
   */
  async verify(plainPassword: string): Promise<boolean> {
    if (!this._hashedValue) {
      await this.hash();
    }
    return CryptoUtil.comparePassword(plainPassword, this._hashedValue!);
  }

  /**
   * 检查是否已哈希
   */
  isHashed(): boolean {
    return !!this._hashedValue;
  }

  /**
   * 获取哈希值
   */
  getHashedValue(): string {
    if (!this._hashedValue) {
      throw new Error('密码尚未哈希');
    }
    return this._hashedValue;
  }

  /**
   * 创建密码值对象（明文）
   */
  static create(value: string): Password {
    return new Password(value, false);
  }

  /**
   * 创建密码值对象（已哈希）
   */
  static fromHash(hashedValue: string): Password {
    return new Password(hashedValue, true);
  }

  /**
   * 验证密码格式（不创建对象）
   */
  static isValid(value: string): boolean {
    try {
      new Password(value, false);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 生成随机密码
   */
  static generateRandom(length: number = 12): Password {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // 确保包含各种字符类型
    password += 'A'; // 大写字母
    password += 'a'; // 小写字母
    password += '1'; // 数字
    password += '!'; // 特殊字符
    
    // 填充剩余长度
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // 打乱字符顺序
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    return new Password(password, false);
  }

  /**
   * 比较两个密码是否相同（仅限明文）
   */
  equals(other: Password): boolean {
    if (this._hashedValue || other._hashedValue) {
      throw new Error('无法比较已哈希的密码');
    }
    return this._value === other._value;
  }

  /**
   * 清除内存中的明文密码
   */
  clear(): void {
    if (this._value) {
      // 在实际应用中，这里可能需要更安全的内存清理
      (this as any)._value = '';
    }
  }
}

export class InvalidPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}
