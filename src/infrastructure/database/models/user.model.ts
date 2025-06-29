/**
 * 用户数据库模型
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  VersionColumn
} from 'typeorm';
import { UserRole, UserStatus } from '../../../shared/types/auth.types';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['status'])
@Index(['role'])
@Index(['isEmailVerified'])
@Index(['createdAt'])
@Index(['lastLoginAt'])
export class UserModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'last_name' })
  lastName?: string;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  phoneNumber?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'email_verified_at' })
  emailVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @Column({ type: 'inet', nullable: true, name: 'last_login_ip' })
  lastLoginIp?: string;

  @Column({ type: 'text', nullable: true, name: 'last_user_agent' })
  lastUserAgent?: string;

  @Column({ type: 'int', default: 0, name: 'login_attempts' })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true, name: 'locked_until' })
  lockedUntil?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'utm_source' })
  utmSource?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'utm_medium' })
  utmMedium?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'utm_campaign' })
  utmCampaign?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @VersionColumn()
  version: number;

  // 虚拟字段
  get fullName(): string | undefined {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || undefined;
  }

  get isLocked(): boolean {
    return this.lockedUntil ? new Date() < this.lockedUntil : false;
  }

  get isDeleted(): boolean {
    return !!this.deletedAt;
  }

  get displayName(): string {
    return this.fullName || this.username;
  }

  // 辅助方法
  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = undefined;
  }

  lockAccount(durationMinutes: number = 30): void {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + durationMinutes);
    this.lockedUntil = lockUntil;
  }

  updateLastLogin(ipAddress?: string, userAgent?: string): void {
    this.lastLoginAt = new Date();
    if (ipAddress) this.lastLoginIp = ipAddress;
    if (userAgent) this.lastUserAgent = userAgent;
    this.resetLoginAttempts();
  }

  verifyEmail(): void {
    this.isEmailVerified = true;
    this.emailVerifiedAt = new Date();
    if (this.status === UserStatus.PENDING_VERIFICATION) {
      this.status = UserStatus.ACTIVE;
    }
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.status = UserStatus.DELETED;
  }

  restore(): void {
    this.deletedAt = undefined;
    this.status = UserStatus.ACTIVE;
  }
}
