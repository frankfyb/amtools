/**
 * 刷新令牌命令
 * 
 * 定义刷新JWT令牌所需的参数，包括刷新令牌和客户端信息
 * 用于CQRS架构中的令牌刷新处理
 */

/**
 * 验证错误接口
 */
export interface ValidationError {
  /** 错误字段 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: ValidationError[];
}

/**
 * 刷新令牌命令类
 */
export class RefreshTokenCommand {
  constructor(
    /**
     * 刷新令牌
     * 用于获取新的访问令牌的刷新令牌
     */
    public readonly refreshToken: string,

    /**
     * 客户端IP地址
     * 用于安全审计和异常检测
     */
    public readonly ipAddress: string,

    /**
     * 用户代理字符串
     * 用于设备识别和安全审计
     */
    public readonly userAgent: string
  ) {
    // 验证必需参数
    if (!refreshToken?.trim()) {
      throw new Error('刷新令牌不能为空');
    }

    if (!ipAddress?.trim()) {
      throw new Error('IP地址不能为空');
    }

    if (!userAgent?.trim()) {
      throw new Error('用户代理不能为空');
    }
  }

  /**
   * 验证命令参数的有效性
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证刷新令牌格式（基本的JWT格式检查）
    if (!this.isValidJWTFormat(this.refreshToken)) {
      errors.push({
        field: 'refreshToken',
        message: '刷新令牌格式不正确',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // 验证IP地址格式
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (this.ipAddress !== 'unknown' && !ipRegex.test(this.ipAddress)) {
      errors.push({
        field: 'ipAddress',
        message: 'IP地址格式不正确',
        code: 'INVALID_IP_FORMAT'
      });
    }

    // 验证用户代理长度
    if (this.userAgent.length > 500) {
      errors.push({
        field: 'userAgent',
        message: '用户代理字符串过长',
        code: 'USER_AGENT_TOO_LONG'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查是否为有效的JWT格式
   */
  private isValidJWTFormat(token: string): boolean {
    // JWT应该有三个部分，用点分隔
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // 每个部分都应该是base64编码的字符串
    const base64Regex = /^[A-Za-z0-9_-]+$/;
    return parts.every(part => base64Regex.test(part));
  }

  /**
   * 获取令牌的头部信息（不验证签名）
   */
  getTokenHeader(): any {
    try {
      const parts = this.refreshToken.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = parts[0];
      const decoded = Buffer.from(header, 'base64url').toString('utf8');
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取令牌的载荷信息（不验证签名）
   */
  getTokenPayload(): any {
    try {
      const parts = this.refreshToken.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64url').toString('utf8');
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取令牌中的用户ID（如果可解析）
   */
  getUserIdFromToken(): string | null {
    const payload = this.getTokenPayload();
    return payload?.sub || payload?.userId || null;
  }

  /**
   * 检查令牌是否已过期（基于载荷中的exp字段）
   */
  isTokenExpired(): boolean {
    const payload = this.getTokenPayload();
    if (!payload?.exp) {
      return true; // 没有过期时间，视为已过期
    }

    const expirationTime = payload.exp * 1000; // JWT的exp是秒，需要转换为毫秒
    return Date.now() >= expirationTime;
  }

  /**
   * 获取令牌的剩余有效时间（秒）
   */
  getTokenRemainingTime(): number {
    const payload = this.getTokenPayload();
    if (!payload?.exp) {
      return 0;
    }

    const expirationTime = payload.exp * 1000;
    const remainingTime = Math.max(0, expirationTime - Date.now());
    return Math.floor(remainingTime / 1000);
  }

  /**
   * 创建审计日志信息
   */
  getAuditInfo(): RefreshTokenAuditInfo {
    const payload = this.getTokenPayload();
    
    return {
      userId: this.getUserIdFromToken(),
      tokenType: payload?.type || 'refresh',
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      issuedAt: payload?.iat ? new Date(payload.iat * 1000) : null,
      expiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
      timestamp: new Date()
    };
  }

  /**
   * 获取安全上下文信息
   */
  getSecurityContext(): SecurityContext {
    return {
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      timestamp: new Date(),
      tokenUserId: this.getUserIdFromToken(),
      tokenExpired: this.isTokenExpired(),
      remainingTime: this.getTokenRemainingTime()
    };
  }
}

/**
 * 刷新令牌审计信息接口
 */
export interface RefreshTokenAuditInfo {
  /** 用户ID */
  userId: string | null;
  /** 令牌类型 */
  tokenType: string;
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent: string;
  /** 令牌签发时间 */
  issuedAt: Date | null;
  /** 令牌过期时间 */
  expiresAt: Date | null;
  /** 操作时间戳 */
  timestamp: Date;
}

/**
 * 安全上下文接口
 */
export interface SecurityContext {
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent: string;
  /** 时间戳 */
  timestamp: Date;
  /** 令牌中的用户ID */
  tokenUserId: string | null;
  /** 令牌是否已过期 */
  tokenExpired: boolean;
  /** 剩余有效时间 */
  remainingTime: number;
}

/**
 * 刷新令牌命令工厂类
 */
export class RefreshTokenCommandFactory {
  /**
   * 从HTTP请求创建刷新令牌命令
   */
  static fromHttpRequest(
    body: any,
    ipAddress: string,
    userAgent: string
  ): RefreshTokenCommand {
    return new RefreshTokenCommand(
      body.refreshToken,
      ipAddress,
      userAgent
    );
  }

  /**
   * 创建测试用刷新令牌命令
   */
  static createForTesting(
    refreshToken: string,
    options: Partial<{
      ipAddress: string;
      userAgent: string;
    }> = {}
  ): RefreshTokenCommand {
    return new RefreshTokenCommand(
      refreshToken,
      options.ipAddress || '127.0.0.1',
      options.userAgent || 'test-agent'
    );
  }
}
