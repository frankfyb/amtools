/**
 * 应用程序主入口
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

// 加载环境变量
dotenv.config({ path: '.env' });

// 导入核心模块
import { container } from './core/di/container';
import { CommandBus } from './core/cqrs/command-bus';
import { QueryBus } from './core/cqrs/query-bus';
import { EventBus } from './core/cqrs/event-bus';
import { AppRouter } from './core/routing/router';
import { RouteRegistry } from './core/routing/registry';

// 导入Swagger相关模块
import swaggerUi from 'swagger-ui-express';
import {
  generateSwaggerSpec,
  getSwaggerConfig,
  getSwaggerUiOptions,
  shouldEnableSwagger,
  getSwaggerPath
} from './config/swagger.config';

// 导入配置
import { DatabaseConfig } from './config/database.config';

// 导入服务
import { JWTService } from './infrastructure/auth/jwt.service';
import { EmailService } from './infrastructure/email/email.service';
import { VerificationCodeService } from './infrastructure/services/verification-code.service';
import { CaptchaService } from './infrastructure/services/captcha.service';
import { TokenBlacklistService } from './infrastructure/services/token-blacklist.service';
import { RateLimiterService } from './infrastructure/services/rate-limiter.service';

// 导入仓储
import { UserRepository } from './infrastructure/database/repositories/user.repository';

// 导入控制器和中间件
import { AuthController } from './presentation/controllers/auth.controller';
import { AvailabilityController } from './presentation/controllers/availability.controller';
import { AuthMiddleware } from './presentation/middleware/auth.middleware';

// 导入命令处理器
import { RegisterUserHandler } from './application/command-handlers/auth/register-user.handler';
import { SendVerificationCodeHandler } from './application/command-handlers/auth/send-verification-code.handler';
import { VerifyEmailCommandHandler } from './application/command-handlers/auth/verify-email.handler';
import { LoginUserHandler } from './application/command-handlers/auth/login-user.handler';
import { RefreshTokenHandler } from './application/command-handlers/auth/refresh-token.handler';
import { LogoutUserHandler } from './application/command-handlers/auth/logout-user.handler';
import { ResetPasswordHandler } from './application/command-handlers/auth/reset-password.handler';

// 导入查询处理器
import { GetUserByEmailHandler } from './application/query-handlers/auth/get-user-by-email.handler';
import { GetCurrentUserHandler } from './application/query-handlers/auth/get-current-user.handler';
import { CheckEmailAvailabilityQueryHandler } from './application/query-handlers/auth/check-email-availability.handler';
import { CheckUsernameAvailabilityQueryHandler } from './application/query-handlers/auth/check-username-availability.handler';

// 导入命令
import { RegisterUserCommand } from './application/commands/auth/register-user.command';
import { SendVerificationCodeCommand } from './application/commands/auth/send-verification-code.command';
import { VerifyEmailCommand } from './application/commands/auth/verify-email.command';
import { LoginUserCommand } from './application/commands/auth/login-user.command';
import { RefreshTokenCommand } from './application/commands/auth/refresh-token.command';
import { LogoutUserCommand } from './application/commands/auth/logout-user.command';
import { ResetPasswordCommand } from './application/commands/auth/reset-password.command';

// 导入查询
import { GetUserByEmailQuery } from './application/queries/auth/get-user-by-email.query';
import { GetCurrentUserQuery } from './application/queries/auth/get-current-user.query';
import { CheckEmailAvailabilityQuery } from './application/queries/auth/check-email-availability.query';
import { CheckUsernameAvailabilityQuery } from './application/queries/auth/check-username-availability.query';

// 导入令牌
import { 
  CQRS_TOKENS, 
  SERVICE_TOKENS, 
  REPOSITORY_TOKENS, 
  EXTERNAL_TOKENS,
  CONFIG_TOKENS 
} from './core/di/tokens';

class Application {
  private app: express.Application;
  private dataSource: DataSource;
  private redisClient: Redis;

  constructor() {
    this.app = express();
  }

  /**
   * 初始化应用程序
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing AMTools Backend...');

      // 1. 初始化数据库连接
      await this.initializeDatabase();

      // 2. 初始化Redis连接
      await this.initializeRedis();

      // 3. 注册依赖
      await this.registerDependencies();

      // 4. 注册CQRS处理器
      await this.registerCQRSHandlers();

      // 5. 配置Express中间件
      this.configureMiddleware();

      // 6. 配置路由
      await this.configureRoutes();

      // 7. 配置错误处理
      this.configureErrorHandling();

      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * 初始化数据库连接
   */
  private async initializeDatabase(): Promise<void> {
    const databaseConfig = new DatabaseConfig();
    this.dataSource = new DataSource(databaseConfig.getConfig());
    
    await this.dataSource.initialize();
    console.log('✅ Database connected');
  }

  /**
   * 初始化Redis连接
   */
  private async initializeRedis(): Promise<void> {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'amtools:dev:',
      maxRetriesPerRequest: 3
    });

    await this.redisClient.ping();
    console.log('✅ Redis connected');
    console.log(`📋 Redis配置: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}, 键前缀: ${process.env.REDIS_KEY_PREFIX || 'amtools:dev:'}`);
  }

  /**
   * 注册依赖
   */
  private async registerDependencies(): Promise<void> {
    // 注册外部依赖
    container.registerInstance(EXTERNAL_TOKENS.DATABASE_CONNECTION, this.dataSource);
    container.registerInstance(EXTERNAL_TOKENS.REDIS_CLIENT, this.redisClient);

    // 注册配置
    container.autoRegister(DatabaseConfig);

    // 注册CQRS总线
    container.autoRegister(CommandBus);
    container.autoRegister(QueryBus);
    container.autoRegister(EventBus);
    container.registerInstance(CQRS_TOKENS.COMMAND_BUS, container.resolve(CommandBus));
    container.registerInstance(CQRS_TOKENS.QUERY_BUS, container.resolve(QueryBus));
    container.registerInstance(CQRS_TOKENS.EVENT_BUS, container.resolve(EventBus));

    // 注册基础设施服务
    container.autoRegister(JWTService);
    container.autoRegister(EmailService);
    // 使用真实验证码服务（Redis存储）
    container.autoRegister(VerificationCodeService);
    container.autoRegister(CaptchaService);
    container.autoRegister(TokenBlacklistService);
    container.autoRegister(RateLimiterService);
    container.registerInstance(SERVICE_TOKENS.JWT_SERVICE, container.resolve(JWTService));
    container.registerInstance(SERVICE_TOKENS.EMAIL_SERVICE, container.resolve(EmailService));
    container.registerInstance(SERVICE_TOKENS.VERIFICATION_CODE_SERVICE, container.resolve(VerificationCodeService));
    container.registerInstance(SERVICE_TOKENS.CAPTCHA_SERVICE, container.resolve(CaptchaService));
    container.registerInstance(SERVICE_TOKENS.TOKEN_BLACKLIST_SERVICE, container.resolve(TokenBlacklistService));
    container.registerInstance(SERVICE_TOKENS.RATE_LIMITER_SERVICE, container.resolve(RateLimiterService));

    // 注册仓储
    container.autoRegister(UserRepository);
    container.registerInstance(REPOSITORY_TOKENS.USER_REPOSITORY, container.resolve(UserRepository));

    // 注册控制器和中间件
    container.autoRegister(AuthController);
    container.autoRegister(AvailabilityController);
    container.autoRegister(AuthMiddleware);

    // 注册命令处理器
    container.autoRegister(RegisterUserHandler);
    container.autoRegister(SendVerificationCodeHandler);
    container.autoRegister(VerifyEmailCommandHandler);
    container.autoRegister(LoginUserHandler);
    container.autoRegister(RefreshTokenHandler);
    container.autoRegister(LogoutUserHandler);
    container.autoRegister(ResetPasswordHandler);

    // 注册查询处理器
    container.autoRegister(GetUserByEmailHandler);
    container.autoRegister(GetCurrentUserHandler);
    container.autoRegister(CheckEmailAvailabilityQueryHandler);
    container.autoRegister(CheckUsernameAvailabilityQueryHandler);

    console.log('✅ Dependencies registered');
  }

  /**
   * 注册CQRS处理器
   */
  private async registerCQRSHandlers(): Promise<void> {
    const commandBus = container.resolve<CommandBus>(CQRS_TOKENS.COMMAND_BUS);
    const queryBus = container.resolve<QueryBus>(CQRS_TOKENS.QUERY_BUS);

    // 注册命令处理器
    const registerUserHandler = container.resolve(RegisterUserHandler) as RegisterUserHandler;
    const sendVerificationCodeHandler = container.resolve(SendVerificationCodeHandler) as SendVerificationCodeHandler;
    const verifyEmailHandler = container.resolve(VerifyEmailCommandHandler) as VerifyEmailCommandHandler;
    const loginUserHandler = container.resolve(LoginUserHandler) as LoginUserHandler;
    const refreshTokenHandler = container.resolve(RefreshTokenHandler) as RefreshTokenHandler;
    const logoutUserHandler = container.resolve(LogoutUserHandler) as LogoutUserHandler;
    const resetPasswordHandler = container.resolve(ResetPasswordHandler) as ResetPasswordHandler;

    // 注册查询处理器
    const getUserByEmailHandler = container.resolve(GetUserByEmailHandler) as GetUserByEmailHandler;
    const getCurrentUserHandler = container.resolve(GetCurrentUserHandler) as GetCurrentUserHandler;
    const checkEmailAvailabilityHandler = container.resolve(CheckEmailAvailabilityQueryHandler) as CheckEmailAvailabilityQueryHandler;
    const checkUsernameAvailabilityHandler = container.resolve(CheckUsernameAvailabilityQueryHandler) as CheckUsernameAvailabilityQueryHandler;

    // 手动注册命令处理器到命令总线
    commandBus.register(RegisterUserCommand, registerUserHandler);
    commandBus.register(SendVerificationCodeCommand, sendVerificationCodeHandler);
    commandBus.register(VerifyEmailCommand, verifyEmailHandler);
    commandBus.register(LoginUserCommand, loginUserHandler);
    commandBus.register(RefreshTokenCommand, refreshTokenHandler);
    commandBus.register(LogoutUserCommand, logoutUserHandler);
    commandBus.register(ResetPasswordCommand, resetPasswordHandler);

    // 手动注册查询处理器到查询总线
    queryBus.register(GetUserByEmailQuery, getUserByEmailHandler);
    queryBus.register(GetCurrentUserQuery, getCurrentUserHandler);
    queryBus.register(CheckEmailAvailabilityQuery, checkEmailAvailabilityHandler);
    queryBus.register(CheckUsernameAvailabilityQuery, checkUsernameAvailabilityHandler);

    console.log('✅ CQRS handlers registered');
  }

  /**
   * 配置Express中间件
   */
  private configureMiddleware(): void {
    // 安全中间件
    this.app.use(helmet());

    // CORS配置
    const corsOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:3001'];

    this.app.use(cors({
      origin: corsOrigins,
      credentials: process.env.CORS_CREDENTIALS === 'true',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-ID',
        'x-csrf-token',
        'X-CSRF-Token',
        'Accept',
        'Origin',
        'X-Requested-With'
      ],
      optionsSuccessStatus: 200 // 支持旧版浏览器
    }));

    console.log('✅ CORS配置已启用，允许的源:', corsOrigins);

    // 压缩响应
    this.app.use(compression());

    // 请求日志
    this.app.use(morgan('combined'));

    // 解析JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 请求ID中间件
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || 
        Math.random().toString(36).substring(2, 15);
      next();
    });

    console.log('✅ Middleware configured');
  }

  /**
   * 配置路由
   */
  private async configureRoutes(): Promise<void> {
    // 使用装饰器路由系统
    const routeRegistry = new RouteRegistry(this.app as any, container, {
      verbose: true,
      enableValidation: true,
      enableCaching: false, // 暂时禁用缓存以解决容器问题
      enableSwagger: shouldEnableSwagger(), // 启用Swagger
      globalPrefix: process.env.API_PREFIX || '/api/v1'
    });

    // 手动注册控制器
    await routeRegistry.registerController(AuthController);
    await routeRegistry.registerController(AvailabilityController);

    // 注册所有路由
    await routeRegistry.registerRoutes();

    // 配置Swagger文档
    await this.configureSwagger(routeRegistry);

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: '接口不存在',
        error: {
          code: 'NOT_FOUND',
          message: `路径 ${req.originalUrl} 不存在`
        }
      });
    });

    console.log('✅ Routes configured');
  }

  /**
   * 配置Swagger文档
   */
  private async configureSwagger(routeRegistry: RouteRegistry): Promise<void> {
    if (!shouldEnableSwagger()) {
      console.log('⚠️ Swagger文档已禁用');
      return;
    }

    try {
      // 设置Swagger基础配置
      const swaggerConfig = getSwaggerConfig();
      routeRegistry.setSwaggerConfig({
        info: {
          title: swaggerConfig.title,
          version: swaggerConfig.version,
          description: swaggerConfig.description
        },
        servers: [
          {
            url: swaggerConfig.serverUrl + (process.env.API_PREFIX || '/api/v1'),
            description: '当前环境服务器'
          }
        ]
      });

      // 获取生成的Swagger规范
      const swaggerSpec = routeRegistry.getSwaggerSpec();

      // 配置Swagger UI
      const swaggerPath = getSwaggerPath();
      const swaggerUiOptions = getSwaggerUiOptions();

      // 设置Swagger UI路由
      this.app.use(swaggerPath, swaggerUi.serve);
      this.app.get(swaggerPath, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

      // 提供JSON格式的API规范
      this.app.get(`${swaggerPath}.json`, (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
      });

      console.log(`✅ Swagger文档已配置: http://localhost:${process.env.PORT || 3000}${swaggerPath}`);
      console.log(`📄 API规范JSON: http://localhost:${process.env.PORT || 3000}${swaggerPath}.json`);
    } catch (error) {
      console.error('❌ Swagger配置失败:', error);
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  }

  /**
   * 配置错误处理
   */
  private configureErrorHandling(): void {
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);

      res.status(error.status || 500).json({
        success: false,
        message: '服务器内部错误',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id']
        }
      });
    });

    console.log('✅ Error handling configured');
  }

  /**
   * 启动应用程序
   */
  async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3000');
    
    this.app.listen(port, () => {
      console.log(`🌟 AMTools Backend is running on port ${port}`);
      console.log(`📖 API Documentation: http://localhost:${port}/api/v1/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }

  /**
   * 优雅关闭
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down gracefully...');

    try {
      if (this.dataSource) {
        await this.dataSource.destroy();
        console.log('✅ Database connection closed');
      }

      if (this.redisClient) {
        this.redisClient.disconnect();
        console.log('✅ Redis connection closed');
      }

      console.log('✅ Application shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

// 启动应用程序
async function bootstrap(): Promise<void> {
  const app = new Application();

  // 处理进程信号
  process.on('SIGTERM', () => app.shutdown());
  process.on('SIGINT', () => app.shutdown());

  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// 启动应用
bootstrap().catch(console.error);
