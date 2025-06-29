import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { Express, Router, Request, Response, NextFunction } from 'express';
import { DIContainer } from '../di/container';
import { Constructor } from '../di/decorators';
import {
  getControllerMetadata,
  getRouteMetadata,
  getGuardMetadata,
  getMiddlewareMetadata,
  getParamMetadata,
  getInterceptorMetadata,
  getExceptionFilterMetadata,
  RouteMetadata,
  ParamMetadata
} from './decorators';
import { MiddlewareManager, isMiddleware, getMiddlewareMetadata as getMiddlewareMeta } from './middleware-manager';
import { ValidationPipe, ValidationException } from './pipes/validation.pipe';
import { AuthGuard, AuthenticatedRequest } from './guards/auth.guard';
import { SwaggerGenerator } from '../swagger/generator';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { ApiResponse } from '../../shared/responses/api-response';

/**
 * 路由注册器选项
 */
export interface RouteRegistryOptions {
  /** 是否启用详细日志 */
  verbose?: boolean;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
  /** 全局路由前缀 */
  globalPrefix?: string;
  /** 是否启用自动验证 */
  enableValidation?: boolean;
  /** 是否启用自动缓存 */
  enableCaching?: boolean;
  /** 错误处理模式 */
  errorHandling?: 'strict' | 'loose';
  /** 是否启用Swagger文档生成 */
  enableSwagger?: boolean;
}

/**
 * 路由注册统计信息
 */
export interface RegistrationStats {
  /** 扫描的控制器数量 */
  controllersScanned: number;
  /** 注册的控制器数量 */
  controllersRegistered: number;
  /** 注册的路由数量 */
  routesRegistered: number;
  /** 注册的中间件数量 */
  middlewareRegistered: number;
  /** 注册耗时（毫秒） */
  duration: number;
  /** 错误数量 */
  errors: number;
}

/**
 * 路由注册器
 *
 * 负责自动扫描控制器并注册路由到Express应用，
 * 支持装饰器系统、中间件管理、参数解析等功能。
 */
export class RouteRegistry {
  private middlewareManager = new MiddlewareManager();
  private validationPipe = new ValidationPipe();
  private swaggerGenerator?: SwaggerGenerator;
  private registeredControllers: Constructor[] = [];
  private stats: RegistrationStats = {
    controllersScanned: 0,
    controllersRegistered: 0,
    routesRegistered: 0,
    middlewareRegistered: 0,
    duration: 0,
    errors: 0
  };

  constructor(
    private app: Express,
    private container: DIContainer,
    private options: RouteRegistryOptions = {}
  ) {
    this.options = {
      verbose: false,
      enablePerformanceMonitoring: true,
      globalPrefix: '',
      enableValidation: true,
      enableCaching: true,
      errorHandling: 'strict',
      enableSwagger: false,
      ...options
    };

    // 如果启用Swagger，初始化生成器
    if (this.options.enableSwagger) {
      this.swaggerGenerator = new SwaggerGenerator();
    }
  }

  /**
   * 注册所有路由
   */
  async registerRoutes(): Promise<RegistrationStats> {
    const startTime = Date.now();
    this.log('开始注册路由...');

    try {
      // 先扫描和注册中间件
      await this.scanAndRegisterMiddlewares();

      // 扫描控制器
      const controllers = await this.scanControllers();
      this.stats.controllersScanned = controllers.length;

      // 注册控制器
      for (const ControllerClass of controllers) {
        try {
          await this.registerController(ControllerClass);
          this.stats.controllersRegistered++;
        } catch (error) {
          this.stats.errors++;
          this.logError(`注册控制器失败 ${ControllerClass.name}:`, error);

          if (this.options.errorHandling === 'strict') {
            throw error;
          }
        }
      }

      this.stats.duration = Date.now() - startTime;

      this.log(`路由注册完成:`, {
        控制器扫描: this.stats.controllersScanned,
        控制器注册: this.stats.controllersRegistered,
        路由注册: this.stats.routesRegistered,
        中间件注册: this.stats.middlewareRegistered,
        耗时: `${this.stats.duration}ms`,
        错误数: this.stats.errors
      });

      return this.stats;
    } catch (error) {
      this.stats.duration = Date.now() - startTime;
      this.stats.errors++;
      this.logError('路由注册失败:', error);
      throw error;
    }
  }

  /**
   * 注册单个控制器（公开方法）
   */
  async registerController(ControllerClass: Constructor): Promise<void> {
    return this.registerControllerInternal(ControllerClass);
  }

  /**
   * 扫描控制器
   */
  private async scanControllers(): Promise<Constructor[]> {
    // 简化版本：直接返回空数组，因为控制器已在main.ts中手动注册
    return [];
  }

  /**
   * 注册单个控制器（内部方法）
   */
  private async registerControllerInternal(ControllerClass: Constructor): Promise<void> {
    const controllerMetadata = getControllerMetadata(ControllerClass);
    if (!controllerMetadata) {
      this.logWarn(`控制器 ${ControllerClass.name} 缺少 @Controller 装饰器`);
      return;
    }

    const routes = getRouteMetadata(ControllerClass);
    if (routes.length === 0) {
      this.logWarn(`控制器 ${ControllerClass.name} 没有路由方法`);
      return;
    }

    // 注册控制器到DI容器（如果尚未注册）
    if (!this.container.has(ControllerClass.name)) {
      this.container.register(ControllerClass.name, ControllerClass);
    }

    // 从DI容器获取控制器实例
    const controllerInstance = this.container.resolve(ControllerClass.name);
    const router = Router();

    // 性能监控中间件已移除

    // 注册路由
    let routeCount = 0;
    for (const route of routes) {
      try {
        await this.registerRoute(router, controllerInstance, ControllerClass, route);
        routeCount++;
        this.stats.routesRegistered++;
      } catch (error) {
        this.stats.errors++;
        this.logError(`注册路由失败 ${route.method} ${route.path}:`, error);

        if (this.options.errorHandling === 'strict') {
          throw error;
        }
      }
    }

    // 构建完整路径
    const fullPath = this.options.globalPrefix
      ? `${this.options.globalPrefix}${controllerMetadata.path}`
      : controllerMetadata.path;

    // 挂载路由到应用
    this.app.use(fullPath, router);

    // 如果启用Swagger，生成文档
    if (this.swaggerGenerator) {
      this.swaggerGenerator.generatePathsFromController(ControllerClass);
      this.registeredControllers.push(ControllerClass);
    }

    this.log(`已注册控制器: ${ControllerClass.name} -> ${fullPath} (${routeCount}个路由)`);
  }

  /**
   * 注册单个路由
   */
  private async registerRoute(
    router: Router,
    controllerInstance: any,
    ControllerClass: Constructor,
    route: RouteMetadata
  ): Promise<void> {
    // 构建中间件链
    const middlewareChain: any[] = [];

    // 1. 添加守卫中间件
    const guards = await this.getRouteGuards(ControllerClass, route.methodName);
    middlewareChain.push(...guards);

    // 2. 添加自定义中间件
    const customMiddleware = await this.getRouteMiddleware(ControllerClass, route.methodName);
    middlewareChain.push(...customMiddleware);

    // 3. 添加验证中间件（如果启用）
    if (this.options.enableValidation) {
      const validationMiddleware = this.createValidationMiddleware(ControllerClass, route.methodName);
      if (validationMiddleware) {
        middlewareChain.push(validationMiddleware);
      }
    }

    // 4. 添加缓存拦截器（如果启用且是GET请求）
    if (this.options.enableCaching && route.method.toLowerCase() === 'get') {
      const cacheMiddleware = this.createCacheMiddleware(ControllerClass, route.methodName);
      if (cacheMiddleware) {
        middlewareChain.push(cacheMiddleware);
      }
    }

    // 5. 创建主路由处理器
    const handler = this.createRouteHandler(controllerInstance, route.methodName, ControllerClass);

    // 6. 添加拦截器处理
    const interceptorHandler = this.createInterceptorHandler(
      handler,
      ControllerClass,
      route.methodName
    );

    // 7. 添加异常过滤器
    const finalHandler = this.createExceptionFilterHandler(
      interceptorHandler,
      ControllerClass,
      route.methodName
    );

    // 注册路由
    const method = route.method.toLowerCase() as keyof Router;
    if (typeof router[method] === 'function') {
      (router[method] as any)(route.path, ...middlewareChain, finalHandler);
      this.log(`  ${route.method} ${route.path} -> ${route.methodName}`);
    } else {
      throw new Error(`不支持的HTTP方法: ${route.method}`);
    }
  }

  /**
   * 扫描和注册中间件
   */
  private async scanAndRegisterMiddlewares(): Promise<void> {
    // 扫描中间件目录
    const isProduction = process.env.NODE_ENV === 'production' || !existsSync(path.resolve(process.cwd(), 'src'));
    const middlewareDir = isProduction
      ? path.resolve(process.cwd(), 'application/middleware')
      : path.resolve(process.cwd(), 'src/application/middleware');

    if (!existsSync(middlewareDir)) {
      return;
    }

    const middlewareFiles = await this.getTypeScriptFiles(middlewareDir);

    for (const file of middlewareFiles) {
      try {
        const module = await import(file);

        for (const exportedItem of Object.values(module)) {
          if (isMiddleware(exportedItem)) {
            const MiddlewareClass = exportedItem as Constructor;
            const metadata = getMiddlewareMeta(MiddlewareClass);

            // 注册到DI容器
            if (!this.container.has(MiddlewareClass.name)) {
              this.container.register(MiddlewareClass.name, MiddlewareClass);
            }

            // 获取中间件实例
            const middlewareInstance = this.container.resolve(MiddlewareClass.name) as any;

            // 注册到中间件管理器
            this.middlewareManager.registerMiddleware(
              MiddlewareClass.name,
              middlewareInstance,
              metadata
            );

            console.log(`已注册中间件: ${MiddlewareClass.name}`);
          }
        }
      } catch (error) {
        console.error(`加载中间件文件失败 ${file}:`, error);
      }
    }
  }

  /**
   * 获取路由守卫
   */
  private async getRouteGuards(
    ControllerClass: Constructor,
    methodName: string
  ): Promise<any[]> {
    const guards: any[] = [];

    try {
      const guardClasses = getGuardMetadata(ControllerClass, methodName);
      for (const GuardClass of guardClasses) {
        try {
          if (!this.container.has(GuardClass.name)) {
            this.container.register(GuardClass.name, GuardClass);
          }
          const guardInstance = this.container.resolve(GuardClass.name) as any;

          if (guardInstance) {
            // 检查是否是AuthGuard
            if (guardInstance instanceof AuthGuard) {
              const authOptions = Reflect.getMetadata('auth:options', ControllerClass.prototype, methodName) ||
                                Reflect.getMetadata('auth:options', ControllerClass);
              guards.push(guardInstance.authenticate(authOptions));
            } else if (typeof guardInstance.canActivate === 'function') {
              guards.push(this.createGuardMiddleware(guardInstance));
            }
          }
        } catch (error) {
          this.logError(`获取守卫失败 ${GuardClass.name}:`, error);
        }
      }
    } catch (error) {
      this.logError('获取路由守卫失败:', error);
    }

    return guards;
  }

  /**
   * 获取路由中间件
   */
  private async getRouteMiddleware(
    ControllerClass: Constructor,
    methodName: string
  ): Promise<any[]> {
    const middleware: any[] = [];

    try {
      const middlewareClasses = getMiddlewareMetadata(ControllerClass, methodName);
      for (const MiddlewareClass of middlewareClasses) {
        try {
          if (!this.container.has(MiddlewareClass.name)) {
            this.container.register(MiddlewareClass.name, MiddlewareClass);
          }
          const middlewareInstance = this.container.resolve(MiddlewareClass.name) as any;
          if (middlewareInstance && typeof middlewareInstance.use === 'function') {
            middleware.push(middlewareInstance.use.bind(middlewareInstance));
          }
        } catch (error) {
          this.logError(`获取中间件失败 ${MiddlewareClass.name}:`, error);
        }
      }
    } catch (error) {
      this.logError('获取路由中间件失败:', error);
    }

    return middleware;
  }

  /**
   * 创建验证中间件
   */
  private createValidationMiddleware(
    ControllerClass: Constructor,
    methodName: string
  ): any | null {
    const validationPipes = Reflect.getMetadata('validation:pipes', ControllerClass.prototype, methodName);

    if (!validationPipes || validationPipes.length === 0) {
      return null;
    }

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // 验证请求体
        if (validationPipes[0] && req.body) {
          const paramTypes = Reflect.getMetadata('design:paramtypes', ControllerClass.prototype, methodName);
          if (paramTypes && paramTypes[0]) {
            req.body = await this.validationPipe.transform(req.body, paramTypes[0]);
          }
        }
        next();
      } catch (error) {
        if (error instanceof ValidationException) {
          const response = error.toApiResponse();
          res.status(400).json(response);
        } else {
          this.logError('验证中间件执行失败:', error);
          const response = ApiResponse.internalError('请求验证失败');
          res.status(500).json(response);
        }
      }
    };
  }

  /**
   * 创建缓存中间件
   */
  private createCacheMiddleware(
    ControllerClass: Constructor,
    methodName: string
  ): any | null {
    const cacheOptions = Reflect.getMetadata('cache:options', ControllerClass.prototype, methodName) ||
                        Reflect.getMetadata('cache:options', ControllerClass);

    if (!cacheOptions) {
      return null;
    }

    try {
      if (!this.container.has('CacheInterceptor')) {
        this.container.register('CacheInterceptor', CacheInterceptor);
      }
      const cacheInterceptor = this.container.resolve('CacheInterceptor') as CacheInterceptor;
      return cacheInterceptor.intercept(cacheOptions);
    } catch (error) {
      this.logError('创建缓存中间件失败:', error);
      return null;
    }
  }



  /**
   * 创建守卫中间件
   */
  private createGuardMiddleware(guardInstance: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const canActivate = await guardInstance.canActivate(req, res);
        if (canActivate) {
          next();
        } else {
          const response = ApiResponse.forbidden('访问被拒绝');
          res.status(403).json(response);
        }
      } catch (error) {
        this.logError('守卫执行失败:', error);
        if (!res.headersSent) {
          const response = ApiResponse.internalError('身份验证服务异常');
          res.status(500).json(response);
        }
      }
    };
  }

  /**
   * 创建拦截器处理器
   */
  private createInterceptorHandler(
    originalHandler: any,
    ControllerClass: Constructor,
    methodName: string
  ) {
    const interceptorClasses = getInterceptorMetadata(ControllerClass, methodName);

    if (!interceptorClasses || interceptorClasses.length === 0) {
      return originalHandler;
    }

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // 创建拦截器实例
        const interceptors: any[] = [];
        for (const InterceptorClass of interceptorClasses) {
          if (!this.container.has(InterceptorClass.name)) {
            this.container.register(InterceptorClass.name, InterceptorClass);
          }
          const interceptorInstance = this.container.resolve(InterceptorClass.name);
          interceptors.push(interceptorInstance);
        }

        // 执行拦截器链
        let index = 0;
        const executeNext = async (): Promise<any> => {
          if (index < interceptors.length) {
            const interceptor = interceptors[index++];
            if (interceptor && typeof interceptor.intercept === 'function') {
              return await interceptor.intercept(req, executeNext);
            }
          }
          // 执行原始处理器
          return await originalHandler(req, res, next);
        };

        await executeNext();
      } catch (error) {
        this.logError('拦截器执行失败:', error);
        next(error);
      }
    };
  }

  /**
   * 创建异常过滤器处理器
   */
  private createExceptionFilterHandler(
    originalHandler: any,
    ControllerClass: Constructor,
    methodName: string
  ) {
    const filterClasses = getExceptionFilterMetadata(ControllerClass, methodName);

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        await originalHandler(req, res, next);
      } catch (error) {
        // 尝试使用异常过滤器处理错误
        if (filterClasses && filterClasses.length > 0) {
          for (const FilterClass of filterClasses) {
            try {
              if (!this.container.has(FilterClass.name)) {
                this.container.register(FilterClass.name, FilterClass);
              }
              const filterInstance = this.container.resolve(FilterClass.name) as any;

              if (filterInstance && typeof filterInstance.catch === 'function') {
                await filterInstance.catch(error, req, res);
                return;
              }
            } catch (filterError) {
              this.logError(`异常过滤器执行失败 ${FilterClass.name}:`, filterError);
            }
          }
        }

        // 默认错误处理
        this.handleDefaultError(error, req, res);
      }
    };
  }

  /**
   * 创建路由处理器
   */
  private createRouteHandler(
    controllerInstance: any,
    methodName: string,
    ControllerClass: Constructor
  ) {
    console.log(`🔧 创建路由处理器: ${ControllerClass.name}.${methodName}`);
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // 获取参数元数据
      const paramMetadata = getParamMetadata(ControllerClass.prototype, methodName);
      console.log(`📋 方法 ${methodName} 的参数元数据:`, JSON.stringify(paramMetadata, null, 2));

      // 解析参数
      const args = await this.resolveParameters(req, res, paramMetadata, ControllerClass, methodName);

      // 调用控制器方法
      const result = await controllerInstance[methodName](...args);

      // 如果方法没有直接操作响应，则发送结果
      if (!res.headersSent && result !== undefined) {
        // 设置响应时间
        if (req.startTime) {
          const duration = Date.now() - req.startTime;
          if (result && typeof result === 'object' && result.meta) {
            result.meta.duration = duration;
          }
        }

        res.json(result);
      }
    };
  }

  /**
   * 解析控制器方法参数
   */
  private async resolveParameters(
    req: AuthenticatedRequest,
    res: Response,
    paramMetadata: ParamMetadata[],
    ControllerClass: Constructor,
    methodName: string
  ): Promise<any[]> {
    // 如果没有参数元数据，默认传递 req 和 res
    if (paramMetadata.length === 0) {
      return [req, res];
    }

    const args: any[] = [];

    for (const param of paramMetadata) {
      try {
        let value: any;

        switch (param.type) {
          case 'body':
            value = param.key ? req.body[param.key] : req.body;
            break;
          case 'param':
            value = param.key ? req.params[param.key] : req.params;
            // 尝试类型转换
            if (param.key && req.params[param.key]) {
              value = this.convertParamType(req.params[param.key]!, param);
            }
            break;
          case 'query':
            value = param.key ? req.query[param.key] : req.query;
            // 尝试类型转换
            if (param.key && req.query[param.key]) {
              value = this.convertParamType(req.query[param.key] as string, param);
            }
            break;
          case 'header':
            value = param.key ? req.get(param.key) : req.headers;
            break;
          case 'req':
            value = req;
            break;
          case 'res':
            value = res;
            break;
          case 'session':
            value = param.key ? (req as any).session?.[param.key] : (req as any).session;
            break;
          case 'cookies':
            value = param.key ? req.cookies?.[param.key] : req.cookies;
            break;
          case 'ip':
            value = req.ip || req.connection.remoteAddress;
            break;
          case 'host':
            value = req.get('host');
            break;
          default:
            value = undefined;
        }

        // 应用验证管道（如果有）
        if (param.pipes && param.pipes.length > 0) {
          console.log(`🔍 参数 ${param.type}[${param.index}] 有验证管道:`, param.pipes.length);
          console.log(`📋 参数元类型:`, param.metatype?.name || 'undefined');

          for (const pipe of param.pipes) {
            let pipeInstance = pipe;

            // 如果是类，则实例化
            if (typeof pipe === 'function' && pipe.prototype && pipe.prototype.transform) {
              console.log(`🔧 实例化验证管道:`, pipe.name);
              pipeInstance = new pipe();
            }

            if (pipeInstance && typeof pipeInstance.transform === 'function') {
              console.log(`🚀 应用验证管道，输入值类型:`, typeof value);
              value = await pipeInstance.transform(value, param.metatype);
              console.log(`✅ 验证管道完成，输出值类型:`, typeof value);
            }
          }
        } else {
          console.log(`❌ 参数 ${param.type}[${param.index}] 没有验证管道`);
        }

        args[param.index] = value;
      } catch (error) {
        this.logError(`参数解析失败 ${param.type}[${param.index}]:`, error);
        // 如果是验证错误，直接抛出，不要继续执行
        if ((error as any).name === 'ValidationException' || (error as any).validationErrors) {
          throw error;
        }
        args[param.index] = undefined;
      }
    }

    return args;
  }

  /**
   * 转换参数类型
   */
  private convertParamType(value: string, param: ParamMetadata): any {
    if (!param.metatype || value === undefined || value === null) {
      return value;
    }

    try {
      switch (param.metatype) {
        case Number:
          const num = Number(value);
          return isNaN(num) ? value : num;
        case Boolean:
          return value === 'true' || value === '1';
        case Date:
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date;
        default:
          return value;
      }
    } catch (error) {
      this.logError('参数类型转换失败:', error);
      return value;
    }
  }

  /**
   * 默认错误处理
   */
  private handleDefaultError(error: any, req: AuthenticatedRequest, res: Response): void {
    this.logError(`路由处理器执行失败:`, error);

    if (!res.headersSent) {
      let response: ApiResponse;

      if (error instanceof ValidationException) {
        response = error.toApiResponse();
        res.status(400);
      } else if (error.name === 'UnauthorizedError') {
        response = ApiResponse.unauthorized(error.message);
        res.status(401);
      } else if (error.name === 'ForbiddenError') {
        response = ApiResponse.forbidden(error.message);
        res.status(403);
      } else if (error.name === 'NotFoundError') {
        response = ApiResponse.notFound(error.message);
        res.status(404);
      } else {
        response = ApiResponse.internalError(
          '服务器内部错误',
          process.env.NODE_ENV === 'development' ? error.stack : undefined
        );
        res.status(500);
      }

      // 设置请求ID和处理时间
      if (req.startTime) {
        response.setDuration(Date.now() - req.startTime);
      }

      res.json(response);
    }
  }

  /**
   * 获取控制器文件
   */
  private async getTypeScriptFiles(directory: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      const isProduction = process.env.NODE_ENV === 'production' || !existsSync(path.resolve(process.cwd(), 'src'));

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getTypeScriptFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // 在生产环境中查找.js文件，在开发环境中查找.ts文件
          const isValidFile = isProduction
            ? (entry.name.endsWith('.js') && !entry.name.endsWith('.d.ts') && entry.name.includes('controller'))
            : (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts'));

          if (isValidFile) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`读取目录失败 ${directory}:`, error);
    }

    return files;
  }

  /**
   * 检查是否为控制器类
   */
  private isController(item: any): boolean {
    return (
      typeof item === 'function' &&
      item.prototype &&
      getControllerMetadata(item) !== undefined
    );
  }

  /**
   * 日志输出
   */
  private log(message: string, data?: any): void {
    if (this.options.verbose) {
      if (data) {
        console.log(`[RouteRegistry] ${message}`, data);
      } else {
        console.log(`[RouteRegistry] ${message}`);
      }
    }
  }

  /**
   * 警告日志
   */
  private logWarn(message: string, data?: any): void {
    if (data) {
      console.warn(`[RouteRegistry] ${message}`, data);
    } else {
      console.warn(`[RouteRegistry] ${message}`);
    }
  }

  /**
   * 错误日志
   */
  private logError(message: string, error?: any): void {
    if (error) {
      console.error(`[RouteRegistry] ${message}`, error);
    } else {
      console.error(`[RouteRegistry] ${message}`);
    }
  }

  /**
   * 获取注册统计信息
   */
  getStats(): RegistrationStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      controllersScanned: 0,
      controllersRegistered: 0,
      routesRegistered: 0,
      middlewareRegistered: 0,
      duration: 0,
      errors: 0
    };
  }

  /**
   * 设置选项
   */
  setOptions(options: Partial<RouteRegistryOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取中间件管理器
   */
  getMiddlewareManager(): MiddlewareManager {
    return this.middlewareManager;
  }



  /**
   * 获取验证管道
   */
  getValidationPipe(): ValidationPipe {
    return this.validationPipe;
  }

  /**
   * 设置验证管道
   */
  setValidationPipe(pipe: ValidationPipe): void {
    this.validationPipe = pipe;
  }

  /**
   * 检查控制器是否已注册
   */
  isControllerRegistered(ControllerClass: Constructor): boolean {
    return this.container.has(ControllerClass.name);
  }



  /**
   * 手动注册路由（用于测试或特殊情况）
   */
  async registerManualRoute(
    method: string,
    path: string,
    handler: any,
    options: {
      middleware?: any[];
      guards?: any[];
      validation?: boolean;
      caching?: boolean;
    } = {}
  ): Promise<void> {
    const router = Router();
    const middlewareChain: any[] = [];

    // 添加守卫
    if (options.guards) {
      middlewareChain.push(...options.guards);
    }

    // 添加中间件
    if (options.middleware) {
      middlewareChain.push(...options.middleware);
    }

    // 注册路由
    const httpMethod = method.toLowerCase() as keyof Router;
    if (typeof router[httpMethod] === 'function') {
      (router[httpMethod] as any)(path, ...middlewareChain, handler);
      this.app.use(router);
      this.log(`手动注册路由: ${method} ${path}`);
    } else {
      throw new Error(`不支持的HTTP方法: ${method}`);
    }
  }

  /**
   * 获取Swagger规范
   */
  getSwaggerSpec(): any {
    if (!this.swaggerGenerator) {
      throw new Error('Swagger未启用，请在RouteRegistry选项中设置enableSwagger为true');
    }
    return this.swaggerGenerator.getSpec();
  }

  /**
   * 获取已注册的控制器列表
   */
  getRegisteredControllers(): Constructor[] {
    return [...this.registeredControllers];
  }

  /**
   * 设置Swagger基础配置
   */
  setSwaggerConfig(config: any): void {
    if (!this.swaggerGenerator) {
      throw new Error('Swagger未启用，请在RouteRegistry选项中设置enableSwagger为true');
    }

    if (config.info) {
      this.swaggerGenerator.setInfo(config.info);
    }

    if (config.servers) {
      config.servers.forEach((server: any) => {
        this.swaggerGenerator!.addServer(server);
      });
    }

    if (config.tags) {
      config.tags.forEach((tag: any) => {
        this.swaggerGenerator!.addTag(tag);
      });
    }
  }
}
