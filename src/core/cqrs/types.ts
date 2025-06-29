/**
 * CQRS系统类型定义
 */

// 基础接口
export interface ICommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
  validate?(): Promise<ValidationResult> | ValidationResult;
}

export interface IQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
  validate?(): Promise<ValidationResult> | ValidationResult;
}

export interface IDomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly eventType: string;
  readonly eventData: any;
  readonly timestamp: Date;
  readonly version: number;
}

// 处理器接口
export interface ICommandHandler<TCommand extends ICommand, TResult = any> {
  execute(command: TCommand): Promise<TResult>;
}

export interface IQueryHandler<TQuery extends IQuery, TResult = any> {
  execute(query: TQuery): Promise<TResult>;
}

export interface IEventHandler<TEvent extends IDomainEvent> {
  handle(event: TEvent): Promise<void>;
}

// 总线接口
export interface ICommandBus {
  execute<TResult = any>(command: ICommand): Promise<TResult>;
  register<TCommand extends ICommand>(commandType: new (...args: any[]) => TCommand, handler: ICommandHandler<TCommand>): void;
}

export interface IQueryBus {
  execute<TResult = any>(query: IQuery): Promise<TResult>;
  register<TQuery extends IQuery>(queryType: new (...args: any[]) => TQuery, handler: IQueryHandler<TQuery>): void;
}

export interface IEventBus {
  publish(event: IDomainEvent): Promise<void>;
  publishAll(events: IDomainEvent[]): Promise<void>;
  subscribe<TEvent extends IDomainEvent>(eventType: new (...args: any[]) => TEvent, handler: IEventHandler<TEvent>): void;
}

// 验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// 命令结果
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  events?: IDomainEvent[];
}

// 查询结果
export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  totalCount?: number;
  pageInfo?: PageInfo;
}

export interface PageInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// CQRS错误类型
export class CQRSError extends Error {
  constructor(message: string, public readonly context?: any) {
    super(message);
    this.name = 'CQRSError';
  }
}

export class CommandHandlerNotFoundError extends CQRSError {
  constructor(commandType: string) {
    super(`Command handler not found for command type: ${commandType}`);
    this.name = 'CommandHandlerNotFoundError';
  }
}

export class QueryHandlerNotFoundError extends CQRSError {
  constructor(queryType: string) {
    super(`Query handler not found for query type: ${queryType}`);
    this.name = 'QueryHandlerNotFoundError';
  }
}

export class ValidationFailedError extends CQRSError {
  constructor(public readonly validationErrors: ValidationError[]) {
    super(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    this.name = 'ValidationFailedError';
  }
}

// 聚合根接口
export interface IAggregateRoot {
  readonly id: string;
  readonly version: number;
  getUncommittedEvents(): IDomainEvent[];
  markEventsAsCommitted(): void;
  loadFromHistory(events: IDomainEvent[]): void;
}

// 事件存储接口
export interface IEventStore {
  saveEvents(aggregateId: string, events: IDomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<IDomainEvent[]>;
  getAllEvents(fromTimestamp?: Date): Promise<IDomainEvent[]>;
}

// 快照接口
export interface ISnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: any;
  timestamp: Date;
}

export interface ISnapshotStore {
  saveSnapshot(snapshot: ISnapshot): Promise<void>;
  getSnapshot(aggregateId: string): Promise<ISnapshot | null>;
}

// 中间件接口
export interface ICommandMiddleware {
  execute<TCommand extends ICommand>(command: TCommand, next: () => Promise<any>): Promise<any>;
}

export interface IQueryMiddleware {
  execute<TQuery extends IQuery>(query: TQuery, next: () => Promise<any>): Promise<any>;
}

export interface IEventMiddleware {
  execute<TEvent extends IDomainEvent>(event: TEvent, next: () => Promise<void>): Promise<void>;
}

// 事务接口
export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

// 投影接口
export interface IProjection {
  readonly name: string;
  handle(event: IDomainEvent): Promise<void>;
  rebuild(): Promise<void>;
}

// 读模型接口
export interface IReadModel {
  readonly id: string;
  readonly version: number;
  readonly lastUpdated: Date;
}
