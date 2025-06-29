/**
 * 检查用户名可用性查询处理器
 * 
 * 处理用户名可用性检查查询，验证指定用户名是否已被注册使用。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { Injectable, Inject } from '../../../core/di/decorators';
import { QueryHandler } from '../../../core/cqrs/decorators';
import { IQueryHandler, QueryResult } from '../../../core/cqrs/types';
import { REPOSITORY_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { CheckUsernameAvailabilityQuery } from '../../queries/auth/check-username-availability.query';
import { Username } from '../../../domain/value-objects/username.vo';

/**
 * 用户名可用性检查查询处理器
 */
@QueryHandler(CheckUsernameAvailabilityQuery)
@Injectable()
export class CheckUsernameAvailabilityQueryHandler implements IQueryHandler<CheckUsernameAvailabilityQuery> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * 执行用户名可用性检查查询
   * 
   * @param query 用户名可用性检查查询
   * @returns 查询结果
   */
  async execute(query: CheckUsernameAvailabilityQuery): Promise<QueryResult> {
    try {
      // 验证查询参数
      const validation = query.validate();
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 创建用户名值对象
      const username = Username.create(query.username);
      
      // 检查用户名是否已存在
      const existingUser = await this.userRepository.findByUsername(username);
      
      // 用户名可用性：不存在用户则可用
      const available = !existingUser;
      
      // 生成建议用户名（如果不可用）
      let suggestion: string | undefined;
      if (!available) {
        suggestion = await this.generateUsernameSuggestion(query.username);
      }

      return {
        success: true,
        data: {
          available,
          suggestion,
          username: query.username,
          checkedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Username availability check failed:', error);
      return {
        success: false,
        errors: [{
          field: 'username',
          message: '用户名可用性检查失败',
          code: 'USERNAME_AVAILABILITY_CHECK_FAILED'
        }]
      };
    }
  }

  /**
   * 生成用户名建议
   * 
   * @param originalUsername 原始用户名
   * @returns 建议的用户名
   */
  private async generateUsernameSuggestion(originalUsername: string): Promise<string | undefined> {
    try {
      // 尝试几种变体
      const suggestions = [
        `${originalUsername}1`,
        `${originalUsername}_user`,
        `${originalUsername}${new Date().getFullYear()}`,
        `${originalUsername}_${Math.floor(Math.random() * 100)}`,
        `user_${originalUsername}`,
        `${originalUsername}${Math.floor(Math.random() * 1000)}`
      ];

      // 检查建议的用户名是否可用
      for (const suggestion of suggestions) {
        try {
          const suggestionUsername = Username.create(suggestion);
          const existingUser = await this.userRepository.findByUsername(suggestionUsername);
          if (!existingUser) {
            return suggestion;
          }
        } catch (error) {
          // 忽略无效的建议用户名
          continue;
        }
      }

      return undefined;
    } catch (error) {
      console.error('Failed to generate username suggestion:', error);
      return undefined;
    }
  }

  /**
   * 获取处理器名称
   * 
   * @returns 处理器名称
   */
  getHandlerName(): string {
    return 'CheckUsernameAvailabilityQueryHandler';
  }

  /**
   * 获取支持的查询类型
   * 
   * @returns 查询类型名称
   */
  getSupportedQueryType(): string {
    return CheckUsernameAvailabilityQuery.name;
  }

  /**
   * 检查处理器是否可以处理指定查询
   * 
   * @param query 查询实例
   * @returns 是否可以处理
   */
  canHandle(query: any): boolean {
    return query instanceof CheckUsernameAvailabilityQuery;
  }

  /**
   * 获取处理器描述
   * 
   * @returns 处理器描述
   */
  getDescription(): string {
    return '检查用户名是否已被注册使用，并在不可用时提供替代建议';
  }

  /**
   * 获取处理器版本
   * 
   * @returns 版本号
   */
  getVersion(): string {
    return '1.0.0';
  }

  /**
   * 检查处理器依赖是否就绪
   * 
   * @returns 依赖是否就绪
   */
  isDependenciesReady(): boolean {
    return !!this.userRepository;
  }

  /**
   * 获取处理器统计信息
   * 
   * @returns 统计信息
   */
  getStats(): {
    handlerName: string;
    supportedQueryType: string;
    dependenciesReady: boolean;
    lastExecutionTime?: Date;
  } {
    return {
      handlerName: this.getHandlerName(),
      supportedQueryType: this.getSupportedQueryType(),
      dependenciesReady: this.isDependenciesReady(),
      lastExecutionTime: new Date()
    };
  }
}
