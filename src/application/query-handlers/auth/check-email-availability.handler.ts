/**
 * 检查邮箱可用性查询处理器
 * 
 * 处理邮箱可用性检查查询，验证指定邮箱是否已被注册使用。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { Injectable, Inject } from '../../../core/di/decorators';
import { QueryHandler } from '../../../core/cqrs/decorators';
import { IQueryHandler, QueryResult } from '../../../core/cqrs/types';
import { REPOSITORY_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { CheckEmailAvailabilityQuery } from '../../queries/auth/check-email-availability.query';
import { Email } from '../../../domain/value-objects/email.vo';

/**
 * 邮箱可用性检查查询处理器
 */
@QueryHandler(CheckEmailAvailabilityQuery)
@Injectable()
export class CheckEmailAvailabilityQueryHandler implements IQueryHandler<CheckEmailAvailabilityQuery> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * 执行邮箱可用性检查查询
   * 
   * @param query 邮箱可用性检查查询
   * @returns 查询结果
   */
  async execute(query: CheckEmailAvailabilityQuery): Promise<QueryResult> {
    try {
      // 验证查询参数
      const validation = query.validate();
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 创建邮箱值对象
      const email = Email.create(query.email);
      
      // 检查邮箱是否已存在
      const existingUser = await this.userRepository.findByEmail(email);
      
      // 邮箱可用性：不存在用户则可用
      const available = !existingUser;
      
      // 生成建议邮箱（如果不可用）
      let suggestion: string | undefined;
      if (!available) {
        suggestion = await this.generateEmailSuggestion(query.email);
      }

      return {
        success: true,
        data: {
          available,
          suggestion,
          email: query.email,
          checkedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Email availability check failed:', error);
      return {
        success: false,
        errors: [{
          field: 'email',
          message: '邮箱可用性检查失败',
          code: 'EMAIL_AVAILABILITY_CHECK_FAILED'
        }]
      };
    }
  }

  /**
   * 生成邮箱建议
   * 
   * @param originalEmail 原始邮箱
   * @returns 建议的邮箱
   */
  private async generateEmailSuggestion(originalEmail: string): Promise<string | undefined> {
    try {
      const [localPart, domain] = originalEmail.split('@');
      
      // 尝试几种变体
      const suggestions = [
        `${localPart}1@${domain}`,
        `${localPart}.user@${domain}`,
        `${localPart}${new Date().getFullYear()}@${domain}`,
        `${localPart}_${Math.floor(Math.random() * 100)}@${domain}`
      ];

      // 检查建议的邮箱是否可用
      for (const suggestion of suggestions) {
        try {
          const suggestionEmail = Email.create(suggestion);
          const existingUser = await this.userRepository.findByEmail(suggestionEmail);
          if (!existingUser) {
            return suggestion;
          }
        } catch (error) {
          // 忽略无效的建议邮箱
          continue;
        }
      }

      return undefined;
    } catch (error) {
      console.error('Failed to generate email suggestion:', error);
      return undefined;
    }
  }

  /**
   * 获取处理器名称
   * 
   * @returns 处理器名称
   */
  getHandlerName(): string {
    return 'CheckEmailAvailabilityQueryHandler';
  }

  /**
   * 获取支持的查询类型
   * 
   * @returns 查询类型名称
   */
  getSupportedQueryType(): string {
    return CheckEmailAvailabilityQuery.name;
  }

  /**
   * 检查处理器是否可以处理指定查询
   * 
   * @param query 查询实例
   * @returns 是否可以处理
   */
  canHandle(query: any): boolean {
    return query instanceof CheckEmailAvailabilityQuery;
  }

  /**
   * 获取处理器描述
   * 
   * @returns 处理器描述
   */
  getDescription(): string {
    return '检查邮箱是否已被注册使用，并在不可用时提供替代建议';
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
