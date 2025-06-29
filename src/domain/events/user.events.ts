/**
 * 用户相关领域事件
 */

import { BaseDomainEvent } from './base-domain-event';
import { UserRole, UserStatus } from '../../shared/types/auth.types';

/**
 * 用户注册事件
 */
export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      username: string;
      firstName?: string;
      lastName?: string;
      role: UserRole;
      registrationSource?: string;
      utmData?: {
        source?: string;
        medium?: string;
        campaign?: string;
      };
    }
  ) {
    super(userId, 'User', 'UserRegistered', eventData);
  }

  get email(): string {
    return this.eventData.email;
  }

  get username(): string {
    return this.eventData.username;
  }

  get role(): UserRole {
    return this.eventData.role;
  }

  get fullName(): string | undefined {
    const { firstName, lastName } = this.eventData;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || undefined;
  }
}

/**
 * 邮箱验证事件
 */
export class EmailVerifiedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      verifiedAt: Date;
      verificationMethod: 'email_code' | 'email_link';
    }
  ) {
    super(userId, 'User', 'EmailVerified', eventData);
  }

  get email(): string {
    return this.eventData.email;
  }

  get verifiedAt(): Date {
    return this.eventData.verifiedAt;
  }

  get verificationMethod(): string {
    return this.eventData.verificationMethod;
  }
}

/**
 * 用户登录事件
 */
export class UserLoggedInEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      username: string;
      loginMethod: 'password' | 'oauth' | 'sso';
      ipAddress: string;
      userAgent: string;
      deviceInfo?: {
        deviceType: string;
        browser: string;
        os: string;
      };
      location?: string;
    }
  ) {
    super(userId, 'User', 'UserLoggedIn', eventData);
  }

  get email(): string {
    return this.eventData.email;
  }

  get username(): string {
    return this.eventData.username;
  }

  get loginMethod(): string {
    return this.eventData.loginMethod;
  }

  get ipAddress(): string {
    return this.eventData.ipAddress;
  }

  get userAgent(): string {
    return this.eventData.userAgent;
  }
}

/**
 * 用户登出事件
 */
export class UserLoggedOutEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      username: string;
      logoutReason: 'manual' | 'timeout' | 'forced';
      sessionDuration: number; // 会话持续时间（秒）
    }
  ) {
    super(userId, 'User', 'UserLoggedOut', eventData);
  }

  get logoutReason(): string {
    return this.eventData.logoutReason;
  }

  get sessionDuration(): number {
    return this.eventData.sessionDuration;
  }
}

/**
 * 密码更改事件
 */
export class PasswordChangedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      changeMethod: 'user_initiated' | 'admin_reset' | 'forced_reset';
      previousPasswordHash?: string; // 用于密码历史检查
    }
  ) {
    super(userId, 'User', 'PasswordChanged', eventData);
  }

  get changeMethod(): string {
    return this.eventData.changeMethod;
  }
}

/**
 * 用户资料更新事件
 */
export class UserProfileUpdatedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      updatedFields: string[];
      previousValues: Record<string, any>;
      newValues: Record<string, any>;
    }
  ) {
    super(userId, 'User', 'UserProfileUpdated', eventData);
  }

  get updatedFields(): string[] {
    return this.eventData.updatedFields;
  }

  get previousValues(): Record<string, any> {
    return this.eventData.previousValues;
  }

  get newValues(): Record<string, any> {
    return this.eventData.newValues;
  }
}

/**
 * 用户状态更改事件
 */
export class UserStatusChangedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      username: string;
      previousStatus: UserStatus;
      newStatus: UserStatus;
      reason?: string;
      changedBy?: string; // 管理员ID
    }
  ) {
    super(userId, 'User', 'UserStatusChanged', eventData);
  }

  get previousStatus(): UserStatus {
    return this.eventData.previousStatus;
  }

  get newStatus(): UserStatus {
    return this.eventData.newStatus;
  }

  get reason(): string | undefined {
    return this.eventData.reason;
  }

  get changedBy(): string | undefined {
    return this.eventData.changedBy;
  }
}

/**
 * 用户角色更改事件
 */
export class UserRoleChangedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      username: string;
      previousRole: UserRole;
      newRole: UserRole;
      changedBy: string; // 管理员ID
      reason?: string;
    }
  ) {
    super(userId, 'User', 'UserRoleChanged', eventData);
  }

  get previousRole(): UserRole {
    return this.eventData.previousRole;
  }

  get newRole(): UserRole {
    return this.eventData.newRole;
  }

  get changedBy(): string {
    return this.eventData.changedBy;
  }

  get reason(): string | undefined {
    return this.eventData.reason;
  }
}

/**
 * 用户删除事件
 */
export class UserDeletedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    eventData: {
      email: string;
      username: string;
      deletionType: 'soft' | 'hard';
      deletedBy?: string; // 管理员ID或用户自己
      reason?: string;
      dataRetentionDays?: number;
    }
  ) {
    super(userId, 'User', 'UserDeleted', eventData);
  }

  get deletionType(): string {
    return this.eventData.deletionType;
  }

  get deletedBy(): string | undefined {
    return this.eventData.deletedBy;
  }

  get reason(): string | undefined {
    return this.eventData.reason;
  }
}
