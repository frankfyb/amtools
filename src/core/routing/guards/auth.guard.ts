/**
 * 认证守卫
 * 
 * 基于JWT的认证守卫，负责验证用户身份、权限检查、
 * 用户信息注入等功能。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { Injectable, Inject } from '../../di/decorators';
import { SERVICE_TOKENS } from '../../di/tokens';
import { JWTService } from '../../../infrastructure/auth/jwt.service';
import { ApiResponse } from '../../../shared/responses/api-response';

/**
 * 用户信息接口
 */
export interface UserInfo {
  /** 用户ID */
  id: string;
  /** 邮箱 */
  email: string;
  /** 用户名 */
  username: string;
  /** 角色 */
  role: string;
  /** 权限列表 */
  permissions: string[];
  /** 用户状态 */
  status: string;
  /** 邮箱是否已验证 */
  isEmailVerified: boolean;
  /** 令牌签发时间 */
  iat?: number;
  /** 令牌过期时间 */
  exp?: number;
}

/**
 * 扩展的请求接口，包含用户信息
 */
export interface AuthenticatedRequest extends Request {
  /** 当前认证用户信息 */
  user?: UserInfo;
  /** 原始JWT载荷 */
  jwtPayload?: any;
  /** 请求开始时间（用于性能监控） */
  startTime?: number;
}

/**
 * 认证守卫选项
 */
export interface AuthGuardOptions {
  /** 是否可选认证（不强制要求登录） */
  optional?: boolean;
  /** 需要的角色列表 */
  roles?: string[];
  /** 需要的权限列表 */
  permissions?: string[];
  /** 是否需要邮箱验证 */
  requireEmailVerified?: boolean;
  /** 自定义错误消息 */
  errorMessage?: string;
}

/**
 * 认证异常类
 */
export class AuthenticationException extends Error {
  constructor(
    message: string = '身份验证失败',
    public readonly code: string = 'AUTHENTICATION_FAILED',
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationException';
  }
}

/**
 * 授权异常类
 */
export class AuthorizationException extends Error {
  constructor(
    message: string = '权限不足',
    public readonly code: string = 'AUTHORIZATION_FAILED',
    public readonly statusCode: number = 403
  ) {
    super(message);
    this.name = 'AuthorizationException';
  }
}

/**
 * 认证守卫类
 */
@Injectable()
export class AuthGuard {
  constructor(
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: JWTService
  ) {}

  /**
   * 创建认证中间件
   * 
   * @param options 守卫选项
   * @returns Express中间件函数
   */
  authenticate(options: AuthGuardOptions = {}) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // 记录请求开始时间
        req.startTime = Date.now();

        // 提取令牌
        const token = this.extractTokenFromHeader(req);

        // 如果是可选认证且没有令牌，直接通过
        if (options.optional && !token) {
          return next();
        }

        // 验证令牌
        if (!token) {
          throw new AuthenticationException(
            options.errorMessage || '访问令牌缺失',
            'TOKEN_MISSING'
          );
        }

        // 解析和验证JWT
        const payload = await this.jwtService.verifyAccessToken(token);
        
        if (!payload) {
          throw new AuthenticationException(
            '访问令牌无效',
            'INVALID_TOKEN'
          );
        }

        // 构建用户信息
        const userInfo: UserInfo = {
          id: payload.sub,
          email: payload.email,
          username: payload.username,
          role: payload.role,
          permissions: payload.permissions || [],
          status: payload.status,
          isEmailVerified: payload.isEmailVerified || false,
          iat: payload.iat,
          exp: payload.exp
        };

        // 检查用户状态
        if (userInfo.status === 'LOCKED') {
          throw new AuthenticationException(
            '账户已被锁定',
            'ACCOUNT_LOCKED'
          );
        }

        if (userInfo.status === 'SUSPENDED') {
          throw new AuthenticationException(
            '账户已被暂停',
            'ACCOUNT_SUSPENDED'
          );
        }

        // 检查邮箱验证
        if (options.requireEmailVerified && !userInfo.isEmailVerified) {
          throw new AuthenticationException(
            '请先验证邮箱',
            'EMAIL_NOT_VERIFIED'
          );
        }

        // 检查角色权限
        if (options.roles && options.roles.length > 0) {
          if (!options.roles.includes(userInfo.role)) {
            throw new AuthorizationException(
              '角色权限不足',
              'INSUFFICIENT_ROLE'
            );
          }
        }

        // 检查具体权限
        if (options.permissions && options.permissions.length > 0) {
          const hasPermission = options.permissions.every(permission =>
            userInfo.permissions.includes(permission)
          );

          if (!hasPermission) {
            throw new AuthorizationException(
              '操作权限不足',
              'INSUFFICIENT_PERMISSION'
            );
          }
        }

        // 注入用户信息到请求对象
        req.user = userInfo;
        req.jwtPayload = payload;

        next();
      } catch (error) {
        this.handleAuthError(error, res);
      }
    };
  }

  /**
   * 创建角色检查中间件
   * 
   * @param roles 允许的角色列表
   * @returns Express中间件函数
   */
  requireRoles(roles: string[]) {
    return this.authenticate({ roles });
  }

  /**
   * 创建权限检查中间件
   * 
   * @param permissions 需要的权限列表
   * @returns Express中间件函数
   */
  requirePermissions(permissions: string[]) {
    return this.authenticate({ permissions });
  }

  /**
   * 创建管理员权限中间件
   * 
   * @returns Express中间件函数
   */
  requireAdmin() {
    return this.authenticate({ roles: ['admin'] });
  }

  /**
   * 创建可选认证中间件
   * 
   * @returns Express中间件函数
   */
  optional() {
    return this.authenticate({ optional: true });
  }

  /**
   * 从请求头中提取令牌
   * 
   * @param req 请求对象
   * @returns JWT令牌或null
   */
  private extractTokenFromHeader(req: AuthenticatedRequest): string | null {
    const authorization = req.headers.authorization;
    
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');
    
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  /**
   * 处理认证错误
   * 
   * @param error 错误对象
   * @param res 响应对象
   */
  private handleAuthError(error: any, res: Response): void {
    let response: ApiResponse;

    if (error instanceof AuthenticationException) {
      response = ApiResponse.error(error.message, error.code);
      res.status(error.statusCode);
    } else if (error instanceof AuthorizationException) {
      response = ApiResponse.error(error.message, error.code);
      res.status(error.statusCode);
    } else if (error.name === 'TokenExpiredError') {
      response = ApiResponse.error('访问令牌已过期', 'TOKEN_EXPIRED');
      res.status(401);
    } else if (error.name === 'JsonWebTokenError') {
      response = ApiResponse.error('访问令牌格式错误', 'INVALID_TOKEN_FORMAT');
      res.status(401);
    } else {
      console.error('Auth guard unexpected error:', error);
      response = ApiResponse.internalError('身份验证服务异常');
      res.status(500);
    }

    res.json(response);
  }

  /**
   * 验证用户是否有权限访问资源
   * 
   * @param user 用户信息
   * @param resourceId 资源ID
   * @param action 操作类型
   * @returns 是否有权限
   */
  async canAccess(user: UserInfo, resourceId: string, action: string): Promise<boolean> {
    // 管理员拥有所有权限
    if (user.role === 'admin') {
      return true;
    }

    // 检查具体权限
    const permission = `${action}:${resourceId}`;
    return user.permissions.includes(permission) || user.permissions.includes(`${action}:*`);
  }

  /**
   * 检查用户是否为资源所有者
   * 
   * @param user 用户信息
   * @param resourceOwnerId 资源所有者ID
   * @returns 是否为所有者
   */
  isResourceOwner(user: UserInfo, resourceOwnerId: string): boolean {
    return user.id === resourceOwnerId;
  }
}

/**
 * 认证装饰器工厂
 * 
 * @param options 认证选项
 * @returns 装饰器函数
 */
export function UseGuards(options?: AuthGuardOptions) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey) {
      // 方法级装饰器
      Reflect.defineMetadata('auth:options', options, target, propertyKey);
    } else {
      // 类级装饰器
      Reflect.defineMetadata('auth:options', options, target);
    }
  };
}

/**
 * 角色检查装饰器
 * 
 * @param roles 允许的角色列表
 * @returns 装饰器函数
 */
export function RequireRoles(...roles: string[]) {
  return UseGuards({ roles });
}

/**
 * 权限检查装饰器
 * 
 * @param permissions 需要的权限列表
 * @returns 装饰器函数
 */
export function RequirePermissions(...permissions: string[]) {
  return UseGuards({ permissions });
}

/**
 * 管理员权限装饰器
 */
export function RequireAdmin() {
  return UseGuards({ roles: ['admin'] });
}

/**
 * 可选认证装饰器
 */
export function OptionalAuth() {
  return UseGuards({ optional: true });
}
