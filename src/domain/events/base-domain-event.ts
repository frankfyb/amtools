/**
 * 领域事件基类
 */

import { IDomainEvent } from '../../core/cqrs/types';
import { CryptoUtil } from '../../shared/utils/crypto.util';

export abstract class BaseDomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public readonly version: number;

  constructor(
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly eventType: string,
    public readonly eventData: any,
    version: number = 1
  ) {
    this.eventId = CryptoUtil.generateUUID();
    this.timestamp = new Date();
    this.version = version;
  }

  /**
   * 获取事件的唯一标识
   */
  getEventKey(): string {
    return `${this.aggregateType}:${this.aggregateId}:${this.eventType}:${this.version}`;
  }

  /**
   * 获取事件的序列化数据
   */
  serialize(): string {
    return JSON.stringify({
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventType: this.eventType,
      eventData: this.eventData,
      timestamp: this.timestamp.toISOString(),
      version: this.version
    });
  }

  /**
   * 从序列化数据反序列化事件
   */
  static deserialize(data: string): any {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp)
    };
  }

  /**
   * 检查事件是否过期
   */
  isExpired(maxAgeMs: number): boolean {
    const now = new Date();
    return (now.getTime() - this.timestamp.getTime()) > maxAgeMs;
  }

  /**
   * 获取事件发生的时间戳
   */
  getTimestamp(): number {
    return this.timestamp.getTime();
  }

  /**
   * 比较两个事件的时间顺序
   */
  isOlderThan(other: BaseDomainEvent): boolean {
    return this.timestamp < other.timestamp;
  }

  /**
   * 比较两个事件的时间顺序
   */
  isNewerThan(other: BaseDomainEvent): boolean {
    return this.timestamp > other.timestamp;
  }
}
