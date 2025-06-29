/**
 * Swagger/OpenAPI 配置
 * 
 * 提供API文档的完整配置，包括基本信息、服务器设置、
 * 安全定义和文档生成选项。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

/**
 * Swagger 基础配置选项
 */
export interface SwaggerConfigOptions {
  /** 应用名称 */
  title: string;
  /** 应用描述 */
  description: string;
  /** API版本 */
  version: string;
  /** 服务器URL */
  serverUrl: string;
  /** 是否启用Swagger UI */
  enabled: boolean;
  /** 文档访问路径 */
  path: string;
  /** 是否在生产环境启用 */
  enableInProduction: boolean;
}

/**
 * 默认Swagger配置
 */
const defaultConfig: SwaggerConfigOptions = {
  title: 'AMTools API',
  description: `
    AMTools 企业级多工具平台 API 文档
    
    ## 功能特性
    - 🔐 JWT 认证系统
    - 📧 邮箱验证服务
    - 👤 用户管理
    - 🔍 可用性检查
    - 📊 数据统计
    
    ## 认证说明
    大部分API需要JWT认证，请先通过登录接口获取访问令牌，
    然后在请求头中添加：\`Authorization: Bearer <token>\`
    
    ## 错误处理
    所有API响应都遵循统一的错误格式，包含错误代码、消息和详细信息。
    
    ## 版本信息
    当前API版本：v1.0.0
    文档更新时间：${new Date().toISOString()}
  `,
  version: '1.0.0',
  serverUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  enabled: process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true',
  path: '/api-docs',
  enableInProduction: process.env.SWAGGER_ENABLED === 'true'
};

/**
 * Swagger JSDoc 配置
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: defaultConfig.title,
    version: defaultConfig.version,
    description: defaultConfig.description,
    contact: {
      name: 'AMTools Team',
      email: 'support@amtools.com',
      url: 'https://amtools.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    termsOfService: 'https://amtools.com/terms'
  },
  servers: [
    {
      url: defaultConfig.serverUrl + (process.env.API_PREFIX || '/api/v1'),
      description: '开发环境服务器'
    },
    {
      url: 'https://api.amtools.com/api/v1',
      description: '生产环境服务器'
    },
    {
      url: 'https://staging-api.amtools.com/api/v1',
      description: '测试环境服务器'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT认证令牌，格式：Bearer <token>'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API密钥认证（可选）'
      }
    },
    responses: {
      UnauthorizedError: {
        description: '认证失败',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: '认证失败' },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'UNAUTHORIZED' },
                    message: { type: 'string', example: '无效的访问令牌' }
                  }
                }
              }
            }
          }
        }
      },
      ValidationError: {
        description: '参数验证失败',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: '参数验证失败' },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'VALIDATION_ERROR' },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' },
                          code: { type: 'string' },
                          value: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      InternalServerError: {
        description: '服务器内部错误',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: '服务器内部错误' },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'INTERNAL_ERROR' },
                    message: { type: 'string', example: '服务器处理请求时发生错误' }
                  }
                }
              }
            }
          }
        }
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: '请求是否成功'
          },
          message: {
            type: 'string',
            description: '响应消息'
          },
          data: {
            description: '响应数据',
            nullable: true
          },
          error: {
            type: 'object',
            description: '错误信息（仅在失败时返回）',
            nullable: true,
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: '响应时间戳'
          },
          requestId: {
            type: 'string',
            description: '请求ID'
          }
        },
        required: ['success', 'message', 'timestamp']
      }
    }
  },
  tags: [
    {
      name: '认证管理',
      description: '用户认证相关接口，包括注册、登录、验证等功能'
    },
    {
      name: '用户管理',
      description: '用户信息管理接口'
    },
    {
      name: '可用性检查',
      description: '邮箱和用户名可用性检查接口'
    },
    {
      name: '系统管理',
      description: '系统健康检查和配置管理接口'
    }
  ],
  security: [
    {
      BearerAuth: []
    }
  ]
};

/**
 * Swagger JSDoc 选项
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: [
    './src/presentation/controllers/*.ts',
    './src/presentation/dto/*.ts',
    './src/shared/responses/*.ts',
    './docs/swagger/*.yaml'
  ]
};

/**
 * Swagger UI 选项
 */
const swaggerUiOptions: SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // 添加请求拦截器，自动添加认证头
      const token = localStorage.getItem('auth_token');
      if (token && !req.headers.Authorization) {
        req.headers.Authorization = `Bearer ${token}`;
      }
      return req;
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
  `,
  customSiteTitle: 'AMTools API Documentation',
  customfavIcon: '/favicon.ico'
};

/**
 * 生成Swagger规范
 */
export const generateSwaggerSpec = () => {
  return swaggerJSDoc(swaggerOptions);
};

/**
 * 获取Swagger配置
 */
export const getSwaggerConfig = (): SwaggerConfigOptions => {
  return { ...defaultConfig };
};

/**
 * 获取Swagger UI选项
 */
export const getSwaggerUiOptions = (): SwaggerUiOptions => {
  return { ...swaggerUiOptions };
};

/**
 * 检查是否应该启用Swagger
 */
export const shouldEnableSwagger = (): boolean => {
  const config = getSwaggerConfig();
  
  if (process.env.NODE_ENV === 'production') {
    return config.enableInProduction;
  }
  
  return config.enabled;
};

/**
 * 获取Swagger访问路径
 */
export const getSwaggerPath = (): string => {
  return getSwaggerConfig().path;
};
