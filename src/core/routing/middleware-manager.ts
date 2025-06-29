/**
 * 中间件管理器
 * 
 * 统一管理路由级中间件，支持优先级排序、条件执行、
 * 中间件链管理等功能。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { Injectable } from '../di/decorators';

/**
 * 中间件元数据接口
 */
export interface MiddlewareMetadata {
  /** 中间件名称 */
  name: string;
  /** 优先级（数字越小优先级越高） */
  priority: number;
  /** 是否为全局中间件 */
  global: boolean;
  /** 应用路径模式 */
  pathPattern?: string | RegExp;
  /** 应用的HTTP方法 */
  methods?: string[];
  /** 执行条件 */
  condition?: (req: Request) => boolean;
  /** 中间件描述 */
  description?: string;
}

/**
 * 中间件接口
 */
export interface IMiddleware {
  /** 中间件处理方法 */
  use(req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

/**
 * 中间件注册信息
 */
export interface MiddlewareRegistration {
  /** 中间件实例 */
  instance: IMiddleware;
  /** 中间件元数据 */
  metadata: MiddlewareMetadata;
  /** 注册时间 */
  registeredAt: Date;
  /** 执行次数 */
  executionCount: number;
  /** 平均执行时间（毫秒） */
  averageExecutionTime: number;
}

/**
 * 中间件执行统计
 */
export interface MiddlewareStats {
  /** 中间件名称 */
  name: string;
  /** 执行次数 */
  executionCount: number;
  /** 总执行时间 */
  totalExecutionTime: number;
  /** 平均执行时间 */
  averageExecutionTime: number;
  /** 最后执行时间 */
  lastExecutionTime: Date;
  /** 错误次数 */
  errorCount: number;
}

/**
 * 中间件管理器类
 */
@Injectable()
export class MiddlewareManager {
  private middlewares = new Map<string, MiddlewareRegistration>();
  private globalMiddlewares: MiddlewareRegistration[] = [];
  private stats = new Map<string, MiddlewareStats>();

  /**
   * 注册中间件
   * 
   * @param name 中间件名称
   * @param instance 中间件实例
   * @param metadata 中间件元数据
   */
  registerMiddleware(
    name: string,
    instance: IMiddleware,
    metadata: Partial<MiddlewareMetadata> = {}
  ): void {
    const fullMetadata: MiddlewareMetadata = {
      name,
      priority: 100,
      global: false,
      ...metadata
    };

    const registration: MiddlewareRegistration = {
      instance,
      metadata: fullMetadata,
      registeredAt: new Date(),
      executionCount: 0,
      averageExecutionTime: 0
    };

    this.middlewares.set(name, registration);

    // 如果是全局中间件，添加到全局列表并排序
    if (fullMetadata.global) {
      this.globalMiddlewares.push(registration);
      this.sortGlobalMiddlewares();
    }

    // 初始化统计信息
    this.stats.set(name, {
      name,
      executionCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      lastExecutionTime: new Date(),
      errorCount: 0
    });

    console.log(`中间件已注册: ${name} (优先级: ${fullMetadata.priority})`);
  }

  /**
   * 获取路由中间件
   * 
   * @param path 路由路径
   * @param method HTTP方法
   * @returns 中间件函数数组
   */
  getRouteMiddlewares(path: string, method: string): any[] {
    const middlewares: any[] = [];

    // 添加全局中间件
    for (const registration of this.globalMiddlewares) {
      if (this.shouldApplyMiddleware(registration, path, method)) {
        middlewares.push(this.wrapMiddleware(registration));
      }
    }

    // 添加路径特定中间件
    for (const registration of this.middlewares.values()) {
      if (!registration.metadata.global && 
          this.shouldApplyMiddleware(registration, path, method)) {
        middlewares.push(this.wrapMiddleware(registration));
      }
    }

    return middlewares;
  }

  /**
   * 判断是否应该应用中间件
   * 
   * @param registration 中间件注册信息
   * @param path 路由路径
   * @param method HTTP方法
   * @returns 是否应该应用
   */
  private shouldApplyMiddleware(
    registration: MiddlewareRegistration,
    path: string,
    method: string
  ): boolean {
    const { metadata } = registration;

    // 检查HTTP方法
    if (metadata.methods && metadata.methods.length > 0) {
      if (!metadata.methods.includes(method.toUpperCase())) {
        return false;
      }
    }

    // 检查路径模式
    if (metadata.pathPattern) {
      if (typeof metadata.pathPattern === 'string') {
        if (!path.startsWith(metadata.pathPattern)) {
          return false;
        }
      } else if (metadata.pathPattern instanceof RegExp) {
        if (!metadata.pathPattern.test(path)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 包装中间件以添加统计和错误处理
   * 
   * @param registration 中间件注册信息
   * @returns 包装后的中间件函数
   */
  private wrapMiddleware(registration: MiddlewareRegistration): any {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const stats = this.stats.get(registration.metadata.name);

      try {
        // 检查执行条件
        if (registration.metadata.condition && 
            !registration.metadata.condition(req)) {
          return next();
        }

        // 执行中间件
        await registration.instance.use(req, res, next);

        // 更新统计信息
        if (stats) {
          const executionTime = Date.now() - startTime;
          stats.executionCount++;
          stats.totalExecutionTime += executionTime;
          stats.averageExecutionTime = stats.totalExecutionTime / stats.executionCount;
          stats.lastExecutionTime = new Date();

          registration.executionCount++;
          registration.averageExecutionTime = 
            (registration.averageExecutionTime * (registration.executionCount - 1) + executionTime) / 
            registration.executionCount;
        }
      } catch (error) {
        // 更新错误统计
        if (stats) {
          stats.errorCount++;
        }

        console.error(`中间件执行失败 ${registration.metadata.name}:`, error);
        next(error);
      }
    };
  }

  /**
   * 排序全局中间件
   */
  private sortGlobalMiddlewares(): void {
    this.globalMiddlewares.sort((a, b) => a.metadata.priority - b.metadata.priority);
  }

  /**
   * 获取中间件统计信息
   * 
   * @param name 中间件名称（可选）
   * @returns 统计信息
   */
  getStats(name?: string): MiddlewareStats | MiddlewareStats[] {
    if (name) {
      return this.stats.get(name) || {
        name,
        executionCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        lastExecutionTime: new Date(),
        errorCount: 0
      };
    }

    return Array.from(this.stats.values());
  }

  /**
   * 获取已注册的中间件列表
   * 
   * @returns 中间件注册信息数组
   */
  getRegisteredMiddlewares(): MiddlewareRegistration[] {
    return Array.from(this.middlewares.values());
  }

  /**
   * 移除中间件
   * 
   * @param name 中间件名称
   * @returns 是否成功移除
   */
  removeMiddleware(name: string): boolean {
    const registration = this.middlewares.get(name);
    
    if (!registration) {
      return false;
    }

    // 从映射中移除
    this.middlewares.delete(name);

    // 从全局中间件列表中移除
    if (registration.metadata.global) {
      const index = this.globalMiddlewares.indexOf(registration);
      if (index > -1) {
        this.globalMiddlewares.splice(index, 1);
      }
    }

    // 移除统计信息
    this.stats.delete(name);

    console.log(`中间件已移除: ${name}`);
    return true;
  }

  /**
   * 清空所有中间件
   */
  clear(): void {
    this.middlewares.clear();
    this.globalMiddlewares.length = 0;
    this.stats.clear();
    console.log('所有中间件已清空');
  }

  /**
   * 检查中间件是否已注册
   * 
   * @param name 中间件名称
   * @returns 是否已注册
   */
  hasMiddleware(name: string): boolean {
    return this.middlewares.has(name);
  }

  /**
   * 获取中间件数量
   * 
   * @returns 中间件数量
   */
  getMiddlewareCount(): number {
    return this.middlewares.size;
  }
}

/**
 * 中间件装饰器
 * 
 * @param metadata 中间件元数据
 * @returns 装饰器函数
 */
export function Middleware(metadata: Partial<MiddlewareMetadata> = {}) {
  return function (target: any) {
    Reflect.defineMetadata('middleware:metadata', metadata, target);
  };
}

/**
 * 全局中间件装饰器
 * 
 * @param priority 优先级
 * @returns 装饰器函数
 */
export function GlobalMiddleware(priority: number = 100) {
  return Middleware({ global: true, priority });
}

/**
 * 检查是否为中间件类
 * 
 * @param target 目标类
 * @returns 是否为中间件
 */
export function isMiddleware(target: any): boolean {
  return (
    typeof target === 'function' &&
    target.prototype &&
    (typeof target.prototype.use === 'function' ||
     Reflect.hasMetadata('middleware:metadata', target))
  );
}

/**
 * 获取中间件元数据
 * 
 * @param target 目标类
 * @returns 中间件元数据
 */
export function getMiddlewareMetadata(target: any): MiddlewareMetadata | undefined {
  return Reflect.getMetadata('middleware:metadata', target);
}
