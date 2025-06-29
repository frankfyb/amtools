#!/usr/bin/env node

/**
 * API 接口可用性测试脚本
 * 
 * 用于测试 AMTools Backend API 的所有接口是否正常工作
 * 
 * 使用方法:
 * node scripts/test-api.js
 * 
 * 或者通过 npm script:
 * npm run test:api
 */

const axios = require('axios');
const colors = require('colors');

// 配置
const CONFIG = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:3002',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  timeout: 10000,
  retries: 3
};

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// 创建 axios 实例
const api = axios.create({
  baseURL: CONFIG.baseURL + CONFIG.apiPrefix,
  timeout: CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'AMTools-API-Tester/1.0.0'
  }
});

/**
 * 日志工具
 */
const logger = {
  info: (msg) => console.log('ℹ️ '.blue + msg),
  success: (msg) => console.log('✅ '.green + msg.green),
  error: (msg) => console.log('❌ '.red + msg.red),
  warn: (msg) => console.log('⚠️ '.yellow + msg.yellow),
  debug: (msg) => console.log('🔍 '.gray + msg.gray)
};

/**
 * 测试用例定义
 */
const testCases = [
  // 健康检查接口
  {
    name: '健康检查',
    method: 'GET',
    url: '/auth/health',
    expectedStatus: 200,
    description: '检查服务器是否正常运行'
  },

  // 可用性检查接口
  {
    name: '邮箱可用性检查',
    method: 'GET',
    url: '/auth/availability/email/test@example.com',
    expectedStatus: 200,
    description: '检查邮箱可用性接口'
  },
  {
    name: '用户名可用性检查',
    method: 'GET',
    url: '/auth/availability/username/testuser',
    expectedStatus: 200,
    description: '检查用户名可用性接口'
  },
  {
    name: '批量可用性检查',
    method: 'GET',
    url: '/auth/availability/batch',
    expectedStatus: 200,
    description: '批量检查可用性接口'
  },
  {
    name: '可用性统计信息',
    method: 'GET',
    url: '/auth/availability/stats',
    expectedStatus: 200,
    description: '获取可用性统计信息'
  },

  // 认证相关接口（需要请求体的接口）
  {
    name: '发送验证码',
    method: 'POST',
    url: '/auth/send-verification-code',
    data: {
      email: 'test@example.com',
      type: 'register',
      captcha: 'test123'
    },
    expectedStatus: [200, 400], // 可能返回400（参数验证失败）
    description: '发送邮箱验证码接口'
  },
  {
    name: '用户注册',
    method: 'POST',
    url: '/auth/register',
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123',
      verificationCode: '123456'
    },
    expectedStatus: [200, 400, 422],
    description: '用户注册接口'
  },
  {
    name: '邮箱验证',
    method: 'POST',
    url: '/auth/verify-email',
    data: {
      email: 'test@example.com',
      verificationCode: '123456'
    },
    expectedStatus: [200, 400, 422],
    description: '邮箱验证接口'
  },
  {
    name: '用户登录',
    method: 'POST',
    url: '/auth/login',
    data: {
      email: 'test@example.com',
      password: 'password123'
    },
    expectedStatus: [200, 400, 401, 501], // 501表示未实现
    description: '用户登录接口'
  },
  {
    name: '刷新令牌',
    method: 'POST',
    url: '/auth/refresh',
    data: {
      refreshToken: 'dummy-refresh-token'
    },
    expectedStatus: [200, 400, 401, 501],
    description: '刷新访问令牌接口'
  },
  {
    name: '重置密码',
    method: 'POST',
    url: '/auth/reset-password',
    data: {
      email: 'test@example.com',
      verificationCode: '123456',
      newPassword: 'newpassword123'
    },
    expectedStatus: [200, 400, 422, 501],
    description: '重置密码接口'
  }
];

/**
 * 执行单个测试用例
 */
async function runTestCase(testCase) {
  stats.total++;
  
  try {
    logger.info(`测试: ${testCase.name}`);
    logger.debug(`${testCase.method} ${testCase.url}`);
    
    const config = {
      method: testCase.method.toLowerCase(),
      url: testCase.url
    };
    
    if (testCase.data) {
      config.data = testCase.data;
      logger.debug(`请求数据: ${JSON.stringify(testCase.data, null, 2)}`);
    }
    
    const response = await api(config);
    
    // 检查状态码
    const expectedStatuses = Array.isArray(testCase.expectedStatus) 
      ? testCase.expectedStatus 
      : [testCase.expectedStatus];
    
    if (expectedStatuses.includes(response.status)) {
      logger.success(`${testCase.name} - 状态码: ${response.status}`);
      
      // 检查响应格式
      if (response.data) {
        if (typeof response.data === 'object' && response.data.hasOwnProperty('success')) {
          logger.debug(`响应格式正确: ${JSON.stringify(response.data, null, 2)}`);
        } else {
          logger.warn(`响应格式可能不标准`);
        }
      }
      
      stats.passed++;
      return true;
    } else {
      logger.error(`${testCase.name} - 意外的状态码: ${response.status}, 期望: ${expectedStatuses.join(' 或 ')}`);
      stats.failed++;
      return false;
    }
    
  } catch (error) {
    if (error.response) {
      // 服务器响应了错误状态码
      const expectedStatuses = Array.isArray(testCase.expectedStatus) 
        ? testCase.expectedStatus 
        : [testCase.expectedStatus];
      
      if (expectedStatuses.includes(error.response.status)) {
        logger.success(`${testCase.name} - 状态码: ${error.response.status} (预期错误)`);
        stats.passed++;
        return true;
      } else {
        logger.error(`${testCase.name} - 错误状态码: ${error.response.status}`);
        logger.debug(`错误响应: ${JSON.stringify(error.response.data, null, 2)}`);
        stats.failed++;
        return false;
      }
    } else if (error.request) {
      // 请求发送失败
      logger.error(`${testCase.name} - 网络错误: 无法连接到服务器`);
      stats.failed++;
      return false;
    } else {
      // 其他错误
      logger.error(`${testCase.name} - 未知错误: ${error.message}`);
      stats.failed++;
      return false;
    }
  }
}

/**
 * 测试 Swagger 文档可用性
 */
async function testSwaggerDocs() {
  logger.info('测试 Swagger 文档可用性');
  
  try {
    // 测试 Swagger UI
    const swaggerUIResponse = await axios.get(`${CONFIG.baseURL}/api-docs`);
    if (swaggerUIResponse.status === 200) {
      logger.success('Swagger UI 可访问');
    }
    
    // 测试 API 规范 JSON
    const swaggerJSONResponse = await axios.get(`${CONFIG.baseURL}/api-docs.json`);
    if (swaggerJSONResponse.status === 200 && swaggerJSONResponse.data.openapi) {
      logger.success('Swagger API 规范 JSON 可访问');
      logger.debug(`API 版本: ${swaggerJSONResponse.data.info.version}`);
      logger.debug(`API 标题: ${swaggerJSONResponse.data.info.title}`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Swagger 文档测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 AMTools Backend API 接口可用性测试'.cyan.bold);
  console.log('='.repeat(50).gray);
  
  logger.info(`测试目标: ${CONFIG.baseURL}${CONFIG.apiPrefix}`);
  logger.info(`超时时间: ${CONFIG.timeout}ms`);
  console.log();
  
  // 测试 Swagger 文档
  await testSwaggerDocs();
  console.log();
  
  // 运行所有测试用例
  logger.info('开始运行 API 接口测试...');
  console.log();
  
  for (const testCase of testCases) {
    await runTestCase(testCase);
    console.log(); // 添加空行分隔
  }
  
  // 输出测试结果统计
  console.log('📊 测试结果统计'.cyan.bold);
  console.log('='.repeat(30).gray);
  console.log(`总计: ${stats.total}`.white);
  console.log(`通过: ${stats.passed}`.green);
  console.log(`失败: ${stats.failed}`.red);
  console.log(`跳过: ${stats.skipped}`.yellow);
  
  const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
  console.log(`成功率: ${successRate}%`.cyan);
  
  if (stats.failed === 0) {
    console.log('\n🎉 所有测试通过！'.green.bold);
    process.exit(0);
  } else {
    console.log(`\n⚠️  有 ${stats.failed} 个测试失败`.red.bold);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`未处理的 Promise 拒绝: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    logger.error(`测试运行失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, testCases, CONFIG };
