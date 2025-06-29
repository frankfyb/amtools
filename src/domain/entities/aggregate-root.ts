/**
 * 聚合根基类
 */

import { IDomainEvent } from '../../core/cqrs/types';

export abstract class AggregateRoot {
  private _domainEvents: IDomainEvent[] = [];

  /**
   * 添加领域事件
   */
  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 获取所有领域事件
   */
  getDomainEvents(): IDomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * 清空领域事件
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * 检查是否有未发布的事件
   */
  hasUnpublishedEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * 获取聚合根ID
   */
  abstract getId(): string;

  /**
   * 获取聚合根版本
   */
  abstract getVersion(): number;
}
