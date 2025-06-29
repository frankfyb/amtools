/**
 * 用户实体
 */

import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { Username } from '../value-objects/username.vo';
import { UserRole, UserStatus } from '../../shared/types/auth.types';
import { CryptoUtil } from '../../shared/utils/crypto.util';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthDate?: Date;
  phoneNumber?: string;
}

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: Email,
    private readonly _username: Username,
    private _password: Password,
    private _profile: UserProfile,
    private _role: UserRole,
    private _status: UserStatus,
    private _isEmailVerified: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _lastLoginAt?: Date,
    private _emailVerifiedAt?: Date,
    private _version: number = 1
  ) {}

  // Getters
  get id(): string {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get username(): Username {
    return this._username;
  }

  get profile(): UserProfile {
    return { ...this._profile };
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get emailVerifiedAt(): Date | undefined {
    return this._emailVerifiedAt;
  }

  get version(): number {
    return this._version;
  }

  /**
   * 创建新用户
   */
  static async create(userData: CreateUserData): Promise<User> {
    const id = CryptoUtil.generateUUID();
    const email = Email.create(userData.email);
    const username = Username.create(userData.username);
    const password = Password.create(userData.password);
    
    const profile: UserProfile = {
      firstName: userData.firstName,
      lastName: userData.lastName
    };

    const now = new Date();

    return new User(
      id,
      email,
      username,
      password,
      profile,
      userData.role || UserRole.USER,
      UserStatus.PENDING_VERIFICATION,
      false,
      now,
      now
    );
  }

  /**
   * 从持久化数据重建用户实体
   */
  static reconstruct(data: {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    profile: UserProfile;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    emailVerifiedAt?: Date;
    version: number;
  }): User {
    return new User(
      data.id,
      Email.create(data.email),
      Username.create(data.username),
      Password.fromHash(data.passwordHash),
      data.profile,
      data.role,
      data.status,
      data.isEmailVerified,
      data.createdAt,
      data.updatedAt,
      data.lastLoginAt,
      data.emailVerifiedAt,
      data.version
    );
  }

  /**
   * 验证密码
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return this._password.verify(plainPassword);
  }

  /**
   * 更改密码
   */
  async changePassword(newPassword: string): Promise<void> {
    this._password = Password.create(newPassword);
    this.updateTimestamp();
  }

  /**
   * 验证邮箱
   */
  verifyEmail(): void {
    if (this._isEmailVerified) {
      throw new Error('邮箱已经验证过了');
    }

    this._isEmailVerified = true;
    this._emailVerifiedAt = new Date();
    this._status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 更新个人资料
   */
  updateProfile(profileData: Partial<UserProfile>): void {
    this._profile = {
      ...this._profile,
      ...profileData
    };
    this.updateTimestamp();
  }

  /**
   * 更新角色
   */
  updateRole(role: UserRole): void {
    this._role = role;
    this.updateTimestamp();
  }

  /**
   * 激活用户
   */
  activate(): void {
    if (this._status === UserStatus.ACTIVE) {
      throw new Error('用户已经是激活状态');
    }
    this._status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 停用用户
   */
  deactivate(): void {
    if (this._status === UserStatus.INACTIVE) {
      throw new Error('用户已经是停用状态');
    }
    this._status = UserStatus.INACTIVE;
    this.updateTimestamp();
  }

  /**
   * 暂停用户
   */
  suspend(): void {
    this._status = UserStatus.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * 记录登录
   */
  recordLogin(): void {
    this._lastLoginAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 检查用户是否可以登录
   */
  canLogin(): boolean {
    return this._status === UserStatus.ACTIVE && this._isEmailVerified;
  }

  /**
   * 检查用户是否有特定权限
   */
  hasRole(role: UserRole): boolean {
    return this._role === role;
  }

  /**
   * 检查用户是否为管理员
   */
  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  /**
   * 获取用户显示名称
   */
  getDisplayName(): string {
    if (this._profile.firstName && this._profile.lastName) {
      return `${this._profile.firstName} ${this._profile.lastName}`;
    }
    if (this._profile.firstName) {
      return this._profile.firstName;
    }
    return this._username.value;
  }

  /**
   * 获取密码哈希值
   */
  async getPasswordHash(): Promise<string> {
    return this._password.hash();
  }

  /**
   * 更新时间戳和版本
   */
  private updateTimestamp(): void {
    this._updatedAt = new Date();
    this._version += 1;
  }

  /**
   * 转换为普通对象（用于序列化）
   */
  toPlainObject(): any {
    return {
      id: this._id,
      email: this._email.value,
      username: this._username.value,
      profile: this._profile,
      role: this._role,
      status: this._status,
      isEmailVerified: this._isEmailVerified,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastLoginAt: this._lastLoginAt,
      emailVerifiedAt: this._emailVerifiedAt,
      version: this._version
    };
  }
}
