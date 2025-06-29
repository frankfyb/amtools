/**
 * CQRS基础类
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ICommand, 
  IQuery, 
  IDomainEvent, 
  ValidationResult, 
  ValidationError,
  IReadModel 
} from './types';

/**
 * 基础命令类
 */
export abstract class BaseCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor() {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }

  /**
   * 验证命令（子类可重写）
   */
  async validate(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    // 执行基础验证
    this.validateRequired(errors);
    this.validateBusinessRules(errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证必需字段
   */
  protected abstract validateRequired(errors: ValidationError[]): void;

  /**
   * 验证业务规则
   */
  protected abstract validateBusinessRules(errors: ValidationError[]): void;

  /**
   * 添加验证错误
   */
  protected addError(errors: ValidationError[], field: string, message: string, code: string): void {
    errors.push({ field, message, code });
  }

  /**
   * 验证字符串不为空
   */
  protected validateNotEmpty(
    errors: ValidationError[], 
    value: string | undefined | null, 
    field: string
  ): void {
    if (!value || value.trim().length === 0) {
      this.addError(errors, field, `${field} is required`, 'REQUIRED');
    }
  }

  /**
   * 验证数字范围
   */
  protected validateNumberRange(
    errors: ValidationError[],
    value: number | undefined | null,
    field: string,
    min?: number,
    max?: number
  ): void {
    if (value === undefined || value === null) {
      this.addError(errors, field, `${field} is required`, 'REQUIRED');
      return;
    }

    if (min !== undefined && value < min) {
      this.addError(errors, field, `${field} must be at least ${min}`, 'MIN_VALUE');
    }

    if (max !== undefined && value > max) {
      this.addError(errors, field, `${field} must be at most ${max}`, 'MAX_VALUE');
    }
  }

  /**
   * 验证邮箱格式
   */
  protected validateEmail(
    errors: ValidationError[],
    value: string | undefined | null,
    field: string
  ): void {
    if (!value) {
      this.addError(errors, field, `${field} is required`, 'REQUIRED');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.addError(errors, field, `${field} must be a valid email address`, 'INVALID_EMAIL');
    }
  }
}

/**
 * 基础查询类
 */
export abstract class BaseQuery implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor() {
    this.queryId = uuidv4();
    this.timestamp = new Date();
  }

  /**
   * 验证查询（子类可重写）
   */
  async validate(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    // 执行基础验证
    this.validateParameters(errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证查询参数
   */
  protected abstract validateParameters(errors: ValidationError[]): void;

  /**
   * 添加验证错误
   */
  protected addError(errors: ValidationError[], field: string, message: string, code: string): void {
    errors.push({ field, message, code });
  }
}

/**
 * 分页查询基类
 */
export abstract class BasePagedQuery extends BaseQuery {
  public page: number = 1;
  public pageSize: number = 20;
  public sortBy?: string;
  public sortOrder: 'asc' | 'desc' = 'asc';

  constructor(page?: number, pageSize?: number, sortBy?: string, sortOrder?: 'asc' | 'desc') {
    super();
    if (page !== undefined) this.page = page;
    if (pageSize !== undefined) this.pageSize = pageSize;
    if (sortBy !== undefined) this.sortBy = sortBy;
    if (sortOrder !== undefined) this.sortOrder = sortOrder;
  }

  protected validateParameters(errors: ValidationError[]): void {
    // 验证分页参数
    if (this.page < 1) {
      this.addError(errors, 'page', 'Page must be greater than 0', 'INVALID_PAGE');
    }

    if (this.pageSize < 1 || this.pageSize > 100) {
      this.addError(errors, 'pageSize', 'Page size must be between 1 and 100', 'INVALID_PAGE_SIZE');
    }

    if (this.sortOrder !== 'asc' && this.sortOrder !== 'desc') {
      this.addError(errors, 'sortOrder', 'Sort order must be asc or desc', 'INVALID_SORT_ORDER');
    }
  }

  /**
   * 获取跳过的记录数
   */
  getSkip(): number {
    return (this.page - 1) * this.pageSize;
  }

  /**
   * 获取限制数量
   */
  getLimit(): number {
    return this.pageSize;
  }
}

/**
 * 基础领域事件类
 */
export abstract class BaseDomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly eventType: string;
  public readonly eventData: any;
  public readonly timestamp: Date;
  public readonly version: number;

  constructor(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: any,
    version: number
  ) {
    this.eventId = uuidv4();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventType = eventType;
    this.eventData = eventData;
    this.timestamp = new Date();
    this.version = version;
  }

  /**
   * 获取事件的字符串表示
   */
  toString(): string {
    return `${this.eventType}@${this.aggregateType}[${this.aggregateId}]:v${this.version}`;
  }

  /**
   * 获取事件的JSON表示
   */
  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventType: this.eventType,
      eventData: this.eventData,
      timestamp: this.timestamp.toISOString(),
      version: this.version
    };
  }

  /**
   * 从JSON创建事件
   */
  static fromJSON(json: any): BaseDomainEvent {
    return new (class extends BaseDomainEvent {})(
      json.aggregateId,
      json.aggregateType,
      json.eventType,
      json.eventData,
      json.version
    );
  }
}

/**
 * 基础读模型类
 */
export abstract class BaseReadModel implements IReadModel {
  public readonly id: string;
  public version: number = 0;
  public lastUpdated: Date;

  constructor(id: string) {
    this.id = id;
    this.lastUpdated = new Date();
  }

  /**
   * 更新读模型
   */
  protected updateVersion(version: number): void {
    this.version = version;
    this.lastUpdated = new Date();
  }

  /**
   * 获取读模型的JSON表示
   */
  toJSON(): any {
    return {
      id: this.id,
      version: this.version,
      lastUpdated: this.lastUpdated.toISOString(),
      ...this.getData()
    };
  }

  /**
   * 获取读模型数据（子类实现）
   */
  protected abstract getData(): any;
}

/**
 * 命令验证器接口
 */
export interface ICommandValidator<T extends ICommand> {
  validate(command: T): Promise<ValidationResult>;
}

/**
 * 查询验证器接口
 */
export interface IQueryValidator<T extends IQuery> {
  validate(query: T): Promise<ValidationResult>;
}

/**
 * 基础命令验证器
 */
export abstract class BaseCommandValidator<T extends ICommand> implements ICommandValidator<T> {
  async validate(command: T): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    await this.validateCommand(command, errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected abstract validateCommand(command: T, errors: ValidationError[]): Promise<void>;

  protected addError(errors: ValidationError[], field: string, message: string, code: string): void {
    errors.push({ field, message, code });
  }
}

/**
 * 基础查询验证器
 */
export abstract class BaseQueryValidator<T extends IQuery> implements IQueryValidator<T> {
  async validate(query: T): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    await this.validateQuery(query, errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected abstract validateQuery(query: T, errors: ValidationError[]): Promise<void>;

  protected addError(errors: ValidationError[], field: string, message: string, code: string): void {
    errors.push({ field, message, code });
  }
}
