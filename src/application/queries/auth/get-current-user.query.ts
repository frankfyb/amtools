/**
 * 获取当前用户信息查询
 * 
 * 定义获取当前登录用户详细信息所需的参数
 * 用于CQRS架构中的查询处理
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
 * 获取当前用户信息查询类
 */
export class GetCurrentUserQuery {
  constructor(
    /**
     * 用户ID
     * 从JWT令牌中解析出的用户标识符
     */
    public readonly userId: string,

    /**
     * 是否包含敏感信息
     * 控制是否返回敏感的用户信息，如权限列表等
     */
    public readonly includeSensitiveInfo: boolean = true,

    /**
     * 是否包含统计信息
     * 控制是否返回用户的统计信息，如登录次数等
     */
    public readonly includeStatistics: boolean = false
  ) {
    // 验证必需参数
    if (!userId?.trim()) {
      throw new Error('用户ID不能为空');
    }
  }

  /**
   * 验证查询参数的有效性
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取查询选项
   */
  getQueryOptions(): UserQueryOptions {
    return {
      includeSensitiveInfo: this.includeSensitiveInfo,
      includeStatistics: this.includeStatistics,
      includePermissions: this.includeSensitiveInfo,
      includeProfile: true,
      includeLastLogin: true
    };
  }

  /**
   * 创建审计日志信息
   */
  getAuditInfo(): UserQueryAuditInfo {
    return {
      userId: this.userId,
      queryType: 'get_current_user',
      includeSensitiveInfo: this.includeSensitiveInfo,
      includeStatistics: this.includeStatistics,
      timestamp: new Date()
    };
  }

  /**
   * 获取缓存键
   */
  getCacheKey(): string {
    const sensitiveFlag = this.includeSensitiveInfo ? 'sensitive' : 'basic';
    const statsFlag = this.includeStatistics ? 'stats' : 'nostats';
    return `user:${this.userId}:${sensitiveFlag}:${statsFlag}`;
  }

  /**
   * 检查是否需要缓存
   */
  shouldCache(): boolean {
    // 包含统计信息的查询不缓存，因为统计信息可能频繁变化
    return !this.includeStatistics;
  }

  /**
   * 获取缓存TTL（秒）
   */
  getCacheTTL(): number {
    if (this.includeSensitiveInfo) {
      return 300; // 5分钟，敏感信息缓存时间较短
    } else {
      return 900; // 15分钟，基本信息缓存时间较长
    }
  }
}

/**
 * 用户查询选项接口
 */
export interface UserQueryOptions {
  /** 是否包含敏感信息 */
  includeSensitiveInfo: boolean;
  /** 是否包含统计信息 */
  includeStatistics: boolean;
  /** 是否包含权限信息 */
  includePermissions: boolean;
  /** 是否包含用户资料 */
  includeProfile: boolean;
  /** 是否包含最后登录信息 */
  includeLastLogin: boolean;
}

/**
 * 用户查询审计信息接口
 */
export interface UserQueryAuditInfo {
  /** 用户ID */
  userId: string;
  /** 查询类型 */
  queryType: string;
  /** 是否包含敏感信息 */
  includeSensitiveInfo: boolean;
  /** 是否包含统计信息 */
  includeStatistics: boolean;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 获取当前用户查询工厂类
 */
export class GetCurrentUserQueryFactory {
  /**
   * 从认证请求创建查询
   */
  static fromAuthenticatedRequest(
    userId: string,
    options: Partial<{
      includeSensitiveInfo: boolean;
      includeStatistics: boolean;
    }> = {}
  ): GetCurrentUserQuery {
    return new GetCurrentUserQuery(
      userId,
      options.includeSensitiveInfo ?? true,
      options.includeStatistics ?? false
    );
  }

  /**
   * 创建基本信息查询
   */
  static createBasicQuery(userId: string): GetCurrentUserQuery {
    return new GetCurrentUserQuery(
      userId,
      false, // 不包含敏感信息
      false  // 不包含统计信息
    );
  }

  /**
   * 创建完整信息查询
   */
  static createFullQuery(userId: string): GetCurrentUserQuery {
    return new GetCurrentUserQuery(
      userId,
      true, // 包含敏感信息
      true  // 包含统计信息
    );
  }

  /**
   * 创建测试用查询
   */
  static createForTesting(
    userId: string = 'test-user-id',
    options: Partial<{
      includeSensitiveInfo: boolean;
      includeStatistics: boolean;
    }> = {}
  ): GetCurrentUserQuery {
    return new GetCurrentUserQuery(
      userId,
      options.includeSensitiveInfo ?? true,
      options.includeStatistics ?? false
    );
  }
}
