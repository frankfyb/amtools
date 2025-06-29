/**
 * 用户登录命令
 * 
 * 定义用户登录所需的所有参数，包括凭据信息、安全参数和客户端信息
 * 用于CQRS架构中的命令处理
 */

/**
 * 用户登录命令类
 */
export class LoginUserCommand {
  constructor(
    /**
     * 邮箱或用户名
     * 支持使用邮箱地址或用户名进行登录
     */
    public readonly emailOrUsername: string,

    /**
     * 密码
     * 用户输入的明文密码，将在处理器中进行验证
     */
    public readonly password: string,

    /**
     * 记住我选项
     * 如果为true，将生成更长有效期的刷新令牌
     */
    public readonly rememberMe: boolean = false,

    /**
     * 客户端IP地址
     * 用于频率限制和安全审计
     */
    public readonly ipAddress: string,

    /**
     * 用户代理字符串
     * 用于设备识别和安全审计
     */
    public readonly userAgent: string,

    /**
     * 人机验证码（可选）
     * 在检测到可疑活动时要求用户输入
     */
    public readonly captcha?: string
  ) {
    // 验证必需参数
    if (!emailOrUsername?.trim()) {
      throw new Error('邮箱或用户名不能为空');
    }

    if (!password?.trim()) {
      throw new Error('密码不能为空');
    }

    if (!ipAddress?.trim()) {
      throw new Error('IP地址不能为空');
    }

    if (!userAgent?.trim()) {
      throw new Error('用户代理不能为空');
    }
  }

  /**
   * 获取用于频率限制的键
   * 结合IP地址和用户标识符创建唯一键
   */
  getRateLimitKey(): string {
    return `login:${this.ipAddress}:${this.emailOrUsername.toLowerCase()}`;
  }

  /**
   * 检查是否为邮箱登录
   */
  isEmailLogin(): boolean {
    return this.emailOrUsername.includes('@');
  }

  /**
   * 获取标准化的用户标识符
   */
  getNormalizedIdentifier(): string {
    return this.emailOrUsername.toLowerCase().trim();
  }

  /**
   * 获取登录类型描述
   */
  getLoginType(): 'email' | 'username' {
    return this.isEmailLogin() ? 'email' : 'username';
  }

  /**
   * 创建审计日志信息
   */
  getAuditInfo(): LoginAuditInfo {
    return {
      identifier: this.getNormalizedIdentifier(),
      loginType: this.getLoginType(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      rememberMe: this.rememberMe,
      hasCaptcha: !!this.captcha,
      timestamp: new Date()
    };
  }

  /**
   * 验证命令参数的有效性
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证邮箱或用户名格式
    if (this.isEmailLogin()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.emailOrUsername)) {
        errors.push({
          field: 'emailOrUsername',
          message: '邮箱格式不正确',
          code: 'INVALID_EMAIL_FORMAT'
        });
      }
    } else {
      // 验证用户名格式
      const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
      if (!usernameRegex.test(this.emailOrUsername)) {
        errors.push({
          field: 'emailOrUsername',
          message: '用户名格式不正确，只能包含字母、数字、下划线和连字符，长度3-50位',
          code: 'INVALID_USERNAME_FORMAT'
        });
      }
    }

    // 验证密码长度
    if (this.password.length < 8 || this.password.length > 128) {
      errors.push({
        field: 'password',
        message: '密码长度必须在8-128个字符之间',
        code: 'INVALID_PASSWORD_LENGTH'
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
   * 获取安全上下文信息
   */
  getSecurityContext(): SecurityContext {
    return {
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      timestamp: new Date(),
      rateLimitKey: this.getRateLimitKey(),
      requiresCaptcha: !!this.captcha
    };
  }
}

/**
 * 登录审计信息接口
 */
export interface LoginAuditInfo {
  /** 用户标识符 */
  identifier: string;
  /** 登录类型 */
  loginType: 'email' | 'username';
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent: string;
  /** 记住我选项 */
  rememberMe: boolean;
  /** 是否包含验证码 */
  hasCaptcha: boolean;
  /** 时间戳 */
  timestamp: Date;
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
 * 安全上下文接口
 */
export interface SecurityContext {
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent: string;
  /** 时间戳 */
  timestamp: Date;
  /** 频率限制键 */
  rateLimitKey: string;
  /** 是否需要验证码 */
  requiresCaptcha: boolean;
}

/**
 * 登录命令工厂类
 * 提供便捷的命令创建方法
 */
export class LoginUserCommandFactory {
  /**
   * 从HTTP请求创建登录命令
   */
  static fromHttpRequest(
    body: any,
    ipAddress: string,
    userAgent: string
  ): LoginUserCommand {
    return new LoginUserCommand(
      body.emailOrUsername,
      body.password,
      body.rememberMe || false,
      ipAddress,
      userAgent,
      body.captcha
    );
  }

  /**
   * 创建测试用登录命令
   */
  static createForTesting(
    emailOrUsername: string,
    password: string,
    options: Partial<{
      rememberMe: boolean;
      ipAddress: string;
      userAgent: string;
      captcha: string;
    }> = {}
  ): LoginUserCommand {
    return new LoginUserCommand(
      emailOrUsername,
      password,
      options.rememberMe || false,
      options.ipAddress || '127.0.0.1',
      options.userAgent || 'test-agent',
      options.captcha
    );
  }
}
