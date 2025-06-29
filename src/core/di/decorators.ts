/**
 * 依赖注入装饰器
 */

import 'reflect-metadata';
import { ServiceToken, ServiceLifetime, ServiceMetadata } from './types';

// 元数据键
export const INJECTABLE_METADATA_KEY = Symbol('injectable');
export const INJECT_METADATA_KEY = Symbol('inject');
export const DEPENDENCIES_METADATA_KEY = Symbol('dependencies');

/**
 * 标记类为可注入的服务
 * @param token 服务令牌
 * @param lifetime 生命周期
 */
export function Injectable(token?: ServiceToken, lifetime: ServiceLifetime = ServiceLifetime.SINGLETON): ClassDecorator {
  return function <T extends Function>(target: T): T {
    const metadata: ServiceMetadata = {
      token: token || (target as unknown as ServiceToken),
      lifetime,
      dependencies: Reflect.getMetadata('design:paramtypes', target) || []
    };
    
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, metadata, target);
    return target;
  };
}

/**
 * 标记类为单例服务
 * @param token 服务令牌
 */
export function Singleton(token?: ServiceToken): ClassDecorator {
  return Injectable(token, ServiceLifetime.SINGLETON);
}

/**
 * 标记类为瞬态服务
 * @param token 服务令牌
 */
export function Transient(token?: ServiceToken): ClassDecorator {
  return Injectable(token, ServiceLifetime.TRANSIENT);
}

/**
 * 标记类为作用域服务
 * @param token 服务令牌
 */
export function Scoped(token?: ServiceToken): ClassDecorator {
  return Injectable(token, ServiceLifetime.SCOPED);
}

/**
 * 注入依赖
 * @param token 依赖令牌
 */
export function Inject(token: ServiceToken): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingTokens = Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
    existingTokens[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingTokens, target);
  };
}

/**
 * 获取类的可注入元数据
 */
export function getInjectableMetadata(target: any): ServiceMetadata | undefined {
  return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target);
}

/**
 * 获取构造函数的依赖令牌
 */
export function getInjectTokens(target: any): ServiceToken[] {
  const injectTokens = Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
  const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
  
  return paramTypes.map((type: any, index: number) => {
    return injectTokens[index] || type;
  });
}

/**
 * 检查类是否可注入
 */
export function isInjectable(target: any): boolean {
  return Reflect.hasMetadata(INJECTABLE_METADATA_KEY, target);
}
