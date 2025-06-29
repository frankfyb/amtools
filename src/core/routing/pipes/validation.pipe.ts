/**
 * 验证管道
 * 
 * 基于class-validator的自动验证管道，支持DTO对象验证、
 * 类型转换、嵌套对象验证等功能。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';
import { ValidationError, ApiResponse } from '../../../shared/responses/api-response';

/**
 * 验证管道选项
 */
export interface ValidationPipeOptions {
  /** 是否启用类型转换 */
  transform?: boolean;
  /** 是否只保留白名单属性 */
  whitelist?: boolean;
  /** 是否禁止非白名单属性 */
  forbidNonWhitelisted?: boolean;
  /** 是否跳过缺失属性的验证 */
  skipMissingProperties?: boolean;
  /** 是否禁用错误消息 */
  disableErrorMessages?: boolean;
  /** 验证组 */
  groups?: string[];
  /** 是否总是验证（即使值为undefined） */
  always?: boolean;
  /** 自定义错误消息前缀 */
  errorPrefix?: string;
}

/**
 * 验证异常类
 */
export class ValidationException extends Error {
  constructor(
    public readonly validationErrors: ValidationError[],
    message: string = '请求参数验证失败'
  ) {
    super(message);
    this.name = 'ValidationException';
  }

  /**
   * 获取第一个错误消息
   */
  getFirstErrorMessage(): string {
    return this.validationErrors[0]?.message || this.message;
  }

  /**
   * 获取指定字段的错误消息
   */
  getFieldErrorMessage(field: string): string | undefined {
    return this.validationErrors.find(error => error.field === field)?.message;
  }

  /**
   * 转换为ApiResponse
   */
  toApiResponse(): ApiResponse {
    return ApiResponse.validationError(this.validationErrors, this.message);
  }
}

/**
 * 验证管道类
 */
export class ValidationPipe {
  private readonly options: ValidationPipeOptions;

  constructor(options: ValidationPipeOptions = {}) {
    this.options = {
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      disableErrorMessages: false,
      always: false,
      errorPrefix: '',
      ...options
    };
  }

  /**
   * 验证并转换数据
   * 
   * @param value 待验证的值
   * @param metatype 目标类型
   * @returns 验证后的数据
   * @throws ValidationException 验证失败时抛出
   */
  async transform<T>(value: any, metatype: any): Promise<T> {
    // 如果没有元类型或者是基础类型，直接返回
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 转换为类实例
    const object = plainToClass(metatype, value, {
      enableImplicitConversion: this.options.transform,
      excludeExtraneousValues: this.options.whitelist
    });

    // 执行验证
    const errors = await validate(object, {
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted,
      skipMissingProperties: this.options.skipMissingProperties,
      groups: this.options.groups,
      always: this.options.always
    });

    // 如果有验证错误，抛出异常
    if (errors.length > 0) {
      const validationErrors = this.formatErrors(errors);
      throw new ValidationException(validationErrors);
    }

    return this.options.transform ? (object as T) : value;
  }

  /**
   * 验证数组数据
   * 
   * @param values 待验证的数组
   * @param metatype 目标类型
   * @returns 验证后的数组
   */
  async transformArray<T>(values: any[], metatype: any): Promise<T[]> {
    if (!Array.isArray(values)) {
      throw new ValidationException([{
        field: 'root',
        message: '期望数组类型',
        code: 'INVALID_ARRAY_TYPE',
        value: values
      }]);
    }

    const results: T[] = [];
    const allErrors: ValidationError[] = [];

    for (let i = 0; i < values.length; i++) {
      try {
        const result = await this.transform<T>(values[i], metatype);
        results.push(result);
      } catch (error) {
        if (error instanceof ValidationException) {
          // 为数组元素添加索引前缀
          const indexedErrors = error.validationErrors.map(err => ({
            ...err,
            field: `[${i}].${err.field}`,
            message: `第${i + 1}项: ${err.message}`
          }));
          allErrors.push(...indexedErrors);
        } else {
          allErrors.push({
            field: `[${i}]`,
            message: `第${i + 1}项验证失败: ${(error as Error).message || '未知错误'}`,
            code: 'ARRAY_ITEM_VALIDATION_ERROR',
            value: values[i]
          });
        }
      }
    }

    if (allErrors.length > 0) {
      throw new ValidationException(allErrors, '数组数据验证失败');
    }

    return results;
  }

  /**
   * 判断是否需要验证
   * 
   * @param metatype 元类型
   * @returns 是否需要验证
   */
  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * 格式化验证错误
   * 
   * @param errors class-validator错误数组
   * @returns 格式化后的错误数组
   */
  private formatErrors(errors: ClassValidatorError[]): ValidationError[] {
    const result: ValidationError[] = [];

    const processError = (error: ClassValidatorError, parentPath: string = '') => {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

      // 处理约束错误
      if (error.constraints) {
        Object.entries(error.constraints).forEach(([constraintKey, message]) => {
          result.push({
            field: fieldPath,
            message: this.options.errorPrefix ? `${this.options.errorPrefix}${message}` : message,
            code: this.getErrorCode(constraintKey),
            value: error.value,
            constraints: { [constraintKey]: message }
          });
        });
      }

      // 递归处理嵌套错误
      if (error.children && error.children.length > 0) {
        error.children.forEach(childError => {
          processError(childError, fieldPath);
        });
      }
    };

    errors.forEach(error => processError(error));
    return result;
  }

  /**
   * 根据约束类型获取错误代码
   * 
   * @param constraintKey 约束键
   * @returns 错误代码
   */
  private getErrorCode(constraintKey: string): string {
    const errorCodeMap: Record<string, string> = {
      isNotEmpty: 'FIELD_REQUIRED',
      isEmail: 'INVALID_EMAIL_FORMAT',
      isString: 'INVALID_STRING_TYPE',
      isNumber: 'INVALID_NUMBER_TYPE',
      isBoolean: 'INVALID_BOOLEAN_TYPE',
      isArray: 'INVALID_ARRAY_TYPE',
      isObject: 'INVALID_OBJECT_TYPE',
      minLength: 'STRING_TOO_SHORT',
      maxLength: 'STRING_TOO_LONG',
      min: 'NUMBER_TOO_SMALL',
      max: 'NUMBER_TOO_LARGE',
      matches: 'PATTERN_MISMATCH',
      isIn: 'INVALID_ENUM_VALUE',
      isOptional: 'OPTIONAL_FIELD',
      isDateString: 'INVALID_DATE_FORMAT',
      isUUID: 'INVALID_UUID_FORMAT',
      isUrl: 'INVALID_URL_FORMAT',
      isPhoneNumber: 'INVALID_PHONE_FORMAT',
      isPostalCode: 'INVALID_POSTAL_CODE',
      isCreditCard: 'INVALID_CREDIT_CARD',
      isJSON: 'INVALID_JSON_FORMAT'
    };

    return errorCodeMap[constraintKey] || 'VALIDATION_ERROR';
  }

  /**
   * 创建验证管道实例的工厂方法
   * 
   * @param options 验证选项
   * @returns 验证管道实例
   */
  static create(options?: ValidationPipeOptions): ValidationPipe {
    return new ValidationPipe(options);
  }

  /**
   * 创建严格验证管道（禁止额外属性）
   * 
   * @returns 严格验证管道实例
   */
  static createStrict(): ValidationPipe {
    return new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false
    });
  }

  /**
   * 创建宽松验证管道（允许额外属性）
   * 
   * @returns 宽松验证管道实例
   */
  static createLoose(): ValidationPipe {
    return new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidNonWhitelisted: false,
      skipMissingProperties: true
    });
  }
}

/**
 * 验证装饰器工厂
 * 
 * @param options 验证选项
 * @returns 装饰器函数
 */
export function ValidatedBody(options?: ValidationPipeOptions) {
  const pipe = new ValidationPipe(options);
  
  return function (target: any, propertyKey: string, parameterIndex: number) {
    // 存储验证管道元数据
    const existingPipes = Reflect.getMetadata('validation:pipes', target, propertyKey) || [];
    existingPipes[parameterIndex] = pipe;
    Reflect.defineMetadata('validation:pipes', existingPipes, target, propertyKey);
  };
}

/**
 * 验证查询参数装饰器
 */
export function ValidatedQuery(key?: string, options?: ValidationPipeOptions) {
  const pipe = new ValidationPipe(options);
  
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingPipes = Reflect.getMetadata('validation:query-pipes', target, propertyKey) || [];
    existingPipes[parameterIndex] = { pipe, key };
    Reflect.defineMetadata('validation:query-pipes', existingPipes, target, propertyKey);
  };
}

/**
 * 验证路径参数装饰器
 */
export function ValidatedParam(key: string, options?: ValidationPipeOptions) {
  const pipe = new ValidationPipe(options);
  
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingPipes = Reflect.getMetadata('validation:param-pipes', target, propertyKey) || [];
    existingPipes[parameterIndex] = { pipe, key };
    Reflect.defineMetadata('validation:param-pipes', existingPipes, target, propertyKey);
  };
}
