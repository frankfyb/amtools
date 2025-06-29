/**
 * JWT配置
 * 
 * 管理JWT令牌相关配置
 */

/**
 * JWT算法类型
 */
export type JwtAlgorithm = 
  | 'HS256' | 'HS384' | 'HS512'
  | 'RS256' | 'RS384' | 'RS512'
  | 'ES256' | 'ES384' | 'ES512'
  | 'PS256' | 'PS384' | 'PS512';

/**
 * JWT密钥配置接口
 */
export interface JwtKeyConfig {
  secret?: string;
  publicKey?: string;
  privateKey?: string;
  passphrase?: string;
}

/**
 * JWT令牌配置接口
 */
export interface JwtTokenConfig {
  algorithm: JwtAlgorithm;
  expiresIn: string | number;
  notBefore?: string | number;
  audience?: string | string[];
  issuer?: string;
  subject?: string;
  jwtid?: string;
  noTimestamp?: boolean;
  header?: Record<string, any>;
  encoding?: string;
}

/**
 * JWT刷新令牌配置接口
 */
export interface JwtRefreshTokenConfig {
  algorithm: JwtAlgorithm;
  expiresIn: string | number;
  audience?: string | string[];
  issuer?: string;
  rotationEnabled: boolean; // 是否启用令牌轮换
  reuseInterval: number; // 重用间隔（秒）
  maxReuses: number; // 最大重用次数
}

/**
 * JWT验证配置接口
 */
export interface JwtVerifyConfig {
  algorithms: JwtAlgorithm[];
  audience?: string | string[];
  issuer?: string | string[];
  subject?: string;
  clockTolerance?: number; // 时钟容差（秒）
  maxAge?: string | number;
  clockTimestamp?: number;
  nonce?: string;
  ignoreExpiration?: boolean;
  ignoreNotBefore?: boolean;
}

/**
 * JWT安全配置接口
 */
export interface JwtSecurityConfig {
  blacklist: {
    enabled: boolean;
    storage: 'redis' | 'memory' | 'database';
    keyPrefix: string;
    cleanupInterval: number; // 清理间隔（秒）
  };
  rateLimiting: {
    enabled: boolean;
    maxAttempts: number;
    windowMs: number;
    blockDuration: number;
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    key: string;
  };
  fingerprinting: {
    enabled: boolean;
    algorithm: 'sha256' | 'sha512';
    includeUserAgent: boolean;
    includeIP: boolean;
  };
}

/**
 * 完整JWT配置接口
 */
export interface JwtConfig {
  accessToken: {
    key: JwtKeyConfig;
    config: JwtTokenConfig;
  };
  refreshToken: {
    key: JwtKeyConfig;
    config: JwtRefreshTokenConfig;
  };
  verify: JwtVerifyConfig;
  security: JwtSecurityConfig;
  cookies: {
    enabled: boolean;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    domain?: string;
    path: string;
    maxAge: number;
  };
}

/**
 * 获取JWT配置
 */
export function getJwtConfig(): JwtConfig {
  const environment = process.env.NODE_ENV || 'development';

  const baseConfig: JwtConfig = {
    accessToken: {
      key: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        publicKey: process.env.JWT_PUBLIC_KEY,
        privateKey: process.env.JWT_PRIVATE_KEY,
        passphrase: process.env.JWT_PASSPHRASE
      },
      config: {
        algorithm: (process.env.JWT_ALGORITHM as JwtAlgorithm) || 'HS256',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        notBefore: process.env.JWT_NOT_BEFORE,
        audience: process.env.JWT_AUDIENCE || 'amtools-users',
        issuer: process.env.JWT_ISSUER || 'amtools',
        subject: process.env.JWT_SUBJECT,
        noTimestamp: process.env.JWT_NO_TIMESTAMP === 'true',
        encoding: process.env.JWT_ENCODING || 'utf8'
      }
    },
    refreshToken: {
      key: {
        secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
        publicKey: process.env.JWT_REFRESH_PUBLIC_KEY,
        privateKey: process.env.JWT_REFRESH_PRIVATE_KEY,
        passphrase: process.env.JWT_REFRESH_PASSPHRASE
      },
      config: {
        algorithm: (process.env.JWT_REFRESH_ALGORITHM as JwtAlgorithm) || 'HS256',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        audience: process.env.JWT_REFRESH_AUDIENCE || 'amtools-users',
        issuer: process.env.JWT_REFRESH_ISSUER || 'amtools',
        rotationEnabled: process.env.JWT_REFRESH_ROTATION === 'true',
        reuseInterval: parseInt(process.env.JWT_REFRESH_REUSE_INTERVAL || '300'),
        maxReuses: parseInt(process.env.JWT_REFRESH_MAX_REUSES || '5')
      }
    },
    verify: {
      algorithms: process.env.JWT_VERIFY_ALGORITHMS ? 
        process.env.JWT_VERIFY_ALGORITHMS.split(',') as JwtAlgorithm[] : 
        ['HS256'],
      audience: process.env.JWT_VERIFY_AUDIENCE || 'amtools-users',
      issuer: process.env.JWT_VERIFY_ISSUER || 'amtools',
      clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE || '30'),
      ignoreExpiration: process.env.JWT_IGNORE_EXPIRATION === 'true',
      ignoreNotBefore: process.env.JWT_IGNORE_NOT_BEFORE === 'true'
    },
    security: {
      blacklist: {
        enabled: process.env.JWT_BLACKLIST_ENABLED === 'true',
        storage: (process.env.JWT_BLACKLIST_STORAGE as any) || 'redis',
        keyPrefix: process.env.JWT_BLACKLIST_PREFIX || 'jwt:blacklist:',
        cleanupInterval: parseInt(process.env.JWT_BLACKLIST_CLEANUP || '3600')
      },
      rateLimiting: {
        enabled: process.env.JWT_RATE_LIMIT_ENABLED === 'true',
        maxAttempts: parseInt(process.env.JWT_RATE_LIMIT_ATTEMPTS || '5'),
        windowMs: parseInt(process.env.JWT_RATE_LIMIT_WINDOW || '900000'),
        blockDuration: parseInt(process.env.JWT_RATE_LIMIT_BLOCK || '3600000')
      },
      encryption: {
        enabled: process.env.JWT_ENCRYPTION_ENABLED === 'true',
        algorithm: process.env.JWT_ENCRYPTION_ALGORITHM || 'aes-256-gcm',
        key: process.env.JWT_ENCRYPTION_KEY || 'your-encryption-key-32-characters'
      },
      fingerprinting: {
        enabled: process.env.JWT_FINGERPRINT_ENABLED === 'true',
        algorithm: (process.env.JWT_FINGERPRINT_ALGORITHM as any) || 'sha256',
        includeUserAgent: process.env.JWT_FINGERPRINT_USER_AGENT !== 'false',
        includeIP: process.env.JWT_FINGERPRINT_IP === 'true'
      }
    },
    cookies: {
      enabled: process.env.JWT_COOKIES_ENABLED === 'true',
      httpOnly: process.env.JWT_COOKIES_HTTP_ONLY !== 'false',
      secure: process.env.JWT_COOKIES_SECURE === 'true',
      sameSite: (process.env.JWT_COOKIES_SAME_SITE as any) || 'lax',
      domain: process.env.JWT_COOKIES_DOMAIN,
      path: process.env.JWT_COOKIES_PATH || '/',
      maxAge: parseInt(process.env.JWT_COOKIES_MAX_AGE || '604800000') // 7天
    }
  };

  // 环境特定配置
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        accessToken: {
          ...baseConfig.accessToken,
          config: {
            ...baseConfig.accessToken.config,
            expiresIn: '1h' // 开发环境延长过期时间
          }
        },
        security: {
          ...baseConfig.security,
          blacklist: {
            ...baseConfig.security.blacklist,
            enabled: false // 开发环境禁用黑名单
          },
          rateLimiting: {
            ...baseConfig.security.rateLimiting,
            enabled: false // 开发环境禁用速率限制
          },
          fingerprinting: {
            ...baseConfig.security.fingerprinting,
            enabled: false // 开发环境禁用指纹识别
          }
        },
        cookies: {
          ...baseConfig.cookies,
          secure: false // 开发环境不要求HTTPS
        }
      };

    case 'test':
      return {
        ...baseConfig,
        accessToken: {
          ...baseConfig.accessToken,
          key: {
            secret: 'test-jwt-secret-key'
          },
          config: {
            ...baseConfig.accessToken.config,
            expiresIn: '1h'
          }
        },
        refreshToken: {
          ...baseConfig.refreshToken,
          key: {
            secret: 'test-refresh-secret-key'
          },
          config: {
            ...baseConfig.refreshToken.config,
            expiresIn: '1d'
          }
        },
        security: {
          ...baseConfig.security,
          blacklist: {
            ...baseConfig.security.blacklist,
            enabled: false
          },
          rateLimiting: {
            ...baseConfig.security.rateLimiting,
            enabled: false
          }
        }
      };

    case 'production':
      return {
        ...baseConfig,
        security: {
          ...baseConfig.security,
          blacklist: {
            ...baseConfig.security.blacklist,
            enabled: true
          },
          rateLimiting: {
            ...baseConfig.security.rateLimiting,
            enabled: true
          },
          encryption: {
            ...baseConfig.security.encryption,
            enabled: true
          },
          fingerprinting: {
            ...baseConfig.security.fingerprinting,
            enabled: true
          }
        },
        cookies: {
          ...baseConfig.cookies,
          secure: true, // 生产环境要求HTTPS
          sameSite: 'strict'
        }
      };

    default:
      return baseConfig;
  }
}

/**
 * 验证JWT配置
 */
export function validateJwtConfig(config: JwtConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证访问令牌配置
  if (!config.accessToken.key.secret && !config.accessToken.key.privateKey) {
    errors.push('访问令牌必须提供密钥或私钥');
  }

  if (config.accessToken.key.secret && config.accessToken.key.secret.length < 32) {
    errors.push('访问令牌密钥长度至少32个字符');
  }

  // 验证刷新令牌配置
  if (!config.refreshToken.key.secret && !config.refreshToken.key.privateKey) {
    errors.push('刷新令牌必须提供密钥或私钥');
  }

  if (config.refreshToken.key.secret && config.refreshToken.key.secret.length < 32) {
    errors.push('刷新令牌密钥长度至少32个字符');
  }

  // 验证算法配置
  const supportedAlgorithms = [
    'HS256', 'HS384', 'HS512',
    'RS256', 'RS384', 'RS512',
    'ES256', 'ES384', 'ES512',
    'PS256', 'PS384', 'PS512'
  ];

  if (!supportedAlgorithms.includes(config.accessToken.config.algorithm)) {
    errors.push(`不支持的访问令牌算法: ${config.accessToken.config.algorithm}`);
  }

  if (!supportedAlgorithms.includes(config.refreshToken.config.algorithm)) {
    errors.push(`不支持的刷新令牌算法: ${config.refreshToken.config.algorithm}`);
  }

  // 验证安全配置
  if (config.security.encryption.enabled && config.security.encryption.key.length < 32) {
    errors.push('加密密钥长度至少32个字符');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成安全的JWT密钥
 */
export function generateJwtSecret(length: number = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
