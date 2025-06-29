/**
 * 认证相关常量定义
 */

// 验证码配置
export const VERIFICATION_CODE = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  COOLDOWN_SECONDS: 60,
  RESEND_COOLDOWN_SECONDS: 300
} as const;

// 密码配置
export const PASSWORD = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  BCRYPT_ROUNDS: 12
} as const;

// JWT配置
export const JWT = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ISSUER: 'amtools',
  AUDIENCE: 'amtools-users',
  ALGORITHM: 'HS256'
} as const;

// 用户名配置
export const USERNAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  ALLOWED_CHARS: /^[a-zA-Z0-9_-]+$/,
  RESERVED_NAMES: [
    'admin', 'administrator', 'root', 'system', 'api', 'www',
    'mail', 'email', 'support', 'help', 'info', 'contact',
    'user', 'users', 'account', 'accounts', 'profile', 'profiles',
    'test', 'demo', 'guest', 'anonymous', 'null', 'undefined'
  ]
} as const;

// 邮箱配置
export const EMAIL = {
  MAX_LENGTH: 254,
  REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  DISPOSABLE_DOMAINS: [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'temp-mail.org'
  ]
} as const;

// 会话配置
export const SESSION = {
  MAX_CONCURRENT_SESSIONS: 5,
  IDLE_TIMEOUT_MINUTES: 30,
  ABSOLUTE_TIMEOUT_HOURS: 24,
  REMEMBER_ME_DAYS: 30
} as const;

// 限流配置
export const RATE_LIMIT = {
  REGISTRATION: {
    WINDOW_MS: 15 * 60 * 1000, // 15分钟
    MAX_ATTEMPTS: 5
  },
  LOGIN: {
    WINDOW_MS: 15 * 60 * 1000, // 15分钟
    MAX_ATTEMPTS: 10
  },
  VERIFICATION_CODE: {
    WINDOW_MS: 60 * 60 * 1000, // 1小时
    MAX_ATTEMPTS: 10
  },
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1000, // 1小时
    MAX_ATTEMPTS: 3
  }
} as const;

// 安全配置
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION_MINUTES: 30,
  PASSWORD_HISTORY_COUNT: 5,
  FORCE_PASSWORD_CHANGE_DAYS: 90,
  SESSION_ROTATION_INTERVAL_MINUTES: 60
} as const;

// 错误码
export const AUTH_ERROR_CODES = {
  // 通用错误
  INVALID_CREDENTIALS: 'AUTH_001',
  UNAUTHORIZED: 'AUTH_002',
  FORBIDDEN: 'AUTH_003',
  TOKEN_EXPIRED: 'AUTH_004',
  TOKEN_INVALID: 'AUTH_005',
  
  // 注册错误
  EMAIL_ALREADY_EXISTS: 'REG_001',
  USERNAME_ALREADY_EXISTS: 'REG_002',
  INVALID_EMAIL_FORMAT: 'REG_003',
  INVALID_USERNAME_FORMAT: 'REG_004',
  WEAK_PASSWORD: 'REG_005',
  PASSWORD_MISMATCH: 'REG_006',
  INVALID_VERIFICATION_CODE: 'REG_007',
  VERIFICATION_CODE_EXPIRED: 'REG_008',
  VERIFICATION_CODE_ATTEMPTS_EXCEEDED: 'REG_009',
  
  // 登录错误
  USER_NOT_FOUND: 'LOGIN_001',
  INCORRECT_PASSWORD: 'LOGIN_002',
  ACCOUNT_LOCKED: 'LOGIN_003',
  ACCOUNT_SUSPENDED: 'LOGIN_004',
  EMAIL_NOT_VERIFIED: 'LOGIN_005',
  TOO_MANY_ATTEMPTS: 'LOGIN_006',
  
  // 验证码错误
  VERIFICATION_CODE_SEND_FAILED: 'VC_001',
  VERIFICATION_CODE_COOLDOWN: 'VC_002',
  VERIFICATION_CODE_LIMIT_EXCEEDED: 'VC_003'
} as const;

// 成功消息
export const AUTH_SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: '注册成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
  VERIFICATION_CODE_SENT: '验证码已发送',
  EMAIL_VERIFIED: '邮箱验证成功',
  PASSWORD_RESET_SUCCESS: '密码重置成功',
  TOKEN_REFRESHED: '令牌刷新成功'
} as const;

// 缓存键前缀
export const CACHE_KEYS = {
  VERIFICATION_CODE: 'vc:',
  USER_SESSION: 'session:',
  LOGIN_ATTEMPTS: 'login_attempts:',
  REGISTRATION_ATTEMPTS: 'reg_attempts:',
  PASSWORD_RESET_ATTEMPTS: 'pwd_reset:',
  USER_PROFILE: 'user:',
  PERMISSIONS: 'permissions:'
} as const;
