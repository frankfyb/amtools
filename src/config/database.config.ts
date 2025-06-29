/**
 * 数据库配置
 */

import { DataSourceOptions } from 'typeorm';
import { Injectable } from '../core/di/decorators';

@Injectable()
export class DatabaseConfig {
  private readonly config: DataSourceOptions;

  constructor() {
    this.config = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'amtools',
      password: process.env.DB_PASSWORD || 'amtools123',
      database: process.env.DB_DATABASE || 'amtools_dev',
      synchronize: false, // 禁用自动同步，避免并发问题
      logging: process.env.DB_LOGGING === 'true',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities: [
        __dirname + '/../infrastructure/database/models/*.model{.ts,.js}'
      ],
      migrations: [
        __dirname + '/../infrastructure/database/migrations/*{.ts,.js}'
      ],
      subscribers: [
        __dirname + '/../infrastructure/database/subscribers/*{.ts,.js}'
      ],
      migrationsTableName: 'migrations',
      migrationsRun: false,
      dropSchema: false,
      cache: false, // 暂时禁用Redis缓存
      extra: {
        // 连接池配置
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000,
        // PostgreSQL 特定配置
        ssl: process.env.DB_SSL === 'true',
        application_name: 'amtools-backend'
      }
    };
  }

  getConfig(): DataSourceOptions {
    return this.config;
  }

  getTestConfig(): DataSourceOptions {
    return {
      ...this.config,
      database: process.env.DB_TEST_DATABASE || 'amtools_test',
      synchronize: true,
      logging: false,
      dropSchema: true,
      cache: false
    };
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }
}
