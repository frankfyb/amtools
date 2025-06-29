/**
 * 事件总线实现
 */

import { Injectable } from '../di/decorators';
import { IDomainEvent, IEventBus, IEventHandler } from './types';

@Injectable()
export class EventBus implements IEventBus {
  private readonly handlers = new Map<string, IEventHandler<any>[]>();

  /**
   * 发布单个事件
   */
  async publish(event: IDomainEvent): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];

    if (handlers.length === 0) {
      console.warn(`No handlers registered for event type: ${eventType}`);
      return;
    }

    // 并行执行所有处理器
    const promises = handlers.map(handler => this.executeHandler(handler, event));
    await Promise.allSettled(promises);
  }

  /**
   * 发布多个事件
   */
  async publishAll(events: IDomainEvent[]): Promise<void> {
    const promises = events.map(event => this.publish(event));
    await Promise.allSettled(promises);
  }

  /**
   * 订阅事件
   */
  subscribe<TEvent extends IDomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: IEventHandler<TEvent>
  ): void {
    const eventTypeName = eventType.name;
    
    if (!this.handlers.has(eventTypeName)) {
      this.handlers.set(eventTypeName, []);
    }

    const handlers = this.handlers.get(eventTypeName)!;
    handlers.push(handler);
  }

  /**
   * 取消订阅事件
   */
  unsubscribe<TEvent extends IDomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: IEventHandler<TEvent>
  ): void {
    const eventTypeName = eventType.name;
    const handlers = this.handlers.get(eventTypeName);
    
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      // 如果没有处理器了，删除该事件类型
      if (handlers.length === 0) {
        this.handlers.delete(eventTypeName);
      }
    }
  }

  /**
   * 获取事件的处理器数量
   */
  getHandlerCount(eventType: string): number {
    const handlers = this.handlers.get(eventType);
    return handlers ? handlers.length : 0;
  }

  /**
   * 获取所有已注册的事件类型
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 清空所有处理器
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * 执行事件处理器
   */
  private async executeHandler(handler: IEventHandler<any>, event: IDomainEvent): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(`Event handler failed for event ${event.eventType}:`, error);
      // 事件处理失败不应该影响其他处理器的执行
      // 可以在这里添加错误报告逻辑
    }
  }
}
