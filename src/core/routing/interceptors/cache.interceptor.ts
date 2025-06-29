/**
 * 缓存拦截器
 * 
 * 基于Redis的HTTP响应缓存拦截器，支持智能缓存键生成、
 * 条件缓存、缓存失效策略等功能。
 * 
 * @author AMTools Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { Injectable, Inject } from '../../di/decorators';
import { EXTERNAL_TOKENS } from '../../di/tokens';
import { Redis } from 'ioredis';
import { ApiResponse } from '../../../shared/responses/api-response';

/**
 * 缓存选项接口
 */
export interface CacheOptions {
  /** 缓存过期时间（秒），默认300秒 */
  ttl?: number;
  /** 自定义缓存键生成器 */
  keyGenerator?: (req: Request) => string;
  /** 缓存条件判断器 */
  condition?: (req: Request, res: Response) => boolean;
  /** 是否缓存错误响应 */
  cacheErrors?: boolean;
  /** 缓存键前缀 */
  keyPrefix?: string;
  /** 是否压缩缓存内容 */
  compress?: boolean;
  /** 缓存标签（用于批量失效） */
  tags?: string[];
  /** 是否启用缓存统计 */
  enableStats?: boolean;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 缓存命中次数 */
  hits: number;
  /** 缓存未命中次数 */
  misses: number;
  /** 缓存写入次数 */
  sets: number;
  /** 缓存删除次数 */
  deletes: number;
  /** 命中率 */
  hitRate: number;
}

/**
 * 缓存元数据
 */
export interface CacheMetadata {
  /** 缓存创建时间 */
  createdAt: string;
  /** 缓存过期时间 */
  expiresAt: string;
  /** 缓存键 */
  key: string;
  /** 缓存标签 */
  tags?: string[];
  /** 请求信息 */
  request: {
    method: string;
    url: string;
    userAgent?: string;
  };
}

/**
 * 缓存拦截器类
 */
@Injectable()
export class CacheInterceptor {
  private readonly stats: Map<string, CacheStats> = new Map();
  private readonly defaultOptions: Required<CacheOptions>;

  constructor(
    @Inject(EXTERNAL_TOKENS.REDIS_CLIENT)
    private readonly redisClient: Redis
  ) {
    this.defaultOptions = {
      ttl: 300,
      keyGenerator: this.defaultKeyGenerator.bind(this),
      condition: this.defaultCondition.bind(this),
      cacheErrors: false,
      keyPrefix: 'api:cache:',
      compress: false,
      tags: [],
      enableStats: true
    };
  }

  /**
   * 创建缓存中间件
   * 
   * @param options 缓存选项
   * @returns Express中间件函数
   */
  intercept(options: CacheOptions = {}) {
    const mergedOptions = { ...this.defaultOptions, ...options };

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // 检查是否满足缓存条件
        if (!mergedOptions.condition(req, res)) {
          return next();
        }

        const cacheKey = mergedOptions.keyGenerator(req);
        const fullCacheKey = `${mergedOptions.keyPrefix}${cacheKey}`;

        // 尝试从缓存获取
        const cachedData = await this.getFromCache(fullCacheKey);
        
        if (cachedData) {
          // 缓存命中
          this.updateStats(cacheKey, 'hit');
          
          // 设置缓存相关响应头
          res.set({
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `public, max-age=${mergedOptions.ttl}`
          });

          return res.json(cachedData.response);
        }

        // 缓存未命中，记录统计
        this.updateStats(cacheKey, 'miss');

        // 拦截响应
        const originalJson = res.json.bind(res);
        let responseData: any;

        res.json = function(data: any) {
          responseData = data;
          return originalJson(data);
        };

        // 监听响应完成
        res.on('finish', async () => {
          try {
            // 检查是否应该缓存响应
            if (this.shouldCacheResponse(res, responseData, mergedOptions)) {
              await this.setToCache(
                fullCacheKey,
                responseData,
                mergedOptions,
                req
              );
              this.updateStats(cacheKey, 'set');
            }
          } catch (error) {
            console.error('Cache set error:', error);
          }
        });

        // 设置缓存相关响应头
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey
        });

        next();
      } catch (error) {
        console.error('Cache interceptor error:', error);
        // 缓存失败时继续正常处理
        next();
      }
    };
  }

  /**
   * 从缓存获取数据
   * 
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  private async getFromCache(key: string): Promise<{
    response: any;
    metadata: CacheMetadata;
  } | null> {
    try {
      const cachedString = await this.redisClient.get(key);
      
      if (!cachedString) {
        return null;
      }

      const cachedData = JSON.parse(cachedString);
      
      // 检查是否过期（双重保险）
      if (cachedData.metadata.expiresAt && 
          new Date(cachedData.metadata.expiresAt) < new Date()) {
        await this.redisClient.del(key);
        return null;
      }

      return cachedData;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   * 
   * @param key 缓存键
   * @param data 响应数据
   * @param options 缓存选项
   * @param req 请求对象
   */
  private async setToCache(
    key: string,
    data: any,
    options: Required<CacheOptions>,
    req: Request
  ): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + options.ttl * 1000);

      const cacheData = {
        response: data,
        metadata: {
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          key: key,
          tags: options.tags,
          request: {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent')
          }
        } as CacheMetadata
      };

      const cacheString = JSON.stringify(cacheData);
      
      // 设置缓存
      await this.redisClient.setex(key, options.ttl, cacheString);

      // 如果有标签，建立标签索引
      if (options.tags.length > 0) {
        await this.addTagIndexes(key, options.tags, options.ttl);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * 判断是否应该缓存响应
   * 
   * @param res 响应对象
   * @param data 响应数据
   * @param options 缓存选项
   * @returns 是否应该缓存
   */
  private shouldCacheResponse(
    res: Response,
    data: any,
    options: Required<CacheOptions>
  ): boolean {
    // 检查HTTP状态码
    if (res.statusCode >= 400 && !options.cacheErrors) {
      return false;
    }

    // 检查响应数据
    if (!data) {
      return false;
    }

    // 如果是ApiResponse格式，检查success字段
    if (data.success !== undefined && !data.success && !options.cacheErrors) {
      return false;
    }

    return true;
  }

  /**
   * 添加标签索引
   * 
   * @param key 缓存键
   * @param tags 标签列表
   * @param ttl 过期时间
   */
  private async addTagIndexes(key: string, tags: string[], ttl: number): Promise<void> {
    const pipeline = this.redisClient.pipeline();
    
    for (const tag of tags) {
      const tagKey = `${this.defaultOptions.keyPrefix}tag:${tag}`;
      pipeline.sadd(tagKey, key);
      pipeline.expire(tagKey, ttl + 60); // 标签索引比缓存多保留1分钟
    }
    
    await pipeline.exec();
  }

  /**
   * 根据标签删除缓存
   * 
   * @param tags 标签列表
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let deletedCount = 0;
    
    for (const tag of tags) {
      const tagKey = `${this.defaultOptions.keyPrefix}tag:${tag}`;
      const keys = await this.redisClient.smembers(tagKey);
      
      if (keys.length > 0) {
        const pipeline = this.redisClient.pipeline();
        keys.forEach(key => pipeline.del(key));
        await pipeline.exec();
        deletedCount += keys.length;
        
        // 删除标签索引
        await this.redisClient.del(tagKey);
      }
    }
    
    return deletedCount;
  }

  /**
   * 删除指定模式的缓存
   * 
   * @param pattern 键模式
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    const fullPattern = `${this.defaultOptions.keyPrefix}${pattern}`;
    const keys = await this.redisClient.keys(fullPattern);
    
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
    
    return keys.length;
  }

  /**
   * 清空所有缓存
   */
  async clearAll(): Promise<void> {
    const pattern = `${this.defaultOptions.keyPrefix}*`;
    const keys = await this.redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }

  /**
   * 获取缓存统计信息
   * 
   * @param key 缓存键（可选）
   * @returns 统计信息
   */
  getStats(key?: string): CacheStats | Map<string, CacheStats> {
    if (key) {
      return this.stats.get(key) || {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0
      };
    }
    
    return this.stats;
  }

  /**
   * 更新统计信息
   * 
   * @param key 缓存键
   * @param operation 操作类型
   */
  private updateStats(key: string, operation: 'hit' | 'miss' | 'set' | 'delete'): void {
    if (!this.defaultOptions.enableStats) {
      return;
    }

    const stats = this.stats.get(key) || {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0
    };

    stats[operation === 'hit' ? 'hits' : 
          operation === 'miss' ? 'misses' :
          operation === 'set' ? 'sets' : 'deletes']++;

    // 计算命中率
    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? stats.hits / total : 0;

    this.stats.set(key, stats);
  }

  /**
   * 默认缓存键生成器
   * 
   * @param req 请求对象
   * @returns 缓存键
   */
  private defaultKeyGenerator(req: Request): string {
    const url = req.url;
    const method = req.method;
    const query = JSON.stringify(req.query || {});
    const userId = (req as any).user?.id || 'anonymous';
    
    const keyData = `${method}:${url}:${query}:${userId}`;
    return Buffer.from(keyData).toString('base64').replace(/[/+=]/g, '');
  }

  /**
   * 默认缓存条件
   * 
   * @param req 请求对象
   * @param res 响应对象
   * @returns 是否应该缓存
   */
  private defaultCondition(req: Request, res: Response): boolean {
    // 只缓存GET请求
    return req.method === 'GET';
  }
}

/**
 * 缓存装饰器工厂
 * 
 * @param options 缓存选项
 * @returns 装饰器函数
 */
export function UseInterceptors(options?: CacheOptions) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey) {
      // 方法级装饰器
      Reflect.defineMetadata('cache:options', options, target, propertyKey);
    } else {
      // 类级装饰器
      Reflect.defineMetadata('cache:options', options, target);
    }
  };
}

/**
 * 缓存时间装饰器
 * 
 * @param ttl 缓存时间（秒）
 * @returns 装饰器函数
 */
export function CacheTTL(ttl: number) {
  return UseInterceptors({ ttl });
}

/**
 * 缓存标签装饰器
 * 
 * @param tags 缓存标签
 * @returns 装饰器函数
 */
export function CacheTags(...tags: string[]) {
  return UseInterceptors({ tags });
}
