/**
 * 邮箱验证成功领域事件
 * 
 * 当用户成功验证邮箱时触发的领域事件，用于通知其他
 * 业务模块执行相关的后续操作。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { IDomainEvent } from '../../core/domain/domain-event';

/**
 * 邮箱验证成功事件数据
 */
export interface EmailVerifiedEventData {
  /** 用户ID */
  userId: string;
  /** 验证的邮箱地址 */
  email: string;
  /** 验证时间 */
  verifiedAt: Date;
  /** 用户代理信息 */
  userAgent?: string;
  /** IP地址 */
  ipAddress?: string;
  /** 验证来源 */
  source?: string;
}

/**
 * 邮箱验证成功领域事件
 */
export class EmailVerifiedEvent implements IDomainEvent {
  /** 事件名称 */
  public readonly eventName = 'EmailVerified';
  
  /** 事件版本 */
  public readonly version = '1.0.0';
  
  /** 事件发生时间 */
  public readonly occurredOn: Date;
  
  /** 事件ID */
  public readonly eventId: string;
  
  /** 聚合根ID */
  public readonly aggregateId: string;
  
  /** 事件数据 */
  public readonly data: EmailVerifiedEventData;

  constructor(
    userId: string,
    email: string,
    verifiedAt: Date,
    options: {
      userAgent?: string;
      ipAddress?: string;
      source?: string;
    } = {}
  ) {
    this.occurredOn = new Date();
    this.eventId = this.generateEventId();
    this.aggregateId = userId;
    this.data = {
      userId,
      email,
      verifiedAt,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
      source: options.source || 'web'
    };
  }

  /**
   * 生成事件ID
   * 
   * @returns 唯一的事件ID
   */
  private generateEventId(): string {
    return `email_verified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取事件的完整名称
   * 
   * @returns 事件完整名称
   */
  getFullEventName(): string {
    return `${this.eventName}_v${this.version}`;
  }

  /**
   * 获取事件描述
   * 
   * @returns 事件描述
   */
  getDescription(): string {
    return `用户 ${this.data.userId} 在 ${this.data.verifiedAt.toISOString()} 成功验证了邮箱 ${this.data.email}`;
  }

  /**
   * 检查事件是否有效
   * 
   * @returns 是否有效
   */
  isValid(): boolean {
    return !!(
      this.data.userId &&
      this.data.email &&
      this.data.verifiedAt &&
      this.eventId &&
      this.aggregateId
    );
  }

  /**
   * 转换为JSON对象
   * 
   * @returns JSON对象
   */
  toJSON(): object {
    return {
      eventName: this.eventName,
      version: this.version,
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      data: {
        ...this.data,
        verifiedAt: this.data.verifiedAt.toISOString()
      }
    };
  }

  /**
   * 从JSON对象创建事件实例
   * 
   * @param json JSON对象
   * @returns 事件实例
   */
  static fromJSON(json: any): EmailVerifiedEvent {
    const event = new EmailVerifiedEvent(
      json.data.userId,
      json.data.email,
      new Date(json.data.verifiedAt),
      {
        userAgent: json.data.userAgent,
        ipAddress: json.data.ipAddress,
        source: json.data.source
      }
    );

    // 恢复原始的事件ID和时间
    (event as any).eventId = json.eventId;
    (event as any).occurredOn = new Date(json.occurredOn);

    return event;
  }

  /**
   * 比较两个事件是否相等
   * 
   * @param other 另一个事件
   * @returns 是否相等
   */
  equals(other: EmailVerifiedEvent): boolean {
    return (
      this.eventId === other.eventId &&
      this.aggregateId === other.aggregateId &&
      this.data.userId === other.data.userId &&
      this.data.email === other.data.email
    );
  }

  /**
   * 克隆事件
   * 
   * @returns 克隆的事件实例
   */
  clone(): EmailVerifiedEvent {
    return EmailVerifiedEvent.fromJSON(this.toJSON());
  }

  /**
   * 获取事件的哈希值
   * 
   * @returns 哈希值
   */
  getHash(): string {
    const data = `${this.eventName}:${this.aggregateId}:${this.data.email}:${this.occurredOn.getTime()}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * 检查事件是否过期
   * 
   * @param maxAge 最大年龄（毫秒）
   * @returns 是否过期
   */
  isExpired(maxAge: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - this.occurredOn.getTime() > maxAge;
  }

  /**
   * 获取事件的优先级
   * 
   * @returns 优先级（数字越小优先级越高）
   */
  getPriority(): number {
    return 5; // 中等优先级
  }

  /**
   * 检查是否为关键事件
   * 
   * @returns 是否为关键事件
   */
  isCritical(): boolean {
    return false; // 邮箱验证不是关键事件
  }

  /**
   * 获取事件的标签
   * 
   * @returns 标签数组
   */
  getTags(): string[] {
    return ['email', 'verification', 'user', 'authentication'];
  }

  /**
   * 获取事件的元数据
   * 
   * @returns 元数据对象
   */
  getMetadata(): object {
    return {
      eventName: this.eventName,
      version: this.version,
      priority: this.getPriority(),
      isCritical: this.isCritical(),
      tags: this.getTags(),
      source: this.data.source,
      userAgent: this.data.userAgent,
      ipAddress: this.data.ipAddress
    };
  }

  /**
   * 创建事件的工厂方法
   * 
   * @param userId 用户ID
   * @param email 邮箱地址
   * @param options 可选参数
   * @returns 事件实例
   */
  static create(
    userId: string,
    email: string,
    options: {
      userAgent?: string;
      ipAddress?: string;
      source?: string;
    } = {}
  ): EmailVerifiedEvent {
    return new EmailVerifiedEvent(userId, email, new Date(), options);
  }

  /**
   * 批量创建事件
   * 
   * @param users 用户信息数组
   * @returns 事件数组
   */
  static createBatch(users: Array<{
    userId: string;
    email: string;
    userAgent?: string;
    ipAddress?: string;
    source?: string;
  }>): EmailVerifiedEvent[] {
    return users.map(user => EmailVerifiedEvent.create(
      user.userId,
      user.email,
      {
        userAgent: user.userAgent,
        ipAddress: user.ipAddress,
        source: user.source
      }
    ));
  }
}
