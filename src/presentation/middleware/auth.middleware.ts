/**
 * 认证中间件 - 表示层
 */

import { Request, Response, NextFunction } from 'express';
import { Injectable, Inject } from '../../core/di/decorators';
import { SERVICE_TOKENS } from '../../core/di/tokens';
import { JWTService, TokenExpiredError, InvalidTokenError } from '../../infrastructure/auth/jwt.service';
import { ApiResponse } from '../../shared/types/common.types';
import { JWTPayload } from '../../shared/types/auth.types';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

@Injectable()
export class AuthMiddleware {
  constructor(
    @Inject(SERVICE_TOKENS.JWT_SERVICE)
    private readonly jwtService: JWTService
  ) {}

  /**
   * JWT认证中间件
   */
  authenticate() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = this.extractTokenFromHeader(req);
        
        if (!token) {
          return this.sendUnauthorizedResponse(res, '缺少访问令牌');
        }

        // 验证令牌
        const payload = this.jwtService.verifyAccessToken(token);
        
        // 将用户信息附加到请求对象
        req.user = payload;
        req.userId = payload.sub;
        
        next();
      } catch (error) {
        if (error instanceof TokenExpiredError) {
          return this.sendUnauthorizedResponse(res, '访问令牌已过期', 'TOKEN_EXPIRED');
        } else if (error instanceof InvalidTokenError) {
          return this.sendUnauthorizedResponse(res, '无效的访问令牌', 'INVALID_TOKEN');
        } else {
          console.error('Authentication error:', error);
          return this.sendUnauthorizedResponse(res, '认证失败');
        }
      }
    };
  }

  /**
   * 可选认证中间件（令牌可选）
   */
  optionalAuthenticate() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = this.extractTokenFromHeader(req);
        
        if (token) {
          try {
            const payload = this.jwtService.verifyAccessToken(token);
            req.user = payload;
            req.userId = payload.sub;
          } catch (error) {
            // 可选认证中，令牌无效时不阻止请求
            console.warn('Optional authentication failed:', error.message);
          }
        }
        
        next();
      } catch (error) {
        console.error('Optional authentication error:', error);
        next(); // 继续处理请求
      }
    };
  }

  /**
   * 角色授权中间件
   */
  authorize(requiredRoles: string | string[]) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return this.sendUnauthorizedResponse(res, '需要认证');
      }

      const userRole = req.user.role;
      
      if (!roles.includes(userRole)) {
        return this.sendForbiddenResponse(res, '权限不足');
      }

      next();
    };
  }

  /**
   * 权限检查中间件
   */
  requirePermissions(requiredPermissions: string | string[]) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return this.sendUnauthorizedResponse(res, '需要认证');
      }

      const userPermissions = req.user.permissions || [];
      
      const hasAllPermissions = permissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return this.sendForbiddenResponse(res, '权限不足');
      }

      next();
    };
  }

  /**
   * 邮箱验证检查中间件
   */
  requireEmailVerified() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return this.sendUnauthorizedResponse(res, '需要认证');
      }

      // 这里需要查询用户的邮箱验证状态
      // 简化实现，实际应该从数据库查询
      // const user = await userRepository.findById(req.user.sub);
      // if (!user.isEmailVerified) {
      //   return this.sendForbiddenResponse(res, '需要验证邮箱');
      // }

      next();
    };
  }

  /**
   * API密钥认证中间件
   */
  authenticateApiKey() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const apiKey = this.extractApiKeyFromHeader(req);
        
        if (!apiKey) {
          return this.sendUnauthorizedResponse(res, '缺少API密钥');
        }

        // 验证API密钥
        const keyData = this.jwtService.verifyApiKey(apiKey);
        
        // 将API密钥信息附加到请求对象
        req.user = {
          sub: keyData.sub,
          email: '',
          username: '',
          role: 'api',
          permissions: keyData.permissions,
          iat: 0,
          exp: 0,
          iss: '',
          aud: ''
        };
        req.userId = keyData.sub;
        
        next();
      } catch (error) {
        console.error('API key authentication error:', error);
        return this.sendUnauthorizedResponse(res, '无效的API密钥', 'INVALID_API_KEY');
      }
    };
  }

  /**
   * 从请求头提取令牌
   */
  private extractTokenFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * 从请求头提取API密钥
   */
  private extractApiKeyFromHeader(req: Request): string | null {
    return req.headers['x-api-key'] as string || null;
  }

  /**
   * 发送未授权响应
   */
  private sendUnauthorizedResponse(res: Response, message: string, code: string = 'UNAUTHORIZED'): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code,
        message
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('x-request-id') as string || 'unknown',
        version: '1.0.0'
      }
    };

    res.status(401).json(response);
  }

  /**
   * 发送禁止访问响应
   */
  private sendForbiddenResponse(res: Response, message: string, code: string = 'FORBIDDEN'): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code,
        message
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('x-request-id') as string || 'unknown',
        version: '1.0.0'
      }
    };

    res.status(403).json(response);
  }
}
