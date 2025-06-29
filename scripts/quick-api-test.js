/**
 * 快速API测试脚本
 * 
 * 简化版的API测试，用于快速验证5个认证API接口是否返回正确的响应
 * 主要检查API是否不再返回"功能尚未实现"错误
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';

/**
 * 简单的HTTP请求函数
 */
async function testEndpoint(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      implemented: !response.data.message?.includes('功能尚未实现') && 
                   response.data.code !== 'NOT_IMPLEMENTED'
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message,
      implemented: error.response?.data?.code !== 'NOT_IMPLEMENTED'
    };
  }
}

/**
 * 测试所有API端点
 */
async function quickTestAllAPIs() {
  console.log('🚀 开始快速API测试...\n');

  const tests = [
    {
      name: 'POST /auth/login - 用户登录',
      method: 'POST',
      endpoint: '/auth/login',
      data: {
        emailOrUsername: 'test@example.com',
        password: 'TestPassword123!'
      }
    },
    {
      name: 'POST /auth/refresh - 刷新令牌',
      method: 'POST',
      endpoint: '/auth/refresh',
      data: {
        refreshToken: 'dummy_refresh_token'
      }
    },
    {
      name: 'GET /auth/me - 获取用户信息',
      method: 'GET',
      endpoint: '/auth/me',
      headers: {
        'Authorization': 'Bearer dummy_access_token'
      }
    },
    {
      name: 'POST /auth/logout - 用户登出',
      method: 'POST',
      endpoint: '/auth/logout',
      data: {
        refreshToken: 'dummy_refresh_token'
      },
      headers: {
        'Authorization': 'Bearer dummy_access_token'
      }
    },
    {
      name: 'POST /auth/reset-password - 重置密码',
      method: 'POST',
      endpoint: '/auth/reset-password',
      data: {
        email: 'test@example.com',
        verificationCode: '123456',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }
    }
  ];

  let implementedCount = 0;
  let totalCount = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 测试: ${test.name}`);
      
      const result = await testEndpoint(
        test.method,
        test.endpoint,
        test.data,
        test.headers
      );

      if (result.implemented) {
        console.log(`   ✅ 已实现 (状态码: ${result.status})`);
        implementedCount++;
        
        // 显示响应的关键信息
        if (result.success && result.data) {
          if (result.data.success === false && result.data.message) {
            console.log(`   📝 响应: ${result.data.message}`);
          } else if (result.data.success === true) {
            console.log(`   📝 响应: 成功`);
          }
        } else if (result.error && result.error.message) {
          console.log(`   📝 响应: ${result.error.message}`);
        }
      } else {
        console.log(`   ❌ 未实现 (返回: ${result.data?.code || result.error?.code})`);
      }
      
    } catch (error) {
      console.log(`   ⚠️  测试出错: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }

  // 打印总结
  console.log('='.repeat(50));
  console.log('📊 测试结果总结:');
  console.log(`   总API数量: ${totalCount}`);
  console.log(`   已实现: ${implementedCount}`);
  console.log(`   未实现: ${totalCount - implementedCount}`);
  console.log(`   实现率: ${((implementedCount / totalCount) * 100).toFixed(1)}%`);
  
  if (implementedCount === totalCount) {
    console.log('\n🎉 所有API都已实现！');
  } else {
    console.log(`\n⚠️  还有 ${totalCount - implementedCount} 个API未实现`);
  }
  
  console.log('='.repeat(50));
}

/**
 * 检查服务器是否运行
 */
async function checkServerStatus() {
  try {
    console.log('🔍 检查服务器状态...');
    const response = await axios.get(`${BASE_URL}/auth/health`, { timeout: 3000 });
    console.log('✅ 服务器运行正常\n');
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行或无法访问');
    console.log(`   错误: ${error.message}`);
    console.log(`   请确保服务器在 ${BASE_URL} 上运行\n`);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🧪 认证API快速测试工具');
  console.log(`🔗 目标服务器: ${BASE_URL}`);
  console.log('='.repeat(50));

  // 检查服务器状态
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('💡 启动服务器的命令:');
    console.log('   cd amtools-backend');
    console.log('   npm run dev');
    process.exit(1);
  }

  // 执行API测试
  await quickTestAllAPIs();
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    console.error('测试执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = { quickTestAllAPIs, checkServerStatus };
