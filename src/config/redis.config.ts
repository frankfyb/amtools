/**
 * Redis配置
 * 
 * 管理Redis连接和缓存配置
 */

/**
 * Redis连接配置接口
 */
export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  username?: string;
  family: 4 | 6;
  keepAlive: boolean;
  connectTimeout: number;
  commandTimeout: number;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
  lazyConnect: boolean;
  maxRetriesPerRequest: number;
  keyPrefix: string;
}

/**
 * Redis集群配置接口
 */
export interface RedisClusterConfig {
  enabled: boolean;
  nodes: Array<{
    host: string;
    port: number;
  }>;
  options: {
    enableOfflineQueue: boolean;
    redisOptions: {
      password?: string;
      db: number;
    };
    maxRedirections: number;
    retryDelayOnFailover: number;
    slotsRefreshTimeout: number;
    slotsRefreshInterval: number;
  };
}

/**
 * Redis哨兵配置接口
 */
export interface RedisSentinelConfig {
  enabled: boolean;
  sentinels: Array<{
    host: string;
    port: number;
  }>;
  name: string;
  role: 'master' | 'slave';
  password?: string;
  db: number;
}

/**
 * Redis缓存配置接口
 */
export interface RedisCacheConfig {
  defaultTTL: number; // 默认过期时间（秒）
  maxTTL: number; // 最大过期时间（秒）
  keyPrefix: string;
  compression: {
    enabled: boolean;
    threshold: number; // 压缩阈值（字节）
    algorithm: 'gzip' | 'deflate' | 'br';
  };
  serialization: {
    enabled: boolean;
    format: 'json' | 'msgpack' | 'pickle';
  };
}

/**
 * Redis监控配置接口
 */
export interface RedisMonitoringConfig {
  enabled: boolean;
  slowLogThreshold: number; // 慢查询阈值（微秒）
  maxSlowLogEntries: number;
  metrics: {
    enabled: boolean;
    interval: number; // 收集间隔（秒）
    retention: number; // 保留天数
  };
  alerts: {
    enabled: boolean;
    memoryUsageThreshold: number; // 内存使用率阈值（百分比）
    connectionThreshold: number; // 连接数阈值
    latencyThreshold: number; // 延迟阈值（毫秒）
  };
}

/**
 * 完整Redis配置接口
 */
export interface RedisConfig {
  connection: RedisConnectionConfig;
  cluster: RedisClusterConfig;
  sentinel: RedisSentinelConfig;
  cache: RedisCacheConfig;
  monitoring: RedisMonitoringConfig;
  persistence: {
    enabled: boolean;
    strategy: 'rdb' | 'aof' | 'both';
    rdb: {
      save: string; // 如: "900 1 300 10 60 10000"
      compression: boolean;
      checksum: boolean;
    };
    aof: {
      enabled: boolean;
      fsync: 'always' | 'everysec' | 'no';
      rewritePercentage: number;
      rewriteMinSize: string;
    };
  };
}

/**
 * 获取Redis配置
 */
export function getRedisConfig(): RedisConfig {
  const environment = process.env.NODE_ENV || 'development';

  const baseConfig: RedisConfig = {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      username: process.env.REDIS_USERNAME,
      family: (process.env.REDIS_FAMILY as any) || 4,
      keepAlive: process.env.REDIS_KEEP_ALIVE !== 'false',
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
      enableOfflineQueue: process.env.REDIS_OFFLINE_QUEUE === 'true',
      lazyConnect: process.env.REDIS_LAZY_CONNECT !== 'false',
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'amtools:'
    },
    cluster: {
      enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
      nodes: process.env.REDIS_CLUSTER_NODES ? 
        JSON.parse(process.env.REDIS_CLUSTER_NODES) : [],
      options: {
        enableOfflineQueue: false,
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0')
        },
        maxRedirections: parseInt(process.env.REDIS_CLUSTER_MAX_REDIRECTIONS || '16'),
        retryDelayOnFailover: parseInt(process.env.REDIS_CLUSTER_RETRY_DELAY || '100'),
        slotsRefreshTimeout: parseInt(process.env.REDIS_CLUSTER_SLOTS_TIMEOUT || '1000'),
        slotsRefreshInterval: parseInt(process.env.REDIS_CLUSTER_SLOTS_INTERVAL || '5000')
      }
    },
    sentinel: {
      enabled: process.env.REDIS_SENTINEL_ENABLED === 'true',
      sentinels: process.env.REDIS_SENTINEL_HOSTS ? 
        JSON.parse(process.env.REDIS_SENTINEL_HOSTS) : [],
      name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
      role: (process.env.REDIS_SENTINEL_ROLE as any) || 'master',
      password: process.env.REDIS_SENTINEL_PASSWORD,
      db: parseInt(process.env.REDIS_SENTINEL_DB || '0')
    },
    cache: {
      defaultTTL: parseInt(process.env.REDIS_CACHE_TTL || '3600'),
      maxTTL: parseInt(process.env.REDIS_CACHE_MAX_TTL || '86400'),
      keyPrefix: process.env.REDIS_CACHE_PREFIX || 'cache:',
      compression: {
        enabled: process.env.REDIS_COMPRESSION === 'true',
        threshold: parseInt(process.env.REDIS_COMPRESSION_THRESHOLD || '1024'),
        algorithm: (process.env.REDIS_COMPRESSION_ALGORITHM as any) || 'gzip'
      },
      serialization: {
        enabled: process.env.REDIS_SERIALIZATION !== 'false',
        format: (process.env.REDIS_SERIALIZATION_FORMAT as any) || 'json'
      }
    },
    monitoring: {
      enabled: process.env.REDIS_MONITORING === 'true',
      slowLogThreshold: parseInt(process.env.REDIS_SLOW_LOG_THRESHOLD || '10000'),
      maxSlowLogEntries: parseInt(process.env.REDIS_MAX_SLOW_LOG || '128'),
      metrics: {
        enabled: process.env.REDIS_METRICS === 'true',
        interval: parseInt(process.env.REDIS_METRICS_INTERVAL || '60'),
        retention: parseInt(process.env.REDIS_METRICS_RETENTION || '7')
      },
      alerts: {
        enabled: process.env.REDIS_ALERTS === 'true',
        memoryUsageThreshold: parseInt(process.env.REDIS_MEMORY_THRESHOLD || '80'),
        connectionThreshold: parseInt(process.env.REDIS_CONNECTION_THRESHOLD || '1000'),
        latencyThreshold: parseInt(process.env.REDIS_LATENCY_THRESHOLD || '100')
      }
    },
    persistence: {
      enabled: process.env.REDIS_PERSISTENCE === 'true',
      strategy: (process.env.REDIS_PERSISTENCE_STRATEGY as any) || 'rdb',
      rdb: {
        save: process.env.REDIS_RDB_SAVE || '900 1 300 10 60 10000',
        compression: process.env.REDIS_RDB_COMPRESSION !== 'false',
        checksum: process.env.REDIS_RDB_CHECKSUM !== 'false'
      },
      aof: {
        enabled: process.env.REDIS_AOF_ENABLED === 'true',
        fsync: (process.env.REDIS_AOF_FSYNC as any) || 'everysec',
        rewritePercentage: parseInt(process.env.REDIS_AOF_REWRITE_PERCENTAGE || '100'),
        rewriteMinSize: process.env.REDIS_AOF_REWRITE_MIN_SIZE || '64mb'
      }
    }
  };

  // 环境特定配置
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        monitoring: {
          ...baseConfig.monitoring,
          enabled: true
        },
        persistence: {
          ...baseConfig.persistence,
          enabled: false
        }
      };

    case 'test':
      return {
        ...baseConfig,
        connection: {
          ...baseConfig.connection,
          db: parseInt(process.env.TEST_REDIS_DB || '15'),
          keyPrefix: 'test:amtools:'
        },
        cache: {
          ...baseConfig.cache,
          defaultTTL: 60,
          keyPrefix: 'test:cache:'
        },
        monitoring: {
          ...baseConfig.monitoring,
          enabled: false
        },
        persistence: {
          ...baseConfig.persistence,
          enabled: false
        }
      };

    case 'production':
      return {
        ...baseConfig,
        connection: {
          ...baseConfig.connection,
          maxRetriesPerRequest: 5,
          retryDelayOnFailover: 200
        },
        monitoring: {
          ...baseConfig.monitoring,
          enabled: true,
          metrics: {
            ...baseConfig.monitoring.metrics,
            enabled: true
          },
          alerts: {
            ...baseConfig.monitoring.alerts,
            enabled: true
          }
        },
        persistence: {
          ...baseConfig.persistence,
          enabled: true,
          strategy: 'both'
        }
      };

    default:
      return baseConfig;
  }
}

/**
 * 验证Redis配置
 */
export function validateRedisConfig(config: RedisConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证连接配置
  if (!config.connection.host) {
    errors.push('Redis主机地址不能为空');
  }

  if (config.connection.port <= 0 || config.connection.port > 65535) {
    errors.push('Redis端口必须在1-65535之间');
  }

  if (config.connection.db < 0 || config.connection.db > 15) {
    errors.push('Redis数据库索引必须在0-15之间');
  }

  // 验证集群配置
  if (config.cluster.enabled && config.cluster.nodes.length === 0) {
    errors.push('启用集群模式时必须提供节点列表');
  }

  // 验证哨兵配置
  if (config.sentinel.enabled && config.sentinel.sentinels.length === 0) {
    errors.push('启用哨兵模式时必须提供哨兵列表');
  }

  // 验证缓存配置
  if (config.cache.defaultTTL <= 0) {
    errors.push('默认TTL必须大于0');
  }

  if (config.cache.maxTTL < config.cache.defaultTTL) {
    errors.push('最大TTL必须大于等于默认TTL');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 获取Redis连接URL
 */
export function getRedisConnectionUrl(config: RedisConnectionConfig): string {
  const auth = config.password ? `:${config.password}@` : '';
  const username = config.username ? `${config.username}:` : '';
  return `redis://${username}${auth}${config.host}:${config.port}/${config.db}`;
}
