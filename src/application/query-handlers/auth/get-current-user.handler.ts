/**
 * 获取当前用户信息查询处理器
 *
 * 处理获取当前登录用户详细信息的查询请求
 * 简化版本，直接从数据库获取用户信息
 */

import { QueryHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { GetCurrentUserQuery } from '../../queries/auth/get-current-user.query';
import { UserResponseDto } from '../../../presentation/dto/auth.dto';
import { User } from '../../../domain/entities/user.entity';
import { UserNotFoundException } from '../../../shared/exceptions/auth.exceptions';

/**
 * 用户信息查询结果接口
 */
interface UserInfoResult {
  /** 用户基本信息 */
  user: UserResponseDto;
  /** 查询时间 */
  queryTime: Date;
}

@QueryHandler(GetCurrentUserQuery)
@Injectable()
export class GetCurrentUserHandler {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * 执行获取当前用户信息查询
   */
  async execute(query: GetCurrentUserQuery): Promise<{ success: boolean; data: UserInfoResult }> {
    try {
      // 1. 验证查询参数
      const validation = query.validate();
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new Error(errorMessages);
      }

      // 2. 从数据库获取用户信息
      const user = await this.getUserFromDatabase(query);
      const userInfo = this.buildUserResponse(user, query);

      const queryTime = new Date();

      return {
        success: true,
        data: {
          user: userInfo,
          queryTime
        }
      };
    } catch (error: any) {
      // 记录查询失败日志
      console.error('获取用户信息失败:', {
        userId: query.userId,
        error: error.message
      });

      throw error;
    }
  }



  /**
   * 从数据库获取用户信息
   */
  private async getUserFromDatabase(query: GetCurrentUserQuery): Promise<User> {
    const user = await this.userRepository.findById(query.userId);
    
    if (!user) {
      throw new UserNotFoundException('用户不存在或已被删除');
    }

    console.log('✅ 从数据库获取用户信息:', query.userId);
    return user;
  }

  /**
   * 构建用户响应DTO
   */
  private buildUserResponse(user: User, query: GetCurrentUserQuery): UserResponseDto {
    const options = query.getQueryOptions();

    // 基本用户信息
    const userResponse = new UserResponseDto({
      id: user.id,
      email: user.email.value,
      username: user.username.value,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      displayName: user.getDisplayName(),
      avatar: user.profile?.avatar,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLoginAt: options.includeLastLogin ? user.lastLoginAt : undefined,
      permissions: [] // 暂时使用空数组，后续可以从用户角色获取
    });

    return userResponse;
  }

}
