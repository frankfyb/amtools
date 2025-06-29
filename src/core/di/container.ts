/**
 * 依赖注入容器实现
 */

import {
  IDIContainer,
  ServiceToken,
  ServiceRegistration,
  ServiceLifetime,
  ServiceFactory,
  Constructor,
  DIError,
  CircularDependencyError,
  ServiceNotFoundError
} from './types';
import { getInjectableMetadata, getInjectTokens, isInjectable } from './decorators';

export class DIContainer implements IDIContainer {
  private readonly services = new Map<ServiceToken, ServiceRegistration>();
  private readonly instances = new Map<ServiceToken, any>();
  private readonly resolutionStack: ServiceToken[] = [];

  /**
   * 注册服务实现
   */
  register<T>(token: ServiceToken, implementation: Constructor<T>, lifetime: ServiceLifetime = ServiceLifetime.SINGLETON): void {
    if (!token) {
      throw new DIError('Service token cannot be null or undefined');
    }

    if (!isInjectable(implementation)) {
      throw new DIError(`Class ${implementation.name} is not injectable. Use @Injectable decorator.`, token);
    }

    const metadata = getInjectableMetadata(implementation);
    const dependencies = getInjectTokens(implementation);

    const registration: ServiceRegistration<T> = {
      token,
      implementation,
      lifetime: metadata?.lifetime || lifetime,
      dependencies
    };

    this.services.set(token, registration);
  }

  /**
   * 注册工厂函数
   */
  registerFactory<T>(token: ServiceToken, factory: ServiceFactory<T>, lifetime: ServiceLifetime = ServiceLifetime.SINGLETON): void {
    const registration: ServiceRegistration<T> = {
      token,
      factory,
      lifetime,
      dependencies: []
    };

    this.services.set(token, registration);
  }

  /**
   * 注册实例
   */
  registerInstance<T>(token: ServiceToken, instance: T): void {
    const registration: ServiceRegistration<T> = {
      token,
      instance,
      lifetime: ServiceLifetime.SINGLETON,
      dependencies: []
    };

    this.services.set(token, registration);
    this.instances.set(token, instance);
  }

  /**
   * 解析服务
   */
  resolve<T>(token: ServiceToken): T {
    // 检查循环依赖
    if (this.resolutionStack.includes(token)) {
      throw new CircularDependencyError(token, [...this.resolutionStack]);
    }

    // 检查是否已注册
    if (!this.services.has(token)) {
      throw new ServiceNotFoundError(token);
    }

    const registration = this.services.get(token)!;

    // 如果是单例且已创建实例，直接返回
    if (registration.lifetime === ServiceLifetime.SINGLETON && this.instances.has(token)) {
      return this.instances.get(token);
    }

    // 添加到解析栈
    this.resolutionStack.push(token);

    try {
      let instance: T;

      if (registration.instance) {
        // 已有实例
        instance = registration.instance;
      } else if (registration.factory) {
        // 工厂函数
        instance = registration.factory();
      } else if (registration.implementation) {
        // 构造函数
        const dependencies = registration.dependencies.map(dep => this.resolve(dep));
        instance = new registration.implementation(...dependencies);
      } else {
        throw new DIError(`Invalid service registration for token: ${token.toString()}`, token);
      }

      // 根据生命周期缓存实例
      if (registration.lifetime === ServiceLifetime.SINGLETON) {
        this.instances.set(token, instance);
      }

      return instance;
    } finally {
      // 从解析栈中移除
      this.resolutionStack.pop();
    }
  }

  /**
   * 检查服务是否已注册
   */
  has(token: ServiceToken): boolean {
    return this.services.has(token);
  }

  /**
   * 清空容器
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
    this.resolutionStack.length = 0;
  }

  /**
   * 获取所有注册的服务令牌
   */
  getRegisteredTokens(): ServiceToken[] {
    return Array.from(this.services.keys());
  }

  /**
   * 获取服务注册信息
   */
  getRegistration(token: ServiceToken): ServiceRegistration | undefined {
    return this.services.get(token);
  }

  /**
   * 自动注册类
   */
  autoRegister(target: Constructor): void {
    if (!isInjectable(target)) {
      throw new DIError(`Class ${target.name} is not injectable. Use @Injectable decorator.`);
    }

    const metadata = getInjectableMetadata(target);
    const token = metadata?.token || target;
    const lifetime = metadata?.lifetime || ServiceLifetime.SINGLETON;

    this.register(token, target, lifetime);
  }
}

// 默认容器实例
export const container = new DIContainer();
