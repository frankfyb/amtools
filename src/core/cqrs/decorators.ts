/**
 * CQRS装饰器
 */

import 'reflect-metadata';
import { ICommand, IQuery, IDomainEvent } from './types';

// 元数据键
export const COMMAND_HANDLER_METADATA_KEY = Symbol('commandHandler');
export const QUERY_HANDLER_METADATA_KEY = Symbol('queryHandler');
export const EVENT_HANDLER_METADATA_KEY = Symbol('eventHandler');

/**
 * 命令处理器装饰器
 */
export function CommandHandler<TCommand extends ICommand>(commandType: new (...args: any[]) => TCommand): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA_KEY, commandType, target);
    return target;
  };
}

/**
 * 查询处理器装饰器
 */
export function QueryHandler<TQuery extends IQuery>(queryType: new (...args: any[]) => TQuery): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata(QUERY_HANDLER_METADATA_KEY, queryType, target);
    return target;
  };
}

/**
 * 事件处理器装饰器
 */
export function EventHandler<TEvent extends IDomainEvent>(eventType: new (...args: any[]) => TEvent): ClassDecorator {
  return function <T extends Function>(target: T): T {
    const existingEventTypes = Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, target) || [];
    existingEventTypes.push(eventType);
    Reflect.defineMetadata(EVENT_HANDLER_METADATA_KEY, existingEventTypes, target);
    return target;
  };
}

/**
 * 获取命令处理器元数据
 */
export function getCommandHandlerMetadata(target: any): (new (...args: any[]) => ICommand) | undefined {
  if (!target) return undefined;
  return Reflect.getMetadata(COMMAND_HANDLER_METADATA_KEY, target);
}

/**
 * 获取查询处理器元数据
 */
export function getQueryHandlerMetadata(target: any): (new (...args: any[]) => IQuery) | undefined {
  if (!target) return undefined;
  return Reflect.getMetadata(QUERY_HANDLER_METADATA_KEY, target);
}

/**
 * 获取事件处理器元数据
 */
export function getEventHandlerMetadata(target: any): Array<new (...args: any[]) => IDomainEvent> {
  if (!target) return [];
  return Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, target) || [];
}

/**
 * 检查是否为命令处理器
 */
export function isCommandHandler(target: any): boolean {
  if (!target) return false;
  return Reflect.hasMetadata(COMMAND_HANDLER_METADATA_KEY, target);
}

/**
 * 检查是否为查询处理器
 */
export function isQueryHandler(target: any): boolean {
  if (!target) return false;
  return Reflect.hasMetadata(QUERY_HANDLER_METADATA_KEY, target);
}

/**
 * 检查是否为事件处理器
 */
export function isEventHandler(target: any): boolean {
  if (!target) return false;
  return Reflect.hasMetadata(EVENT_HANDLER_METADATA_KEY, target);
}
