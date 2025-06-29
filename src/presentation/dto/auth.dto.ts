/**
 * 认证相关DTO - 表示层数据传输对象
 */

import { IsEmail, IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import { Expose } from 'class-transformer';
import { VerificationCodeType } from '../../shared/types/auth.types';
import { ApiProperty, ApiModel } from '../../core/swagger/decorators';

/**
 * 发送验证码请求DTO
 */
@ApiModel('SendVerificationCodeDto', '发送验证码请求数据')
export class SendVerificationCodeDto {
  @Expose()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @ApiProperty({
    description: '邮箱地址',
    type: 'string',
    format: 'email',
    example: 'user@example.com',
    required: true
  })
  email: string;

  @Expose()
  @IsString({ message: '验证码类型必须是字符串' })
  @ApiProperty({
    description: '验证码类型',
    type: 'string',
    enum: ['register', 'reset_password', 'login'],
    example: 'register',
    required: true
  })
  type: VerificationCodeType;

  @Expose()
  @IsOptional()
  @IsString({ message: '人机验证码必须是字符串' })
  @ApiProperty({
    description: '人机验证码（可选）',
    type: 'string',
    example: 'abc123',
    required: false
  })
  captcha?: string;
}

/**
 * 用户注册请求DTO
 */
export class RegisterUserDto {
  @Expose()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @Expose()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于3位' })
  @MaxLength(50, { message: '用户名长度不能超过50位' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: '用户名只能包含字母、数字、下划线和连字符' })
  username: string;

  @Expose()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于8位' })
  @MaxLength(128, { message: '密码长度不能超过128位' })
  password: string;

  @Expose()
  @IsString({ message: '确认密码必须是字符串' })
  confirmPassword: string;

  @Expose()
  @IsString({ message: '验证码必须是字符串' })
  @Matches(/^\d{6}$/, { message: '验证码必须是6位数字' })
  verificationCode: string;

  @Expose()
  @IsOptional()
  @IsString({ message: '名字必须是字符串' })
  @MaxLength(50, { message: '名字长度不能超过50位' })
  firstName?: string;

  @Expose()
  @IsOptional()
  @IsString({ message: '姓氏必须是字符串' })
  @MaxLength(50, { message: '姓氏长度不能超过50位' })
  lastName?: string;

  @Expose()
  @IsOptional()
  @IsBoolean({ message: '记住我必须是布尔值' })
  rememberMe?: boolean;

  @Expose()
  @IsOptional()
  @IsString({ message: 'UTM来源必须是字符串' })
  @MaxLength(100, { message: 'UTM来源长度不能超过100位' })
  utmSource?: string;

  @Expose()
  @IsOptional()
  @IsString({ message: 'UTM媒介必须是字符串' })
  @MaxLength(100, { message: 'UTM媒介长度不能超过100位' })
  utmMedium?: string;

  @Expose()
  @IsOptional()
  @IsString({ message: 'UTM活动必须是字符串' })
  @MaxLength(100, { message: 'UTM活动长度不能超过100位' })
  utmCampaign?: string;
}

/**
 * 用户登录请求DTO
 */
export class LoginUserDto {
  @Expose()
  @IsString({ message: '邮箱或用户名必须是字符串' })
  emailOrUsername: string;

  @Expose()
  @IsString({ message: '密码必须是字符串' })
  password: string;

  @Expose()
  @IsOptional()
  @IsBoolean({ message: '记住我必须是布尔值' })
  rememberMe?: boolean;

  @Expose()
  @IsOptional()
  @IsString({ message: '人机验证码必须是字符串' })
  captcha?: string;
}

/**
 * 用户登出请求DTO
 */
@ApiModel('LogoutUserDto', '用户登出请求数据')
export class LogoutUserDto {
  @Expose()
  @IsOptional()
  @IsString({ message: '刷新令牌必须是字符串' })
  @ApiProperty({
    description: '刷新令牌（可选）',
    type: 'string',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false
  })
  refreshToken?: string;

  @Expose()
  @IsOptional()
  @IsBoolean({ message: '登出所有设备必须是布尔值' })
  @ApiProperty({
    description: '是否登出所有设备',
    type: 'boolean',
    example: false,
    required: false
  })
  logoutAllDevices?: boolean = false;
}

/**
 * 刷新令牌请求DTO
 */
@ApiModel('RefreshTokenDto', '刷新令牌请求数据')
export class RefreshTokenDto {
  @Expose()
  @IsString({ message: '刷新令牌必须是字符串' })
  @ApiProperty({
    description: '刷新令牌',
    type: 'string',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  })
  refreshToken: string;
}

/**
 * 验证邮箱请求DTO
 */
export class VerifyEmailDto {
  @Expose()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @Expose()
  @IsString({ message: '验证码必须是字符串' })
  @Matches(/^\d{6}$/, { message: '验证码必须是6位数字' })
  verificationCode: string;
}

/**
 * 重置密码请求DTO
 */
@ApiModel('ResetPasswordDto', '重置密码请求数据')
export class ResetPasswordDto {
  @Expose()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @ApiProperty({
    description: '邮箱地址',
    type: 'string',
    format: 'email',
    example: 'user@example.com',
    required: true
  })
  email: string;

  @Expose()
  @IsString({ message: '验证码必须是字符串' })
  @Matches(/^\d{6}$/, { message: '验证码必须是6位数字' })
  @ApiProperty({
    description: '邮箱验证码',
    type: 'string',
    example: '123456',
    required: true
  })
  verificationCode: string;

  @Expose()
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码长度不能少于8位' })
  @MaxLength(128, { message: '新密码长度不能超过128位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  @ApiProperty({
    description: '新密码',
    type: 'string',
    example: 'NewPassword123!',
    required: true
  })
  newPassword: string;

  @Expose()
  @IsString({ message: '确认密码必须是字符串' })
  @ApiProperty({
    description: '确认新密码',
    type: 'string',
    example: 'NewPassword123!',
    required: true
  })
  confirmPassword: string;
}

/**
 * 更改密码请求DTO
 */
export class ChangePasswordDto {
  @Expose()
  @IsString({ message: '当前密码必须是字符串' })
  currentPassword: string;

  @Expose()
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码长度不能少于8位' })
  @MaxLength(128, { message: '新密码长度不能超过128位' })
  newPassword: string;

  @Expose()
  @IsString({ message: '确认新密码必须是字符串' })
  confirmNewPassword: string;
}

/**
 * 用户响应DTO
 */
@ApiModel('UserResponseDto', '用户信息响应数据')
export class UserResponseDto {
  @Expose()
  @ApiProperty({
    description: '用户ID',
    type: 'string',
    example: 'uuid-string'
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: '邮箱地址',
    type: 'string',
    example: 'user@example.com'
  })
  email: string;

  @Expose()
  @ApiProperty({
    description: '用户名',
    type: 'string',
    example: 'username'
  })
  username: string;

  @Expose()
  @ApiProperty({
    description: '名字',
    type: 'string',
    example: 'John',
    required: false
  })
  firstName?: string;

  @Expose()
  @ApiProperty({
    description: '姓氏',
    type: 'string',
    example: 'Doe',
    required: false
  })
  lastName?: string;

  @Expose()
  @ApiProperty({
    description: '显示名称',
    type: 'string',
    example: 'John Doe'
  })
  displayName: string;

  @Expose()
  @ApiProperty({
    description: '头像URL',
    type: 'string',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  avatar?: string;

  @Expose()
  @ApiProperty({
    description: '用户角色',
    type: 'string',
    example: 'user'
  })
  role: string;

  @Expose()
  @ApiProperty({
    description: '账户状态',
    type: 'string',
    example: 'active'
  })
  status: string;

  @Expose()
  @ApiProperty({
    description: '邮箱是否已验证',
    type: 'boolean',
    example: true
  })
  isEmailVerified: boolean;

  @Expose()
  @ApiProperty({
    description: '创建时间',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T00:00:00Z'
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: '最后登录时间',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
    required: false
  })
  lastLoginAt?: Date;

  @Expose()
  @ApiProperty({
    description: '用户权限列表',
    type: 'array',
    example: ['read:profile', 'write:profile'],
    required: false
  })
  permissions?: string[];

  constructor(data: any) {
    this.id = data.id;
    this.email = data.email;
    this.username = data.username;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.displayName = data.displayName;
    this.avatar = data.avatar;
    this.role = data.role;
    this.status = data.status;
    this.isEmailVerified = data.isEmailVerified;
    this.createdAt = data.createdAt;
    this.lastLoginAt = data.lastLoginAt;
    this.permissions = data.permissions;
  }
}

/**
 * 认证令牌响应DTO
 */
export class AuthTokensResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserResponseDto;

  constructor(tokens: any, user: any) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.expiresIn = tokens.expiresIn;
    this.tokenType = tokens.tokenType;
    this.user = new UserResponseDto(user);
  }
}
