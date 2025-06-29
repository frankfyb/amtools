/**
 * 用户登出命令
 * 
 * 定义用户登出所需的参数，包括令牌信息和登出选项
 * 支持单设备登出和全设备登出两种模式
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
 * 用户登出命令类
 */
export class LogoutUserCommand {
  constructor(
    /**
     * 用户ID
     * 从JWT令牌中解析出的用户标识符
     */
    public readonly userId: string,

    /**
     * 访问令牌
     * 当前会话的访问令牌，需要加入黑名单
     */
    public readonly accessToken: string,

    /**
     * 刷新令牌（可选）
     * 如果提供，也会被加入黑名单
     */
    public readonly refreshToken?: string,

    /**
     * 登出所有设备
     * 如果为true，将撤销用户的所有令牌
     */
    public readonly logoutAllDevices: boolean = false,

    /**
     * 客户端IP地址
     * 用于安全审计
     */
    public readonly ipAddress: string = 'unknown',

    /**
     * 用户代理字符串
     * 用于设备识别和安全审计
     */
    public readonly userAgent: string = 'unknown'
  ) {
    // 验证必需参数
    if (!userId?.trim()) {
      throw new Error('用户ID不能为空');
    }

    if (!accessToken?.trim()) {
      throw new Error('访问令牌不能为空');
    }
  }

  /**
   * 验证命令参数的有效性
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证用户ID格式（假设使用UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this.userId)) {
      errors.push({
        field: 'userId',
        message: '用户ID格式不正确',
        code: 'INVALID_USER_ID_FORMAT'
      });
    }

    // 验证访问令牌格式（基本的JWT格式检查）
    if (!this.isValidJWTFormat(this.accessToken)) {
      errors.push({
        field: 'accessToken',
        message: '访问令牌格式不正确',
        code: 'INVALID_ACCESS_TOKEN_FORMAT'
      });
    }

    // 验证刷新令牌格式（如果提供）
    if (this.refreshToken && !this.isValidJWTFormat(this.refreshToken)) {
      errors.push({
        field: 'refreshToken',
        message: '刷新令牌格式不正确',
        code: 'INVALID_REFRESH_TOKEN_FORMAT'
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
   * 获取令牌的载荷信息（不验证签名）
   */
  getTokenPayload(token: string): any {
    try {
      const parts = token.split('.');
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
   * 获取访问令牌的过期时间
   */
  getAccessTokenExpiration(): Date | null {
    const payload = this.getTokenPayload(this.accessToken);
    if (!payload?.exp) {
      return null;
    }
    return new Date(payload.exp * 1000);
  }

  /**
   * 获取刷新令牌的过期时间
   */
  getRefreshTokenExpiration(): Date | null {
    if (!this.refreshToken) {
      return null;
    }
    
    const payload = this.getTokenPayload(this.refreshToken);
    if (!payload?.exp) {
      return null;
    }
    return new Date(payload.exp * 1000);
  }

  /**
   * 获取登出类型描述
   */
  getLogoutType(): 'single_device' | 'all_devices' {
    return this.logoutAllDevices ? 'all_devices' : 'single_device';
  }

  /**
   * 创建审计日志信息
   */
  getAuditInfo(): LogoutAuditInfo {
    return {
      userId: this.userId,
      logoutType: this.getLogoutType(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      hasRefreshToken: !!this.refreshToken,
      accessTokenExpiration: this.getAccessTokenExpiration(),
      refreshTokenExpiration: this.getRefreshTokenExpiration(),
      timestamp: new Date()
    };
  }

  /**
   * 获取安全上下文信息
   */
  getSecurityContext(): SecurityContext {
    return {
      userId: this.userId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      timestamp: new Date(),
      logoutScope: this.logoutAllDevices ? 'global' : 'current_session',
      tokensToRevoke: this.getTokensToRevoke()
    };
  }

  /**
   * 获取需要撤销的令牌列表
   */
  getTokensToRevoke(): string[] {
    const tokens = [this.accessToken];
    if (this.refreshToken) {
      tokens.push(this.refreshToken);
    }
    return tokens;
  }
}

/**
 * 登出审计信息接口
 */
export interface LogoutAuditInfo {
  /** 用户ID */
  userId: string;
  /** 登出类型 */
  logoutType: 'single_device' | 'all_devices';
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent: string;
  /** 是否包含刷新令牌 */
  hasRefreshToken: boolean;
  /** 访问令牌过期时间 */
  accessTokenExpiration: Date | null;
  /** 刷新令牌过期时间 */
  refreshTokenExpiration: Date | null;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 安全上下文接口
 */
export interface SecurityContext {
  /** 用户ID */
  userId: string;
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent: string;
  /** 时间戳 */
  timestamp: Date;
  /** 登出范围 */
  logoutScope: 'current_session' | 'global';
  /** 需要撤销的令牌 */
  tokensToRevoke: string[];
}

/**
 * 用户登出命令工厂类
 */
export class LogoutUserCommandFactory {
  /**
   * 从认证请求创建登出命令
   */
  static fromAuthenticatedRequest(
    userId: string,
    accessToken: string,
    options: Partial<{
      refreshToken: string;
      logoutAllDevices: boolean;
      ipAddress: string;
      userAgent: string;
    }> = {}
  ): LogoutUserCommand {
    return new LogoutUserCommand(
      userId,
      accessToken,
      options.refreshToken,
      options.logoutAllDevices || false,
      options.ipAddress || 'unknown',
      options.userAgent || 'unknown'
    );
  }

  /**
   * 创建单设备登出命令
   */
  static createSingleDeviceLogout(
    userId: string,
    accessToken: string,
    refreshToken?: string
  ): LogoutUserCommand {
    return new LogoutUserCommand(
      userId,
      accessToken,
      refreshToken,
      false // 单设备登出
    );
  }

  /**
   * 创建全设备登出命令
   */
  static createAllDevicesLogout(
    userId: string,
    accessToken: string,
    refreshToken?: string
  ): LogoutUserCommand {
    return new LogoutUserCommand(
      userId,
      accessToken,
      refreshToken,
      true // 全设备登出
    );
  }

  /**
   * 创建测试用登出命令
   */
  static createForTesting(
    userId: string = 'test-user-id',
    accessToken: string = 'test.access.token',
    options: Partial<{
      refreshToken: string;
      logoutAllDevices: boolean;
      ipAddress: string;
      userAgent: string;
    }> = {}
  ): LogoutUserCommand {
    return new LogoutUserCommand(
      userId,
      accessToken,
      options.refreshToken,
      options.logoutAllDevices || false,
      options.ipAddress || '127.0.0.1',
      options.userAgent || 'test-agent'
    );
  }
}
