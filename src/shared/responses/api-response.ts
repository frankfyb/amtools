/**
 * 统一API响应格式
 * 
 * 提供标准化的API响应结构，支持成功和错误两种状态，
 * 包含完整的元数据信息和类型安全的数据封装。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

/**
 * 响应元数据接口
 */
export interface ResponseMeta {
  /** 响应时间戳 */
  timestamp: string;
  /** 请求ID，用于链路追踪 */
  requestId?: string;
  /** API版本 */
  version: string;
  /** 请求处理耗时（毫秒） */
  duration?: number;
  /** 服务器节点信息 */
  server?: string;
  /** 分页信息（列表接口使用） */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 验证错误接口
 */
export interface ValidationError {
  /** 错误字段名 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
  /** 错误值 */
  value?: any;
  /** 约束条件 */
  constraints?: Record<string, string>;
}

/**
 * 业务错误接口
 */
export interface BusinessError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: any;
  /** 错误堆栈（开发环境） */
  stack?: string;
}

/**
 * 统一API响应类
 * 
 * 提供标准化的API响应格式，支持泛型数据类型
 */
export class ApiResponse<T = any> {
  /** 操作是否成功 */
  success: boolean;
  
  /** 响应数据 */
  data?: T;
  
  /** 响应消息 */
  message: string;
  
  /** 验证错误列表 */
  errors?: ValidationError[];
  
  /** 业务错误信息 */
  error?: BusinessError;
  
  /** 响应元数据 */
  meta: ResponseMeta;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    errors?: ValidationError[],
    error?: BusinessError,
    meta?: Partial<ResponseMeta>
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.error = error;
    this.meta = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      server: process.env.NODE_ENV || 'development',
      ...meta
    };
  }

  /**
   * 创建成功响应
   * 
   * @param data 响应数据
   * @param message 成功消息
   * @param meta 额外元数据
   * @returns 成功响应对象
   */
  static success<T>(
    data: T, 
    message: string = '操作成功',
    meta?: Partial<ResponseMeta>
  ): ApiResponse<T> {
    return new ApiResponse(true, message, data, undefined, undefined, meta);
  }

  /**
   * 创建分页成功响应
   * 
   * @param data 分页数据
   * @param pagination 分页信息
   * @param message 成功消息
   * @param meta 额外元数据
   * @returns 分页成功响应对象
   */
  static successWithPagination<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = '查询成功',
    meta?: Partial<ResponseMeta>
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    return new ApiResponse(
      true, 
      message, 
      data, 
      undefined, 
      undefined, 
      {
        ...meta,
        pagination: {
          ...pagination,
          totalPages
        }
      }
    );
  }

  /**
   * 创建验证错误响应
   * 
   * @param errors 验证错误列表
   * @param message 错误消息
   * @param meta 额外元数据
   * @returns 验证错误响应对象
   */
  static validationError(
    errors: ValidationError[], 
    message: string = '请求参数验证失败',
    meta?: Partial<ResponseMeta>
  ): ApiResponse {
    return new ApiResponse(false, message, undefined, errors, undefined, meta);
  }

  /**
   * 创建业务错误响应
   * 
   * @param error 业务错误信息
   * @param message 错误消息
   * @param meta 额外元数据
   * @returns 业务错误响应对象
   */
  static businessError(
    error: BusinessError,
    message: string = '业务处理失败',
    meta?: Partial<ResponseMeta>
  ): ApiResponse {
    return new ApiResponse(false, message, undefined, undefined, error, meta);
  }

  /**
   * 创建简单错误响应
   * 
   * @param message 错误消息
   * @param code 错误代码
   * @param meta 额外元数据
   * @returns 简单错误响应对象
   */
  static error(
    message: string,
    code: string = 'GENERAL_ERROR',
    meta?: Partial<ResponseMeta>
  ): ApiResponse {
    return new ApiResponse(
      false, 
      message, 
      undefined, 
      undefined, 
      {
        code,
        message,
        details: null
      }, 
      meta
    );
  }

  /**
   * 创建未授权错误响应
   * 
   * @param message 错误消息
   * @param meta 额外元数据
   * @returns 未授权错误响应对象
   */
  static unauthorized(
    message: string = '未授权访问',
    meta?: Partial<ResponseMeta>
  ): ApiResponse {
    return ApiResponse.error(message, 'UNAUTHORIZED', meta);
  }

  /**
   * 创建禁止访问错误响应
   * 
   * @param message 错误消息
   * @param meta 额外元数据
   * @returns 禁止访问错误响应对象
   */
  static forbidden(
    message: string = '禁止访问',
    meta?: Partial<ResponseMeta>
  ): ApiResponse {
    return ApiResponse.error(message, 'FORBIDDEN', meta);
  }

  /**
   * 创建资源未找到错误响应
   * 
   * @param message 错误消息
   * @param meta 额外元数据
   * @returns 资源未找到错误响应对象
   */
  static notFound(
    message: string = '资源未找到',
    meta?: Partial<ResponseMeta>
  ): ApiResponse {
    return ApiResponse.error(message, 'NOT_FOUND', meta);
  }

  /**
   * 创建服务器内部错误响应
   * 
   * @param message 错误消息
   * @param details 错误详情
   * @param meta 额外元数据
   * @returns 服务器内部错误响应对象
   */
  static internalError(
    message: string = '服务器内部错误',
    details?: any,
    meta?: Partial<ResponseMeta>
  ): ApiResponse {
    return new ApiResponse(
      false, 
      message, 
      undefined, 
      undefined, 
      {
        code: 'INTERNAL_SERVER_ERROR',
        message,
        details,
        stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined
      }, 
      meta
    );
  }

  /**
   * 设置请求ID
   * 
   * @param requestId 请求ID
   * @returns 当前响应对象（支持链式调用）
   */
  setRequestId(requestId: string): this {
    this.meta.requestId = requestId;
    return this;
  }

  /**
   * 设置处理耗时
   * 
   * @param duration 耗时（毫秒）
   * @returns 当前响应对象（支持链式调用）
   */
  setDuration(duration: number): this {
    this.meta.duration = duration;
    return this;
  }

  /**
   * 转换为JSON对象
   * 
   * @returns JSON对象
   */
  toJSON(): object {
    return {
      success: this.success,
      message: this.message,
      data: this.data,
      errors: this.errors,
      error: this.error,
      meta: this.meta
    };
  }
}

/**
 * 常用错误代码常量
 */
export const ERROR_CODES = {
  // 通用错误
  GENERAL_ERROR: 'GENERAL_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  
  // 认证授权错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // 资源错误
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
  INVALID_PASSWORD_FORMAT: 'INVALID_PASSWORD_FORMAT',
  INVALID_VERIFICATION_CODE: 'INVALID_VERIFICATION_CODE',
  
  // 业务错误
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  VERIFICATION_CODE_EXPIRED: 'VERIFICATION_CODE_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // 限流错误
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
