#!/usr/bin/env node

/**
 * 快速 API 可用性测试脚本
 * 
 * 快速检查关键 API 接口是否可用
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// 简单的日志函数
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`)
};

// 快速测试用例
const quickTests = [
  {
    name: '服务器健康检查',
    url: `${BASE_URL}${API_PREFIX}/auth/health`,
    method: 'GET'
  },
  {
    name: 'Swagger 文档',
    url: `${BASE_URL}/api-docs.json`,
    method: 'GET'
  },
  {
    name: '邮箱可用性检查',
    url: `${BASE_URL}${API_PREFIX}/auth/availability/email/test@example.com`,
    method: 'GET'
  },
  {
    name: '用户名可用性检查',
    url: `${BASE_URL}${API_PREFIX}/auth/availability/username/testuser`,
    method: 'GET'
  }
];

async function quickTest() {
  console.log('🚀 快速 API 可用性测试\n');
  
  let passed = 0;
  let total = quickTests.length;
  
  for (const test of quickTests) {
    try {
      log.info(`测试: ${test.name}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000
      });
      
      if (response.status >= 200 && response.status < 300) {
        log.success(`${test.name} - 状态码: ${response.status}`);
        passed++;
      } else {
        log.warn(`${test.name} - 状态码: ${response.status}`);
      }
      
    } catch (error) {
      if (error.response) {
        log.error(`${test.name} - 错误: ${error.response.status}`);
      } else {
        log.error(`${test.name} - 网络错误: ${error.message}`);
      }
    }
    console.log();
  }
  
  console.log(`📊 结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有关键接口正常！');
  } else {
    console.log('⚠️  部分接口可能存在问题');
  }
}

// 运行测试
quickTest().catch(console.error);
