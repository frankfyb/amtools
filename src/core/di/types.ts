/**
 * 依赖注入系统类型定义
 */

export type Constructor<T = {}> = new (...args: any[]) => T;
export type ServiceToken = string | symbol | Constructor;
export type ServiceFactory<T> = (...args: any[]) => T;

/**
 * 服务生命周期类型
 */
export enum ServiceLifetime {
  TRANSIENT = 'transient',    // 每次请求都创建新实例
  SINGLETON = 'singleton'     // 单例模式
}

/**
 * 服务注册信息
 */
export interface ServiceRegistration<T = any> {
  token: ServiceToken;
  implementation?: Constructor<T>;
  factory?: ServiceFactory<T>;
  instance?: T;
  lifetime: ServiceLifetime;
  dependencies: ServiceToken[];
}

/**
 * 依赖注入容器接口
 */
export interface IDIContainer {
  register<T>(token: ServiceToken, implementation: Constructor<T>, lifetime?: ServiceLifetime): void;
  registerFactory<T>(token: ServiceToken, factory: ServiceFactory<T>, lifetime?: ServiceLifetime): void;
  registerInstance<T>(token: ServiceToken, instance: T): void;
  resolve<T>(token: ServiceToken): T;
  has(token: ServiceToken): boolean;
  clear(): void;
}

/**
 * 服务元数据
 */
export interface ServiceMetadata {
  token?: ServiceToken;
  lifetime?: ServiceLifetime;
  dependencies?: ServiceToken[];
}

/**
 * 依赖注入错误类型
 */
export class DIError extends Error {
  constructor(message: string, public readonly token?: ServiceToken) {
    super(message);
    this.name = 'DIError';
  }
}

export class CircularDependencyError extends DIError {
  constructor(token: ServiceToken, chain: ServiceToken[]) {
    super(`Circular dependency detected: ${chain.map(t => t.toString()).join(' -> ')} -> ${token.toString()}`);
    this.name = 'CircularDependencyError';
  }
}

export class ServiceNotFoundError extends DIError {
  constructor(token: ServiceToken) {
    super(`Service not found: ${token.toString()}`, token);
    this.name = 'ServiceNotFoundError';
  }
}
