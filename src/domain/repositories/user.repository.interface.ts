/**
 * 用户仓储接口
 */

import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { Username } from '../value-objects/username.vo';
import { UserRole, UserStatus } from '../../shared/types/auth.types';
import { PaginationParams, FilterParams } from '../../shared/types/common.types';

export interface UserSearchCriteria extends FilterParams {
  email?: string;
  username?: string;
  role?: UserRole;
  status?: UserStatus;
  isEmailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
}

export interface UserListResult {
  users: User[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IUserRepository {
  /**
   * 保存用户
   */
  save(user: User): Promise<void>;

  /**
   * 根据ID查找用户
   */
  findById(id: string): Promise<User | null>;

  /**
   * 根据邮箱查找用户
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * 根据用户名查找用户
   */
  findByUsername(username: Username): Promise<User | null>;

  /**
   * 根据邮箱或用户名查找用户
   */
  findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;

  /**
   * 检查邮箱是否已存在
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * 检查用户名是否已存在
   */
  existsByUsername(username: Username): Promise<boolean>;

  /**
   * 检查邮箱或用户名是否已存在
   */
  exists(email: Email, username: Username): Promise<boolean>;

  /**
   * 删除用户
   */
  delete(id: string): Promise<void>;

  /**
   * 软删除用户
   */
  softDelete(id: string): Promise<void>;

  /**
   * 恢复软删除的用户
   */
  restore(id: string): Promise<void>;

  /**
   * 分页查询用户列表
   */
  findMany(
    criteria: UserSearchCriteria,
    pagination: PaginationParams
  ): Promise<UserListResult>;

  /**
   * 根据角色查找用户
   */
  findByRole(role: UserRole, pagination?: PaginationParams): Promise<UserListResult>;

  /**
   * 根据状态查找用户
   */
  findByStatus(status: UserStatus, pagination?: PaginationParams): Promise<UserListResult>;

  /**
   * 查找未验证邮箱的用户
   */
  findUnverifiedUsers(olderThanDays?: number): Promise<User[]>;

  /**
   * 查找长时间未登录的用户
   */
  findInactiveUsers(daysInactive: number): Promise<User[]>;

  /**
   * 统计用户数量
   */
  count(criteria?: Partial<UserSearchCriteria>): Promise<number>;

  /**
   * 根据角色统计用户数量
   */
  countByRole(): Promise<Record<UserRole, number>>;

  /**
   * 根据状态统计用户数量
   */
  countByStatus(): Promise<Record<UserStatus, number>>;

  /**
   * 批量更新用户状态
   */
  batchUpdateStatus(userIds: string[], status: UserStatus): Promise<void>;

  /**
   * 批量删除用户
   */
  batchDelete(userIds: string[]): Promise<void>;

  /**
   * 获取用户注册统计
   */
  getRegistrationStats(startDate: Date, endDate: Date): Promise<{
    totalRegistrations: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    dailyStats: Array<{
      date: string;
      registrations: number;
      verifications: number;
    }>;
  }>;

  /**
   * 获取用户活跃度统计
   */
  getActivityStats(startDate: Date, endDate: Date): Promise<{
    totalActiveUsers: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  }>;

  /**
   * 开始事务
   */
  beginTransaction(): Promise<void>;

  /**
   * 提交事务
   */
  commitTransaction(): Promise<void>;

  /**
   * 回滚事务
   */
  rollbackTransaction(): Promise<void>;
}
