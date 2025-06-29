/**
 * JWT服务实现
 */

import * as jwt from 'jsonwebtoken';
import { Injectable } from '../../core/di/decorators';
import { AuthTokens, JWTPayload } from '../../shared/types/auth.types';
import { JWT } from '../../shared/constants/auth.constants';

export interface JWTConfig {
  secret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience: string;
}

@Injectable()
export class JWTService {
  private readonly config: JWTConfig;

  constructor() {
    this.config = {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || JWT.ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || JWT.REFRESH_TOKEN_EXPIRY,
      issuer: process.env.JWT_ISSUER || JWT.ISSUER,
      audience: process.env.JWT_AUDIENCE || JWT.AUDIENCE
    };

    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not set in environment variables. Using default secret.');
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  generateTokens(userId: string, email: string, username: string, role: string, permissions: string[] = []): AuthTokens {
    const now = Math.floor(Date.now() / 1000);
    
    // 访问令牌载荷
    const accessPayload: JWTPayload = {
      sub: userId,
      email,
      username,
      role,
      permissions,
      iat: now,
      exp: now + this.parseExpiry(this.config.accessTokenExpiry),
      iss: this.config.issuer,
      aud: this.config.audience
    };

    // 刷新令牌载荷（包含较少信息）
    const refreshPayload = {
      sub: userId,
      type: 'refresh',
      iat: now,
      exp: now + this.parseExpiry(this.config.refreshTokenExpiry),
      iss: this.config.issuer,
      aud: this.config.audience
    };

    const accessToken = jwt.sign(accessPayload, this.config.secret, {
      algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(refreshPayload, this.config.secret, {
      algorithm: 'HS256'
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(this.config.accessTokenExpiry),
      tokenType: 'Bearer'
    };
  }

  /**
   * 验证访问令牌
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: ['HS256']
      }) as JWTPayload;

      // 检查令牌类型（确保不是刷新令牌）
      if ((decoded as any).type === 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError('Invalid access token');
      } else {
        throw new TokenVerificationError('Token verification failed');
      }
    }
  }

  /**
   * 验证刷新令牌
   */
  verifyRefreshToken(token: string): { sub: string; iat: number; exp: number } {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: ['HS256']
      }) as any;

      // 检查令牌类型
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        sub: decoded.sub,
        iat: decoded.iat,
        exp: decoded.exp
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError('Invalid refresh token');
      } else {
        throw new TokenVerificationError('Refresh token verification failed');
      }
    }
  }

  /**
   * 刷新令牌
   */
  async refreshTokens(refreshToken: string, getUserData: (userId: string) => Promise<{
    email: string;
    username: string;
    role: string;
    permissions: string[];
  }>): Promise<AuthTokens> {
    const decoded = this.verifyRefreshToken(refreshToken);
    const userData = await getUserData(decoded.sub);
    
    return this.generateTokens(
      decoded.sub,
      userData.email,
      userData.username,
      userData.role,
      userData.permissions
    );
  }

  /**
   * 解码令牌（不验证）
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * 检查令牌是否即将过期
   */
  isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
    try {
      const decoded = this.decodeToken(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      const threshold = thresholdMinutes * 60;
      
      return (decoded.exp - now) <= threshold;
    } catch {
      return true;
    }
  }

  /**
   * 获取令牌剩余时间（秒）
   */
  getTokenRemainingTime(token: string): number {
    try {
      const decoded = this.decodeToken(token) as any;
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - now);
    } catch {
      return 0;
    }
  }

  /**
   * 从令牌中提取用户ID
   */
  extractUserIdFromToken(token: string): string | null {
    try {
      const decoded = this.decodeToken(token) as any;
      return decoded?.sub || null;
    } catch {
      return null;
    }
  }

  /**
   * 生成API密钥（长期有效的令牌）
   */
  generateApiKey(userId: string, name: string, permissions: string[] = []): string {
    const payload = {
      sub: userId,
      type: 'api_key',
      name,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      iss: this.config.issuer,
      aud: this.config.audience
    };

    return jwt.sign(payload, this.config.secret, {
      algorithm: 'HS256'
      // 注意：API密钥没有过期时间
    });
  }

  /**
   * 验证API密钥
   */
  verifyApiKey(token: string): { sub: string; name: string; permissions: string[] } {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: ['HS256']
      }) as any;

      if (decoded.type !== 'api_key') {
        throw new Error('Invalid token type');
      }

      return {
        sub: decoded.sub,
        name: decoded.name,
        permissions: decoded.permissions || []
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError('Invalid API key');
      } else {
        throw new TokenVerificationError('API key verification failed');
      }
    }
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: throw new Error(`Invalid expiry unit: ${unit}`);
    }
  }
}

// 自定义错误类
export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

export class TokenVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenVerificationError';
  }
}
