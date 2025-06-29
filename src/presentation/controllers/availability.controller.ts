/**
 * 用户可用性检查控制器
 * 
 * 提供邮箱和用户名可用性检查的API接口，支持缓存和
 * 替代建议功能。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { Injectable, Inject } from '../../core/di/decorators';
import { CQRS_TOKENS } from '../../core/di/tokens';
import { IQueryBus } from '../../core/cqrs/types';

// 导入装饰器系统
import { Controller, Get, HttpCode, Param } from '../../core/routing/decorators';
import { UseInterceptors, CacheTTL } from '../../core/routing/interceptors/cache.interceptor';

// 导入Swagger装饰器
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiParameter,
  CommonApiResponses
} from '../../core/swagger/decorators';

// 导入查询和响应类型
import { ApiResponse } from '../../shared/responses/api-response';

/**
 * 可用性检查响应接口
 */
export interface AvailabilityResponse {
  /** 是否可用 */
  available: boolean;
  /** 替代建议 */
  suggestion?: string;
  /** 检查的值 */
  value: string;
  /** 检查类型 */
  type: 'email' | 'username';
  /** 检查时间 */
  checkedAt: string;
}

/**
 * 用户可用性检查控制器
 */
@Controller('/auth/availability')
@Injectable()
@ApiTags('可用性检查')
export class AvailabilityController {
  constructor(
    @Inject(CQRS_TOKENS.QUERY_BUS)
    private readonly queryBus: IQueryBus
  ) {}

  /**
   * 检查邮箱可用性
   * GET /api/v1/auth/availability/email/:email
   */
  @Get('/email/:email')
  @HttpCode(200)
  @UseInterceptors({ ttl: 60, tags: ['availability', 'email'] })
  @ApiOperation({
    summary: '检查邮箱可用性',
    description: '检查指定邮箱地址是否可用于注册，支持缓存以提高性能',
    tags: ['可用性检查']
  })
  @SwaggerApiResponse({
    status: 200,
    description: '邮箱可用性检查成功',
    type: 'object'
  })
  @CommonApiResponses.BadRequest('邮箱格式不正确')
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async checkEmailAvailability(
    @Param('email') email: string
  ): Promise<ApiResponse<AvailabilityResponse>> {
    try {
      // 基本格式验证
      if (!this.isValidEmail(email)) {
        return ApiResponse.validationError([{
          field: 'email',
          message: '邮箱格式不正确',
          code: 'INVALID_EMAIL_FORMAT',
          value: email
        }], '邮箱格式验证失败');
      }

      // TODO: 实现查询逻辑
      // const query = new CheckEmailAvailabilityQuery(email);
      // const result = await this.queryBus.execute(query);

      // 临时模拟响应
      const response: AvailabilityResponse = {
        available: true,
        suggestion: undefined,
        value: email,
        type: 'email',
        checkedAt: new Date().toISOString()
      };

      return ApiResponse.success(response, '邮箱可用');
    } catch (error) {
      console.error('Email availability check error:', error);
      return ApiResponse.internalError('邮箱可用性检查服务异常');
    }
  }

  /**
   * 检查用户名可用性
   * GET /api/v1/auth/availability/username/:username
   */
  @Get('/username/:username')
  @HttpCode(200)
  @UseInterceptors({ ttl: 60, tags: ['availability', 'username'] })
  @ApiOperation({
    summary: '检查用户名可用性',
    description: '检查指定用户名是否可用于注册，支持缓存以提高性能',
    tags: ['可用性检查']
  })
  @SwaggerApiResponse({
    status: 200,
    description: '用户名可用性检查成功',
    type: 'object'
  })
  @CommonApiResponses.BadRequest('用户名格式不正确')
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async checkUsernameAvailability(
    @Param('username') username: string
  ): Promise<ApiResponse<AvailabilityResponse>> {
    try {
      // 基本格式验证
      if (!this.isValidUsername(username)) {
        return ApiResponse.validationError([{
          field: 'username',
          message: '用户名格式不正确，只能包含字母、数字、下划线和连字符，长度3-50位',
          code: 'INVALID_USERNAME_FORMAT',
          value: username
        }], '用户名格式验证失败');
      }

      // TODO: 实现查询逻辑
      // const query = new CheckUsernameAvailabilityQuery(username);
      // const result = await this.queryBus.execute(query);

      // 临时模拟响应
      const response: AvailabilityResponse = {
        available: true,
        suggestion: undefined,
        value: username,
        type: 'username',
        checkedAt: new Date().toISOString()
      };

      return ApiResponse.success(response, '用户名可用');
    } catch (error) {
      console.error('Username availability check error:', error);
      return ApiResponse.internalError('用户名可用性检查服务异常');
    }
  }

  /**
   * 批量检查可用性
   * POST /api/v1/auth/availability/batch
   */
  @Get('/batch')
  @HttpCode(200)
  @ApiOperation({
    summary: '批量检查可用性',
    description: '批量检查邮箱和用户名的可用性',
    tags: ['可用性检查']
  })
  @SwaggerApiResponse({
    status: 200,
    description: '批量检查结果',
    type: 'object'
  })
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async checkBatchAvailability(): Promise<ApiResponse<{
    email?: AvailabilityResponse;
    username?: AvailabilityResponse;
  }>> {
    // TODO: 实现批量检查功能
    return ApiResponse.error('批量检查功能尚未实现', 'NOT_IMPLEMENTED');
  }

  /**
   * 获取可用性检查统计信息
   * GET /api/v1/auth/availability/stats
   */
  @Get('/stats')
  @HttpCode(200)
  @CacheTTL(300) // 缓存5分钟
  async getAvailabilityStats(): Promise<ApiResponse<{
    totalChecks: number;
    emailChecks: number;
    usernameChecks: number;
    cacheHitRate: number;
    lastUpdated: string;
  }>> {
    // TODO: 实现统计功能
    const stats = {
      totalChecks: 0,
      emailChecks: 0,
      usernameChecks: 0,
      cacheHitRate: 0,
      lastUpdated: new Date().toISOString()
    };

    return ApiResponse.success(stats, '可用性检查统计信息');
  }

  /**
   * 验证邮箱格式
   * 
   * @param email 邮箱地址
   * @returns 是否为有效邮箱格式
   */
  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // 基本长度检查
    if (email.length < 5 || email.length > 254) {
      return false;
    }

    // 邮箱格式正则表达式
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    return emailRegex.test(email);
  }

  /**
   * 验证用户名格式
   * 
   * @param username 用户名
   * @returns 是否为有效用户名格式
   */
  private isValidUsername(username: string): boolean {
    if (!username || typeof username !== 'string') {
      return false;
    }

    // 长度检查
    if (username.length < 3 || username.length > 50) {
      return false;
    }

    // 用户名格式正则表达式（字母、数字、下划线、连字符）
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    
    return usernameRegex.test(username);
  }

  /**
   * 生成邮箱替代建议
   * 
   * @param email 原邮箱
   * @returns 替代建议
   */
  private generateEmailSuggestion(email: string): string {
    const [localPart, domain] = email.split('@');
    const timestamp = Date.now().toString().slice(-4);
    return `${localPart}${timestamp}@${domain}`;
  }

  /**
   * 生成用户名替代建议
   * 
   * @param username 原用户名
   * @returns 替代建议
   */
  private generateUsernameSuggestion(username: string): string {
    const timestamp = Date.now().toString().slice(-4);
    return `${username}${timestamp}`;
  }

  /**
   * 获取控制器信息
   * 
   * @returns 控制器信息
   */
  getControllerInfo(): {
    name: string;
    version: string;
    description: string;
    endpoints: string[];
  } {
    return {
      name: 'AvailabilityController',
      version: '1.0.0',
      description: '用户可用性检查控制器',
      endpoints: [
        'GET /api/v1/auth/availability/email/:email',
        'GET /api/v1/auth/availability/username/:username',
        'GET /api/v1/auth/availability/batch',
        'GET /api/v1/auth/availability/stats'
      ]
    };
  }
}
