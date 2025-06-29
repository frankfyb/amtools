# AMTools CQRS模块

## 📋 概述

AMTools CQRS模块提供了完整的命令查询职责分离（Command Query Responsibility Segregation）实现，包括事件溯源、聚合根、投影系统和中间件支持。

## 📁 文件结构与功能详解

### 核心文件概览

```
src/core/cqrs/
├── index.ts                    # 模块统一导出入口
├── types.ts                    # 核心类型定义和接口
├── decorators.ts               # 装饰器定义
├── base-classes.ts             # 基础抽象类
├── aggregate-root.ts           # 聚合根实现
├── command-bus.ts              # 命令总线
├── query-bus.ts                # 查询总线
├── event-bus.ts                # 事件总线
├── middleware.ts               # 中间件系统
├── event-store.ts              # 事件存储实现
├── projections.ts              # 投影系统
├── examples/
│   └── user-domain.ts          # 完整用户领域示例
└── README.md                   # 本文档
```

## 📋 详细文件说明

### 1. **index.ts** - 模块入口文件

#### 🎯 **文件作用**
- 统一导出CQRS模块的所有公共API
- 解决命名冲突，提供别名导出
- 为外部模块提供清晰的导入接口

#### 🔧 **使用范围**
- 所有需要使用CQRS功能的模块
- 外部应用程序的入口点
- 单元测试和集成测试

#### 💡 **解决的问题**
- **模块导入复杂性**: 避免深层路径导入
- **命名冲突**: 通过别名解决重复命名
- **API一致性**: 提供统一的导入体验

#### 📖 **使用方法**
```typescript
// 导入所有CQRS功能
import {
  CommandBus,
  QueryBus,
  EventBus,
  BaseCommand,
  BaseQuery,
  AggregateRoot,
  EventStoreFactory
} from '@core/cqrs';

// 使用别名导入解决冲突
import {
  AggregateEventHandler,  // 聚合根的EventHandler
  ExampleUserReadModel    // 示例中的UserReadModel
} from '@core/cqrs';
```

### 2. **types.ts** - 核心类型定义

#### 🎯 **文件作用**
- 定义CQRS模式的核心接口和类型
- 提供错误类型和验证结果类型
- 建立模块间的契约和规范

#### 🔧 **使用范围**
- 所有CQRS相关的实现文件
- 业务领域模型定义
- 第三方扩展和插件

#### 💡 **解决的问题**
- **类型安全**: 提供完整的TypeScript类型支持
- **接口规范**: 统一各组件的接口定义
- **扩展性**: 为自定义实现提供标准接口

#### 📖 **核心类型**
```typescript
// 基础接口
interface ICommand { }                    // 命令接口
interface IQuery { }                      // 查询接口
interface IDomainEvent { }                // 领域事件接口
interface ICommandHandler<T> { }          // 命令处理器接口
interface IQueryHandler<T> { }            // 查询处理器接口

// 总线接口
interface ICommandBus { }                 // 命令总线接口
interface IQueryBus { }                   // 查询总线接口
interface IEventBus { }                   // 事件总线接口

// 高级接口
interface IAggregateRoot { }              // 聚合根接口
interface IEventStore { }                 // 事件存储接口
interface IProjection { }                 // 投影接口
interface IReadModel { }                  // 读模型接口

// 中间件接口
interface ICommandMiddleware { }          // 命令中间件接口
interface IQueryMiddleware { }            // 查询中间件接口
interface IEventMiddleware { }            // 事件中间件接口

// 错误类型
class CQRSError extends Error { }         // CQRS基础错误
class ValidationFailedError { }          // 验证失败错误
class CommandHandlerNotFoundError { }    // 命令处理器未找到错误
```

### 3. **decorators.ts** - 装饰器定义

#### 🎯 **文件作用**
- 提供元数据驱动的处理器注册
- 简化命令和查询处理器的配置
- 支持反射和自动发现机制

#### 🔧 **使用范围**
- 命令处理器类
- 查询处理器类
- 事件处理器类

#### 💡 **解决的问题**
- **配置复杂性**: 通过装饰器简化处理器注册
- **类型关联**: 自动建立命令/查询与处理器的关联
- **元数据管理**: 统一的元数据存储和访问

#### 📖 **使用方法**
```typescript
import { CommandHandler, QueryHandler } from '@core/cqrs';

// 命令处理器装饰器
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<any> {
    // 处理逻辑
  }
}

// 查询处理器装饰器
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery> {
  async execute(query: GetUserByIdQuery): Promise<any> {
    // 查询逻辑
  }
}

// 事件处理器装饰器
@EventHandler(UserCreatedEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // 事件处理逻辑
  }
}
```

### 4. **base-classes.ts** - 基础抽象类

#### 🎯 **文件作用**
- 提供命令、查询、事件和读模型的基础实现
- 内置常用的验证逻辑和工具方法
- 减少重复代码，提高开发效率

#### 🔧 **使用范围**
- 所有业务命令和查询的基类
- 领域事件的基础实现
- 读模型的标准结构

#### 💡 **解决的问题**
- **代码重复**: 提供通用的基础功能
- **验证标准化**: 统一的验证逻辑和错误处理
- **开发效率**: 减少样板代码编写

#### 📖 **主要类**
```typescript
// 基础命令类
export abstract class BaseCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  // 内置验证方法
  async validate(): Promise<ValidationResult>
  protected validateNotEmpty(errors, value, field): void
  protected validateEmail(errors, value, field): void
  protected validateNumberRange(errors, value, field, min?, max?): void
}

// 基础查询类
export abstract class BaseQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  async validate(): Promise<ValidationResult>
}

// 分页查询基类
export abstract class BasePagedQuery extends BaseQuery {
  public page: number = 1;
  public pageSize: number = 20;
  public sortBy?: string;
  public sortOrder: 'asc' | 'desc' = 'asc';

  getSkip(): number
  getLimit(): number
}

// 基础领域事件类
export abstract class BaseDomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly eventType: string;
  // ... 其他属性

  toString(): string
  toJSON(): any
  static fromJSON(json: any): BaseDomainEvent
}

// 基础读模型类
export abstract class BaseReadModel implements IReadModel {
  public readonly id: string;
  public version: number = 0;
  public lastUpdated: Date;

  toJSON(): any
  protected abstract getData(): any
}
```

### 5. **aggregate-root.ts** - 聚合根实现

#### 🎯 **文件作用**
- 实现DDD聚合根模式的核心功能
- 提供事件溯源和快照支持
- 管理聚合的生命周期和状态

#### 🔧 **使用范围**
- 所有业务聚合的基类
- 事件溯源场景
- 复杂业务逻辑封装

#### 💡 **解决的问题**
- **业务逻辑封装**: 将相关的业务规则集中管理
- **数据一致性**: 在聚合边界内保证强一致性
- **事件溯源**: 通过事件重建聚合状态
- **性能优化**: 通过快照减少事件重放开销

#### 📖 **核心功能**
```typescript
// 聚合根基类
export abstract class AggregateRoot implements IAggregateRoot {
  private _id: string;
  private _version: number = 0;
  private _uncommittedEvents: IDomainEvent[] = [];

  // 核心方法
  getUncommittedEvents(): IDomainEvent[]        // 获取未提交事件
  markEventsAsCommitted(): void                 // 标记事件已提交
  loadFromHistory(events: IDomainEvent[]): void // 从事件历史加载
  protected raiseEvent(eventType: string, eventData: any): void // 触发事件

  // 快照支持
  getSnapshot(): any                            // 获取快照
  loadFromSnapshot(snapshot: any): void         // 从快照加载

  // 子类实现
  protected abstract validate(): void          // 验证聚合状态
  protected abstract getState(): any           // 获取状态
  protected abstract restoreState(state: any): void // 恢复状态
}

// 聚合根工厂
export class AggregateRootFactory {
  static register<T>(aggregateType: string, aggregateClass: new (...args: any[]) => T): void
  static create<T>(aggregateType: string, id?: string): T
  static fromHistory<T>(aggregateType: string, events: IDomainEvent[]): T
  static fromSnapshot<T>(aggregateType: string, snapshot: any): T
}

// 装饰器
@Aggregate(aggregateType?: string)            // 聚合类型装饰器
@EventHandler(eventType: string)              // 事件处理器装饰器

// 仓储接口
export interface IAggregateRepository<T extends AggregateRoot> {
  save(aggregate: T): Promise<void>
  getById(id: string): Promise<T | null>
  exists(id: string): Promise<boolean>
}
```

#### 🎯 **使用示例**
```typescript
@Aggregate('User')
export class UserAggregate extends AggregateRoot {
  private name: string = '';
  private email: string = '';

  static create(name: string, email: string): UserAggregate {
    const user = new UserAggregate();
    user.raiseEvent('UserCreated', { name, email });
    return user;
  }

  @EventHandler('UserCreated')
  private onUserCreated(event: any): void {
    this.name = event.eventData.name;
    this.email = event.eventData.email;
  }

  protected validate(): void {
    if (!this.name) throw new Error('Name required');
  }

  protected getState(): any {
    return { name: this.name, email: this.email };
  }

  protected restoreState(state: any): void {
    this.name = state.name;
    this.email = state.email;
  }
}
```

### 6. **command-bus.ts** - 命令总线

#### 🎯 **文件作用**
- 实现命令模式的调度中心
- 管理命令处理器的注册和执行
- 支持中间件管道处理

#### 🔧 **使用范围**
- 所有写操作的入口点
- 业务命令的统一调度
- 横切关注点处理（验证、日志、事务等）

#### 💡 **解决的问题**
- **命令调度**: 自动路由命令到对应处理器
- **解耦**: 命令发送者与处理器解耦
- **横切关注点**: 通过中间件处理通用逻辑
- **错误处理**: 统一的错误处理和日志记录

#### 📖 **核心功能**
```typescript
@Injectable()
export class CommandBus implements ICommandBus {
  // 处理器管理
  register<T extends ICommand>(commandType: string, handler: ICommandHandler<T>): void
  unregister(commandType: string): void

  // 命令执行
  async execute<TResult = any>(command: ICommand): Promise<TResult>

  // 中间件管理
  use(middleware: ICommandMiddleware): void
  clearMiddleware(): void
  getMiddlewareCount(): number

  // 查询方法
  getRegisteredHandlers(): string[]
  hasHandler(commandType: string): boolean
}
```

#### 🎯 **使用示例**
```typescript
// 注册处理器
commandBus.register('CreateUserCommand', new CreateUserCommandHandler());

// 添加中间件
commandBus.use(new ValidationMiddleware());
commandBus.use(new LoggingMiddleware());

// 执行命令
const command = new CreateUserCommand('John', 'john@example.com');
const result = await commandBus.execute(command);
```

### 7. **query-bus.ts** - 查询总线

#### 🎯 **文件作用**
- 实现查询模式的调度中心
- 管理查询处理器的注册和执行
- 支持查询缓存和性能优化

#### 🔧 **使用范围**
- 所有读操作的入口点
- 数据查询的统一调度
- 查询缓存和性能优化

#### 💡 **解决的问题**
- **查询调度**: 自动路由查询到对应处理器
- **性能优化**: 通过缓存中间件提升查询性能
- **查询复杂性**: 支持复杂查询和分页
- **读写分离**: 与命令总线完全分离

#### 📖 **核心功能**
```typescript
@Injectable()
export class QueryBus implements IQueryBus {
  // 处理器管理
  register<T extends IQuery>(queryType: string, handler: IQueryHandler<T>): void
  unregister(queryType: string): void

  // 查询执行
  async execute<TResult = any>(query: IQuery): Promise<TResult>

  // 中间件管理（支持缓存等查询特定中间件）
  use(middleware: IQueryMiddleware): void
  clearMiddleware(): void

  // 查询方法
  getRegisteredHandlers(): string[]
  hasHandler(queryType: string): boolean
}
```

### 8. **event-bus.ts** - 事件总线

#### 🎯 **文件作用**
- 实现发布-订阅模式的事件系统
- 管理事件处理器的注册和分发
- 支持异步事件处理和错误恢复

#### 🔧 **使用范围**
- 领域事件的发布和订阅
- 跨聚合的事件通信
- 投影系统的事件处理

#### 💡 **解决的问题**
- **事件分发**: 将事件分发给所有相关处理器
- **解耦**: 事件发布者与订阅者解耦
- **异步处理**: 支持异步事件处理
- **错误隔离**: 单个处理器失败不影响其他处理器

#### 📖 **核心功能**
```typescript
@Injectable()
export class EventBus implements IEventBus {
  // 订阅管理
  subscribe<T extends IDomainEvent>(eventType: string, handler: IEventHandler<T>): void
  unsubscribe(eventType: string, handler?: IEventHandler<any>): void

  // 事件发布
  async publish(event: IDomainEvent): Promise<void>
  async publishAll(events: IDomainEvent[]): Promise<void>

  // 查询方法
  getSubscribers(eventType: string): IEventHandler<any>[]
  getAllSubscribers(): Map<string, IEventHandler<any>[]>
}
```

### 9. **middleware.ts** - 中间件系统

#### 🎯 **文件作用**
- 实现AOP（面向切面编程）的中间件管道
- 提供常用的横切关注点中间件
- 支持自定义中间件扩展

#### 🔧 **使用范围**
- 命令和查询的预处理和后处理
- 横切关注点（验证、日志、缓存、事务等）
- 性能监控和错误处理

#### 💡 **解决的问题**
- **横切关注点**: 统一处理验证、日志、缓存等
- **代码重用**: 避免在每个处理器中重复相同逻辑
- **可扩展性**: 支持插件式的功能扩展
- **性能优化**: 通过缓存、重试等中间件提升性能

#### 📖 **核心组件**
```typescript
// 中间件管道
export class MiddlewarePipeline<T> {
  use(middleware: (item: T, next: () => Promise<any>) => Promise<any>): this
  async execute(item: T, finalHandler: () => Promise<any>): Promise<any>
}

// 内置中间件
export class ValidationMiddleware implements ICommandMiddleware, IQueryMiddleware
export class LoggingMiddleware implements ICommandMiddleware, IQueryMiddleware, IEventMiddleware
export class PerformanceMiddleware implements ICommandMiddleware, IQueryMiddleware, IEventMiddleware
export class RetryMiddleware implements ICommandMiddleware, IQueryMiddleware
export class CacheMiddleware implements IQueryMiddleware
export class TransactionMiddleware implements ICommandMiddleware
export class AuthorizationMiddleware implements ICommandMiddleware, IQueryMiddleware

// 中间件工厂
export class MiddlewareFactory {
  static createValidation(): ValidationMiddleware
  static createLogging(logger?: any): LoggingMiddleware
  static createPerformance(): PerformanceMiddleware
  static createRetry(maxRetries?, retryDelay?, shouldRetry?): RetryMiddleware
  static createCache(defaultTtl?): CacheMiddleware
  static createTransaction(unitOfWork): TransactionMiddleware
  static createAuthorization(authService): AuthorizationMiddleware
}
```

#### 🎯 **使用示例**
```typescript
// 添加内置中间件
commandBus.use(MiddlewareFactory.createValidation());
commandBus.use(MiddlewareFactory.createLogging());
commandBus.use(MiddlewareFactory.createRetry(3, 1000));

// 自定义中间件
class CustomMiddleware implements ICommandMiddleware {
  async execute<T extends ICommand>(command: T, next: () => Promise<any>): Promise<any> {
    console.log('Before execution');
    const result = await next();
    console.log('After execution');
    return result;
  }
}

commandBus.use(new CustomMiddleware());
```

### 10. **event-store.ts** - 事件存储

#### 🎯 **文件作用**
- 实现事件溯源的核心存储机制
- 提供事件的持久化和查询功能
- 支持快照存储和缓存优化

#### 🔧 **使用范围**
- 事件溯源架构的核心组件
- 聚合根的持久化存储
- 事件历史查询和重放

#### 💡 **解决的问题**
- **事件持久化**: 安全可靠地存储领域事件
- **版本控制**: 处理并发冲突和版本管理
- **性能优化**: 通过快照减少事件重放开销
- **数据恢复**: 支持从事件历史重建系统状态

#### 📖 **核心组件**
```typescript
// 事件存储接口
export interface IEventStore {
  saveEvents(aggregateId: string, events: IDomainEvent[], expectedVersion: number): Promise<void>
  getEvents(aggregateId: string, fromVersion?: number): Promise<IDomainEvent[]>
  getAllEvents(fromTimestamp?: Date): Promise<IDomainEvent[]>
}

// 快照存储接口
export interface ISnapshotStore {
  saveSnapshot(snapshot: ISnapshot): Promise<void>
  getSnapshot(aggregateId: string): Promise<ISnapshot | null>
}

// 内存实现
export class InMemoryEventStore implements IEventStore
export class InMemorySnapshotStore implements ISnapshotStore

// 缓存装饰器
export class CachedEventStore implements IEventStore

// 工厂
export class EventStoreFactory {
  static createInMemory(): { eventStore: InMemoryEventStore; snapshotStore: InMemorySnapshotStore }
  static createFileSystem(basePath: string): { eventStore: FileSystemEventStore; snapshotStore: FileSystemSnapshotStore }
}
```

#### 🎯 **使用示例**
```typescript
// 创建事件存储
const { eventStore, snapshotStore } = EventStoreFactory.createInMemory();

// 保存事件
await eventStore.saveEvents('user-123', events, expectedVersion);

// 加载事件
const events = await eventStore.getEvents('user-123');

// 快照操作
await snapshotStore.saveSnapshot({
  aggregateId: 'user-123',
  aggregateType: 'User',
  version: 10,
  data: aggregateSnapshot,
  timestamp: new Date()
});
```

### 11. **projections.ts** - 投影系统

#### 🎯 **文件作用**
- 实现CQRS读模型的构建和维护
- 提供事件到读模型的转换机制
- 支持投影重建和错误恢复

#### 🔧 **使用范围**
- 构建和维护查询优化的读模型
- 事件驱动的数据同步
- 复杂查询场景的数据准备

#### 💡 **解决的问题**
- **读写分离**: 为查询优化专门的数据结构
- **查询性能**: 预计算复杂查询结果
- **数据同步**: 保持读模型与写模型的一致性
- **容错恢复**: 支持投影重建和错误恢复

#### 📖 **核心组件**
```typescript
// 投影基类
export abstract class BaseProjection implements IProjection {
  abstract handle(event: IDomainEvent): Promise<void>
  async rebuild(): Promise<void>
  protected abstract clearProjection(): Promise<void>
  protected abstract rebuildFromEvents(): Promise<void>
}

// 投影管理器
export class ProjectionManager {
  register(projection: IProjection, eventTypes: string[]): void
  unregister(projectionName: string): void
  async handleEvent(event: IDomainEvent): Promise<void>
  async rebuildAll(): Promise<void>
  async rebuildProjection(projectionName: string): Promise<void>
}

// 读模型存储
export class InMemoryReadModelStore<T extends IReadModel> {
  async save(model: T): Promise<void>
  async getById(id: string): Promise<T | null>
  async query(predicate: (model: T) => boolean): Promise<T[]>
  async queryPaged(predicate, page, pageSize): Promise<{ items: T[]; total: number; page: number; pageSize: number }>
}

// 装饰器
@Projection(name: string, eventTypes: string[])
@ProjectionEventHandler(eventType: string)

// 工厂
export class ProjectionFactory {
  static register<T>(name: string, projectionClass: new (...args: any[]) => T): void
  static create<T>(name: string, ...args: any[]): T
}
```

#### 🎯 **使用示例**
```typescript
@Projection('UserProjection', ['UserCreated', 'UserUpdated'])
export class UserProjection extends BaseProjection {
  constructor(private readModelStore: InMemoryReadModelStore<UserReadModel>) {
    super('UserProjection');
  }

  async handle(event: IDomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'UserCreated':
        await this.handleUserCreated(event);
        break;
      case 'UserUpdated':
        await this.handleUserUpdated(event);
        break;
    }
  }

  @ProjectionEventHandler('UserCreated')
  private async handleUserCreated(event: IDomainEvent): Promise<void> {
    const userReadModel = new UserReadModel(
      event.aggregateId,
      event.eventData.name,
      event.eventData.email,
      true,
      event.timestamp,
      event.timestamp
    );
    await this.readModelStore.save(userReadModel);
  }
}
```

### 12. **examples/user-domain.ts** - 完整示例

#### 🎯 **文件作用**
- 提供完整的CQRS实现示例
- 展示最佳实践和设计模式
- 作为学习和参考的模板

#### 🔧 **使用范围**
- 学习CQRS模式的参考实现
- 新项目的起始模板
- 单元测试和集成测试的示例

#### 💡 **解决的问题**
- **学习曲线**: 提供完整的实现示例
- **最佳实践**: 展示正确的使用方法
- **快速开始**: 减少从零开始的开发时间
- **测试参考**: 提供测试用例的编写示例

#### 📖 **包含内容**
```typescript
// 领域事件
export class UserCreatedEvent extends BaseDomainEvent
export class UserUpdatedEvent extends BaseDomainEvent
export class UserDeactivatedEvent extends BaseDomainEvent

// 聚合根
@Aggregate('User')
export class UserAggregate extends AggregateRoot {
  static create(name: string, email: string): UserAggregate
  updateInfo(name?: string, email?: string): void
  deactivate(): void
}

// 命令
export class CreateUserCommand extends BaseCommand
export class UpdateUserCommand extends BaseCommand
export class DeactivateUserCommand extends BaseCommand

// 查询
export class GetUserByIdQuery extends BaseQuery
export class GetUsersByEmailQuery extends BaseQuery
export class GetUsersQuery extends BasePagedQuery

// 读模型
export class UserReadModel extends BaseReadModel

// 处理器
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand>

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery>
```

#### 🎯 **使用方法**
```typescript
// 导入示例组件
import {
  UserAggregate,
  CreateUserCommand,
  CreateUserCommandHandler,
  GetUserByIdQuery,
  GetUserByIdQueryHandler
} from '@core/cqrs/examples/user-domain';

// 使用示例
const command = new CreateUserCommand('John Doe', 'john@example.com');
const handler = new CreateUserCommandHandler(userRepository);
const result = await handler.execute(command);
```

## 🎯 文件使用场景矩阵

### 按开发阶段分类

| 开发阶段 | 主要使用文件 | 次要使用文件 | 用途说明 |
|---------|-------------|-------------|----------|
| **项目初始化** | `index.ts`, `types.ts` | `examples/user-domain.ts` | 了解API结构，参考示例实现 |
| **领域建模** | `aggregate-root.ts`, `base-classes.ts` | `types.ts`, `decorators.ts` | 定义聚合根和基础类 |
| **命令实现** | `base-classes.ts`, `command-bus.ts` | `decorators.ts`, `middleware.ts` | 实现业务命令和处理器 |
| **查询实现** | `base-classes.ts`, `query-bus.ts` | `projections.ts`, `middleware.ts` | 实现查询和读模型 |
| **事件处理** | `event-bus.ts`, `projections.ts` | `event-store.ts`, `base-classes.ts` | 处理领域事件和投影 |
| **性能优化** | `middleware.ts`, `event-store.ts` | `projections.ts` | 添加缓存、快照等优化 |
| **测试编写** | `examples/user-domain.ts` | 所有文件 | 参考测试用例编写 |

### 按功能需求分类

| 功能需求 | 核心文件 | 支持文件 | 实现复杂度 |
|---------|---------|---------|-----------|
| **简单CRUD** | `base-classes.ts`, `command-bus.ts`, `query-bus.ts` | `decorators.ts` | ⭐⭐ |
| **复杂业务逻辑** | `aggregate-root.ts`, `event-store.ts` | `middleware.ts`, `event-bus.ts` | ⭐⭐⭐⭐ |
| **事件溯源** | `aggregate-root.ts`, `event-store.ts`, `event-bus.ts` | `projections.ts` | ⭐⭐⭐⭐⭐ |
| **读写分离** | `projections.ts`, `query-bus.ts` | `middleware.ts` | ⭐⭐⭐ |
| **性能优化** | `middleware.ts`, `event-store.ts` | `projections.ts` | ⭐⭐⭐ |
| **横切关注点** | `middleware.ts` | `command-bus.ts`, `query-bus.ts` | ⭐⭐ |

### 按团队角色分类

| 团队角色 | 主要关注文件 | 使用频率 | 职责说明 |
|---------|-------------|---------|----------|
| **架构师** | `types.ts`, `index.ts`, `middleware.ts` | 高 | 设计整体架构和接口规范 |
| **后端开发** | `base-classes.ts`, `aggregate-root.ts`, `decorators.ts` | 高 | 实现业务逻辑和聚合根 |
| **前端开发** | `base-classes.ts`, `query-bus.ts` | 中 | 了解查询接口和数据结构 |
| **测试工程师** | `examples/user-domain.ts`, 所有文件 | 中 | 编写单元测试和集成测试 |
| **运维工程师** | `middleware.ts`, `event-store.ts` | 低 | 了解监控和存储机制 |

## 🏗️ 架构层次与文件关系

### 分层架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (Application Layer)                 │
├─────────────────────────────────────────────────────────────┤
│  index.ts (统一入口)                                         │
│  ├── command-bus.ts (命令总线)                               │
│  ├── query-bus.ts (查询总线)                                │
│  └── event-bus.ts (事件总线)                                │
├─────────────────────────────────────────────────────────────┤
│                    领域层 (Domain Layer)                     │
├─────────────────────────────────────────────────────────────┤
│  aggregate-root.ts (聚合根)                                  │
│  ├── base-classes.ts (基础类)                               │
│  ├── types.ts (类型定义)                                    │
│  └── decorators.ts (装饰器)                                 │
├─────────────────────────────────────────────────────────────┤
│                   基础设施层 (Infrastructure Layer)           │
├─────────────────────────────────────────────────────────────┤
│  event-store.ts (事件存储)                                   │
│  ├── projections.ts (投影系统)                              │
│  └── middleware.ts (中间件系统)                             │
├─────────────────────────────────────────────────────────────┤
│                    示例层 (Examples Layer)                   │
├─────────────────────────────────────────────────────────────┤
│  examples/user-domain.ts (完整示例)                          │
└─────────────────────────────────────────────────────────────┘
```

### 依赖关系图

```
index.ts
├── types.ts (被所有文件依赖)
├── decorators.ts
├── base-classes.ts
│   └── types.ts
├── aggregate-root.ts
│   ├── types.ts
│   └── base-classes.ts
├── command-bus.ts
│   ├── types.ts
│   ├── decorators.ts
│   └── middleware.ts
├── query-bus.ts
│   ├── types.ts
│   ├── decorators.ts
│   └── middleware.ts
├── event-bus.ts
│   ├── types.ts
│   └── decorators.ts
├── middleware.ts
│   └── types.ts
├── event-store.ts
│   └── types.ts
├── projections.ts
│   ├── types.ts
│   └── base-classes.ts
└── examples/user-domain.ts
    ├── base-classes.ts
    ├── aggregate-root.ts
    ├── decorators.ts
    └── types.ts
```

## 🚀 快速开始指南

### 1. 新手入门路径 (⭐)
```
1. 阅读 types.ts → 了解核心概念
2. 查看 examples/user-domain.ts → 理解完整实现
3. 使用 base-classes.ts → 创建第一个命令/查询
4. 配置 command-bus.ts, query-bus.ts → 设置基础总线
```

### 2. 中级开发路径 (⭐⭐⭐)
```
1. 学习 aggregate-root.ts → 实现复杂业务逻辑
2. 使用 middleware.ts → 添加横切关注点
3. 配置 event-bus.ts → 处理领域事件
4. 实现 projections.ts → 构建读模型
```

### 3. 高级架构路径 (⭐⭐⭐⭐⭐)
```
1. 深入 event-store.ts → 实现事件溯源
2. 自定义 middleware.ts → 扩展中间件功能
3. 优化 projections.ts → 高性能读模型
4. 集成外部系统 → 消息队列、数据库等
```

## 📊 文件复杂度和学习优先级

| 文件名 | 复杂度 | 学习优先级 | 使用频率 | 说明 |
|--------|--------|-----------|---------|------|
| `types.ts` | ⭐⭐ | 🔥🔥🔥🔥🔥 | 极高 | 必须首先理解的核心概念 |
| `index.ts` | ⭐ | 🔥🔥🔥🔥🔥 | 极高 | 模块入口，必须了解 |
| `base-classes.ts` | ⭐⭐⭐ | 🔥🔥🔥🔥 | 高 | 日常开发的基础类 |
| `decorators.ts` | ⭐⭐ | 🔥🔥🔥🔥 | 高 | 简化配置的重要工具 |
| `command-bus.ts` | ⭐⭐⭐ | 🔥🔥🔥🔥 | 高 | 写操作的核心组件 |
| `query-bus.ts` | ⭐⭐⭐ | 🔥🔥🔥🔥 | 高 | 读操作的核心组件 |
| `aggregate-root.ts` | ⭐⭐⭐⭐ | 🔥🔥🔥 | 中高 | 复杂业务逻辑的核心 |
| `event-bus.ts` | ⭐⭐⭐ | 🔥🔥🔥 | 中高 | 事件驱动架构的核心 |
| `middleware.ts` | ⭐⭐⭐⭐ | 🔥🔥🔥 | 中 | 横切关注点处理 |
| `projections.ts` | ⭐⭐⭐⭐ | 🔥🔥 | 中 | 读模型构建系统 |
| `event-store.ts` | ⭐⭐⭐⭐⭐ | 🔥🔥 | 中 | 事件溯源的核心存储 |
| `examples/user-domain.ts` | ⭐⭐⭐ | 🔥🔥🔥🔥 | 学习期高 | 完整实现示例 |

**图例说明:**
- 复杂度: ⭐ (简单) 到 ⭐⭐⭐⭐⭐ (复杂)
- 学习优先级: 🔥 (可选) 到 🔥🔥🔥🔥🔥 (必须)
- 使用频率: 日常开发中的使用频率

## 🚀 快速开始

### 1. 定义聚合根

```typescript
import { AggregateRoot, Aggregate, EventHandler } from '@core/cqrs';

@Aggregate('User')
export class UserAggregate extends AggregateRoot {
  private name: string = '';
  private email: string = '';
  private isActive: boolean = true;

  static create(name: string, email: string): UserAggregate {
    const user = new UserAggregate();
    user.raiseEvent('UserCreated', { name, email });
    return user;
  }

  updateInfo(name: string, email: string): void {
    this.raiseEvent('UserUpdated', { name, email });
  }

  @EventHandler('UserCreated')
  private onUserCreated(event: any): void {
    this.name = event.eventData.name;
    this.email = event.eventData.email;
  }

  @EventHandler('UserUpdated')
  private onUserUpdated(event: any): void {
    this.name = event.eventData.name;
    this.email = event.eventData.email;
  }

  protected validate(): void {
    if (!this.name) throw new Error('Name is required');
    if (!this.email) throw new Error('Email is required');
  }

  protected getState(): any {
    return { name: this.name, email: this.email, isActive: this.isActive };
  }

  protected restoreState(state: any): void {
    this.name = state.name;
    this.email = state.email;
    this.isActive = state.isActive;
  }
}
```

### 2. 定义命令和处理器

```typescript
import { BaseCommand, CommandHandler, ICommandHandler } from '@core/cqrs';

export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string
  ) {
    super();
  }

  protected validateRequired(errors: ValidationError[]): void {
    this.validateNotEmpty(errors, this.name, 'name');
    this.validateEmail(errors, this.email, 'email');
  }

  protected validateBusinessRules(errors: ValidationError[]): void {
    // 业务规则验证
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private userRepository: IAggregateRepository<UserAggregate>) {}

  async execute(command: CreateUserCommand): Promise<{ userId: string }> {
    const user = UserAggregate.create(command.name, command.email);
    await this.userRepository.save(user);
    return { userId: user.id };
  }
}
```

### 3. 定义查询和处理器

```typescript
import { BaseQuery, QueryHandler, IQueryHandler } from '@core/cqrs';

export class GetUserByIdQuery extends BaseQuery {
  constructor(public readonly userId: string) {
    super();
  }

  protected validateParameters(errors: ValidationError[]): void {
    this.validateNotEmpty(errors, this.userId, 'userId');
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private userReadModelStore: InMemoryReadModelStore<UserReadModel>) {}

  async execute(query: GetUserByIdQuery): Promise<UserReadModel | null> {
    return await this.userReadModelStore.getById(query.userId);
  }
}
```

### 4. 设置投影

```typescript
import { BaseProjection, Projection, ProjectionEventHandler } from '@core/cqrs';

@Projection('UserProjection', ['UserCreated', 'UserUpdated'])
export class UserProjection extends BaseProjection {
  constructor(private readModelStore: InMemoryReadModelStore<UserReadModel>) {
    super('UserProjection');
  }

  async handle(event: IDomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'UserCreated':
        await this.handleUserCreated(event);
        break;
      case 'UserUpdated':
        await this.handleUserUpdated(event);
        break;
    }
  }

  @ProjectionEventHandler('UserCreated')
  private async handleUserCreated(event: IDomainEvent): Promise<void> {
    const userData = event.eventData;
    const userReadModel = new UserReadModel(
      event.aggregateId,
      userData.name,
      userData.email,
      true,
      event.timestamp,
      event.timestamp
    );
    await this.readModelStore.save(userReadModel);
  }

  protected async clearProjection(): Promise<void> {
    await this.readModelStore.clear();
  }

  protected async rebuildFromEvents(): Promise<void> {
    // 从事件存储重建投影
  }
}
```

### 5. 配置系统

```typescript
import { 
  CommandBus, 
  QueryBus, 
  EventBus,
  EventStoreFactory,
  ProjectionManager,
  MiddlewareFactory
} from '@core/cqrs';

// 创建总线
const commandBus = new CommandBus();
const queryBus = new QueryBus();
const eventBus = new EventBus();

// 添加中间件
commandBus.use(MiddlewareFactory.createValidation());
commandBus.use(MiddlewareFactory.createLogging());
queryBus.use(MiddlewareFactory.createCache());

// 创建事件存储
const { eventStore, snapshotStore } = EventStoreFactory.createInMemory();

// 注册处理器
commandBus.register('CreateUserCommand', new CreateUserCommandHandler(userRepository));
queryBus.register('GetUserByIdQuery', new GetUserByIdQueryHandler(userReadModelStore));

// 设置投影
const projectionManager = new ProjectionManager();
const userProjection = new UserProjection(userReadModelStore);
projectionManager.register(userProjection, ['UserCreated', 'UserUpdated']);

// 连接事件总线和投影
eventBus.subscribe('UserCreated', async (event) => {
  await projectionManager.handleEvent(event);
});
```

## 🔧 高级功能

### 中间件系统

```typescript
// 自定义中间件
class CustomMiddleware implements ICommandMiddleware {
  async execute<T extends ICommand>(command: T, next: () => Promise<any>): Promise<any> {
    console.log('Before command execution');
    const result = await next();
    console.log('After command execution');
    return result;
  }
}

commandBus.use(new CustomMiddleware());
```

### 事务支持

```typescript
// 事务中间件
const transactionMiddleware = MiddlewareFactory.createTransaction(unitOfWork);
commandBus.use(transactionMiddleware);
```

### 缓存支持

```typescript
// 查询缓存
const cacheMiddleware = MiddlewareFactory.createCache(300000); // 5分钟TTL
queryBus.use(cacheMiddleware);
```

### 重试机制

```typescript
// 重试中间件
const retryMiddleware = MiddlewareFactory.createRetry(3, 1000, (error) => {
  return error.message.includes('timeout');
});
commandBus.use(retryMiddleware);
```

## 📊 监控和诊断

### 性能监控

```typescript
const performanceMiddleware = MiddlewareFactory.createPerformance();
commandBus.use(performanceMiddleware);

// 获取性能指标
const metrics = performanceMiddleware.getMetrics();
console.log('Command performance:', metrics);
```

### 事件存储统计

```typescript
const stats = eventStore.getStatistics();
console.log('Event store stats:', {
  totalAggregates: stats.totalAggregates,
  totalEvents: stats.totalEvents,
  eventsByAggregate: stats.eventsByAggregate
});
```

### 投影状态

```typescript
const projectionStats = projectionManager.getStatistics();
console.log('Projection stats:', {
  totalProjections: projectionStats.totalProjections,
  rebuildingProjections: projectionStats.rebuildingProjections
});
```

## 🧪 测试支持

### 单元测试

```typescript
describe('UserAggregate', () => {
  test('should create user with valid data', () => {
    const user = UserAggregate.create('John Doe', 'john@example.com');
    
    const events = user.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('UserCreated');
    expect(events[0].eventData).toEqual({
      name: 'John Doe',
      email: 'john@example.com'
    });
  });
});
```

### 集成测试

```typescript
describe('User Domain Integration', () => {
  test('should handle complete user lifecycle', async () => {
    // 创建用户
    const createCommand = new CreateUserCommand('John Doe', 'john@example.com');
    const result = await commandBus.execute(createCommand);
    
    // 查询用户
    const query = new GetUserByIdQuery(result.userId);
    const user = await queryBus.execute(query);
    
    expect(user).toBeDefined();
    expect(user.name).toBe('John Doe');
  });
});
```

## 📚 最佳实践

### 1. 聚合设计
- 保持聚合小而专注
- 通过ID引用其他聚合
- 在聚合边界内保持一致性

### 2. 事件设计
- 事件应该是过去时态
- 包含足够的信息用于重建状态
- 避免在事件中包含敏感信息

### 3. 命令验证
- 在命令级别进行基础验证
- 在聚合中进行业务规则验证
- 使用中间件进行横切关注点

### 4. 查询优化
- 使用专门的读模型
- 实现查询缓存
- 考虑分页和排序

### 5. 错误处理
- 使用特定的错误类型
- 在中间件中处理横切错误
- 提供有意义的错误消息

## 🎯 总结与价值

### 核心价值主张

AMTools CQRS模块提供了一个**完整、可扩展、生产就绪**的CQRS实现，具有以下核心价值：

#### 1. **架构清晰性** 🏗️
- **职责分离**: 命令和查询完全分离，各司其职
- **层次分明**: 清晰的分层架构，便于理解和维护
- **模块化设计**: 每个文件都有明确的职责和边界

#### 2. **开发效率** ⚡
- **基础类库**: 减少80%的样板代码编写
- **装饰器支持**: 简化配置，提高开发体验
- **完整示例**: 快速上手，减少学习成本

#### 3. **企业级特性** 🏢
- **事件溯源**: 完整的事件历史记录和状态重建
- **中间件系统**: 灵活的横切关注点处理
- **性能优化**: 缓存、快照、分页等优化机制

#### 4. **可扩展性** 🔧
- **插件化架构**: 支持自定义中间件和扩展
- **多存储支持**: 内存、文件系统、数据库等多种存储选择
- **投影系统**: 灵活的读模型构建机制

### 适用场景分析

| 场景类型 | 适用度 | 推荐文件组合 | 实施复杂度 |
|---------|--------|-------------|-----------|
| **简单CRUD应用** | ⭐⭐ | `base-classes.ts` + 总线 | 低 |
| **复杂业务系统** | ⭐⭐⭐⭐⭐ | 全套文件 | 中高 |
| **事件驱动架构** | ⭐⭐⭐⭐⭐ | `event-store.ts` + `projections.ts` | 高 |
| **微服务架构** | ⭐⭐⭐⭐ | 总线 + `middleware.ts` | 中 |
| **高并发系统** | ⭐⭐⭐⭐ | `middleware.ts` + `projections.ts` | 中高 |
| **审计要求严格** | ⭐⭐⭐⭐⭐ | `event-store.ts` + `aggregate-root.ts` | 高 |

### 技术决策指南

#### 何时使用CQRS？ ✅
- 读写负载差异很大
- 需要复杂的业务逻辑处理
- 要求严格的审计日志
- 需要事件驱动的架构
- 系统需要高度可扩展

#### 何时不使用CQRS？ ❌
- 简单的CRUD操作
- 团队缺乏DDD经验
- 项目时间紧迫
- 数据一致性要求极高
- 系统规模很小

### 实施建议

#### 渐进式采用策略 📈
```
阶段1: 基础CQRS (1-2周)
├── 使用 base-classes.ts 创建命令和查询
├── 配置 command-bus.ts 和 query-bus.ts
└── 添加基础中间件

阶段2: 事件驱动 (2-3周)
├── 引入 event-bus.ts 处理领域事件
├── 实现 projections.ts 构建读模型
└── 添加性能监控中间件

阶段3: 事件溯源 (3-4周)
├── 实现 aggregate-root.ts 聚合根
├── 配置 event-store.ts 事件存储
└── 添加快照和缓存优化

阶段4: 生产优化 (1-2周)
├── 性能调优和监控
├── 错误处理和恢复机制
└── 文档和培训
```

## 🔗 相关文档

- [DI系统文档](../di/README.md) - 依赖注入和IoC容器
- [Bootstrap模块文档](../bootstrap/README.md) - 应用程序启动和配置
- [路由系统文档](../routing/README.md) - HTTP路由和控制器

## 📞 支持与反馈

### 技术支持
- **文档问题**: 查看各文件的详细注释
- **使用问题**: 参考 `examples/user-domain.ts` 示例
- **性能问题**: 使用 `middleware.ts` 中的性能监控工具

### 贡献指南
1. 遵循现有的代码风格和架构模式
2. 为新功能添加完整的类型定义
3. 提供单元测试和使用示例
4. 更新相关文档

---

**AMTools CQRS Module** - 企业级命令查询职责分离实现
版本: 1.0.0 | 更新时间: 2024年12月 | 许可证: MIT

> 💡 **提示**: 这个CQRS模块是AMTools框架的核心组件之一，与DI系统、Bootstrap模块等紧密集成，为构建现代化的企业级应用提供了坚实的基础。
