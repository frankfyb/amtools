/**
 * 查询总线实现
 */

import { Injectable } from '../di/decorators';
import {
  IQuery,
  IQueryBus,
  IQueryHandler,
  QueryHandlerNotFoundError,
  ValidationFailedError,
  ValidationResult
} from './types';

@Injectable()
export class QueryBus implements IQueryBus {
  private readonly handlers = new Map<string, IQueryHandler<any>>();

  /**
   * 执行查询
   */
  async execute<TResult = any>(query: IQuery): Promise<TResult> {
    const queryType = query.constructor.name;

    // 查找处理器
    const handler = this.handlers.get(queryType);
    if (!handler) {
      throw new QueryHandlerNotFoundError(queryType);
    }

    // 执行查询
    try {
      const result = await handler.execute(query);
      return result;
    } catch (error) {
      // 记录错误日志
      console.error(`Query execution failed for ${queryType}:`, error);
      throw error;
    }
  }

  /**
   * 注册查询处理器
   */
  register<TQuery extends IQuery>(
    queryType: new (...args: any[]) => TQuery,
    handler: IQueryHandler<TQuery>
  ): void {
    const queryTypeName = queryType.name;
    
    if (this.handlers.has(queryTypeName)) {
      throw new Error(`Query handler already registered for ${queryTypeName}`);
    }

    this.handlers.set(queryTypeName, handler);
  }

  /**
   * 取消注册查询处理器
   */
  unregister<TQuery extends IQuery>(queryType: new (...args: any[]) => TQuery): void {
    const queryTypeName = queryType.name;
    this.handlers.delete(queryTypeName);
  }

  /**
   * 检查是否已注册处理器
   */
  hasHandler<TQuery extends IQuery>(queryType: new (...args: any[]) => TQuery): boolean {
    const queryTypeName = queryType.name;
    return this.handlers.has(queryTypeName);
  }

  /**
   * 获取所有已注册的查询类型
   */
  getRegisteredQueryTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 清空所有处理器
   */
  clear(): void {
    this.handlers.clear();
  }


}
