# 认证管理模块API接口实现方案

## 📋 概述

本文档提供了AMTools项目中5个"返回未实现"的认证管理模块API接口的详细实现方案，包括：
1. 用户登录 (POST /api/v1/auth/login)
2. 用户登出 (POST /api/v1/auth/logout)
3. 刷新令牌 (POST /api/v1/auth/refresh)
4. 重置密码 (POST /api/v1/auth/reset-password)
5. 获取用户信息 (GET /api/v1/auth/me)

所有实现都遵循项目的CQRS架构模式和现有代码风格。

## 🏗️ 架构设计

### CQRS模式映射
```
Controller → Command/Query → Handler → Repository/Service
```

### 文件组织结构
```
src/
├── application/
│   ├── commands/auth/
│   ├── command-handlers/auth/
│   ├── queries/auth/
│   └── query-handlers/auth/
├── domain/
│   ├── entities/
│   └── value-objects/
├── infrastructure/
│   ├── auth/
│   └── database/repositories/
└── presentation/
    ├── controllers/
    └── dto/
```

## 🔐 1. 用户登录接口实现

### 1.1 需要创建的文件

#### 文件1: 登录命令
**路径**: `src/application/commands/auth/login-user.command.ts`
```typescript
/**
 * 用户登录命令
 */
export class LoginUserCommand {
  constructor(
    public readonly emailOrUsername: string,
    public readonly password: string,
    public readonly rememberMe: boolean = false,
    public readonly ipAddress: string,
    public readonly userAgent: string,
    public readonly captcha?: string
  ) {}
}
```

#### 文件2: 登录命令处理器
**路径**: `src/application/command-handlers/auth/login-user.handler.ts`
```typescript
/**
 * 用户登录命令处理器
 */
import { CommandHandler, ICommandHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { JWTService } from '../../../infrastructure/auth/jwt.service';
import { LoginUserCommand } from '../../commands/auth/login-user.command';
import { CommandResult } from '../../../shared/types/cqrs.types';
import { AuthTokens } from '../../../shared/types/auth.types';
import { 
  InvalidCredentialsException, 
  AccountNotVerifiedException,
  AccountSuspendedException,
  TooManyAttemptsException
} from '../../../shared/exceptions/auth.exceptions';

@CommandHandler(LoginUserCommand)
@Injectable()
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: JWTService,
    @Inject(SERVICE_TOKENS.RATE_LIMITER_SERVICE)
    private readonly rateLimiterService: IRateLimiterService
  ) {}

  async execute(command: LoginUserCommand): Promise<CommandResult<AuthTokens>> {
    // 1. 检查登录频率限制
    await this.checkRateLimit(command.ipAddress, command.emailOrUsername);

    // 2. 查找用户
    const user = await this.findUser(command.emailOrUsername);
    if (!user) {
      await this.recordFailedAttempt(command.ipAddress, command.emailOrUsername);
      throw new InvalidCredentialsException('邮箱/用户名或密码错误');
    }

    // 3. 验证密码
    const isPasswordValid = await user.validatePassword(command.password);
    if (!isPasswordValid) {
      await this.recordFailedAttempt(command.ipAddress, command.emailOrUsername);
      throw new InvalidCredentialsException('邮箱/用户名或密码错误');
    }

    // 4. 检查账户状态
    this.checkAccountStatus(user);

    // 5. 生成令牌
    const tokens = this.jwtService.generateTokens(
      user.id,
      user.email.value,
      user.username.value,
      user.role,
      user.permissions
    );

    // 6. 记录登录
    user.recordLogin();
    await this.userRepository.save(user);

    // 7. 清除失败记录
    await this.clearFailedAttempts(command.ipAddress, command.emailOrUsername);

    return {
      success: true,
      data: tokens
    };
  }

  private async findUser(emailOrUsername: string): Promise<User | null> {
    // 判断是邮箱还是用户名
    const isEmail = emailOrUsername.includes('@');
    
    if (isEmail) {
      return await this.userRepository.findByEmail(emailOrUsername);
    } else {
      return await this.userRepository.findByUsername(emailOrUsername);
    }
  }

  private checkAccountStatus(user: User): void {
    if (!user.isEmailVerified) {
      throw new AccountNotVerifiedException('账户邮箱未验证，请先验证邮箱');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AccountSuspendedException('账户已被暂停，请联系管理员');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new AccountSuspendedException('账户已被停用，请联系管理员');
    }

    if (!user.canLogin()) {
      throw new AccountSuspendedException('账户状态异常，无法登录');
    }
  }

  private async checkRateLimit(ipAddress: string, identifier: string): Promise<void> {
    const isLimited = await this.rateLimiterService.isLimited(
      `login:${ipAddress}:${identifier}`,
      5, // 5次尝试
      900 // 15分钟
    );

    if (isLimited) {
      throw new TooManyAttemptsException('登录尝试次数过多，请15分钟后再试');
    }
  }

  private async recordFailedAttempt(ipAddress: string, identifier: string): Promise<void> {
    await this.rateLimiterService.increment(`login:${ipAddress}:${identifier}`);
  }

  private async clearFailedAttempts(ipAddress: string, identifier: string): Promise<void> {
    await this.rateLimiterService.clear(`login:${ipAddress}:${identifier}`);
  }
}
```

#### 文件3: 更新控制器方法
**路径**: `src/presentation/controllers/auth.controller.ts` (修改现有文件)
```typescript
/**
 * 用户登录
 * POST /api/v1/auth/login
 */
@Post('/login')
@HttpCode(200)
@ApiOperation({
  summary: '用户登录',
  description: '使用邮箱/用户名和密码进行登录认证',
  tags: ['认证管理']
})
@ApiBody({
  description: '登录请求数据',
  type: LoginUserDto
})
@SwaggerApiResponse({
  status: 200,
  description: '登录成功',
  type: AuthTokensResponseDto
})
async login(
  @ValidatedBody() requestData: LoginUserDto,
  @Req() req: Request
): Promise<ApiResponse<AuthTokensResponseDto>> {
  try {
    const command = new LoginUserCommand(
      requestData.emailOrUsername,
      requestData.password,
      requestData.rememberMe || false,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      requestData.captcha
    );

    const result = await this.commandBus.execute(command);

    return ApiResponse.success(
      {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        expiresIn: result.data.expiresIn,
        tokenType: result.data.tokenType
      },
      '登录成功'
    );
  } catch (error) {
    if (error instanceof InvalidCredentialsException) {
      return ApiResponse.error('邮箱/用户名或密码错误', 'INVALID_CREDENTIALS', 401);
    }
    if (error instanceof AccountNotVerifiedException) {
      return ApiResponse.error(error.message, 'ACCOUNT_NOT_VERIFIED', 403);
    }
    if (error instanceof AccountSuspendedException) {
      return ApiResponse.error(error.message, 'ACCOUNT_SUSPENDED', 403);
    }
    if (error instanceof TooManyAttemptsException) {
      return ApiResponse.error(error.message, 'TOO_MANY_ATTEMPTS', 429);
    }
    
    console.error('Login error:', error);
    return ApiResponse.error('登录失败，请稍后重试', 'LOGIN_FAILED', 500);
  }
}
```

### 1.2 实现思路和业务逻辑

1. **安全验证**: 实现登录频率限制，防止暴力破解
2. **用户查找**: 支持邮箱或用户名登录
3. **密码验证**: 使用领域实体的密码验证方法
4. **账户状态检查**: 验证账户是否可以登录
5. **令牌生成**: 使用现有的JWT服务生成访问令牌和刷新令牌
6. **登录记录**: 更新用户的最后登录时间
7. **错误处理**: 提供详细的错误信息和状态码

### 1.3 与现有代码的集成方式

- 复用现有的 `JWTService` 生成令牌
- 使用现有的 `UserRepository` 查找和保存用户
- 遵循现有的 CQRS 模式和错误处理机制
- 集成现有的验证和中间件系统

## 🚪 2. 用户登出接口实现

### 2.1 需要创建的文件

#### 文件1: 登出命令
**路径**: `src/application/commands/auth/logout-user.command.ts`
```typescript
/**
 * 用户登出命令
 */
export class LogoutUserCommand {
  constructor(
    public readonly userId: string,
    public readonly accessToken: string,
    public readonly refreshToken?: string,
    public readonly logoutAllDevices: boolean = false
  ) {}
}
```

#### 文件2: 登出命令处理器
**路径**: `src/application/command-handlers/auth/logout-user.handler.ts`
```typescript
/**
 * 用户登出命令处理器
 */
import { CommandHandler, ICommandHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { SERVICE_TOKENS } from '../../../core/di/tokens';
import { LogoutUserCommand } from '../../commands/auth/logout-user.command';
import { CommandResult } from '../../../shared/types/cqrs.types';
import { ITokenBlacklistService } from '../../../domain/services/token-blacklist.service.interface';

@CommandHandler(LogoutUserCommand)
@Injectable()
export class LogoutUserHandler implements ICommandHandler<LogoutUserCommand> {
  constructor(
    @Inject(SERVICE_TOKENS.TOKEN_BLACKLIST_SERVICE)
    private readonly tokenBlacklistService: ITokenBlacklistService,
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: JWTService
  ) {}

  async execute(command: LogoutUserCommand): Promise<CommandResult<void>> {
    // 1. 将访问令牌加入黑名单
    await this.blacklistToken(command.accessToken);

    // 2. 如果提供了刷新令牌，也加入黑名单
    if (command.refreshToken) {
      await this.blacklistToken(command.refreshToken);
    }

    // 3. 如果需要登出所有设备
    if (command.logoutAllDevices) {
      await this.tokenBlacklistService.blacklistAllUserTokens(command.userId);
    }

    return {
      success: true,
      data: undefined
    };
  }

  private async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decodeToken(token);
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenBlacklistService.addToBlacklist(token, expiresAt);
      }
    } catch (error) {
      // 即使令牌无效，也不抛出错误，因为登出应该总是成功
      console.warn('Failed to blacklist token:', error);
    }
  }
}
```

#### 文件3: 令牌黑名单服务接口
**路径**: `src/domain/services/token-blacklist.service.interface.ts`
```typescript
/**
 * 令牌黑名单服务接口
 */
export interface ITokenBlacklistService {
  /**
   * 将令牌加入黑名单
   */
  addToBlacklist(token: string, expiresAt: Date): Promise<void>;

  /**
   * 检查令牌是否在黑名单中
   */
  isBlacklisted(token: string): Promise<boolean>;

  /**
   * 将用户的所有令牌加入黑名单
   */
  blacklistAllUserTokens(userId: string): Promise<void>;

  /**
   * 清理过期的黑名单记录
   */
  cleanupExpiredTokens(): Promise<void>;
}
```

#### 文件4: 令牌黑名单服务实现
**路径**: `src/infrastructure/services/token-blacklist.service.ts`
```typescript
/**
 * 令牌黑名单服务实现
 */
import { Injectable, Inject } from '../../core/di/decorators';
import { EXTERNAL_TOKENS } from '../../core/di/tokens';
import { ITokenBlacklistService } from '../../domain/services/token-blacklist.service.interface';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService implements ITokenBlacklistService {
  constructor(
    @Inject(EXTERNAL_TOKENS.REDIS_CLIENT)
    private readonly redisClient: Redis
  ) {}

  async addToBlacklist(token: string, expiresAt: Date): Promise<void> {
    const key = this.getBlacklistKey(token);
    const ttl = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    if (ttl > 0) {
      await this.redisClient.setex(key, ttl, '1');
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = this.getBlacklistKey(token);
    const result = await this.redisClient.get(key);
    return result !== null;
  }

  async blacklistAllUserTokens(userId: string): Promise<void> {
    const userKey = this.getUserBlacklistKey(userId);
    // 设置用户级别的黑名单标记，有效期24小时
    await this.redisClient.setex(userKey, 86400, Date.now().toString());
  }

  async cleanupExpiredTokens(): Promise<void> {
    // Redis会自动清理过期的键，这里可以实现额外的清理逻辑
    // 例如清理数据库中的过期记录等
  }

  private getBlacklistKey(token: string): string {
    // 使用token的哈希值作为键，避免存储完整token
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return `blacklist:token:${hash}`;
  }

  private getUserBlacklistKey(userId: string): string {
    return `blacklist:user:${userId}`;
  }
}
```

#### 文件5: 更新控制器方法
**路径**: `src/presentation/controllers/auth.controller.ts` (修改现有文件)
```typescript
/**
 * 用户登出
 * POST /api/v1/auth/logout
 */
@Post('/logout')
@UseGuards()
@HttpCode(200)
@ApiOperation({
  summary: '用户登出',
  description: '登出当前用户，使令牌失效',
  tags: ['认证管理']
})
@ApiBody({
  description: '登出请求数据',
  type: LogoutUserDto,
  required: false
})
@SwaggerApiResponse({
  status: 200,
  description: '登出成功'
})
async logout(
  @ValidatedBody() requestData: LogoutUserDto = {},
  req: AuthenticatedRequest
): Promise<ApiResponse> {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

    const command = new LogoutUserCommand(
      req.user.sub,
      accessToken,
      requestData.refreshToken,
      requestData.logoutAllDevices || false
    );

    await this.commandBus.execute(command);

    return ApiResponse.success(null, '登出成功');
  } catch (error) {
    console.error('Logout error:', error);
    return ApiResponse.error('登出失败，请稍后重试', 'LOGOUT_FAILED', 500);
  }
}
```

### 2.2 实现思路和业务逻辑

1. **令牌失效**: 将访问令牌和刷新令牌加入黑名单
2. **Redis存储**: 使用Redis存储黑名单，自动过期清理
3. **全设备登出**: 支持登出用户的所有设备
4. **安全哈希**: 使用令牌哈希值作为存储键，避免泄露
5. **容错处理**: 即使令牌无效，登出操作也应该成功

## 🔄 3. 刷新令牌接口实现

### 3.1 需要创建的文件

#### 文件1: 刷新令牌命令
**路径**: `src/application/commands/auth/refresh-token.command.ts`
```typescript
/**
 * 刷新令牌命令
 */
export class RefreshTokenCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly ipAddress: string,
    public readonly userAgent: string
  ) {}
}
```

#### 文件2: 刷新令牌命令处理器
**路径**: `src/application/command-handlers/auth/refresh-token.handler.ts`
```typescript
/**
 * 刷新令牌命令处理器
 */
import { CommandHandler, ICommandHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { JWTService } from '../../../infrastructure/auth/jwt.service';
import { RefreshTokenCommand } from '../../commands/auth/refresh-token.command';
import { CommandResult } from '../../../shared/types/cqrs.types';
import { AuthTokens } from '../../../shared/types/auth.types';
import { ITokenBlacklistService } from '../../../domain/services/token-blacklist.service.interface';
import {
  InvalidTokenException,
  TokenExpiredException,
  UserNotFoundException
} from '../../../shared/exceptions/auth.exceptions';

@CommandHandler(RefreshTokenCommand)
@Injectable()
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: JWTService,
    @Inject(SERVICE_TOKENS.TOKEN_BLACKLIST_SERVICE)
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  async execute(command: RefreshTokenCommand): Promise<CommandResult<AuthTokens>> {
    // 1. 检查令牌是否在黑名单中
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(command.refreshToken);
    if (isBlacklisted) {
      throw new InvalidTokenException('刷新令牌已失效');
    }

    // 2. 验证刷新令牌
    let decoded;
    try {
      decoded = this.jwtService.verifyRefreshToken(command.refreshToken);
    } catch (error) {
      throw new TokenExpiredException('刷新令牌已过期或无效');
    }

    // 3. 获取用户信息
    const user = await this.userRepository.findById(decoded.sub);
    if (!user) {
      throw new UserNotFoundException('用户不存在');
    }

    // 4. 检查用户状态
    if (!user.canLogin()) {
      throw new InvalidTokenException('用户状态异常，无法刷新令牌');
    }

    // 5. 将旧的刷新令牌加入黑名单
    await this.tokenBlacklistService.addToBlacklist(
      command.refreshToken,
      new Date(decoded.exp * 1000)
    );

    // 6. 生成新的令牌对
    const newTokens = this.jwtService.generateTokens(
      user.id,
      user.email.value,
      user.username.value,
      user.role,
      user.permissions
    );

    return {
      success: true,
      data: newTokens
    };
  }
}
```

#### 文件3: 更新控制器方法
**路径**: `src/presentation/controllers/auth.controller.ts` (修改现有文件)
```typescript
/**
 * 刷新令牌
 * POST /api/v1/auth/refresh
 */
@Post('/refresh')
@HttpCode(200)
@ApiOperation({
  summary: '刷新访问令牌',
  description: '使用刷新令牌获取新的访问令牌',
  tags: ['认证管理']
})
@ApiBody({
  description: '刷新令牌请求数据',
  type: RefreshTokenDto
})
@SwaggerApiResponse({
  status: 200,
  description: '令牌刷新成功',
  type: AuthTokensResponseDto
})
async refreshToken(
  @ValidatedBody() requestData: RefreshTokenDto,
  @Req() req: Request
): Promise<ApiResponse<AuthTokensResponseDto>> {
  try {
    const command = new RefreshTokenCommand(
      requestData.refreshToken,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    );

    const result = await this.commandBus.execute(command);

    return ApiResponse.success(
      {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        expiresIn: result.data.expiresIn,
        tokenType: result.data.tokenType
      },
      '令牌刷新成功'
    );
  } catch (error) {
    if (error instanceof InvalidTokenException) {
      return ApiResponse.error(error.message, 'INVALID_TOKEN', 401);
    }
    if (error instanceof TokenExpiredException) {
      return ApiResponse.error(error.message, 'TOKEN_EXPIRED', 401);
    }
    if (error instanceof UserNotFoundException) {
      return ApiResponse.error('用户不存在', 'USER_NOT_FOUND', 404);
    }

    console.error('Refresh token error:', error);
    return ApiResponse.error('令牌刷新失败，请重新登录', 'REFRESH_FAILED', 500);
  }
}
```

### 3.2 实现思路和业务逻辑

1. **黑名单检查**: 验证刷新令牌是否已被撤销
2. **令牌验证**: 使用JWT服务验证刷新令牌的有效性
3. **用户状态检查**: 确保用户仍然可以使用系统
4. **令牌轮换**: 生成新的令牌对，将旧令牌加入黑名单
5. **安全性**: 防止令牌重放攻击和会话劫持

## 🔑 4. 重置密码接口实现

### 4.1 需要创建的文件

#### 文件1: 重置密码命令
**路径**: `src/application/commands/auth/reset-password.command.ts`
```typescript
/**
 * 重置密码命令
 */
export class ResetPasswordCommand {
  constructor(
    public readonly email: string,
    public readonly verificationCode: string,
    public readonly newPassword: string,
    public readonly confirmPassword: string
  ) {}
}
```

#### 文件2: 重置密码命令处理器
**路径**: `src/application/command-handlers/auth/reset-password.handler.ts`
```typescript
/**
 * 重置密码命令处理器
 */
import { CommandHandler, ICommandHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { VerificationCodeService } from '../../../infrastructure/services/verification-code.service';
import { ResetPasswordCommand } from '../../commands/auth/reset-password.command';
import { CommandResult } from '../../../shared/types/cqrs.types';
import { VerificationCodeType } from '../../../shared/types/auth.types';
import {
  UserNotFoundException,
  InvalidVerificationCodeException,
  PasswordMismatchException,
  WeakPasswordException
} from '../../../shared/exceptions/auth.exceptions';

@CommandHandler(ResetPasswordCommand)
@Injectable()
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.VERIFICATION_CODE_SERVICE)
    private readonly verificationCodeService: VerificationCodeService,
    @Inject(SERVICE_TOKENS.TOKEN_BLACKLIST_SERVICE)
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  async execute(command: ResetPasswordCommand): Promise<CommandResult<void>> {
    // 1. 验证密码确认
    if (command.newPassword !== command.confirmPassword) {
      throw new PasswordMismatchException('两次输入的密码不一致');
    }

    // 2. 验证密码强度
    this.validatePasswordStrength(command.newPassword);

    // 3. 验证验证码
    const isCodeValid = await this.verificationCodeService.verifyCode(
      command.email,
      command.verificationCode,
      VerificationCodeType.PASSWORD_RESET
    );

    if (!isCodeValid) {
      throw new InvalidVerificationCodeException('验证码无效或已过期');
    }

    // 4. 查找用户
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new UserNotFoundException('用户不存在');
    }

    // 5. 更新密码
    await user.changePassword(command.newPassword);
    await this.userRepository.save(user);

    // 6. 使验证码失效
    await this.verificationCodeService.invalidateCode(
      command.email,
      VerificationCodeType.PASSWORD_RESET
    );

    // 7. 撤销用户的所有令牌（强制重新登录）
    await this.tokenBlacklistService.blacklistAllUserTokens(user.id);

    return {
      success: true,
      data: undefined
    };
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new WeakPasswordException('密码长度至少8位');
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new WeakPasswordException('密码必须包含大小写字母、数字和特殊字符');
    }
  }
}
```

#### 文件3: 更新控制器方法
**路径**: `src/presentation/controllers/auth.controller.ts` (修改现有文件)
```typescript
/**
 * 重置密码
 * POST /api/v1/auth/reset-password
 */
@Post('/reset-password')
@HttpCode(200)
@ApiOperation({
  summary: '重置密码',
  description: '使用验证码重置用户密码',
  tags: ['认证管理']
})
@ApiBody({
  description: '重置密码请求数据',
  type: ResetPasswordDto
})
@SwaggerApiResponse({
  status: 200,
  description: '密码重置成功'
})
async resetPassword(
  @ValidatedBody() requestData: ResetPasswordDto
): Promise<ApiResponse> {
  try {
    const command = new ResetPasswordCommand(
      requestData.email,
      requestData.verificationCode,
      requestData.newPassword,
      requestData.confirmPassword
    );

    await this.commandBus.execute(command);

    return ApiResponse.success(null, '密码重置成功，请使用新密码登录');
  } catch (error) {
    if (error instanceof PasswordMismatchException) {
      return ApiResponse.error(error.message, 'PASSWORD_MISMATCH', 400);
    }
    if (error instanceof WeakPasswordException) {
      return ApiResponse.error(error.message, 'WEAK_PASSWORD', 400);
    }
    if (error instanceof InvalidVerificationCodeException) {
      return ApiResponse.error(error.message, 'INVALID_VERIFICATION_CODE', 400);
    }
    if (error instanceof UserNotFoundException) {
      return ApiResponse.error('用户不存在', 'USER_NOT_FOUND', 404);
    }

    console.error('Reset password error:', error);
    return ApiResponse.error('密码重置失败，请稍后重试', 'RESET_PASSWORD_FAILED', 500);
  }
}
```

### 4.2 实现思路和业务逻辑

1. **密码验证**: 检查密码确认和强度要求
2. **验证码验证**: 确保用户拥有邮箱访问权限
3. **密码更新**: 使用领域实体的密码更改方法
4. **安全清理**: 使验证码失效，撤销所有令牌
5. **强制重登**: 要求用户使用新密码重新登录

## 👤 5. 获取用户信息接口实现

### 5.1 需要创建的文件

#### 文件1: 获取用户信息查询
**路径**: `src/application/queries/auth/get-current-user.query.ts`
```typescript
/**
 * 获取当前用户信息查询
 */
export class GetCurrentUserQuery {
  constructor(
    public readonly userId: string
  ) {}
}
```

#### 文件2: 获取用户信息查询处理器
**路径**: `src/application/query-handlers/auth/get-current-user.handler.ts`
```typescript
/**
 * 获取当前用户信息查询处理器
 */
import { QueryHandler, IQueryHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { GetCurrentUserQuery } from '../../queries/auth/get-current-user.query';
import { QueryResult } from '../../../shared/types/cqrs.types';
import { UserResponseDto } from '../../../presentation/dto/auth.dto';
import { UserNotFoundException } from '../../../shared/exceptions/auth.exceptions';

@QueryHandler(GetCurrentUserQuery)
@Injectable()
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository
  ) {}

  async execute(query: GetCurrentUserQuery): Promise<QueryResult<UserResponseDto>> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw new UserNotFoundException('用户不存在');
    }

    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email.value,
      username: user.username.value,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatar: user.profile.avatar,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      permissions: user.permissions
    };

    return {
      success: true,
      data: userResponse
    };
  }
}
```

#### 文件3: 更新控制器方法
**路径**: `src/presentation/controllers/auth.controller.ts` (修改现有文件)
```typescript
/**
 * 获取当前用户信息
 * GET /api/v1/auth/me
 */
@Get('/me')
@UseGuards()
@HttpCode(200)
@ApiOperation({
  summary: '获取当前用户信息',
  description: '获取当前登录用户的详细信息',
  tags: ['认证管理']
})
@SwaggerApiResponse({
  status: 200,
  description: '获取用户信息成功',
  type: UserResponseDto
})
async getCurrentUser(
  req: AuthenticatedRequest
): Promise<ApiResponse<UserResponseDto>> {
  try {
    const query = new GetCurrentUserQuery(req.user.sub);
    const result = await this.queryBus.execute(query);

    return ApiResponse.success(result.data, '获取用户信息成功');
  } catch (error) {
    if (error instanceof UserNotFoundException) {
      return ApiResponse.error('用户不存在', 'USER_NOT_FOUND', 404);
    }

    console.error('Get current user error:', error);
    return ApiResponse.error('获取用户信息失败', 'GET_USER_FAILED', 500);
  }
}
```

### 5.2 实现思路和业务逻辑

1. **身份验证**: 通过认证中间件确保用户已登录
2. **用户查找**: 根据JWT中的用户ID查找用户信息
3. **数据转换**: 将领域实体转换为DTO响应格式
4. **隐私保护**: 不返回敏感信息如密码哈希
5. **权限信息**: 包含用户的角色和权限信息

## 📋 6. 需要添加的DTO定义

### 6.1 新增DTO文件
**路径**: `src/presentation/dto/auth.dto.ts` (添加到现有文件)
```typescript
// 登出请求DTO
export class LogoutUserDto {
  @Expose()
  @IsOptional()
  @IsString({ message: '刷新令牌必须是字符串' })
  refreshToken?: string;

  @Expose()
  @IsOptional()
  @IsBoolean({ message: '登出所有设备必须是布尔值' })
  logoutAllDevices?: boolean = false;
}

// 刷新令牌请求DTO
export class RefreshTokenDto {
  @Expose()
  @IsString({ message: '刷新令牌必须是字符串' })
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  refreshToken: string;
}

// 重置密码请求DTO
export class ResetPasswordDto {
  @Expose()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @Expose()
  @IsString({ message: '验证码必须是字符串' })
  @Length(6, 6, { message: '验证码必须是6位数字' })
  @Matches(/^\d{6}$/, { message: '验证码必须是6位数字' })
  verificationCode: string;

  @Expose()
  @IsString({ message: '新密码必须是字符串' })
  @Length(8, 128, { message: '密码长度必须在8-128个字符之间' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  newPassword: string;

  @Expose()
  @IsString({ message: '确认密码必须是字符串' })
  confirmPassword: string;
}

// 用户响应DTO
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  firstName?: string;

  @Expose()
  lastName?: string;

  @Expose()
  avatar?: string;

  @Expose()
  role: string;

  @Expose()
  status: string;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  lastLoginAt?: Date;

  @Expose()
  permissions: string[];
}
```

## 🔧 7. 需要添加的异常类

### 7.1 认证异常类
**路径**: `src/shared/exceptions/auth.exceptions.ts`
```typescript
/**
 * 认证相关异常类
 */

export class InvalidCredentialsException extends Error {
  constructor(message: string = '用户名或密码错误') {
    super(message);
    this.name = 'InvalidCredentialsException';
  }
}

export class AccountNotVerifiedException extends Error {
  constructor(message: string = '账户未验证') {
    super(message);
    this.name = 'AccountNotVerifiedException';
  }
}

export class AccountSuspendedException extends Error {
  constructor(message: string = '账户已被暂停') {
    super(message);
    this.name = 'AccountSuspendedException';
  }
}

export class TooManyAttemptsException extends Error {
  constructor(message: string = '尝试次数过多') {
    super(message);
    this.name = 'TooManyAttemptsException';
  }
}

export class InvalidTokenException extends Error {
  constructor(message: string = '无效的令牌') {
    super(message);
    this.name = 'InvalidTokenException';
  }
}

export class TokenExpiredException extends Error {
  constructor(message: string = '令牌已过期') {
    super(message);
    this.name = 'TokenExpiredException';
  }
}

export class UserNotFoundException extends Error {
  constructor(message: string = '用户不存在') {
    super(message);
    this.name = 'UserNotFoundException';
  }
}

export class PasswordMismatchException extends Error {
  constructor(message: string = '密码不匹配') {
    super(message);
    this.name = 'PasswordMismatchException';
  }
}

export class WeakPasswordException extends Error {
  constructor(message: string = '密码强度不足') {
    super(message);
    this.name = 'WeakPasswordException';
  }
}
```

## 🔗 8. 服务注册和令牌配置

### 8.1 更新依赖注入令牌
**路径**: `src/core/di/tokens.ts` (添加到现有文件)
```typescript
export const SERVICE_TOKENS = {
  // ... 现有令牌
  TOKEN_BLACKLIST_SERVICE: Symbol('TokenBlacklistService'),
  RATE_LIMITER_SERVICE: Symbol('RateLimiterService'),
} as const;
```

### 8.2 更新主应用文件
**路径**: `src/main.ts` (添加到现有文件)
```typescript
// 导入新服务
import { TokenBlacklistService } from './infrastructure/services/token-blacklist.service';
import { RateLimiterService } from './infrastructure/services/rate-limiter.service';

// 导入新的命令处理器
import { LoginUserHandler } from './application/command-handlers/auth/login-user.handler';
import { LogoutUserHandler } from './application/command-handlers/auth/logout-user.handler';
import { RefreshTokenHandler } from './application/command-handlers/auth/refresh-token.handler';
import { ResetPasswordHandler } from './application/command-handlers/auth/reset-password.handler';

// 导入新的查询处理器
import { GetCurrentUserHandler } from './application/query-handlers/auth/get-current-user.handler';

// 在服务注册部分添加
container.register(SERVICE_TOKENS.TOKEN_BLACKLIST_SERVICE, TokenBlacklistService);
container.register(SERVICE_TOKENS.RATE_LIMITER_SERVICE, RateLimiterService);

// 在处理器注册部分添加
commandBus.registerHandler(LoginUserHandler);
commandBus.registerHandler(LogoutUserHandler);
commandBus.registerHandler(RefreshTokenHandler);
commandBus.registerHandler(ResetPasswordHandler);

queryBus.registerHandler(GetCurrentUserHandler);
```

## 📊 9. 实施计划和优先级

### 9.1 实施顺序
1. **第一阶段**: 创建基础服务和异常类
   - TokenBlacklistService
   - 认证异常类
   - DTO定义

2. **第二阶段**: 实现核心认证功能
   - 用户登录
   - 刷新令牌
   - 获取用户信息

3. **第三阶段**: 实现安全功能
   - 用户登出
   - 重置密码

4. **第四阶段**: 测试和优化
   - 单元测试
   - 集成测试
   - 性能优化

### 9.2 测试建议
```typescript
// 测试用例示例
describe('LoginUserHandler', () => {
  it('should login user with valid credentials', async () => {
    // 测试正常登录流程
  });

  it('should throw InvalidCredentialsException for wrong password', async () => {
    // 测试密码错误
  });

  it('should throw AccountNotVerifiedException for unverified account', async () => {
    // 测试未验证账户
  });
});
```

## 🎯 10. 总结

本实现方案提供了完整的认证管理模块API接口实现，包括：

### ✅ 核心特性
- **安全登录**: 支持频率限制和多种验证
- **令牌管理**: 完整的令牌生命周期管理
- **密码安全**: 强密码策略和安全重置
- **用户信息**: 安全的用户信息获取

### ✅ 技术优势
- **CQRS架构**: 遵循项目现有架构模式
- **安全设计**: 多层安全防护机制
- **性能优化**: Redis缓存和黑名单机制
- **错误处理**: 详细的异常处理和用户反馈

### ✅ 扩展性
- **模块化设计**: 易于扩展和维护
- **接口抽象**: 支持不同的实现方式
- **配置灵活**: 支持多种部署环境

所有实现都严格遵循AMTools项目的现有代码风格和架构模式，确保与现有系统的无缝集成。

---

**实现方案版本**: v1.0.0
**创建时间**: 2025-06-28
**适用系统**: AMTools v1.0.0
**预估开发周期**: 2-3周
```
```
