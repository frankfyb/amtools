/**
 * 通用类型定义
 */

// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  meta?: ResponseMeta;
}

// API错误
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

// 响应元数据
export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
  performance?: PerformanceMeta;
}

// 分页元数据
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// 性能元数据
export interface PerformanceMeta {
  executionTime: number;
  queryCount: number;
  cacheHits: number;
}

// 分页请求参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 过滤参数
export interface FilterParams {
  search?: string;
  filters?: Record<string, any>;
  dateRange?: DateRange;
}

// 日期范围
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// 排序参数
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// 实体基类
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

// 软删除实体
export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: Date;
  isDeleted: boolean;
}

// 审计实体
export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}

// 操作结果
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  warnings?: string[];
}

// 批量操作结果
export interface BatchOperationResult<T = any> {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: OperationResult<T>[];
  errors: BatchError[];
}

// 批量操作错误
export interface BatchError {
  index: number;
  error: string;
  errorCode?: string;
  data?: any;
}

// 环境类型
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

// 日志级别
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose'
}

// 缓存键类型
export type CacheKey = string | symbol;

// 缓存选项
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
}

// 健康检查状态
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded'
}

// 健康检查结果
export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration: number;
}

// 配置接口
export interface IConfig {
  get<T = any>(key: string): T;
  has(key: string): boolean;
  set(key: string, value: any): void;
}

// 可选字段类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 必需字段类型
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// 深度部分类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
