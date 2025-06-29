/**
 * 检查邮箱可用性查询
 * 
 * 用于查询指定邮箱是否已被注册使用的查询对象。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { IQuery, ValidationResult } from '../../../core/cqrs/types';
import { ValidationError } from '../../../shared/responses/api-response';

/**
 * 检查邮箱可用性查询类
 */
export class CheckEmailAvailabilityQuery implements IQuery {
  constructor(
    public readonly email: string
  ) {}

  /**
   * 验证查询参数
   *
   * @returns 验证结果
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证邮箱是否为空
    if (!this.email || typeof this.email !== 'string') {
      errors.push({
        field: 'email',
        message: '邮箱不能为空',
        code: 'EMAIL_REQUIRED',
        value: this.email
      });
      return errors;
    }

    // 验证邮箱长度
    if (this.email.length < 5 || this.email.length > 254) {
      errors.push({
        field: 'email',
        message: '邮箱长度必须在5-254个字符之间',
        code: 'EMAIL_LENGTH_INVALID',
        value: this.email
      });
    }

    // 验证邮箱格式
    if (!this.isValidEmail(this.email)) {
      errors.push({
        field: 'email',
        message: '邮箱格式不正确',
        code: 'INVALID_EMAIL_FORMAT',
        value: this.email
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
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * 获取查询名称
   * 
   * @returns 查询名称
   */
  getQueryName(): string {
    return 'CheckEmailAvailabilityQuery';
  }

  /**
   * 获取查询描述
   * 
   * @returns 查询描述
   */
  getDescription(): string {
    return `检查邮箱 ${this.email} 的可用性`;
  }

  /**
   * 转换为JSON对象
   * 
   * @returns JSON对象
   */
  toJSON(): object {
    return {
      queryName: this.getQueryName(),
      email: this.email,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 创建查询实例的工厂方法
   * 
   * @param email 邮箱地址
   * @returns 查询实例
   */
  static create(email: string): CheckEmailAvailabilityQuery {
    return new CheckEmailAvailabilityQuery(email);
  }

  /**
   * 从请求数据创建查询实例
   * 
   * @param requestData 请求数据
   * @returns 查询实例
   */
  static fromRequest(requestData: { email: string }): CheckEmailAvailabilityQuery {
    return new CheckEmailAvailabilityQuery(requestData.email);
  }

  /**
   * 检查查询是否有效
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
   * 比较两个查询是否相等
   * 
   * @param other 另一个查询
   * @returns 是否相等
   */
  equals(other: CheckEmailAvailabilityQuery): boolean {
    return this.email === other.email;
  }

  /**
   * 克隆查询
   * 
   * @returns 克隆的查询实例
   */
  clone(): CheckEmailAvailabilityQuery {
    return new CheckEmailAvailabilityQuery(this.email);
  }

  /**
   * 获取查询的哈希值
   * 
   * @returns 哈希值
   */
  getHash(): string {
    return Buffer.from(`email_availability:${this.email}`).toString('base64');
  }

  /**
   * 获取缓存键
   * 
   * @returns 缓存键
   */
  getCacheKey(): string {
    return `email_availability:${this.email.toLowerCase()}`;
  }

  /**
   * 获取缓存TTL（秒）
   * 
   * @returns 缓存时间
   */
  getCacheTTL(): number {
    return 300; // 5分钟
  }

  /**
   * 检查是否应该缓存结果
   * 
   * @returns 是否应该缓存
   */
  shouldCache(): boolean {
    return this.isValid();
  }

  /**
   * 获取查询的优先级
   * 
   * @returns 优先级（数字越小优先级越高）
   */
  getPriority(): number {
    return 10; // 低优先级
  }

  /**
   * 检查是否为敏感查询
   * 
   * @returns 是否为敏感查询
   */
  isSensitive(): boolean {
    return false; // 邮箱可用性检查不敏感
  }

  /**
   * 获取用于日志记录的安全版本
   * 
   * @returns 安全的日志对象
   */
  toLogSafeJSON(): object {
    return {
      queryName: this.getQueryName(),
      email: this.maskEmail(this.email),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 掩码邮箱地址（用于日志记录）
   * 
   * @param email 邮箱地址
   * @returns 掩码后的邮箱
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***';
    }

    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2 
      ? `${localPart[0]}***${localPart[localPart.length - 1]}`
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * 获取查询的标签
   * 
   * @returns 标签数组
   */
  getTags(): string[] {
    return ['availability', 'email', 'validation'];
  }

  /**
   * 获取查询的元数据
   * 
   * @returns 元数据对象
   */
  getMetadata(): object {
    return {
      queryName: this.getQueryName(),
      priority: this.getPriority(),
      isSensitive: this.isSensitive(),
      shouldCache: this.shouldCache(),
      cacheTTL: this.getCacheTTL(),
      tags: this.getTags()
    };
  }
}
