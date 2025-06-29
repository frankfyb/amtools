/**
 * 参数解析器
 * 
 * 自动解析@Body, @Param, @Query等装饰器参数，
 * 支持类型转换、验证、默认值等功能。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { ValidationPipe, ValidationException } from './pipes/validation.pipe';
import { AuthenticatedRequest } from './guards/auth.guard';

/**
 * 参数类型枚举
 */
export enum ParameterType {
  BODY = 'body',
  PARAM = 'param',
  QUERY = 'query',
  HEADER = 'header',
  REQUEST = 'req',
  RESPONSE = 'res',
  SESSION = 'session',
  COOKIES = 'cookies',
  IP = 'ip',
  HOST = 'host',
  USER = 'user',
  FILE = 'file',
  FILES = 'files'
}

/**
 * 参数元数据接口
 */
export interface ParameterMetadata {
  /** 参数索引 */
  index: number;
  /** 参数类型 */
  type: ParameterType;
  /** 参数键名 */
  key?: string;
  /** 参数的TypeScript类型 */
  metatype?: any;
  /** 是否必需 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 验证管道 */
  pipes?: any[];
  /** 转换函数 */
  transform?: (value: any) => any;
  /** 验证函数 */
  validate?: (value: any) => boolean | Promise<boolean>;
  /** 参数描述 */
  description?: string;
}

/**
 * 参数解析选项
 */
export interface ParameterResolverOptions {
  /** 是否启用类型转换 */
  enableTypeConversion?: boolean;
  /** 是否启用验证 */
  enableValidation?: boolean;
  /** 是否启用默认值 */
  enableDefaultValues?: boolean;
  /** 严格模式（缺少必需参数时抛出错误） */
  strictMode?: boolean;
}

/**
 * 参数解析结果
 */
export interface ParameterResolutionResult {
  /** 解析后的参数值 */
  value: any;
  /** 是否成功解析 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 原始值 */
  originalValue?: any;
}

/**
 * 参数解析器类
 */
export class ParameterResolver {
  private validationPipe = new ValidationPipe();
  private options: Required<ParameterResolverOptions>;

  constructor(options: ParameterResolverOptions = {}) {
    this.options = {
      enableTypeConversion: true,
      enableValidation: true,
      enableDefaultValues: true,
      strictMode: false,
      ...options
    };
  }

  /**
   * 解析所有参数
   * 
   * @param req 请求对象
   * @param res 响应对象
   * @param parameterMetadata 参数元数据数组
   * @returns 解析后的参数数组
   */
  async resolveParameters(
    req: AuthenticatedRequest,
    res: Response,
    parameterMetadata: ParameterMetadata[]
  ): Promise<any[]> {
    if (parameterMetadata.length === 0) {
      return [req, res];
    }

    const resolvedArgs: any[] = [];
    const errors: string[] = [];

    for (const param of parameterMetadata) {
      try {
        const result = await this.resolveParameter(req, res, param);
        
        if (result.success) {
          resolvedArgs[param.index] = result.value;
        } else {
          if (this.options.strictMode && param.required) {
            errors.push(result.error || `参数 ${param.key || param.type} 解析失败`);
          } else {
            resolvedArgs[param.index] = param.defaultValue;
          }
        }
      } catch (error) {
        const errorMessage = `参数 ${param.key || param.type}[${param.index}] 解析失败: ${error.message}`;
        
        if (this.options.strictMode && param.required) {
          errors.push(errorMessage);
        } else {
          console.warn(errorMessage);
          resolvedArgs[param.index] = param.defaultValue;
        }
      }
    }

    if (errors.length > 0 && this.options.strictMode) {
      throw new ValidationException(
        errors.map(error => ({
          field: 'parameter',
          message: error,
          code: 'PARAMETER_RESOLUTION_ERROR',
          value: undefined
        })),
        '参数解析失败'
      );
    }

    return resolvedArgs;
  }

  /**
   * 解析单个参数
   * 
   * @param req 请求对象
   * @param res 响应对象
   * @param param 参数元数据
   * @returns 参数解析结果
   */
  async resolveParameter(
    req: AuthenticatedRequest,
    res: Response,
    param: ParameterMetadata
  ): Promise<ParameterResolutionResult> {
    try {
      // 1. 提取原始值
      let rawValue = this.extractRawValue(req, res, param);

      // 2. 应用默认值
      if (rawValue === undefined && this.options.enableDefaultValues && param.defaultValue !== undefined) {
        rawValue = param.defaultValue;
      }

      // 3. 检查必需参数
      if (param.required && (rawValue === undefined || rawValue === null || rawValue === '')) {
        return {
          value: undefined,
          success: false,
          error: `必需参数 ${param.key || param.type} 缺失`,
          originalValue: rawValue
        };
      }

      // 4. 类型转换
      let convertedValue = rawValue;
      if (this.options.enableTypeConversion && rawValue !== undefined) {
        convertedValue = this.convertType(rawValue, param);
      }

      // 5. 应用自定义转换
      if (param.transform && typeof param.transform === 'function') {
        convertedValue = param.transform(convertedValue);
      }

      // 6. 应用验证管道
      if (this.options.enableValidation && param.pipes && param.pipes.length > 0) {
        for (const pipe of param.pipes) {
          if (pipe && typeof pipe.transform === 'function') {
            convertedValue = await pipe.transform(convertedValue, param.metatype);
          }
        }
      }

      // 7. 自定义验证
      if (param.validate && typeof param.validate === 'function') {
        const isValid = await param.validate(convertedValue);
        if (!isValid) {
          return {
            value: undefined,
            success: false,
            error: `参数 ${param.key || param.type} 验证失败`,
            originalValue: rawValue
          };
        }
      }

      return {
        value: convertedValue,
        success: true,
        originalValue: rawValue
      };
    } catch (error) {
      return {
        value: undefined,
        success: false,
        error: error.message,
        originalValue: undefined
      };
    }
  }

  /**
   * 提取原始参数值
   * 
   * @param req 请求对象
   * @param res 响应对象
   * @param param 参数元数据
   * @returns 原始值
   */
  private extractRawValue(
    req: AuthenticatedRequest,
    res: Response,
    param: ParameterMetadata
  ): any {
    switch (param.type) {
      case ParameterType.BODY:
        return param.key ? req.body?.[param.key] : req.body;
      
      case ParameterType.PARAM:
        return param.key ? req.params?.[param.key] : req.params;
      
      case ParameterType.QUERY:
        return param.key ? req.query?.[param.key] : req.query;
      
      case ParameterType.HEADER:
        return param.key ? req.get(param.key) : req.headers;
      
      case ParameterType.REQUEST:
        return req;
      
      case ParameterType.RESPONSE:
        return res;
      
      case ParameterType.SESSION:
        return param.key ? (req as any).session?.[param.key] : (req as any).session;
      
      case ParameterType.COOKIES:
        return param.key ? req.cookies?.[param.key] : req.cookies;
      
      case ParameterType.IP:
        return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      
      case ParameterType.HOST:
        return req.get('host');
      
      case ParameterType.USER:
        return param.key ? req.user?.[param.key as keyof typeof req.user] : req.user;
      
      case ParameterType.FILE:
        return (req as any).file;
      
      case ParameterType.FILES:
        return (req as any).files;
      
      default:
        return undefined;
    }
  }

  /**
   * 类型转换
   * 
   * @param value 原始值
   * @param param 参数元数据
   * @returns 转换后的值
   */
  private convertType(value: any, param: ParameterMetadata): any {
    if (value === undefined || value === null || !param.metatype) {
      return value;
    }

    try {
      switch (param.metatype) {
        case String:
          return String(value);
        
        case Number:
          const num = Number(value);
          return isNaN(num) ? value : num;
        
        case Boolean:
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
          }
          return Boolean(value);
        
        case Date:
          if (value instanceof Date) return value;
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date;
        
        case Array:
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return value.split(',').map(item => item.trim());
            }
          }
          return [value];
        
        case Object:
          if (typeof value === 'object') return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          }
          return value;
        
        default:
          return value;
      }
    } catch (error) {
      console.warn(`类型转换失败 ${param.key || param.type}:`, error);
      return value;
    }
  }

  /**
   * 设置选项
   * 
   * @param options 新选项
   */
  setOptions(options: Partial<ParameterResolverOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取当前选项
   * 
   * @returns 当前选项
   */
  getOptions(): Required<ParameterResolverOptions> {
    return { ...this.options };
  }

  /**
   * 设置验证管道
   * 
   * @param pipe 验证管道
   */
  setValidationPipe(pipe: ValidationPipe): void {
    this.validationPipe = pipe;
  }

  /**
   * 获取验证管道
   * 
   * @returns 验证管道
   */
  getValidationPipe(): ValidationPipe {
    return this.validationPipe;
  }
}
