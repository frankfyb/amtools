/**
 * 检查用户名可用性查询
 * 
 * 用于查询指定用户名是否已被注册使用的查询对象。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { IQuery, ValidationResult } from '../../../core/cqrs/types';
import { ValidationError } from '../../../shared/responses/api-response';

/**
 * 检查用户名可用性查询类
 */
export class CheckUsernameAvailabilityQuery implements IQuery {
  constructor(
    public readonly username: string
  ) {}

  /**
   * 验证查询参数
   *
   * @returns 验证结果
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证用户名是否为空
    if (!this.username || typeof this.username !== 'string') {
      errors.push({
        field: 'username',
        message: '用户名不能为空',
        code: 'USERNAME_REQUIRED',
        value: this.username
      });
      return errors;
    }

    // 验证用户名长度
    if (this.username.length < 3 || this.username.length > 50) {
      errors.push({
        field: 'username',
        message: '用户名长度必须在3-50个字符之间',
        code: 'USERNAME_LENGTH_INVALID',
        value: this.username
      });
    }

    // 验证用户名格式
    if (!this.isValidUsername(this.username)) {
      errors.push({
        field: 'username',
        message: '用户名只能包含字母、数字、下划线和连字符',
        code: 'INVALID_USERNAME_FORMAT',
        value: this.username
      });
    }

    // 检查保留用户名
    if (this.isReservedUsername(this.username)) {
      errors.push({
        field: 'username',
        message: '该用户名为系统保留，不能使用',
        code: 'RESERVED_USERNAME',
        value: this.username
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证用户名格式
   * 
   * @param username 用户名
   * @returns 是否为有效用户名格式
   */
  private isValidUsername(username: string): boolean {
    // 用户名格式：字母、数字、下划线、连字符
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username);
  }

  /**
   * 检查是否为保留用户名
   * 
   * @param username 用户名
   * @returns 是否为保留用户名
   */
  private isReservedUsername(username: string): boolean {
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail',
      'ftp', 'smtp', 'pop', 'imap', 'dns', 'ns', 'mx', 'blog', 'forum',
      'shop', 'store', 'support', 'help', 'info', 'contact', 'about',
      'terms', 'privacy', 'legal', 'security', 'abuse', 'noreply',
      'no-reply', 'postmaster', 'webmaster', 'hostmaster', 'usenet',
      'news', 'uucp', 'operator', 'manager', 'dumper', 'guest',
      'nobody', 'daemon', 'bin', 'sys', 'sync', 'games', 'man',
      'lp', 'mail', 'news', 'uucp', 'proxy', 'majordom', 'postgres',
      'mysql', 'apache', 'nginx', 'test', 'demo', 'example', 'sample'
    ];

    return reservedUsernames.includes(username.toLowerCase());
  }

  /**
   * 获取查询名称
   * 
   * @returns 查询名称
   */
  getQueryName(): string {
    return 'CheckUsernameAvailabilityQuery';
  }

  /**
   * 获取查询描述
   * 
   * @returns 查询描述
   */
  getDescription(): string {
    return `检查用户名 ${this.username} 的可用性`;
  }

  /**
   * 转换为JSON对象
   * 
   * @returns JSON对象
   */
  toJSON(): object {
    return {
      queryName: this.getQueryName(),
      username: this.username,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 创建查询实例的工厂方法
   * 
   * @param username 用户名
   * @returns 查询实例
   */
  static create(username: string): CheckUsernameAvailabilityQuery {
    return new CheckUsernameAvailabilityQuery(username);
  }

  /**
   * 从请求数据创建查询实例
   * 
   * @param requestData 请求数据
   * @returns 查询实例
   */
  static fromRequest(requestData: { username: string }): CheckUsernameAvailabilityQuery {
    return new CheckUsernameAvailabilityQuery(requestData.username);
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
  equals(other: CheckUsernameAvailabilityQuery): boolean {
    return this.username === other.username;
  }

  /**
   * 克隆查询
   * 
   * @returns 克隆的查询实例
   */
  clone(): CheckUsernameAvailabilityQuery {
    return new CheckUsernameAvailabilityQuery(this.username);
  }

  /**
   * 获取查询的哈希值
   * 
   * @returns 哈希值
   */
  getHash(): string {
    return Buffer.from(`username_availability:${this.username}`).toString('base64');
  }

  /**
   * 获取缓存键
   * 
   * @returns 缓存键
   */
  getCacheKey(): string {
    return `username_availability:${this.username.toLowerCase()}`;
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
    return false; // 用户名可用性检查不敏感
  }

  /**
   * 获取用于日志记录的安全版本
   * 
   * @returns 安全的日志对象
   */
  toLogSafeJSON(): object {
    return {
      queryName: this.getQueryName(),
      username: this.maskUsername(this.username),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 掩码用户名（用于日志记录）
   * 
   * @param username 用户名
   * @returns 掩码后的用户名
   */
  private maskUsername(username: string): string {
    if (!username || username.length < 3) {
      return '***';
    }

    return `${username[0]}***${username[username.length - 1]}`;
  }

  /**
   * 获取查询的标签
   * 
   * @returns 标签数组
   */
  getTags(): string[] {
    return ['availability', 'username', 'validation'];
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

  /**
   * 生成用户名建议
   * 
   * @returns 用户名建议数组
   */
  generateSuggestions(): string[] {
    const suggestions: string[] = [];
    const baseUsername = this.username.toLowerCase();

    // 添加数字后缀
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${baseUsername}${i}`);
    }

    // 添加随机数字后缀
    const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    suggestions.push(`${baseUsername}${randomSuffix}`);

    // 添加年份后缀
    const currentYear = new Date().getFullYear();
    suggestions.push(`${baseUsername}${currentYear}`);

    // 添加下划线变体
    suggestions.push(`${baseUsername}_user`);
    suggestions.push(`user_${baseUsername}`);

    return suggestions.filter(suggestion => 
      suggestion.length >= 3 && 
      suggestion.length <= 50 &&
      this.isValidUsername(suggestion) &&
      !this.isReservedUsername(suggestion)
    );
  }
}
