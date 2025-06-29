/**
 * 路由管理器
 */

import { Router, Request, Response } from 'express';
import { Injectable, Inject } from '../di/decorators';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { AuthMiddleware } from '../../presentation/middleware/auth.middleware';
import { AuthRoutes } from '../../presentation/routes/auth.routes';

export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  handler: string;
  middleware?: string[];
  validation?: any;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

@Injectable()
export class AppRouter {
  private router: Router;

  constructor(
    private readonly authController: AuthController,
    private readonly authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * 设置所有路由
   */
  private setupRoutes(): void {
    this.setupAuthRoutes();
    this.setupHealthRoutes();
  }

  /**
   * 设置认证相关路由
   */
  private setupAuthRoutes(): void {
    const authRoutes = new AuthRoutes(this.authController, this.authMiddleware);
    this.router.use('/auth', authRoutes.getRouter());
  }

  /**
   * 设置健康检查路由
   */
  private setupHealthRoutes(): void {
    this.router.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'amtools-backend',
          version: '1.0.0'
        }
      });
    });
  }

  /**
   * 获取路由器实例
   */
  getRouter(): Router {
    return this.router;
  }
}
