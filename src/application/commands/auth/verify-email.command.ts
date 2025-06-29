/**
 * 验证邮箱命令
 * 
 * 用于处理用户邮箱验证确认的命令，包含邮箱地址和验证码。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { ICommand, ValidationResult } from '../../../core/cqrs/types';
import { ValidationError } from '../../../shared/responses/api-response';

/**
 * 验证邮箱命令类
 */
export class VerifyEmailCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly verificationCode: string
  ) {}

  /**
   * 验证命令参数
   *
   * @returns 验证结果
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证邮箱格式
    if (!this.email || typeof this.email !== 'string') {
      errors.push({
        field: 'email',
        message: '邮箱不能为空',
        code: 'EMAIL_REQUIRED',
        value: this.email
      });
    } else if (!this.isValidEmail(this.email)) {
      errors.push({
        field: 'email',
        message: '邮箱格式不正确',
        code: 'INVALID_EMAIL_FORMAT',
        value: this.email
      });
    }

    // 验证验证码格式
    if (!this.verificationCode || typeof this.verificationCode !== 'string') {
      errors.push({
        field: 'verificationCode',
        message: '验证码不能为空',
        code: 'VERIFICATION_CODE_REQUIRED',
        value: this.verificationCode
      });
    } else if (!this.isValidVerificationCode(this.verificationCode)) {
      errors.push({
        field: 'verificationCode',
        message: '验证码格式不正确，必须是6位数字',
        code: 'INVALID_VERIFICATION_CODE_FORMAT',
        value: this.verificationCode
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证邮箱格式
   * 
   * @param email 邮箱地址
   * @returns 是否为有效邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证验证码格式
   * 
   * @param code 验证码
   * @returns 是否为有效验证码格式
   */
  private isValidVerificationCode(code: string): boolean {
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  }

  /**
   * 获取命令名称
   * 
   * @returns 命令名称
   */
  getCommandName(): string {
    return 'VerifyEmailCommand';
  }

  /**
   * 获取命令描述
   * 
   * @returns 命令描述
   */
  getDescription(): string {
    return `验证邮箱 ${this.email} 的验证码 ${this.verificationCode}`;
  }

  /**
   * 转换为JSON对象
   * 
   * @returns JSON对象
   */
  toJSON(): object {
    return {
      commandName: this.getCommandName(),
      email: this.email,
      verificationCode: this.verificationCode,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 创建命令实例的工厂方法
   * 
   * @param email 邮箱地址
   * @param verificationCode 验证码
   * @returns 验证邮箱命令实例
   */
  static create(email: string, verificationCode: string): VerifyEmailCommand {
    return new VerifyEmailCommand(email, verificationCode);
  }

  /**
   * 从请求数据创建命令实例
   * 
   * @param requestData 请求数据
   * @returns 验证邮箱命令实例
   */
  static fromRequest(requestData: {
    email: string;
    verificationCode: string;
  }): VerifyEmailCommand {
    return new VerifyEmailCommand(
      requestData.email,
      requestData.verificationCode
    );
  }

  /**
   * 检查命令是否有效
   *
   * @returns 是否有效
   */
  isValid(): boolean {
    return this.validate().isValid;
  }

  /**
   * 获取第一个验证错误
   *
   * @returns 第一个验证错误或undefined
   */
  getFirstError(): ValidationError | undefined {
    const result = this.validate();
    return result.errors.length > 0 ? result.errors[0] : undefined;
  }

  /**
   * 获取所有验证错误的消息
   *
   * @returns 错误消息数组
   */
  getErrorMessages(): string[] {
    return this.validate().errors.map(error => error.message);
  }

  /**
   * 比较两个命令是否相等
   * 
   * @param other 另一个命令
   * @returns 是否相等
   */
  equals(other: VerifyEmailCommand): boolean {
    return (
      this.email === other.email &&
      this.verificationCode === other.verificationCode
    );
  }

  /**
   * 克隆命令
   * 
   * @returns 克隆的命令实例
   */
  clone(): VerifyEmailCommand {
    return new VerifyEmailCommand(this.email, this.verificationCode);
  }

  /**
   * 获取命令的哈希值
   * 
   * @returns 哈希值
   */
  getHash(): string {
    return Buffer.from(`${this.email}:${this.verificationCode}`).toString('base64');
  }

  /**
   * 检查是否为敏感命令（包含敏感信息）
   * 
   * @returns 是否为敏感命令
   */
  isSensitive(): boolean {
    return true; // 包含验证码，属于敏感信息
  }

  /**
   * 获取用于日志记录的安全版本（隐藏敏感信息）
   * 
   * @returns 安全的日志对象
   */
  toLogSafeJSON(): object {
    return {
      commandName: this.getCommandName(),
      email: this.email,
      verificationCode: '******', // 隐藏验证码
      timestamp: new Date().toISOString()
    };
  }
}
