/**
 * Swagger API 装饰器
 * 
 * 提供与现有路由装饰器兼容的Swagger注解装饰器，
 * 用于生成API文档和OpenAPI规范。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import 'reflect-metadata';

// Swagger 元数据键
export const SWAGGER_METADATA_KEYS = {
  API_OPERATION: 'swagger:api-operation',
  API_RESPONSE: 'swagger:api-response',
  API_RESPONSES: 'swagger:api-responses',
  API_TAGS: 'swagger:api-tags',
  API_SECURITY: 'swagger:api-security',
  API_PARAMETER: 'swagger:api-parameter',
  API_BODY: 'swagger:api-body',
  API_PROPERTY: 'swagger:api-property',
  API_MODEL: 'swagger:api-model'
} as const;

/**
 * API操作配置接口
 */
export interface ApiOperationOptions {
  /** 操作摘要 */
  summary: string;
  /** 操作描述 */
  description?: string;
  /** 操作ID */
  operationId?: string;
  /** 是否已弃用 */
  deprecated?: boolean;
  /** 标签 */
  tags?: string[];
}

/**
 * API响应配置接口
 */
export interface ApiResponseOptions {
  /** HTTP状态码 */
  status: number;
  /** 响应描述 */
  description: string;
  /** 响应类型 */
  type?: any;
  /** 响应示例 */
  example?: any;
  /** 响应头 */
  headers?: Record<string, any>;
}

/**
 * API参数配置接口
 */
export interface ApiParameterOptions {
  /** 参数名称 */
  name: string;
  /** 参数位置 */
  in: 'query' | 'path' | 'header' | 'cookie';
  /** 参数描述 */
  description?: string;
  /** 是否必需 */
  required?: boolean;
  /** 参数类型 */
  type?: string;
  /** 参数示例 */
  example?: any;
  /** 参数格式 */
  format?: string;
}

/**
 * API请求体配置接口
 */
export interface ApiBodyOptions {
  /** 请求体描述 */
  description?: string;
  /** 请求体类型 */
  type?: any;
  /** 是否必需 */
  required?: boolean;
  /** 请求体示例 */
  examples?: Record<string, any>;
}

/**
 * API属性配置接口
 */
export interface ApiPropertyOptions {
  /** 属性描述 */
  description?: string;
  /** 属性类型 */
  type?: string;
  /** 属性格式 */
  format?: string;
  /** 是否必需 */
  required?: boolean;
  /** 属性示例 */
  example?: any;
  /** 最小值 */
  minimum?: number;
  /** 最大值 */
  maximum?: number;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 正则模式 */
  pattern?: string;
  /** 枚举值 */
  enum?: any[];
  /** 默认值 */
  default?: any;
}

/**
 * API操作装饰器
 * 
 * @param options 操作配置选项
 */
export function ApiOperation(options: ApiOperationOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_OPERATION, options, target, propertyKey);
    return descriptor;
  };
}

/**
 * API响应装饰器
 * 
 * @param options 响应配置选项
 */
export function ApiResponse(options: ApiResponseOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingResponses = Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_RESPONSES, target, propertyKey) || [];
    existingResponses.push(options);
    Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_RESPONSES, existingResponses, target, propertyKey);
    return descriptor;
  };
}

/**
 * API标签装饰器
 * 
 * @param tags 标签数组
 */
export function ApiTags(...tags: string[]) {
  return function (target: any) {
    Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_TAGS, tags, target);
    return target;
  };
}

/**
 * API安全装饰器
 * 
 * @param securities 安全配置
 */
export function ApiSecurity(...securities: string[]) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey && descriptor) {
      // 方法级别的安全配置
      Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_SECURITY, securities, target, propertyKey);
    } else {
      // 类级别的安全配置
      Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_SECURITY, securities, target);
    }
    return descriptor || target;
  };
}

/**
 * API参数装饰器
 * 
 * @param options 参数配置选项
 */
export function ApiParameter(options: ApiParameterOptions) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingParameters = Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_PARAMETER, target, propertyKey) || [];
    existingParameters[parameterIndex] = options;
    Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_PARAMETER, existingParameters, target, propertyKey);
  };
}

/**
 * API请求体装饰器
 * 
 * @param options 请求体配置选项
 */
export function ApiBody(options: ApiBodyOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_BODY, options, target, propertyKey);
    return descriptor;
  };
}

/**
 * API属性装饰器
 * 
 * @param options 属性配置选项
 */
export function ApiProperty(options: ApiPropertyOptions = {}) {
  return function (target: any, propertyKey: string) {
    const existingProperties = Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_PROPERTY, target.constructor) || {};
    existingProperties[propertyKey] = options;
    Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_PROPERTY, existingProperties, target.constructor);
  };
}

/**
 * API模型装饰器
 * 
 * @param name 模型名称
 * @param description 模型描述
 */
export function ApiModel(name?: string, description?: string) {
  return function (target: any) {
    const modelInfo = {
      name: name || target.name,
      description: description || `${target.name} 数据模型`
    };
    Reflect.defineMetadata(SWAGGER_METADATA_KEYS.API_MODEL, modelInfo, target);
    return target;
  };
}

/**
 * 获取API操作元数据
 */
export function getApiOperation(target: any, propertyKey: string): ApiOperationOptions | undefined {
  return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_OPERATION, target, propertyKey);
}

/**
 * 获取API响应元数据
 */
export function getApiResponses(target: any, propertyKey: string): ApiResponseOptions[] {
  return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_RESPONSES, target, propertyKey) || [];
}

/**
 * 获取API标签元数据
 */
export function getApiTags(target: any): string[] {
  return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_TAGS, target) || [];
}

/**
 * 获取API安全元数据
 */
export function getApiSecurity(target: any, propertyKey?: string): string[] {
  if (propertyKey) {
    return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_SECURITY, target, propertyKey) || [];
  }
  return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_SECURITY, target) || [];
}

/**
 * 获取API参数元数据
 */
export function getApiParameters(target: any, propertyKey: string): ApiParameterOptions[] {
  return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_PARAMETER, target, propertyKey) || [];
}

/**
 * 获取API请求体元数据
 */
export function getApiBody(target: any, propertyKey: string): ApiBodyOptions | undefined {
  return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_BODY, target, propertyKey);
}

/**
 * 获取API属性元数据
 */
export function getApiProperties(target: any): Record<string, ApiPropertyOptions> {
  return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_PROPERTY, target) || {};
}

/**
 * 获取API模型元数据
 */
export function getApiModel(target: any): { name: string; description: string } | undefined {
  return Reflect.getMetadata(SWAGGER_METADATA_KEYS.API_MODEL, target);
}

/**
 * 常用响应装饰器组合
 */
export const CommonApiResponses = {
  /**
   * 成功响应
   */
  Success: (description: string = '操作成功', type?: any) => 
    ApiResponse({ status: 200, description, type }),

  /**
   * 创建成功响应
   */
  Created: (description: string = '创建成功', type?: any) => 
    ApiResponse({ status: 201, description, type }),

  /**
   * 无内容响应
   */
  NoContent: (description: string = '操作成功，无返回内容') => 
    ApiResponse({ status: 204, description }),

  /**
   * 参数错误响应
   */
  BadRequest: (description: string = '请求参数错误') => 
    ApiResponse({ status: 400, description }),

  /**
   * 未授权响应
   */
  Unauthorized: (description: string = '未授权访问') => 
    ApiResponse({ status: 401, description }),

  /**
   * 禁止访问响应
   */
  Forbidden: (description: string = '禁止访问') => 
    ApiResponse({ status: 403, description }),

  /**
   * 资源不存在响应
   */
  NotFound: (description: string = '资源不存在') => 
    ApiResponse({ status: 404, description }),

  /**
   * 服务器错误响应
   */
  InternalServerError: (description: string = '服务器内部错误') => 
    ApiResponse({ status: 500, description })
};
