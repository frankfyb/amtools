/**
 * 根据邮箱获取用户查询处理器
 */

import { Injectable, Inject } from '../../../core/di/decorators';
import { QueryHandler } from '../../../core/cqrs/decorators';
import { IQueryHandler, QueryResult } from '../../../core/cqrs/types';
import { REPOSITORY_TOKENS } from '../../../core/di/tokens';
import { GetUserByEmailQuery } from '../../queries/auth/get-user-by-email.query';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { Email } from '../../../domain/value-objects/email.vo';
import { AUTH_ERROR_CODES } from '../../../shared/constants/auth.constants';

@QueryHandler(GetUserByEmailQuery)
@Injectable()
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, QueryResult> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository
  ) {}

  async execute(query: GetUserByEmailQuery): Promise<QueryResult> {
    try {
      const email = Email.create(query.email);
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: '用户不存在',
            code: AUTH_ERROR_CODES.USER_NOT_FOUND
          }]
        };
      }

      // 转换为安全的用户数据（不包含敏感信息）
      const userData = {
        id: user.id,
        email: user.email.value,
        username: user.username.value,
        displayName: user.getDisplayName(),
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        profile: user.profile
      };

      return {
        success: true,
        data: userData
      };

    } catch (error) {
      console.error('Get user by email query failed:', error);
      
      return {
        success: false,
        errors: [{
          field: 'general',
          message: '查询用户失败',
          code: 'QUERY_FAILED'
        }]
      };
    }
  }
}
