/**
 * 用户仓储实现
 */

import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Injectable, Inject } from '../../../core/di/decorators';
import { EXTERNAL_TOKENS } from '../../../core/di/tokens';
import { IUserRepository, UserSearchCriteria, UserListResult } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Username } from '../../../domain/value-objects/username.vo';
import { UserRole, UserStatus } from '../../../shared/types/auth.types';
import { PaginationParams } from '../../../shared/types/common.types';
import { UserModel } from '../models/user.model';

@Injectable()
export class UserRepository implements IUserRepository {
  private repository: Repository<UserModel>;

  constructor(
    @Inject(EXTERNAL_TOKENS.DATABASE_CONNECTION)
    private dataSource: DataSource
  ) {
    this.repository = this.dataSource.getRepository(UserModel);
  }

  async save(user: User): Promise<void> {
    const userModel = await this.toModel(user);
    await this.repository.save(userModel);
  }

  async findById(id: string): Promise<User | null> {
    const userModel = await this.repository.findOne({
      where: { id, deletedAt: null }
    });
    
    return userModel ? this.toDomain(userModel) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userModel = await this.repository.findOne({
      where: { email: email.value, deletedAt: null }
    });
    
    return userModel ? this.toDomain(userModel) : null;
  }

  async findByUsername(username: Username): Promise<User | null> {
    const userModel = await this.repository.findOne({
      where: { username: username.value, deletedAt: null }
    });
    
    return userModel ? this.toDomain(userModel) : null;
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const userModel = await this.repository.findOne({
      where: [
        { email: emailOrUsername, deletedAt: null },
        { username: emailOrUsername, deletedAt: null }
      ]
    });
    
    return userModel ? this.toDomain(userModel) : null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.repository.count({
      where: { email: email.value, deletedAt: null }
    });
    return count > 0;
  }

  async existsByUsername(username: Username): Promise<boolean> {
    const count = await this.repository.count({
      where: { username: username.value, deletedAt: null }
    });
    return count > 0;
  }

  async exists(email: Email, username: Username): Promise<boolean> {
    const count = await this.repository.count({
      where: [
        { email: email.value, deletedAt: null },
        { username: username.value, deletedAt: null }
      ]
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.repository.findOne({ where: { id } });
    if (user) {
      user.softDelete();
      await this.repository.save(user);
    }
  }

  async restore(id: string): Promise<void> {
    const user = await this.repository.findOne({ 
      where: { id },
      withDeleted: true 
    });
    if (user && user.deletedAt) {
      user.restore();
      await this.repository.save(user);
    }
  }

  async findMany(
    criteria: UserSearchCriteria,
    pagination: PaginationParams
  ): Promise<UserListResult> {
    const queryBuilder = this.createQueryBuilder(criteria);
    
    // 分页
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const skip = (page - 1) * pageSize;
    
    queryBuilder.skip(skip).take(pageSize);
    
    // 排序
    if (pagination.sortBy) {
      const order = pagination.sortOrder === 'desc' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`user.${pagination.sortBy}`, order);
    } else {
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }
    
    const [userModels, totalCount] = await queryBuilder.getManyAndCount();
    const users = userModels.map(model => this.toDomain(model));
    
    return {
      users,
      totalCount,
      hasNextPage: skip + pageSize < totalCount,
      hasPreviousPage: page > 1
    };
  }

  async findByRole(role: UserRole, pagination?: PaginationParams): Promise<UserListResult> {
    return this.findMany({ role }, pagination || {});
  }

  async findByStatus(status: UserStatus, pagination?: PaginationParams): Promise<UserListResult> {
    return this.findMany({ status }, pagination || {});
  }

  async findUnverifiedUsers(olderThanDays?: number): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user')
      .where('user.isEmailVerified = :isVerified', { isVerified: false })
      .andWhere('user.deletedAt IS NULL');
    
    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      queryBuilder.andWhere('user.createdAt < :cutoffDate', { cutoffDate });
    }
    
    const userModels = await queryBuilder.getMany();
    return userModels.map(model => this.toDomain(model));
  }

  async findInactiveUsers(daysInactive: number): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    const userModels = await this.repository.createQueryBuilder('user')
      .where('user.lastLoginAt < :cutoffDate OR user.lastLoginAt IS NULL', { cutoffDate })
      .andWhere('user.deletedAt IS NULL')
      .getMany();
    
    return userModels.map(model => this.toDomain(model));
  }

  async count(criteria?: Partial<UserSearchCriteria>): Promise<number> {
    if (!criteria) {
      return this.repository.count({ where: { deletedAt: null } });
    }
    
    const queryBuilder = this.createQueryBuilder(criteria);
    return queryBuilder.getCount();
  }

  async countByRole(): Promise<Record<UserRole, number>> {
    const results = await this.repository.createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.deletedAt IS NULL')
      .groupBy('user.role')
      .getRawMany();
    
    const counts = {} as Record<UserRole, number>;
    Object.values(UserRole).forEach(role => {
      counts[role] = 0;
    });
    
    results.forEach(result => {
      counts[result.role] = parseInt(result.count);
    });
    
    return counts;
  }

  async countByStatus(): Promise<Record<UserStatus, number>> {
    const results = await this.repository.createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('user.deletedAt IS NULL')
      .groupBy('user.status')
      .getRawMany();
    
    const counts = {} as Record<UserStatus, number>;
    Object.values(UserStatus).forEach(status => {
      counts[status] = 0;
    });
    
    results.forEach(result => {
      counts[result.status] = parseInt(result.count);
    });
    
    return counts;
  }

  async batchUpdateStatus(userIds: string[], status: UserStatus): Promise<void> {
    await this.repository.update(userIds, { status });
  }

  async batchDelete(userIds: string[]): Promise<void> {
    await this.repository.delete(userIds);
  }

  async getRegistrationStats(startDate: Date, endDate: Date): Promise<any> {
    // 实现注册统计逻辑
    const totalRegistrations = await this.repository.count({
      where: {
        createdAt: { $gte: startDate, $lte: endDate } as any,
        deletedAt: null
      }
    });
    
    // 这里可以添加更详细的统计逻辑
    return {
      totalRegistrations,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      dailyStats: []
    };
  }

  async getActivityStats(startDate: Date, endDate: Date): Promise<any> {
    // 实现活跃度统计逻辑
    return {
      totalActiveUsers: 0,
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0
    };
  }

  async beginTransaction(): Promise<void> {
    // 事务管理将在更高层处理
  }

  async commitTransaction(): Promise<void> {
    // 事务管理将在更高层处理
  }

  async rollbackTransaction(): Promise<void> {
    // 事务管理将在更高层处理
  }

  private createQueryBuilder(criteria: UserSearchCriteria): SelectQueryBuilder<UserModel> {
    const queryBuilder = this.repository.createQueryBuilder('user')
      .where('user.deletedAt IS NULL');
    
    if (criteria.email) {
      queryBuilder.andWhere('user.email = :email', { email: criteria.email });
    }
    
    if (criteria.username) {
      queryBuilder.andWhere('user.username = :username', { username: criteria.username });
    }
    
    if (criteria.role) {
      queryBuilder.andWhere('user.role = :role', { role: criteria.role });
    }
    
    if (criteria.status) {
      queryBuilder.andWhere('user.status = :status', { status: criteria.status });
    }
    
    if (criteria.isEmailVerified !== undefined) {
      queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', { 
        isEmailVerified: criteria.isEmailVerified 
      });
    }
    
    if (criteria.search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.username ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${criteria.search}%` }
      );
    }
    
    return queryBuilder;
  }

  private async toModel(user: User): Promise<UserModel> {
    const model = new UserModel();
    const plainUser = user.toPlainObject();
    
    model.id = plainUser.id;
    model.email = plainUser.email;
    model.username = plainUser.username;
    model.passwordHash = await user.getPasswordHash();
    model.firstName = plainUser.profile.firstName;
    model.lastName = plainUser.profile.lastName;
    model.avatar = plainUser.profile.avatar;
    model.bio = plainUser.profile.bio;
    model.location = plainUser.profile.location;
    model.website = plainUser.profile.website;
    model.birthDate = plainUser.profile.birthDate;
    model.phoneNumber = plainUser.profile.phoneNumber;
    model.role = plainUser.role;
    model.status = plainUser.status;
    model.isEmailVerified = plainUser.isEmailVerified;
    model.emailVerifiedAt = plainUser.emailVerifiedAt;
    model.lastLoginAt = plainUser.lastLoginAt;
    model.createdAt = plainUser.createdAt;
    model.updatedAt = plainUser.updatedAt;
    model.version = plainUser.version;
    
    return model;
  }

  private toDomain(model: UserModel): User {
    return User.reconstruct({
      id: model.id,
      email: model.email,
      username: model.username,
      passwordHash: model.passwordHash,
      profile: {
        firstName: model.firstName,
        lastName: model.lastName,
        avatar: model.avatar,
        bio: model.bio,
        location: model.location,
        website: model.website,
        birthDate: model.birthDate,
        phoneNumber: model.phoneNumber
      },
      role: model.role,
      status: model.status,
      isEmailVerified: model.isEmailVerified,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      lastLoginAt: model.lastLoginAt,
      emailVerifiedAt: model.emailVerifiedAt,
      version: model.version
    });
  }
}
