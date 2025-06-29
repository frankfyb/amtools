/**
 * Swagger 文档生成器
 * 
 * 负责从装饰器元数据生成OpenAPI规范，
 * 与自定义路由系统集成。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import 'reflect-metadata';
import { OpenAPIV3 } from 'openapi-types';
import { 
  getApiOperation, 
  getApiResponses, 
  getApiTags, 
  getApiSecurity,
  getApiParameters,
  getApiBody,
  getApiProperties,
  getApiModel
} from './decorators';
import { 
  getControllerMetadata, 
  getRouteMetadata, 
  ROUTE_METADATA_KEY,
  CONTROLLER_METADATA_KEY 
} from '../routing/decorators';

/**
 * 路径项对象
 */
interface PathItem extends OpenAPIV3.PathItemObject {
  [method: string]: OpenAPIV3.OperationObject | any;
}

/**
 * Swagger文档生成器
 */
export class SwaggerGenerator {
  private spec: OpenAPIV3.Document;
  private components: OpenAPIV3.ComponentsObject;

  constructor(baseSpec: Partial<OpenAPIV3.Document> = {}) {
    this.components = {
      schemas: {},
      responses: {},
      parameters: {},
      examples: {},
      requestBodies: {},
      headers: {},
      securitySchemes: {},
      links: {},
      callbacks: {},
      ...baseSpec.components
    };

    this.spec = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        ...baseSpec.info
      },
      paths: {},
      components: this.components,
      ...baseSpec
    };
  }

  /**
   * 从控制器类生成路径
   */
  generatePathsFromController(ControllerClass: any): void {
    const controllerMetadata = getControllerMetadata(ControllerClass);
    if (!controllerMetadata) {
      console.warn(`Controller ${ControllerClass.name} has no metadata`);
      return;
    }

    const controllerTags = getApiTags(ControllerClass);
    const controllerSecurity = getApiSecurity(ControllerClass);

    // 获取所有路由方法
    const routes = getRouteMetadata(ControllerClass) || [];

    routes.forEach(route => {
      const fullPath = this.normalizePath(controllerMetadata.path + route.path);
      const method = route.method.toLowerCase();

      // 初始化路径对象
      if (!this.spec.paths[fullPath]) {
        this.spec.paths[fullPath] = {};
      }

      const pathItem = this.spec.paths[fullPath] as PathItem;

      // 生成操作对象
      const operation = this.generateOperation(
        ControllerClass.prototype,
        route.methodName,
        controllerTags,
        controllerSecurity
      );

      pathItem[method] = operation;
    });
  }

  /**
   * 生成操作对象
   */
  private generateOperation(
    target: any,
    methodName: string,
    controllerTags: string[] = [],
    controllerSecurity: string[] = []
  ): OpenAPIV3.OperationObject {
    const operation: OpenAPIV3.OperationObject = {
      responses: {}
    };

    // 获取API操作元数据
    const apiOperation = getApiOperation(target, methodName);
    if (apiOperation) {
      operation.summary = apiOperation.summary;
      operation.description = apiOperation.description;
      operation.operationId = apiOperation.operationId || `${target.constructor.name}_${methodName}`;
      operation.deprecated = apiOperation.deprecated;
      operation.tags = apiOperation.tags || controllerTags;
    } else {
      // 默认值
      operation.operationId = `${target.constructor.name}_${methodName}`;
      operation.tags = controllerTags;
      operation.summary = this.generateDefaultSummary(methodName);
    }

    // 获取API响应元数据
    const apiResponses = getApiResponses(target, methodName);
    if (apiResponses.length > 0) {
      apiResponses.forEach(response => {
        operation.responses[response.status.toString()] = {
          description: response.description,
          content: response.type ? this.generateContent(response.type, response.example) : undefined,
          headers: response.headers
        };
      });
    } else {
      // 默认响应
      operation.responses['200'] = {
        description: '操作成功',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse'
            }
          }
        }
      };
    }

    // 获取API参数元数据
    const apiParameters = getApiParameters(target, methodName);
    if (apiParameters.length > 0) {
      operation.parameters = apiParameters.map(param => ({
        name: param.name,
        in: param.in,
        description: param.description,
        required: param.required,
        schema: {
          type: param.type || 'string',
          format: param.format,
          example: param.example
        }
      }));
    }

    // 获取API请求体元数据
    const apiBody = getApiBody(target, methodName);
    if (apiBody) {
      operation.requestBody = {
        description: apiBody.description,
        required: apiBody.required,
        content: apiBody.type ? this.generateContent(apiBody.type) : {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      };
    }

    // 获取安全配置
    const methodSecurity = getApiSecurity(target, methodName);
    const security = methodSecurity.length > 0 ? methodSecurity : controllerSecurity;
    if (security.length > 0) {
      operation.security = security.map(scheme => ({ [scheme]: [] }));
    }

    return operation;
  }

  /**
   * 生成内容对象
   */
  private generateContent(type: any, example?: any): OpenAPIV3.ContentObject {
    const schema = this.generateSchema(type);
    
    return {
      'application/json': {
        schema,
        example
      }
    };
  }

  /**
   * 生成模式对象
   */
  private generateSchema(type: any): OpenAPIV3.SchemaObject {
    if (!type) {
      return { type: 'object' };
    }

    // 检查是否是基本类型
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'string': return { type: 'string' };
        case 'number': return { type: 'number' };
        case 'boolean': return { type: 'boolean' };
        case 'array': return { type: 'array', items: { type: 'string' } };
        case 'object': return { type: 'object' };
        default: return { type: 'string' };
      }
    }

    // 检查是否是类
    if (typeof type === 'function') {
      const modelName = type.name;
      
      // 如果还没有生成过这个模型的schema，则生成
      if (!this.components.schemas![modelName]) {
        this.generateModelSchema(type);
      }

      return { $ref: `#/components/schemas/${modelName}` };
    }

    return { type: 'object' };
  }

  /**
   * 生成模型模式
   */
  private generateModelSchema(ModelClass: any): void {
    const modelName = ModelClass.name;
    const apiModel = getApiModel(ModelClass);
    const apiProperties = getApiProperties(ModelClass);

    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      description: apiModel?.description || `${modelName} 数据模型`,
      properties: {},
      required: []
    };

    // 生成属性
    Object.entries(apiProperties).forEach(([propertyName, propertyOptions]) => {
      schema.properties![propertyName] = {
        type: propertyOptions.type || 'string',
        description: propertyOptions.description,
        format: propertyOptions.format,
        example: propertyOptions.example,
        minimum: propertyOptions.minimum,
        maximum: propertyOptions.maximum,
        minLength: propertyOptions.minLength,
        maxLength: propertyOptions.maxLength,
        pattern: propertyOptions.pattern,
        enum: propertyOptions.enum,
        default: propertyOptions.default
      };

      if (propertyOptions.required) {
        schema.required!.push(propertyName);
      }
    });

    this.components.schemas![modelName] = schema;
  }

  /**
   * 规范化路径
   */
  private normalizePath(path: string): string {
    // 移除重复的斜杠
    path = path.replace(/\/+/g, '/');
    
    // 确保以斜杠开头
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // 转换Express路径参数为OpenAPI格式
    path = path.replace(/:([^/]+)/g, '{$1}');

    return path;
  }

  /**
   * 生成默认摘要
   */
  private generateDefaultSummary(methodName: string): string {
    // 将驼峰命名转换为可读的摘要
    return methodName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * 获取生成的OpenAPI规范
   */
  getSpec(): OpenAPIV3.Document {
    return this.spec;
  }

  /**
   * 添加自定义组件
   */
  addComponent(type: keyof OpenAPIV3.ComponentsObject, name: string, component: any): void {
    if (!this.components[type]) {
      this.components[type] = {};
    }
    (this.components[type] as any)[name] = component;
  }

  /**
   * 设置基础信息
   */
  setInfo(info: Partial<OpenAPIV3.InfoObject>): void {
    this.spec.info = { ...this.spec.info, ...info };
  }

  /**
   * 添加服务器
   */
  addServer(server: OpenAPIV3.ServerObject): void {
    if (!this.spec.servers) {
      this.spec.servers = [];
    }
    this.spec.servers.push(server);
  }

  /**
   * 添加标签
   */
  addTag(tag: OpenAPIV3.TagObject): void {
    if (!this.spec.tags) {
      this.spec.tags = [];
    }
    this.spec.tags.push(tag);
  }
}
