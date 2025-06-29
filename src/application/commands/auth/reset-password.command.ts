/**
 * 重置密码命令
 * 
 * 定义重置用户密码所需的参数，包括邮箱验证、新密码和安全验证
 * 实现安全的密码重置流程
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
 * 重置密码命令类
 */
export class ResetPasswordCommand {
  constructor(
    /**
     * 邮箱地址
     * 用于标识要重置密码的用户账户
     */
    public readonly email: string,

    /**
     * 验证码
     * 通过邮箱发送的6位数字验证码
     */
    public readonly verificationCode: string,

    /**
     * 新密码
     * 用户设置的新密码
     */
    public readonly newPassword: string,

    /**
     * 确认密码
     * 用于确认新密码输入正确
     */
    public readonly confirmPassword: string,

    /**
     * 客户端IP地址
     * 用于安全审计和异常检测
     */
    public readonly ipAddress: string = 'unknown',

    /**
     * 用户代理字符串
     * 用于设备识别和安全审计
     */
    public readonly userAgent: string = 'unknown'
  ) {
    // 验证必需参数
    if (!email?.trim()) {
      throw new Error('邮箱地址不能为空');
    }

    if (!verificationCode?.trim()) {
      throw new Error('验证码不能为空');
    }

    if (!newPassword?.trim()) {
      throw new Error('新密码不能为空');
    }

    if (!confirmPassword?.trim()) {
      throw new Error('确认密码不能为空');
    }
  }

  /**
   * 验证命令参数的有效性
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      errors.push({
        field: 'email',
        message: '邮箱格式不正确',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // 验证验证码格式（6位数字）
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(this.verificationCode)) {
      errors.push({
        field: 'verificationCode',
        message: '验证码必须是6位数字',
        code: 'INVALID_VERIFICATION_CODE_FORMAT'
      });
    }

    // 验证密码长度
    if (this.newPassword.length < 8 || this.newPassword.length > 128) {
      errors.push({
        field: 'newPassword',
        message: '密码长度必须在8-128个字符之间',
        code: 'INVALID_PASSWORD_LENGTH'
      });
    }

    // 验证密码强度
    if (!this.isStrongPassword(this.newPassword)) {
      errors.push({
        field: 'newPassword',
        message: '密码必须包含大小写字母、数字和特殊字符',
        code: 'WEAK_PASSWORD'
      });
    }

    // 验证密码确认
    if (this.newPassword !== this.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        message: '两次输入的密码不一致',
        code: 'PASSWORD_MISMATCH'
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
   * 检查密码强度
   */
  private isStrongPassword(password: string): boolean {
    // 至少包含一个小写字母
    const hasLowerCase = /[a-z]/.test(password);
    // 至少包含一个大写字母
    const hasUpperCase = /[A-Z]/.test(password);
    // 至少包含一个数字
    const hasNumber = /\d/.test(password);
    // 至少包含一个特殊字符
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar;
  }

  /**
   * 获取标准化的邮箱地址
   */
  getNormalizedEmail(): string {
    return this.email.toLowerCase().trim();
  }

  /**
   * 获取密码强度评分
   */
  getPasswordStrength(): PasswordStrength {
    const password = this.newPassword;
    let score = 0;
    const feedback: string[] = [];

    // 长度检查
    if (password.length >= 8) score += 1;
    else feedback.push('密码长度至少8位');

    if (password.length >= 12) score += 1;
    else feedback.push('建议密码长度12位以上');

    // 字符类型检查
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('缺少小写字母');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('缺少大写字母');

    if (/\d/.test(password)) score += 1;
    else feedback.push('缺少数字');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('缺少特殊字符');

    // 复杂性检查
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('避免连续重复字符');

    let level: 'weak' | 'medium' | 'strong' | 'very_strong';
    if (score <= 2) level = 'weak';
    else if (score <= 4) level = 'medium';
    else if (score <= 6) level = 'strong';
    else level = 'very_strong';

    return {
      score,
      level,
      feedback,
      isAcceptable: score >= 4
    };
  }

  /**
   * 创建审计日志信息
   */
  getAuditInfo(): ResetPasswordAuditInfo {
    return {
      email: this.getNormalizedEmail(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      passwordStrength: this.getPasswordStrength(),
      timestamp: new Date()
    };
  }

  /**
   * 获取安全上下文信息
   */
  getSecurityContext(): SecurityContext {
    return {
      email: this.getNormalizedEmail(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      timestamp: new Date(),
      verificationCodeProvided: !!this.verificationCode,
      passwordStrengthLevel: this.getPasswordStrength().level
    };
  }
}

/**
 * 密码强度接口
 */
export interface PasswordStrength {
  /** 强度评分 (0-7) */
  score: number;
  /** 强度等级 */
  level: 'weak' | 'medium' | 'strong' | 'very_strong';
  /** 改进建议 */
  feedback: string[];
  /** 是否可接受 */
  isAcceptable: boolean;
}

/**
 * 重置密码审计信息接口
 */
export interface ResetPasswordAuditInfo {
  /** 邮箱地址 */
  email: string;
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent: string;
  /** 密码强度 */
  passwordStrength: PasswordStrength;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 安全上下文接口
 */
export interface SecurityContext {
  /** 邮箱地址 */
  email: string;
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent: string;
  /** 时间戳 */
  timestamp: Date;
  /** 是否提供验证码 */
  verificationCodeProvided: boolean;
  /** 密码强度等级 */
  passwordStrengthLevel: string;
}

/**
 * 重置密码命令工厂类
 */
export class ResetPasswordCommandFactory {
  /**
   * 从HTTP请求创建重置密码命令
   */
  static fromHttpRequest(
    body: any,
    ipAddress: string,
    userAgent: string
  ): ResetPasswordCommand {
    return new ResetPasswordCommand(
      body.email,
      body.verificationCode,
      body.newPassword,
      body.confirmPassword,
      ipAddress,
      userAgent
    );
  }

  /**
   * 创建测试用重置密码命令
   */
  static createForTesting(
    email: string = 'test@example.com',
    verificationCode: string = '123456',
    newPassword: string = 'NewPassword123!',
    options: Partial<{
      confirmPassword: string;
      ipAddress: string;
      userAgent: string;
    }> = {}
  ): ResetPasswordCommand {
    return new ResetPasswordCommand(
      email,
      verificationCode,
      newPassword,
      options.confirmPassword || newPassword,
      options.ipAddress || '127.0.0.1',
      options.userAgent || 'test-agent'
    );
  }
}
