import 'reflect-metadata';

/**
 * 🎨 路由装饰器模块 - AMTools 核心路由系统
 *
 * 📋 **模块概述**
 * 提供完整的路由装饰器系统，支持现代Web框架的各种功能：
 * - 控制器和路由定义
 * - 参数绑定和验证
 * - 中间件和拦截器
 * - 响应处理和转换
 * - API文档生成支持
 *
 * 📁 **routing目录文件结构**
 * ```
 * src/core/routing/
 * ├── decorators.ts     # 🎨 路由装饰器定义 (当前文件)
 * ├── middleware.ts     # 🔧 中间件管理系统
 * ├── registry.ts       # 📋 路由注册器
 * ├── router.ts         # 🛣️  路由管理器
 * ├── scanner.ts        # 🔍 控制器扫描器
 * └── README.md         # 📖 使用文档
 * ```
 *
 * 🔧 **各文件详细说明**
 *
 * **decorators.ts (当前文件)**
 * - 🎯 作用：定义所有路由相关的装饰器
 * - 📍 使用范围：控制器类、方法、参数装饰
 * - 🔨 解决问题：简化路由定义，提供类型安全的参数绑定
 * - 🏷️  核心装饰器：@Controller, @Get, @Post, @Body, @Param等
 *
 * **middleware.ts**
 * - 🎯 作用：中间件管理和执行系统
 * - 📍 使用范围：全局中间件、路由级中间件
 * - 🔨 解决问题：统一中间件管理，支持优先级和条件执行
 * - 🏷️  核心类：RouteMiddlewareManager, IMiddleware接口
 *
 * **registry.ts**
 * - 🎯 作用：自动扫描和注册路由到Express应用
 * - 📍 使用范围：应用启动时的路由注册
 * - 🔨 解决问题：自动化路由注册，减少手动配置
 * - 🏷️  核心类：RouteRegistry
 *
 * **router.ts**
 * - 🎯 作用：应用级路由管理器
 * - 📍 使用范围：整个应用的路由配置
 * - 🔨 解决问题：统一路由管理，支持模块化路由
 * - 🏷️  核心类：AppRouter
 *
 * **scanner.ts**
 * - 🎯 作用：自动发现和扫描控制器类
 * - 📍 使用范围：项目文件扫描，控制器发现
 * - 🔨 解决问题：自动发现控制器，支持热重载
 * - 🏷️  核心类：ControllerScanner
 *
 * 🚀 **完整使用示例**
 * ```typescript
 * // 1. 基础控制器定义
 * @Controller('/api/v1/users')
 * @UseGuards(AuthGuard)
 * @ApiTags('用户管理')
 * export class UserController {
 *
 *   @Get('/')
 *   @UseInterceptors(CacheInterceptor)
 *   @HttpCode(200)
 *   async getUsers(
 *     @Query('page') @Optional(1) page: number,
 *     @Query('limit') @Optional(10) limit: number
 *   ) {
 *     return await this.userService.getUsers(page, limit);
 *   }
 *
 *   @Create('/')  // 等同于 @Post('/') + @HttpCode(201)
 *   @UsePipes(ValidationPipe)
 *   async createUser(@ValidatedBody() userData: CreateUserDto) {
 *     return await this.userService.create(userData);
 *   }
 *
 *   @Get('/:id')
 *   async getUser(@ValidatedParam('id') id: string) {
 *     return await this.userService.findById(id);
 *   }
 *
 *   @Update('/:id')  // 等同于 @Put('/:id') + @HttpCode(204)
 *   async updateUser(
 *     @Param('id') id: string,
 *     @Body() updateData: UpdateUserDto
 *   ) {
 *     return await this.userService.update(id, updateData);
 *   }
 * }
 *
 * // 2. 应用启动时自动注册路由
 * const app = express();
 * const container = new DIContainer();
 * const registry = new RouteRegistry(app, container);
 *
 * // 自动扫描并注册所有控制器
 * await registry.registerRoutes();
 *
 * // 3. 手动注册中间件
 * const middlewareManager = registry.getMiddlewareManager();
 * middlewareManager.registerMiddleware('cors', corsMiddleware, {
 *   global: true,
 *   priority: 1
 * });
 * ```
 *
 * 🎯 **核心特性**
 * - ✅ 类型安全的参数绑定
 * - ✅ 自动路由发现和注册
 * - ✅ 中间件优先级管理
 * - ✅ 守卫和拦截器支持
 * - ✅ 响应转换和验证
 * - ✅ API文档生成支持
 * - ✅ 热重载开发支持
 *
 * @author AMTools Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/** 控制器元数据键，用于存储控制器路径信息 */
export const CONTROLLER_METADATA_KEY = Symbol('controller');

/** 路由元数据键，用于存储路由方法和路径信息 */
export const ROUTE_METADATA_KEY = Symbol('route');

/** 中间件元数据键，用于存储方法级中间件信息 */
export const MIDDLEWARE_METADATA_KEY = Symbol('middleware');

/** 守卫元数据键，用于存储方法级守卫信息 */
export const GUARD_METADATA_KEY = Symbol('guard');

/** 参数元数据键，用于存储方法参数绑定信息 */
export const PARAM_METADATA_KEY = Symbol('param');

/** 响应元数据键，用于存储响应配置信息 */
export const RESPONSE_METADATA_KEY = Symbol('response');

/** 异常过滤器元数据键，用于存储异常处理器信息 */
export const EXCEPTION_FILTER_METADATA_KEY = Symbol('exception_filter');

/** 拦截器元数据键，用于存储拦截器信息 */
export const INTERCEPTOR_METADATA_KEY = Symbol('interceptor');

/** 管道元数据键，用于存储数据转换管道信息 */
export const PIPE_METADATA_KEY = Symbol('pipe');

/**
 * HTTP方法枚举
 *
 * 定义支持的HTTP请求方法，用于路由装饰器中指定请求类型
 */
export enum HttpMethod {
  /** GET请求 - 用于获取资源 */
  GET = 'GET',
  /** POST请求 - 用于创建资源 */
  POST = 'POST',
  /** PUT请求 - 用于更新整个资源 */
  PUT = 'PUT',
  /** DELETE请求 - 用于删除资源 */
  DELETE = 'DELETE',
  /** PATCH请求 - 用于部分更新资源 */
  PATCH = 'PATCH',
  /** OPTIONS请求 - 用于预检请求 */
  OPTIONS = 'OPTIONS',
  /** HEAD请求 - 用于获取资源头信息 */
  HEAD = 'HEAD'
}

/**
 * 路由元数据接口
 *
 * 存储路由方法的元数据信息，包括HTTP方法、路径和方法名
 */
export interface RouteMetadata {
  /** HTTP请求方法 */
  method: HttpMethod;
  /** 路由路径，支持参数占位符如 /:id */
  path: string;
  /** 控制器方法名 */
  methodName: string;
}

/**
 * 参数元数据接口
 *
 * 存储方法参数的绑定信息，用于自动参数注入
 */
export interface ParamMetadata {
  /** 参数类型，决定从请求的哪个部分获取数据 */
  type: 'body' | 'param' | 'query' | 'header' | 'req' | 'res' | 'session' | 'cookies' | 'ip' | 'host';
  /** 参数键名，用于从对象中提取特定字段 */
  key?: string;
  /** 参数在方法签名中的索引位置 */
  index: number;
  /** 参数验证管道 */
  pipes?: any[];
  /** 参数是否可选 */
  optional?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 参数的元类型，用于验证管道 */
  metatype?: any;
}

/**
 * 响应配置接口
 *
 * 存储响应相关的配置信息
 */
export interface ResponseMetadata {
  /** HTTP状态码 */
  statusCode?: number;
  /** 响应头 */
  headers?: Record<string, string>;
  /** 响应类型 */
  contentType?: string;
  /** 是否直接返回响应对象 */
  passthrough?: boolean;
}

/**
 * 控制器元数据接口
 *
 * 存储控制器级别的配置信息
 */
export interface ControllerMetadata {
  /** 控制器基础路径 */
  path: string;
  /** 控制器级别的中间件 */
  middleware?: any[];
  /** 控制器级别的守卫 */
  guards?: any[];
  /** 控制器级别的拦截器 */
  interceptors?: any[];
  /** 控制器级别的异常过滤器 */
  exceptionFilters?: any[];
  /** API版本 */
  version?: string;
  /** 标签，用于API文档分组 */
  tags?: string[];
}

/**
 * 控制器装饰器
 *
 * 标记一个类为控制器，并设置基础路径。控制器类中的所有路由方法
 * 都会以此路径作为前缀。
 *
 * @param pathOrOptions - 控制器基础路径或配置选项
 *
 * @example
 * ```typescript
 * @Controller('/api/v1/users')
 * export class UserController {
 *   @Get('/')           // 实际路径: GET /api/v1/users/
 *   async getUsers() { }
 *
 *   @Get('/:id')        // 实际路径: GET /api/v1/users/:id
 *   async getUser() { }
 * }
 *
 * // 使用配置对象
 * @Controller({
 *   path: '/api/v1/users',
 *   version: '1',
 *   tags: ['users']
 * })
 * export class UserControllerV2 { }
 * ```
 */
export function Controller(pathOrOptions: string | Partial<ControllerMetadata> = ''): ClassDecorator {
  return function (target: any) {
    const metadata: ControllerMetadata = typeof pathOrOptions === 'string'
      ? { path: pathOrOptions }
      : { path: '', ...pathOrOptions };

    Reflect.defineMetadata(CONTROLLER_METADATA_KEY, metadata, target);
    return target;
  };
}

/**
 * GET 路由装饰器
 */
export function Get(path: string = ''): MethodDecorator {
  return createRouteDecorator(HttpMethod.GET, path);
}

/**
 * POST 路由装饰器
 */
export function Post(path: string = ''): MethodDecorator {
  return createRouteDecorator(HttpMethod.POST, path);
}

/**
 * PUT 路由装饰器
 */
export function Put(path: string = ''): MethodDecorator {
  return createRouteDecorator(HttpMethod.PUT, path);
}

/**
 * DELETE 路由装饰器
 */
export function Delete(path: string = ''): MethodDecorator {
  return createRouteDecorator(HttpMethod.DELETE, path);
}

/**
 * PATCH 路由装饰器
 */
export function Patch(path: string = ''): MethodDecorator {
  return createRouteDecorator(HttpMethod.PATCH, path);
}

/**
 * OPTIONS 路由装饰器
 */
export function Options(path: string = ''): MethodDecorator {
  return createRouteDecorator(HttpMethod.OPTIONS, path);
}

/**
 * HEAD 路由装饰器
 */
export function Head(path: string = ''): MethodDecorator {
  return createRouteDecorator(HttpMethod.HEAD, path);
}

/**
 * 通用路由装饰器
 *
 * @param method - HTTP方法
 * @param path - 路由路径
 */
export function Route(method: HttpMethod, path: string = ''): MethodDecorator {
  return createRouteDecorator(method, path);
}

/**
 * 创建路由装饰器
 */
function createRouteDecorator(method: HttpMethod, path: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const routes = Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
    routes.push({
      method,
      path,
      methodName: propertyKey
    });
    Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);
    return descriptor;
  };
}

/**
 * 使用守卫装饰器
 */
export function UseGuards(...guards: any[]): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingGuards = Reflect.getMetadata(GUARD_METADATA_KEY, target.constructor, propertyKey) || [];
    Reflect.defineMetadata(GUARD_METADATA_KEY, [...existingGuards, ...guards], target.constructor, propertyKey);
    return descriptor;
  };
}

/**
 * 使用中间件装饰器
 */
export function UseMiddleware(...middleware: any[]): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingMiddleware = Reflect.getMetadata(MIDDLEWARE_METADATA_KEY, target.constructor, propertyKey) || [];
    Reflect.defineMetadata(MIDDLEWARE_METADATA_KEY, [...existingMiddleware, ...middleware], target.constructor, propertyKey);
    return descriptor;
  };
}

/**
 * 请求体参数装饰器
 */
export function Body(key?: string): ParameterDecorator {
  return createParamDecorator('body', key);
}

/**
 * 路径参数装饰器
 */
export function Param(key?: string): ParameterDecorator {
  return createParamDecorator('param', key);
}

/**
 * 查询参数装饰器
 */
export function Query(key?: string): ParameterDecorator {
  return createParamDecorator('query', key);
}

/**
 * 请求头参数装饰器
 */
export function Header(key?: string): ParameterDecorator {
  return createParamDecorator('header', key);
}

/**
 * 请求对象装饰器
 */
export function Req(): ParameterDecorator {
  return createParamDecorator('req');
}

/**
 * 响应对象装饰器
 */
export function Res(): ParameterDecorator {
  return createParamDecorator('res');
}

/**
 * 会话对象装饰器
 */
export function Session(key?: string): ParameterDecorator {
  return createParamDecorator('session', key);
}

/**
 * Cookie装饰器
 */
export function Cookies(key?: string): ParameterDecorator {
  return createParamDecorator('cookies', key);
}

/**
 * IP地址装饰器
 */
export function Ip(): ParameterDecorator {
  return createParamDecorator('ip');
}

/**
 * 主机名装饰器
 */
export function Host(): ParameterDecorator {
  return createParamDecorator('host');
}

/**
 * 创建参数装饰器
 */
function createParamDecorator(
  type: ParamMetadata['type'],
  key?: string,
  options?: Partial<ParamMetadata>
): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingParams = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey!) || [];
    existingParams[parameterIndex] = {
      type,
      key,
      index: parameterIndex,
      ...options
    };
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingParams, target, propertyKey!);
  };
}

/**
 * HTTP状态码装饰器
 *
 * 设置方法的默认HTTP状态码
 *
 * @param statusCode - HTTP状态码
 *
 * @example
 * ```typescript
 * @Post('/')
 * @HttpCode(201)
 * async createUser() {
 *   // 返回201状态码
 * }
 * ```
 */
export function HttpCode(statusCode: number): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingResponse = Reflect.getMetadata(RESPONSE_METADATA_KEY, target.constructor, propertyKey) || {};
    Reflect.defineMetadata(
      RESPONSE_METADATA_KEY,
      { ...existingResponse, statusCode },
      target.constructor,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * 响应头装饰器
 *
 * 设置响应头
 *
 * @param headers - 响应头对象
 *
 * @example
 * ```typescript
 * @Get('/')
 * @Header({ 'Cache-Control': 'no-cache' })
 * async getData() {
 *   // 设置响应头
 * }
 * ```
 */
export function SetHeaders(headers: Record<string, string>): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingResponse = Reflect.getMetadata(RESPONSE_METADATA_KEY, target.constructor, propertyKey) || {};
    Reflect.defineMetadata(
      RESPONSE_METADATA_KEY,
      { ...existingResponse, headers: { ...existingResponse.headers, ...headers } },
      target.constructor,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * 内容类型装饰器
 *
 * 设置响应的内容类型
 *
 * @param contentType - 内容类型
 */
export function ContentType(contentType: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingResponse = Reflect.getMetadata(RESPONSE_METADATA_KEY, target.constructor, propertyKey) || {};
    Reflect.defineMetadata(
      RESPONSE_METADATA_KEY,
      { ...existingResponse, contentType },
      target.constructor,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * 重定向装饰器
 *
 * 设置重定向响应
 *
 * @param url - 重定向URL
 * @param statusCode - 重定向状态码，默认302
 *
 * @example
 * ```typescript
 * @Get('/old-path')
 * @Redirect('/new-path', 301)
 * async redirectToNewPath() {
 *   // 永久重定向到新路径
 * }
 * ```
 */
export function Redirect(url: string, statusCode: number = 302): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingResponse = Reflect.getMetadata(RESPONSE_METADATA_KEY, target.constructor, propertyKey) || {};
    Reflect.defineMetadata(
      RESPONSE_METADATA_KEY,
      {
        ...existingResponse,
        statusCode,
        headers: {
          ...existingResponse.headers,
          'Location': url
        }
      },
      target.constructor,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * 渲染装饰器
 *
 * 设置模板渲染
 *
 * @param template - 模板名称
 *
 * @example
 * ```typescript
 * @Get('/')
 * @Render('index')
 * async homePage() {
 *   return { title: 'Home' };
 * }
 * ```
 */
export function Render(template: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const existingResponse = Reflect.getMetadata(RESPONSE_METADATA_KEY, target.constructor, propertyKey) || {};
    Reflect.defineMetadata(
      RESPONSE_METADATA_KEY,
      { ...existingResponse, template },
      target.constructor,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * 获取控制器元数据
 */
export function getControllerMetadata(target: any): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA_KEY, target);
}

/**
 * 获取路由元数据
 */
export function getRouteMetadata(target: any): RouteMetadata[] {
  return Reflect.getMetadata(ROUTE_METADATA_KEY, target) || [];
}

/**
 * 获取守卫元数据
 */
export function getGuardMetadata(target: any, propertyKey: string | symbol): any[] {
  return Reflect.getMetadata(GUARD_METADATA_KEY, target, propertyKey) || [];
}

/**
 * 获取中间件元数据
 */
export function getMiddlewareMetadata(target: any, propertyKey: string | symbol): any[] {
  return Reflect.getMetadata(MIDDLEWARE_METADATA_KEY, target, propertyKey) || [];
}

/**
 * 获取参数元数据
 */
export function getParamMetadata(target: any, propertyKey: string | symbol): ParamMetadata[] {
  const paramMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || [];
  const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];

  // 为每个参数添加类型信息
  return paramMetadata.map((param: any, index: number) => ({
    ...param,
    metatype: paramTypes[index] || param.metatype
  }));
}

/**
 * 获取响应元数据
 */
export function getResponseMetadata(target: any, propertyKey: string | symbol): ResponseMetadata | undefined {
  return Reflect.getMetadata(RESPONSE_METADATA_KEY, target, propertyKey);
}

/**
 * 获取拦截器元数据
 */
export function getInterceptorMetadata(target: any, propertyKey?: string | symbol): any[] {
  if (propertyKey) {
    return Reflect.getMetadata(INTERCEPTOR_METADATA_KEY, target, propertyKey) || [];
  }
  const controllerMetadata = getControllerMetadata(target);
  return controllerMetadata?.interceptors || [];
}

/**
 * 获取异常过滤器元数据
 */
export function getExceptionFilterMetadata(target: any, propertyKey?: string | symbol): any[] {
  if (propertyKey) {
    return Reflect.getMetadata(EXCEPTION_FILTER_METADATA_KEY, target, propertyKey) || [];
  }
  const controllerMetadata = getControllerMetadata(target);
  return controllerMetadata?.exceptionFilters || [];
}

/**
 * 获取管道元数据
 */
export function getPipeMetadata(target: any, propertyKey: string | symbol, parameterIndex: number): any[] {
  const params = getParamMetadata(target, propertyKey);
  return params[parameterIndex]?.pipes || [];
}

/**
 * 检查是否为控制器
 */
export function isController(target: any): boolean {
  return Reflect.hasMetadata(CONTROLLER_METADATA_KEY, target);
}

/**
 * 获取所有路由信息
 *
 * 返回控制器的完整路由信息，包括控制器路径和所有方法路由
 */
export function getAllRoutes(target: any): Array<{
  controllerPath: string;
  method: HttpMethod;
  path: string;
  fullPath: string;
  methodName: string;
  guards: any[];
  middleware: any[];
  interceptors: any[];
  exceptionFilters: any[];
  params: ParamMetadata[];
  response?: ResponseMetadata;
}> {
  const controllerMetadata = getControllerMetadata(target);
  const routes = getRouteMetadata(target);

  if (!controllerMetadata || !routes.length) {
    return [];
  }

  return routes.map(route => {
    const fullPath = `${controllerMetadata.path}${route.path}`.replace(/\/+/g, '/');

    return {
      controllerPath: controllerMetadata.path,
      method: route.method,
      path: route.path,
      fullPath,
      methodName: route.methodName,
      guards: [
        ...(controllerMetadata.guards || []),
        ...getGuardMetadata(target, route.methodName)
      ],
      middleware: [
        ...(controllerMetadata.middleware || []),
        ...getMiddlewareMetadata(target, route.methodName)
      ],
      interceptors: [
        ...(controllerMetadata.interceptors || []),
        ...getInterceptorMetadata(target, route.methodName)
      ],
      exceptionFilters: [
        ...(controllerMetadata.exceptionFilters || []),
        ...getExceptionFilterMetadata(target, route.methodName)
      ],
      params: getParamMetadata(target.prototype, route.methodName),
      response: getResponseMetadata(target, route.methodName)
    };
  });
}

/**
 * API版本装饰器
 *
 * 为控制器设置API版本
 *
 * @param version - API版本
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * @ApiVersion('v1')
 * export class UserControllerV1 { }
 * ```
 */
export function ApiVersion(version: string): ClassDecorator {
  return function (target: any) {
    const existingMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, target) || {};
    Reflect.defineMetadata(
      CONTROLLER_METADATA_KEY,
      { ...existingMetadata, version },
      target
    );
    return target;
  };
}

/**
 * API标签装饰器
 *
 * 为控制器添加标签，用于API文档分组
 *
 * @param tags - 标签数组
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return function (target: any) {
    const existingMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, target) || {};
    const existingTags = existingMetadata.tags || [];
    Reflect.defineMetadata(
      CONTROLLER_METADATA_KEY,
      { ...existingMetadata, tags: [...existingTags, ...tags] },
      target
    );
    return target;
  };
}

/**
 * 可选参数装饰器
 *
 * 标记参数为可选，并设置默认值
 *
 * @param defaultValue - 默认值
 */
export function Optional(defaultValue?: any): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingParams = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey!) || [];
    const existingParam = existingParams[parameterIndex] || { index: parameterIndex };
    existingParams[parameterIndex] = {
      ...existingParam,
      optional: true,
      defaultValue
    };
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingParams, target, propertyKey!);
  };
}

/**
 * 组合装饰器：创建资源
 *
 * 组合POST方法和201状态码
 */
export function Create(path: string = ''): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // 应用POST装饰器
    Post(path)(target, propertyKey, descriptor);
    // 应用HttpCode装饰器
    HttpCode(201)(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * 组合装饰器：更新资源
 *
 * 组合PUT方法和204状态码
 */
export function Update(path: string = ''): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Put(path)(target, propertyKey, descriptor);
    HttpCode(204)(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * 组合装饰器：删除资源
 *
 * 组合DELETE方法和204状态码
 */
export function Remove(path: string = ''): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Delete(path)(target, propertyKey, descriptor);
    HttpCode(204)(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * 路径参数验证装饰器
 *
 * 为路径参数添加验证
 */
export function ValidatedParam(key: string, ...pipes: any[]): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingParams = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey!) || [];
    existingParams[parameterIndex] = {
      type: 'param',
      key,
      index: parameterIndex,
      pipes
    };
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingParams, target, propertyKey!);
  };
}

/**
 * 查询参数验证装饰器
 *
 * 为查询参数添加验证
 */
export function ValidatedQuery(key?: string, ...pipes: any[]): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingParams = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey!) || [];
    existingParams[parameterIndex] = {
      type: 'query',
      key,
      index: parameterIndex,
      pipes
    };
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingParams, target, propertyKey!);
  };
}

/**
 * 请求体验证装饰器
 *
 * 为请求体添加验证
 */
export function ValidatedBody(...pipes: any[]): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingParams = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey!) || [];
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey!) || [];
    const metatype = paramTypes[parameterIndex];

    existingParams[parameterIndex] = {
      type: 'body',
      index: parameterIndex,
      pipes,
      metatype
    };
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingParams, target, propertyKey!);
  };
}

/**
 * 路由配置接口
 *
 * 用于批量配置路由的完整信息
 */
export interface RouteConfig {
  /** 控制器类 */
  controller: any;
  /** 路由信息 */
  routes: Array<{
    method: HttpMethod;
    path: string;
    fullPath: string;
    methodName: string;
    handler: Function;
    guards: any[];
    middleware: any[];
    interceptors: any[];
    exceptionFilters: any[];
    params: ParamMetadata[];
    response?: ResponseMetadata;
  }>;
}

/**
 * 扫描控制器并提取路由配置
 *
 * @param controllers - 控制器类数组
 * @returns 路由配置数组
 */
export function scanControllers(controllers: any[]): RouteConfig[] {
  return controllers
    .filter(isController)
    .map(controller => {
      const routes = getAllRoutes(controller);
      return {
        controller,
        routes: routes.map(route => ({
          ...route,
          handler: controller.prototype[route.methodName]
        }))
      };
    });
}

/**
 * 路由匹配器
 *
 * 用于匹配请求路径和路由模式
 */
export class RouteMatcher {
  /**
   * 将路由模式转换为正则表达式
   *
   * @param pattern - 路由模式，如 '/users/:id'
   * @returns 正则表达式和参数名数组
   */
  static patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const regexPattern = pattern
      .replace(/\//g, '\\/')
      .replace(/:([^\/\\]+)/g, (_, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    return {
      regex: new RegExp(`^${regexPattern}$`),
      paramNames
    };
  }

  /**
   * 匹配路径并提取参数
   *
   * @param pattern - 路由模式
   * @param path - 请求路径
   * @returns 匹配结果和参数对象
   */
  static match(pattern: string, path: string): { matched: boolean; params: Record<string, string> } {
    const { regex, paramNames } = this.patternToRegex(pattern);
    const match = path.match(regex);

    if (!match) {
      return { matched: false, params: {} };
    }

    const params: Record<string, string> = {};
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1] || '';
    });

    return { matched: true, params };
  }
}

/**
 * 路由构建器
 *
 * 用于程序化构建路由
 */
export class RouteBuilder {
  private routes: RouteMetadata[] = [];

  /**
   * 添加GET路由
   */
  get(path: string, methodName: string): this {
    this.routes.push({ method: HttpMethod.GET, path, methodName });
    return this;
  }

  /**
   * 添加POST路由
   */
  post(path: string, methodName: string): this {
    this.routes.push({ method: HttpMethod.POST, path, methodName });
    return this;
  }

  /**
   * 添加PUT路由
   */
  put(path: string, methodName: string): this {
    this.routes.push({ method: HttpMethod.PUT, path, methodName });
    return this;
  }

  /**
   * 添加DELETE路由
   */
  delete(path: string, methodName: string): this {
    this.routes.push({ method: HttpMethod.DELETE, path, methodName });
    return this;
  }

  /**
   * 添加PATCH路由
   */
  patch(path: string, methodName: string): this {
    this.routes.push({ method: HttpMethod.PATCH, path, methodName });
    return this;
  }

  /**
   * 构建路由并应用到控制器
   */
  build(target: any): void {
    Reflect.defineMetadata(ROUTE_METADATA_KEY, this.routes, target);
  }
}

/**
 * 创建路由构建器
 */
export function createRouteBuilder(): RouteBuilder {
  return new RouteBuilder();
}

// ==================== 高级工具函数 ====================

/**
 * 路由分析器
 *
 * 用于分析和验证路由配置
 */
export class RouteAnalyzer {
  /**
   * 分析控制器路由
   */
  static analyzeController(target: any): {
    controllerInfo: ControllerMetadata | undefined;
    routes: Array<{
      route: RouteMetadata;
      params: ParamMetadata[];
      response?: ResponseMetadata;
      guards: any[];
      middleware: any[];
      interceptors: any[];
      filters: any[];
    }>;
    conflicts: string[];
    warnings: string[];
  } {
    const controllerInfo = getControllerMetadata(target);
    const routes = getRouteMetadata(target);
    const conflicts: string[] = [];
    const warnings: string[] = [];

    const routeDetails = routes.map(route => {
      const params = getParamMetadata(target.prototype, route.methodName);
      const response = getResponseMetadata(target, route.methodName);
      const guards = getGuardMetadata(target, route.methodName);
      const middleware = getMiddlewareMetadata(target, route.methodName);
      const interceptors = getInterceptorMetadata(target, route.methodName);
      const filters = getExceptionFilterMetadata(target, route.methodName);

      return {
        route,
        params,
        response,
        guards,
        middleware,
        interceptors,
        filters
      };
    });

    // 检查路由冲突
    const pathMethodMap = new Map<string, string[]>();
    routeDetails.forEach(({ route }) => {
      const fullPath = `${controllerInfo?.path || ''}${route.path}`;
      if (!pathMethodMap.has(fullPath)) {
        pathMethodMap.set(fullPath, []);
      }
      const methods = pathMethodMap.get(fullPath)!;
      if (methods.includes(route.method)) {
        conflicts.push(`重复的路由: ${route.method} ${fullPath}`);
      }
      methods.push(route.method);
    });

    // 检查参数配置警告
    routeDetails.forEach(({ route, params }) => {
      const pathParams = this.extractPathParams(route.path);
      const decoratedParams = params.filter(p => p.type === 'param').map(p => p.key);

      pathParams.forEach(pathParam => {
        if (!decoratedParams.includes(pathParam)) {
          warnings.push(`路径参数 '${pathParam}' 在方法 '${route.methodName}' 中未使用 @Param 装饰器`);
        }
      });
    });

    return {
      controllerInfo,
      routes: routeDetails,
      conflicts,
      warnings
    };
  }

  /**
   * 提取路径参数
   */
  private static extractPathParams(path: string): string[] {
    const matches = path.match(/:([^\/]+)/g);
    return matches ? matches.map(match => match.substring(1)) : [];
  }

  /**
   * 验证路由配置
   */
  static validateRoutes(controllers: any[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    statistics: {
      totalControllers: number;
      totalRoutes: number;
      totalParams: number;
      methodDistribution: Record<string, number>;
    };
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalRoutes = 0;
    let totalParams = 0;
    const methodDistribution: Record<string, number> = {};

    for (const controller of controllers) {
      const analysis = this.analyzeController(controller);

      if (!analysis.controllerInfo) {
        errors.push(`控制器 ${controller.name} 缺少 @Controller 装饰器`);
        continue;
      }

      errors.push(...analysis.conflicts);
      warnings.push(...analysis.warnings);

      totalRoutes += analysis.routes.length;

      analysis.routes.forEach(({ route, params }) => {
        totalParams += params.length;
        methodDistribution[route.method] = (methodDistribution[route.method] || 0) + 1;
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      statistics: {
        totalControllers: controllers.length,
        totalRoutes,
        totalParams,
        methodDistribution
      }
    };
  }
}

/**
 * 路由文档生成器
 *
 * 用于生成API文档
 */
export class RouteDocumentationGenerator {
  /**
   * 生成控制器文档
   */
  static generateControllerDocs(target: any): {
    name: string;
    path: string;
    description?: string;
    version?: string;
    tags?: string[];
    routes: Array<{
      method: string;
      path: string;
      fullPath: string;
      description?: string;
      parameters: Array<{
        name: string;
        type: string;
        source: string;
        required: boolean;
        defaultValue?: any;
        description?: string;
      }>;
      responses: Array<{
        statusCode: number;
        description?: string;
        contentType?: string;
      }>;
      security?: string[];
    }>;
  } {
    const controllerInfo = getControllerMetadata(target);
    const routes = getRouteMetadata(target);

    if (!controllerInfo) {
      throw new Error(`控制器 ${target.name} 缺少 @Controller 装饰器`);
    }

    const routeDocs = routes.map(route => {
      const params = getParamMetadata(target.prototype, route.methodName);
      const response = getResponseMetadata(target, route.methodName);
      const guards = getGuardMetadata(target, route.methodName);

      const parameters = params.map(param => ({
        name: param.key || `param${param.index}`,
        type: this.getParameterType(param.type),
        source: param.type,
        required: !param.optional,
        defaultValue: param.defaultValue,
        description: `${param.type} 参数`
      }));

      const responses = [{
        statusCode: response?.statusCode || (route.method === 'POST' ? 201 : 200),
        description: '成功响应',
        contentType: response?.contentType || 'application/json'
      }];

      return {
        method: route.method,
        path: route.path,
        fullPath: `${controllerInfo.path}${route.path}`.replace(/\/+/g, '/'),
        description: `${route.method} ${route.path}`,
        parameters,
        responses,
        security: guards.length > 0 ? ['bearer'] : undefined
      };
    });

    return {
      name: target.name,
      path: controllerInfo.path,
      description: `${target.name} 控制器`,
      version: controllerInfo.version,
      tags: controllerInfo.tags,
      routes: routeDocs
    };
  }

  /**
   * 获取参数类型描述
   */
  private static getParameterType(type: string): string {
    const typeMap: Record<string, string> = {
      'body': 'object',
      'param': 'string',
      'query': 'string',
      'header': 'string',
      'req': 'Request',
      'res': 'Response',
      'session': 'object',
      'cookies': 'object',
      'ip': 'string',
      'host': 'string'
    };
    return typeMap[type] || 'any';
  }

  /**
   * 生成OpenAPI规范
   */
  static generateOpenAPISpec(controllers: any[], options: {
    title: string;
    version: string;
    description?: string;
    baseUrl?: string;
  }): any {
    const paths: any = {};
    const tags: any[] = [];

    controllers.forEach(controller => {
      const docs = this.generateControllerDocs(controller);

      if (docs.tags) {
        docs.tags.forEach(tag => {
          if (!tags.find(t => t.name === tag)) {
            tags.push({ name: tag, description: `${tag} 相关接口` });
          }
        });
      }

      docs.routes.forEach(route => {
        if (!paths[route.fullPath]) {
          paths[route.fullPath] = {};
        }

        paths[route.fullPath][route.method.toLowerCase()] = {
          tags: docs.tags || [docs.name],
          summary: route.description,
          parameters: route.parameters.map(param => ({
            name: param.name,
            in: this.getParameterLocation(param.source),
            required: param.required,
            schema: { type: param.type },
            description: param.description
          })),
          responses: {
            [route.responses[0]?.statusCode || 200]: {
              description: route.responses[0]?.description || '成功',
              content: {
                [route.responses[0]?.contentType || 'application/json']: {
                  schema: { type: 'object' }
                }
              }
            }
          },
          security: route.security ? route.security.map(scheme => ({ [scheme]: [] })) : undefined
        };
      });
    });

    return {
      openapi: '3.0.0',
      info: {
        title: options.title,
        version: options.version,
        description: options.description
      },
      servers: options.baseUrl ? [{ url: options.baseUrl }] : [],
      tags,
      paths,
      components: {
        securitySchemes: {
          bearer: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
  }

  /**
   * 获取参数位置
   */
  private static getParameterLocation(source: string): string {
    const locationMap: Record<string, string> = {
      'param': 'path',
      'query': 'query',
      'header': 'header',
      'body': 'body'
    };
    return locationMap[source] || 'query';
  }
}

/**
 * 路由性能分析器
 *
 * 用于分析路由性能和优化建议
 */
export class RoutePerformanceAnalyzer {
  /**
   * 分析路由性能
   */
  static analyzePerformance(controllers: any[]): {
    recommendations: string[];
    metrics: {
      averageMiddlewareCount: number;
      maxMiddlewareCount: number;
      routesWithManyParams: number;
      complexRoutes: string[];
    };
  } {
    const recommendations: string[] = [];
    let totalMiddleware = 0;
    let maxMiddleware = 0;
    let routesWithManyParams = 0;
    const complexRoutes: string[] = [];

    controllers.forEach(controller => {
      const analysis = RouteAnalyzer.analyzeController(controller);

      analysis.routes.forEach(({ route, params, middleware, guards, interceptors }) => {
        const middlewareCount = middleware.length + guards.length + interceptors.length;
        totalMiddleware += middlewareCount;
        maxMiddleware = Math.max(maxMiddleware, middlewareCount);

        if (params.length > 5) {
          routesWithManyParams++;
          recommendations.push(`路由 ${route.method} ${route.path} 参数过多 (${params.length}个)`);
        }

        if (middlewareCount > 10) {
          complexRoutes.push(`${route.method} ${route.path}`);
          recommendations.push(`路由 ${route.method} ${route.path} 中间件过多 (${middlewareCount}个)`);
        }

        // 检查路径复杂度
        const pathSegments = route.path.split('/').filter(s => s.length > 0);
        if (pathSegments.length > 5) {
          recommendations.push(`路由 ${route.method} ${route.path} 路径层级过深`);
        }
      });
    });

    const totalRoutes = controllers.reduce((sum, controller) => {
      return sum + getRouteMetadata(controller).length;
    }, 0);

    return {
      recommendations,
      metrics: {
        averageMiddlewareCount: totalRoutes > 0 ? totalMiddleware / totalRoutes : 0,
        maxMiddlewareCount: maxMiddleware,
        routesWithManyParams,
        complexRoutes
      }
    };
  }
}

/**
 * 使用拦截器装饰器
 *
 * 为方法或控制器添加拦截器
 *
 * @param interceptors - 拦截器数组
 *
 * @example
 * ```typescript
 * @UseInterceptors(LoggingInterceptor, TransformInterceptor)
 * @Get('/')
 * async getData() {
 *   // 方法会被拦截器处理
 * }
 * ```
 */
export function UseInterceptors(...interceptors: any[]): MethodDecorator & ClassDecorator {
  return function (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    if (propertyKey) {
      // 方法装饰器
      const existingInterceptors = Reflect.getMetadata(INTERCEPTOR_METADATA_KEY, target.constructor, propertyKey) || [];
      Reflect.defineMetadata(
        INTERCEPTOR_METADATA_KEY,
        [...existingInterceptors, ...interceptors],
        target.constructor,
        propertyKey
      );
      return descriptor;
    } else {
      // 类装饰器
      const existingMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, target) || {};
      const existingInterceptors = existingMetadata.interceptors || [];
      Reflect.defineMetadata(
        CONTROLLER_METADATA_KEY,
        { ...existingMetadata, interceptors: [...existingInterceptors, ...interceptors] },
        target
      );
      return target;
    }
  };
}

/**
 * 使用管道装饰器
 *
 * 为参数添加验证和转换管道
 *
 * @param pipes - 管道数组
 *
 * @example
 * ```typescript
 * @Post('/')
 * async createUser(@Body() @UsePipes(ValidationPipe) userData: CreateUserDto) {
 *   // userData会被管道处理
 * }
 * ```
 */
export function UsePipes(...pipes: any[]): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingParams = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey!) || [];
    const existingParam = existingParams[parameterIndex] || { index: parameterIndex };
    existingParams[parameterIndex] = {
      ...existingParam,
      pipes: [...(existingParam.pipes || []), ...pipes]
    };
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingParams, target, propertyKey!);
  };
}

/**
 * 使用异常过滤器装饰器
 *
 * 为方法或控制器添加异常过滤器
 *
 * @param filters - 异常过滤器数组
 */
export function UseFilters(...filters: any[]): MethodDecorator & ClassDecorator {
  return function (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    if (propertyKey) {
      // 方法装饰器
      const existingFilters = Reflect.getMetadata(EXCEPTION_FILTER_METADATA_KEY, target.constructor, propertyKey) || [];
      Reflect.defineMetadata(
        EXCEPTION_FILTER_METADATA_KEY,
        [...existingFilters, ...filters],
        target.constructor,
        propertyKey
      );
      return descriptor;
    } else {
      // 类装饰器
      const existingMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, target) || {};
      const existingFilters = existingMetadata.exceptionFilters || [];
      Reflect.defineMetadata(
        CONTROLLER_METADATA_KEY,
        { ...existingMetadata, exceptionFilters: [...existingFilters, ...filters] },
        target
      );
      return target;
    }
  };
}
