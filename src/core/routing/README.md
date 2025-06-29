# 🎨 AMTools 路由系统

## 📋 概述

AMTools 路由系统是一个基于装饰器的现代化路由框架，提供类型安全、自动发现、中间件管理等企业级功能。

## 📁 文件结构

```
src/core/routing/
├── decorators.ts     # 🎨 路由装饰器定义
├── middleware.ts     # 🔧 中间件管理系统
├── registry.ts       # 📋 路由注册器
├── router.ts         # 🛣️  路由管理器
├── scanner.ts        # 🔍 控制器扫描器
└── README.md         # 📖 使用文档 (当前文件)
```

## 🔧 各文件详细说明

### 🎨 decorators.ts - 路由装饰器定义

**作用**: 定义所有路由相关的装饰器，是整个路由系统的核心

**使用范围**:
- 控制器类装饰
- 方法路由装饰
- 参数绑定装饰

**解决的问题**:
- ✅ 简化路由定义语法
- ✅ 提供类型安全的参数绑定
- ✅ 支持中间件和守卫装饰
- ✅ 统一响应处理配置

**核心装饰器**:

#### 控制器装饰器
- `@Controller(path)` - 定义控制器基础路径
- `@ApiVersion(version)` - 设置API版本
- `@ApiTags(...tags)` - 设置API标签

#### HTTP方法装饰器
- `@Get(path)` - GET请求
- `@Post(path)` - POST请求
- `@Put(path)` - PUT请求
- `@Delete(path)` - DELETE请求
- `@Patch(path)` - PATCH请求
- `@Options(path)` - OPTIONS请求
- `@Head(path)` - HEAD请求

#### 参数装饰器
- `@Body()` - 请求体参数
- `@Param(key)` - 路径参数
- `@Query(key)` - 查询参数
- `@Header(key)` - 请求头参数
- `@Req()` - 请求对象
- `@Res()` - 响应对象
- `@Session(key)` - 会话数据
- `@Cookies(key)` - Cookie数据
- `@Ip()` - 客户端IP
- `@Host()` - 主机名

#### 中间件装饰器
- `@UseGuards(...guards)` - 守卫装饰器
- `@UseMiddleware(...middleware)` - 中间件装饰器
- `@UseInterceptors(...interceptors)` - 拦截器装饰器
- `@UseFilters(...filters)` - 异常过滤器装饰器
- `@UsePipes(...pipes)` - 管道装饰器

#### 响应装饰器
- `@HttpCode(code)` - 设置HTTP状态码
- `@SetHeaders(headers)` - 设置响应头
- `@ContentType(type)` - 设置内容类型
- `@Redirect(url, code)` - 重定向响应
- `@Render(template)` - 模板渲染

#### 组合装饰器
- `@Create(path)` - POST + 201状态码
- `@Update(path)` - PUT + 204状态码
- `@Remove(path)` - DELETE + 204状态码

#### 验证装饰器
- `@Optional(defaultValue)` - 可选参数
- `@ValidatedParam(key, ...pipes)` - 验证路径参数
- `@ValidatedQuery(key, ...pipes)` - 验证查询参数
- `@ValidatedBody(...pipes)` - 验证请求体

**使用示例**:
```typescript
@Controller('/api/v1/users')
@UseGuards(AuthGuard)
@ApiTags('用户管理')
export class UserController {
  @Get('/')
  @UseInterceptors(CacheInterceptor)
  async getUsers(
    @Query('page') @Optional(1) page: number,
    @Query('limit') @Optional(10) limit: number
  ) {
    return await this.userService.getUsers(page, limit);
  }

  @Create('/')
  @UsePipes(ValidationPipe)
  async createUser(@ValidatedBody() userData: CreateUserDto) {
    return await this.userService.create(userData);
  }
}
```

### 🔧 middleware.ts - 中间件管理系统

**作用**: 提供统一的中间件管理和执行系统

**使用范围**:
- 全局中间件注册
- 路由级中间件管理
- 中间件优先级控制

**解决的问题**:
- ✅ 统一中间件接口
- ✅ 支持优先级排序
- ✅ 条件性中间件执行
- ✅ 中间件生命周期管理

**核心类和接口**:
- `IMiddleware` - 中间件接口
- `RouteMiddlewareManager` - 中间件管理器
- `MiddlewareMetadata` - 中间件元数据
- `@Middleware()` - 中间件装饰器
- `@GlobalMiddleware()` - 全局中间件装饰器

**使用示例**:
```typescript
@GlobalMiddleware(10)
export class LoggingMiddleware implements IMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log(`${req.method} ${req.path}`);
    next();
  }
}

// 注册中间件
const manager = new RouteMiddlewareManager();
manager.registerMiddleware('logging', new LoggingMiddleware(), {
  global: true,
  priority: 10
});
```

### 📋 registry.ts - 路由注册器

**作用**: 自动扫描和注册路由到Express应用

**使用范围**:
- 应用启动时的路由注册
- 控制器自动发现
- 中间件自动注册

**解决的问题**:
- ✅ 自动化路由注册
- ✅ 减少手动配置
- ✅ 支持依赖注入
- ✅ 统一错误处理

**核心类**:
- `RouteRegistry` - 路由注册器

**使用示例**:
```typescript
const app = express();
const container = new DIContainer();
const registry = new RouteRegistry(app, container);

// 自动扫描并注册所有路由
await registry.registerRoutes();
```

### 🛣️ router.ts - 路由管理器

**作用**: 应用级路由管理器，提供模块化路由配置

**使用范围**:
- 整个应用的路由配置
- 路由模块化管理
- 健康检查等系统路由

**解决的问题**:
- ✅ 统一路由管理
- ✅ 支持模块化路由
- ✅ 系统路由配置

**核心类**:
- `AppRouter` - 应用路由器
- `RouteDefinition` - 路由定义接口

**使用示例**:
```typescript
@Injectable()
export class AppRouter {
  constructor(
    private authController: AuthController,
    private authMiddleware: AuthMiddleware
  ) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.setupAuthRoutes();
    this.setupHealthRoutes();
  }
}
```

### 🔍 scanner.ts - 控制器扫描器

**作用**: 自动发现和扫描项目中的控制器类

**使用范围**:
- 项目文件扫描
- 控制器自动发现
- 开发时热重载支持

**解决的问题**:
- ✅ 自动发现控制器
- ✅ 支持多目录扫描
- ✅ 文件过滤和排除
- ✅ 扫描性能优化

**核心类和接口**:
- `ControllerScanner` - 控制器扫描器
- `ScanResult` - 扫描结果
- `ScanOptions` - 扫描选项

**使用示例**:
```typescript
const scanner = createControllerScanner();

// 扫描项目控制器
const result = await scanner.scanProject({
  include: ['**/*.controller.ts'],
  exclude: ['**/node_modules/**', '**/*.spec.ts']
});

console.log(`发现 ${result.controllersFound} 个控制器`);
```

## 🚀 完整使用流程

### 1. 定义控制器

```typescript
@Controller('/api/v1/products')
@UseGuards(AuthGuard)
@ApiTags('产品管理')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get('/')
  @UseInterceptors(CacheInterceptor)
  async getProducts(
    @Query('category') category?: string,
    @Query('page') @Optional(1) page: number,
    @Query('limit') @Optional(10) limit: number
  ) {
    return await this.productService.getProducts({
      category,
      page,
      limit
    });
  }

  @Get('/:id')
  async getProduct(@ValidatedParam('id') id: string) {
    return await this.productService.findById(id);
  }

  @Create('/')
  @UsePipes(ValidationPipe)
  async createProduct(@ValidatedBody() productData: CreateProductDto) {
    return await this.productService.create(productData);
  }

  @Update('/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateData: UpdateProductDto
  ) {
    return await this.productService.update(id, updateData);
  }

  @Remove('/:id')
  async deleteProduct(@Param('id') id: string) {
    await this.productService.delete(id);
  }
}
```

### 2. 定义中间件

```typescript
@GlobalMiddleware(5)
export class RequestLoggingMiddleware implements IMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
  }
}

@RouteMiddleware('/api/v1/admin', 20)
export class AdminAuthMiddleware implements IMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.headers.authorization;

    if (!token || !this.isAdminToken(token)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  }

  private isAdminToken(token: string): boolean {
    // 验证管理员令牌逻辑
    return true;
  }
}
```

### 3. 应用启动配置

```typescript
import express from 'express';
import { DIContainer } from '../di/container';
import { RouteRegistry } from './registry';

async function bootstrap() {
  const app = express();
  const container = new DIContainer();

  // 配置基础中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 创建路由注册器
  const registry = new RouteRegistry(app, container);

  // 自动注册所有路由
  await registry.registerRoutes();

  // 启动服务器
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 服务器启动成功，端口: ${port}`);
  });
}

bootstrap().catch(console.error);
```

## 🎯 最佳实践

### 1. 控制器组织
- 按业务模块组织控制器
- 使用一致的命名约定
- 合理使用装饰器组合

### 2. 中间件设计
- 保持中间件职责单一
- 合理设置优先级
- 处理异步操作

### 3. 参数验证
- 使用验证装饰器
- 提供默认值
- 统一错误处理

### 4. 响应处理
- 使用一致的响应格式
- 合理设置HTTP状态码
- 支持内容协商

## 🔧 配置选项

### 扫描器配置
```typescript
const scanOptions: ScanOptions = {
  include: ['**/*.controller.ts', '**/*.controller.js'],
  exclude: ['**/node_modules/**', '**/*.spec.ts'],
  recursive: true,
  maxDepth: 10,
  followSymlinks: false
};
```

### 中间件配置
```typescript
const middlewareConfig: MiddlewareMetadata = {
  name: 'custom-middleware',
  priority: 50,
  global: false,
  path: '/api/v1',
  methods: ['GET', 'POST'],
  enabled: true
};
```

## 🐛 故障排除

### 常见问题

1. **控制器未被发现**
   - 检查文件命名是否符合约定
   - 确认装饰器是否正确应用
   - 查看扫描路径配置

2. **中间件未执行**
   - 检查中间件注册顺序
   - 确认优先级设置
   - 验证路径匹配规则

3. **参数绑定失败**
   - 检查参数装饰器使用
   - 确认参数类型匹配
   - 查看验证管道配置

### 调试技巧

1. 启用详细日志
2. 使用扫描器统计信息
3. 检查元数据注册情况
4. 验证路由注册结果

## 📚 相关文档

- [依赖注入系统](../di/README.md)
- [CQRS架构](../cqrs/README.md)
- [验证系统](../../shared/validation/README.md)
- [API文档](../../../docs/api/README.md)

---

**AMTools Team** | 版本 1.0.0 | 更新时间: 2024-01-01