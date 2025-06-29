/**
 * 令牌黑名单服务接口
 * 
 * 定义令牌黑名单管理的核心接口，用于处理JWT令牌的撤销和验证
 * 支持单个令牌黑名单和用户级别的令牌撤销
 */

/**
 * 令牌黑名单服务接口
 */
export interface ITokenBlacklistService {
  /**
   * 将令牌加入黑名单
   * 
   * @param token JWT令牌字符串
   * @param expiresAt 令牌过期时间，用于自动清理
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * await tokenBlacklistService.addToBlacklist(
   *   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
   *   new Date('2024-12-31T23:59:59Z')
   * );
   * ```
   */
  addToBlacklist(token: string, expiresAt: Date): Promise<void>;

  /**
   * 检查令牌是否在黑名单中
   * 
   * @param token JWT令牌字符串
   * @returns Promise<boolean> true表示令牌已被撤销，false表示令牌有效
   * 
   * @example
   * ```typescript
   * const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
   * if (isBlacklisted) {
   *   throw new InvalidTokenException('令牌已被撤销');
   * }
   * ```
   */
  isBlacklisted(token: string): Promise<boolean>;

  /**
   * 将用户的所有令牌加入黑名单
   * 
   * 用于强制用户重新登录的场景，如：
   * - 密码重置后
   * - 账户安全事件
   * - 管理员强制登出
   * 
   * @param userId 用户ID
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * // 密码重置后撤销所有令牌
   * await tokenBlacklistService.blacklistAllUserTokens(userId);
   * ```
   */
  blacklistAllUserTokens(userId: string): Promise<void>;

  /**
   * 检查用户是否被全局撤销令牌
   * 
   * @param userId 用户ID
   * @param tokenIssuedAt 令牌签发时间
   * @returns Promise<boolean> true表示用户的令牌已被全局撤销
   * 
   * @example
   * ```typescript
   * const isUserBlacklisted = await tokenBlacklistService.isUserBlacklisted(
   *   userId, 
   *   new Date(decodedToken.iat * 1000)
   * );
   * ```
   */
  isUserBlacklisted(userId: string, tokenIssuedAt: Date): Promise<boolean>;

  /**
   * 清理过期的黑名单记录
   * 
   * 定期清理已过期的黑名单记录，释放存储空间
   * 通常由定时任务调用
   * 
   * @returns Promise<number> 清理的记录数量
   * 
   * @example
   * ```typescript
   * // 定时任务中调用
   * const cleanedCount = await tokenBlacklistService.cleanupExpiredTokens();
   * console.log(`清理了 ${cleanedCount} 条过期记录`);
   * ```
   */
  cleanupExpiredTokens(): Promise<number>;

  /**
   * 获取黑名单统计信息
   * 
   * @returns Promise<BlacklistStats> 黑名单统计信息
   */
  getBlacklistStats(): Promise<BlacklistStats>;

  /**
   * 批量检查令牌是否在黑名单中
   * 
   * @param tokens 令牌数组
   * @returns Promise<Map<string, boolean>> 令牌到黑名单状态的映射
   */
  batchCheckBlacklist(tokens: string[]): Promise<Map<string, boolean>>;
}

/**
 * 黑名单统计信息
 */
export interface BlacklistStats {
  /** 总的黑名单令牌数量 */
  totalBlacklistedTokens: number;
  
  /** 被全局撤销的用户数量 */
  totalBlacklistedUsers: number;
  
  /** 今天新增的黑名单令牌数量 */
  todayBlacklistedTokens: number;
  
  /** 预计的存储使用量（字节） */
  estimatedStorageUsage: number;
  
  /** 最近清理时间 */
  lastCleanupTime?: Date;
}

/**
 * 黑名单操作选项
 */
export interface BlacklistOptions {
  /** 是否立即生效，默认为true */
  immediate?: boolean;
  
  /** 自定义过期时间，如果不提供则使用令牌的过期时间 */
  customExpiresAt?: Date;
  
  /** 撤销原因，用于审计日志 */
  reason?: string;
  
  /** 操作者ID，用于审计日志 */
  operatorId?: string;
}

/**
 * 扩展的令牌黑名单服务接口
 * 包含更多高级功能
 */
export interface IAdvancedTokenBlacklistService extends ITokenBlacklistService {
  /**
   * 带选项的令牌黑名单添加
   * 
   * @param token JWT令牌字符串
   * @param expiresAt 令牌过期时间
   * @param options 黑名单选项
   * @returns Promise<void>
   */
  addToBlacklistWithOptions(
    token: string, 
    expiresAt: Date, 
    options: BlacklistOptions
  ): Promise<void>;

  /**
   * 获取用户的黑名单历史
   * 
   * @param userId 用户ID
   * @param limit 返回记录数量限制
   * @returns Promise<BlacklistRecord[]> 黑名单记录列表
   */
  getUserBlacklistHistory(userId: string, limit?: number): Promise<BlacklistRecord[]>;

  /**
   * 撤销黑名单（恢复令牌）
   * 
   * @param token JWT令牌字符串
   * @returns Promise<boolean> 是否成功撤销
   */
  removeFromBlacklist(token: string): Promise<boolean>;
}

/**
 * 黑名单记录
 */
export interface BlacklistRecord {
  /** 令牌哈希 */
  tokenHash: string;
  
  /** 用户ID */
  userId: string;
  
  /** 加入黑名单时间 */
  blacklistedAt: Date;
  
  /** 过期时间 */
  expiresAt: Date;
  
  /** 撤销原因 */
  reason?: string;
  
  /** 操作者ID */
  operatorId?: string;
}

/**
 * 令牌黑名单服务的错误类型
 */
export enum BlacklistServiceError {
  /** 令牌格式无效 */
  INVALID_TOKEN_FORMAT = 'INVALID_TOKEN_FORMAT',
  
  /** 存储服务不可用 */
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  
  /** 操作超时 */
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT',
  
  /** 批量操作部分失败 */
  PARTIAL_FAILURE = 'PARTIAL_FAILURE'
}

/**
 * 令牌黑名单服务异常
 */
export class TokenBlacklistServiceException extends Error {
  constructor(
    public readonly errorType: BlacklistServiceError,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TokenBlacklistServiceException';
  }
}
