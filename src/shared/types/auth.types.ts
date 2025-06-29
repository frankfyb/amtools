/**
 * 认证相关类型定义
 */

// 用户注册请求
export interface RegisterUserRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
  firstName?: string;
  lastName?: string;
  rememberMe?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// 用户登录请求
export interface LoginUserRequest {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
  captcha?: string;
}

// 认证令牌
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// JWT载荷
export interface JWTPayload {
  sub: string;          // 用户ID
  email: string;        // 邮箱
  username: string;     // 用户名
  role: string;         // 角色
  permissions: string[]; // 权限列表
  iat: number;          // 签发时间
  exp: number;          // 过期时间
  iss: string;          // 签发者
  aud: string;          // 受众
}

// 验证码类型
export enum VerificationCodeType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  LOGIN_VERIFICATION = 'login_verification',
  PHONE_VERIFICATION = 'phone_verification'
}

// 发送验证码请求
export interface SendVerificationCodeRequest {
  email: string;
  type: VerificationCodeType;
  captcha?: string;
}

// 发送验证码结果
export interface SendCodeResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  attemptsRemaining?: number;
}

// 验证码校验结果
export interface VerifyCodeResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
  isExpired?: boolean;
}

// 用户角色
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest'
}

// 用户状态
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DELETED = 'deleted'
}

// 会话信息
export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

// 设备信息
export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  location?: string;
}

// 密码强度
export interface PasswordStrength {
  score: number;        // 0-4
  feedback: string[];   // 反馈信息
  isValid: boolean;     // 是否满足最低要求
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}
