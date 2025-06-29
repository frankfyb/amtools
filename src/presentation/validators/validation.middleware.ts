/**
 * 验证中间件 - 表示层
 */

import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ApiResponse } from '../../shared/types/common.types';

/**
 * 验证中间件工厂
 */
export function validationMiddleware<T>(type: any): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 将请求体转换为DTO类实例
      const dto = plainToClass(type, req.body);
      
      // 执行验证
      const errors: ValidationError[] = await validate(dto);
      
      if (errors.length > 0) {
        // 格式化验证错误
        const formattedErrors = formatValidationErrors(errors);
        
        const response: ApiResponse = {
          success: false,
          message: '请求参数验证失败',
          errors: formattedErrors,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string || 'unknown',
            version: '1.0.0'
          }
        };
        
        res.status(400).json(response);
        return;
      }
      
      // 验证通过，将验证后的DTO附加到请求对象
      req.body = dto;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: '验证过程中发生错误',
        errors: [{
          code: 'VALIDATION_ERROR',
          message: '验证过程中发生错误'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || 'unknown',
          version: '1.0.0'
        }
      };
      
      res.status(500).json(response);
    }
  };
}

/**
 * 格式化验证错误
 */
function formatValidationErrors(errors: ValidationError[]): any[] {
  const formattedErrors: any[] = [];
  
  errors.forEach(error => {
    if (error.constraints) {
      Object.values(error.constraints).forEach(message => {
        formattedErrors.push({
          field: error.property,
          message: message,
          code: 'VALIDATION_FAILED'
        });
      });
    }
    
    // 处理嵌套验证错误
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatValidationErrors(error.children);
      formattedErrors.push(...nestedErrors.map(err => ({
        ...err,
        field: `${error.property}.${err.field}`
      })));
    }
  });
  
  return formattedErrors;
}

/**
 * 自定义验证装饰器
 */
export function CustomValidation(validationFn: (value: any) => boolean, message: string) {
  return function (object: any, propertyName: string) {
    // 这里可以实现自定义验证逻辑
    // 实际项目中需要使用class-validator的registerDecorator
  };
}

/**
 * 密码确认验证
 */
export function PasswordConfirmation(property: string, message?: string) {
  return function (object: any, propertyName: string) {
    // 实现密码确认验证逻辑
    // 检查两个密码字段是否一致
  };
}

/**
 * 邮箱唯一性验证（异步）
 */
export function IsEmailUnique(message?: string) {
  return function (object: any, propertyName: string) {
    // 实现邮箱唯一性验证逻辑
    // 需要查询数据库检查邮箱是否已存在
  };
}

/**
 * 用户名唯一性验证（异步）
 */
export function IsUsernameUnique(message?: string) {
  return function (object: any, propertyName: string) {
    // 实现用户名唯一性验证逻辑
    // 需要查询数据库检查用户名是否已存在
  };
}
