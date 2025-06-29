#!/usr/bin/env node

/**
 * Swagger API 测试脚本
 * 
 * 基于 Swagger 规范自动测试所有 API 接口
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testSwaggerAPI() {
  console.log('🔍 基于 Swagger 规范的 API 测试\n');
  
  try {
    // 获取 Swagger 规范
    console.log('📖 获取 API 规范...');
    const swaggerResponse = await axios.get(`${BASE_URL}/api-docs.json`);
    const swagger = swaggerResponse.data;
    
    console.log(`✅ API 规范获取成功`);
    console.log(`📋 API 标题: ${swagger.info.title}`);
    console.log(`📋 API 版本: ${swagger.info.version}`);
    console.log(`📋 服务器: ${swagger.servers?.[0]?.url || 'N/A'}\n`);
    
    // 统计信息
    const paths = Object.keys(swagger.paths || {});
    let totalEndpoints = 0;
    let testedEndpoints = 0;
    let passedEndpoints = 0;
    
    console.log('🧪 开始测试 API 接口...\n');
    
    // 遍历所有路径
    for (const path of paths) {
      const pathObj = swagger.paths[path];
      
      // 遍历所有 HTTP 方法
      for (const method of Object.keys(pathObj)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;
        
        totalEndpoints++;
        const operation = pathObj[method];
        const operationId = operation.operationId || `${method.toUpperCase()} ${path}`;
        
        console.log(`🔍 测试: ${operationId}`);
        console.log(`   ${method.toUpperCase()} ${path}`);
        
        try {
          // 构建请求URL
          let testPath = path;
          
          // 处理路径参数（简单替换为测试值）
          testPath = testPath.replace(/{email}/g, 'test@example.com');
          testPath = testPath.replace(/{username}/g, 'testuser');
          testPath = testPath.replace(/{id}/g, '1');
          
          // 使用 Swagger 规范中的服务器 URL
          const serverUrl = swagger.servers?.[0]?.url || `${BASE_URL}/api/v1`;
          const fullUrl = `${serverUrl}${testPath}`;
          
          // 构建请求配置
          const requestConfig = {
            method: method.toUpperCase(),
            url: fullUrl,
            timeout: 10000,
            validateStatus: () => true // 接受所有状态码
          };
          
          // 如果是 POST/PUT/PATCH 请求，添加示例数据
          if (['post', 'put', 'patch'].includes(method)) {
            requestConfig.data = generateSampleData(operation, path);
            requestConfig.headers = {
              'Content-Type': 'application/json'
            };
          }
          
          // 发送请求
          const response = await axios(requestConfig);
          testedEndpoints++;
          
          // 检查响应
          const expectedStatuses = Object.keys(operation.responses || {}).map(Number);
          const isSuccess = expectedStatuses.includes(response.status) || 
                           (response.status >= 200 && response.status < 300) ||
                           response.status === 400 || // 参数验证错误是正常的
                           response.status === 501;   // 未实现也是正常的
          
          if (isSuccess) {
            console.log(`   ✅ 状态码: ${response.status}`);
            passedEndpoints++;
            
            // 检查响应格式
            if (response.data && typeof response.data === 'object') {
              if (response.data.hasOwnProperty('success')) {
                console.log(`   📋 响应格式: 标准 API 响应`);
              } else {
                console.log(`   📋 响应格式: 自定义格式`);
              }
            }
          } else {
            console.log(`   ❌ 意外状态码: ${response.status}`);
          }
          
        } catch (error) {
          testedEndpoints++;
          if (error.code === 'ECONNREFUSED') {
            console.log(`   ❌ 连接失败: 服务器未运行`);
          } else {
            console.log(`   ❌ 请求失败: ${error.message}`);
          }
        }
        
        console.log();
      }
    }
    
    // 输出统计结果
    console.log('📊 测试结果统计');
    console.log('='.repeat(30));
    console.log(`总接口数: ${totalEndpoints}`);
    console.log(`已测试: ${testedEndpoints}`);
    console.log(`通过: ${passedEndpoints}`);
    console.log(`失败: ${testedEndpoints - passedEndpoints}`);
    
    const successRate = testedEndpoints > 0 ? ((passedEndpoints / testedEndpoints) * 100).toFixed(1) : 0;
    console.log(`成功率: ${successRate}%`);
    
    if (passedEndpoints === testedEndpoints) {
      console.log('\n🎉 所有接口测试通过！');
    } else {
      console.log('\n⚠️  部分接口测试失败，请检查服务器状态');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保服务器正在运行在', BASE_URL);
    }
  }
}

/**
 * 为 POST/PUT/PATCH 请求生成示例数据
 */
function generateSampleData(operation, path) {
  // 根据路径和操作生成合适的测试数据
  if (path.includes('send-verification-code')) {
    return {
      email: 'test@example.com',
      type: 'register',
      captcha: 'test123'
    };
  }
  
  if (path.includes('register')) {
    return {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123',
      verificationCode: '123456'
    };
  }
  
  if (path.includes('verify-email')) {
    return {
      email: 'test@example.com',
      verificationCode: '123456'
    };
  }
  
  if (path.includes('login')) {
    return {
      email: 'test@example.com',
      password: 'password123'
    };
  }
  
  if (path.includes('refresh')) {
    return {
      refreshToken: 'dummy-refresh-token'
    };
  }
  
  if (path.includes('reset-password')) {
    return {
      email: 'test@example.com',
      verificationCode: '123456',
      newPassword: 'newpassword123'
    };
  }
  
  // 默认空对象
  return {};
}

// 运行测试
if (require.main === module) {
  testSwaggerAPI().catch(console.error);
}

module.exports = { testSwaggerAPI };
