/**
 * CQRS系统统一导出
 */

// 核心类型和接口
export * from './types';

// 装饰器
export * from './decorators';

// 总线实现
export * from './command-bus';
export * from './query-bus';
export * from './event-bus';

// 基础类
export * from './base-classes';

// 聚合根
export * from './aggregate-root';
export { EventHandler as AggregateEventHandler } from './aggregate-root';

// 中间件系统
export * from './middleware';

// 事件存储
export * from './event-store';

// 投影系统
export * from './projections';

// 示例实现
export * from './examples/user-domain';
export { UserReadModel as ExampleUserReadModel } from './examples/user-domain';
