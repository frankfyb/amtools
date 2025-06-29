/**
 * 服务令牌定义
 * 提供类型安全的服务标识符
 */

// 仓储令牌
export const REPOSITORY_TOKENS = {
  USER_REPOSITORY: Symbol('UserRepository'),
  AUDIT_REPOSITORY: Symbol('AuditRepository'),
  PERMISSION_REPOSITORY: Symbol('PermissionRepository'),
  SESSION_REPOSITORY: Symbol('SessionRepository')
} as const;

// 服务令牌
export const SERVICE_TOKENS = {
  // 基础设施服务
  EMAIL_SERVICE: Symbol('EmailService'),
  CACHE_SERVICE: Symbol('CacheService'),
  LOGGER_SERVICE: Symbol('LoggerService'),
  JWT_SERVICE: Symbol('JWTService'),
  VERIFICATION_CODE_SERVICE: Symbol('VerificationCodeService'),
  PASSWORD_SERVICE: Symbol('PasswordService'),
  CAPTCHA_SERVICE: Symbol('CaptchaService'),
  TOKEN_BLACKLIST_SERVICE: Symbol('TokenBlacklistService'),
  RATE_LIMITER_SERVICE: Symbol('RateLimiterService'),

  // 领域服务
  USER_DOMAIN_SERVICE: Symbol('UserDomainService'),
  PERMISSION_DOMAIN_SERVICE: Symbol('PermissionDomainService'),
  AUDIT_DOMAIN_SERVICE: Symbol('AuditDomainService'),

  // 应用服务
  AUTH_APPLICATION_SERVICE: Symbol('AuthApplicationService'),
  USER_APPLICATION_SERVICE: Symbol('UserApplicationService'),
  ADMIN_APPLICATION_SERVICE: Symbol('AdminApplicationService')
} as const;

// CQRS令牌
export const CQRS_TOKENS = {
  COMMAND_BUS: Symbol('CommandBus'),
  QUERY_BUS: Symbol('QueryBus'),
  EVENT_BUS: Symbol('EventBus')
} as const;

// 配置令牌
export const CONFIG_TOKENS = {
  APP_CONFIG: Symbol('AppConfig'),
  DATABASE_CONFIG: Symbol('DatabaseConfig'),
  REDIS_CONFIG: Symbol('RedisConfig'),
  JWT_CONFIG: Symbol('JWTConfig'),
  EMAIL_CONFIG: Symbol('EmailConfig'),
  SECURITY_CONFIG: Symbol('SecurityConfig')
} as const;

// 中间件令牌
export const MIDDLEWARE_TOKENS = {
  AUTH_MIDDLEWARE: Symbol('AuthMiddleware'),
  VALIDATION_MIDDLEWARE: Symbol('ValidationMiddleware'),
  RATE_LIMIT_MIDDLEWARE: Symbol('RateLimitMiddleware'),
  ERROR_MIDDLEWARE: Symbol('ErrorMiddleware'),
  CORS_MIDDLEWARE: Symbol('CorsMiddleware'),
  LOGGING_MIDDLEWARE: Symbol('LoggingMiddleware'),
  SECURITY_MIDDLEWARE: Symbol('SecurityMiddleware')
} as const;

// 守卫令牌
export const GUARD_TOKENS = {
  AUTH_GUARD: Symbol('AuthGuard'),
  PERMISSION_GUARD: Symbol('PermissionGuard'),
  RATE_LIMIT_GUARD: Symbol('RateLimitGuard')
} as const;

// 外部服务令牌
export const EXTERNAL_TOKENS = {
  DATABASE_CONNECTION: Symbol('DatabaseConnection'),
  REDIS_CLIENT: Symbol('RedisClient'),
  EMAIL_TRANSPORTER: Symbol('EmailTransporter'),
  PROMETHEUS_REGISTRY: Symbol('PrometheusRegistry')
} as const;

// 工具令牌
export const TOOL_TOKENS = {
  PASSWORD_GENERATOR: Symbol('PasswordGeneratorTool'),
  TEXT_ENCRYPTOR: Symbol('TextEncryptorTool'),
  QR_GENERATOR: Symbol('QRGeneratorTool'),
  FILE_CONVERTER: Symbol('FileConverterTool'),
  URL_SHORTENER: Symbol('URLShortenerTool')
} as const;

// 类型安全的令牌类型
export type RepositoryToken = typeof REPOSITORY_TOKENS[keyof typeof REPOSITORY_TOKENS];
export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS];
export type CQRSToken = typeof CQRS_TOKENS[keyof typeof CQRS_TOKENS];
export type ConfigToken = typeof CONFIG_TOKENS[keyof typeof CONFIG_TOKENS];
export type MiddlewareToken = typeof MIDDLEWARE_TOKENS[keyof typeof MIDDLEWARE_TOKENS];
export type GuardToken = typeof GUARD_TOKENS[keyof typeof GUARD_TOKENS];
export type ExternalToken = typeof EXTERNAL_TOKENS[keyof typeof EXTERNAL_TOKENS];
export type ToolToken = typeof TOOL_TOKENS[keyof typeof TOOL_TOKENS];
