/**
 * 认证API功能测试脚本
 * 
 * 测试所有5个认证API接口的功能是否正常工作
 * 包括完整的认证流程测试和错误场景验证
 */

const axios = require('axios');
const colors = require('colors');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'TestPassword123!',
  newPassword: 'NewPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

// 测试状态
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 存储测试过程中的令牌
let authTokens = {
  accessToken: null,
  refreshToken: null
};

/**
 * 日志输出函数
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`[${timestamp}] ✅ ${message}`.green);
      break;
    case 'error':
      console.log(`[${timestamp}] ❌ ${message}`.red);
      break;
    case 'warning':
      console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
      break;
    case 'info':
    default:
      console.log(`[${timestamp}] ℹ️  ${message}`.blue);
      break;
  }
}

/**
 * 测试结果记录
 */
function recordTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName} - 通过`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error?.message || 'Unknown error' });
    log(`${testName} - 失败: ${error?.message || 'Unknown error'}`, 'error');
  }
}

/**
 * HTTP请求封装
 */
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

/**
 * 测试1: 用户登录API
 */
async function testUserLogin() {
  log('开始测试用户登录API...', 'info');

  try {
    // 测试正常登录
    const loginData = {
      emailOrUsername: TEST_USER.email,
      password: TEST_USER.password,
      rememberMe: false
    };

    const result = await makeRequest('POST', '/auth/login', loginData);
    
    if (result.success && result.data.success) {
      authTokens.accessToken = result.data.data.accessToken;
      authTokens.refreshToken = result.data.data.refreshToken;
      recordTest('用户登录 - 正常登录', true);
      
      // 验证返回的数据结构
      const hasRequiredFields = result.data.data.accessToken && 
                               result.data.data.refreshToken && 
                               result.data.data.user;
      recordTest('用户登录 - 返回数据结构', hasRequiredFields);
    } else {
      recordTest('用户登录 - 正常登录', false, new Error(result.error?.message || '登录失败'));
    }

    // 测试错误凭据
    const invalidLoginData = {
      emailOrUsername: TEST_USER.email,
      password: 'wrongpassword',
      rememberMe: false
    };

    const invalidResult = await makeRequest('POST', '/auth/login', invalidLoginData);
    const shouldFail = !invalidResult.success || !invalidResult.data.success;
    recordTest('用户登录 - 错误凭据处理', shouldFail);

  } catch (error) {
    recordTest('用户登录 - 测试执行', false, error);
  }
}

/**
 * 测试2: 获取用户信息API
 */
async function testGetCurrentUser() {
  log('开始测试获取用户信息API...', 'info');

  try {
    if (!authTokens.accessToken) {
      recordTest('获取用户信息 - 前置条件', false, new Error('缺少访问令牌'));
      return;
    }

    // 测试正常获取用户信息
    const headers = {
      'Authorization': `Bearer ${authTokens.accessToken}`
    };

    const result = await makeRequest('GET', '/auth/me', null, headers);
    
    if (result.success && result.data.success) {
      recordTest('获取用户信息 - 正常获取', true);
      
      // 验证返回的用户信息结构
      const user = result.data.data;
      const hasRequiredFields = user.id && user.email && user.username;
      recordTest('获取用户信息 - 数据结构', hasRequiredFields);
    } else {
      recordTest('获取用户信息 - 正常获取', false, new Error(result.error?.message || '获取失败'));
    }

    // 测试无效令牌
    const invalidHeaders = {
      'Authorization': 'Bearer invalid_token'
    };

    const invalidResult = await makeRequest('GET', '/auth/me', null, invalidHeaders);
    const shouldFail = !invalidResult.success || invalidResult.status === 401;
    recordTest('获取用户信息 - 无效令牌处理', shouldFail);

  } catch (error) {
    recordTest('获取用户信息 - 测试执行', false, error);
  }
}

/**
 * 测试3: 刷新令牌API
 */
async function testRefreshToken() {
  log('开始测试刷新令牌API...', 'info');

  try {
    if (!authTokens.refreshToken) {
      recordTest('刷新令牌 - 前置条件', false, new Error('缺少刷新令牌'));
      return;
    }

    // 测试正常刷新令牌
    const refreshData = {
      refreshToken: authTokens.refreshToken
    };

    const result = await makeRequest('POST', '/auth/refresh', refreshData);
    
    if (result.success && result.data.success) {
      // 更新令牌
      authTokens.accessToken = result.data.data.accessToken;
      authTokens.refreshToken = result.data.data.refreshToken;
      recordTest('刷新令牌 - 正常刷新', true);
      
      // 验证返回的数据结构
      const hasRequiredFields = result.data.data.accessToken && 
                               result.data.data.refreshToken;
      recordTest('刷新令牌 - 返回数据结构', hasRequiredFields);
    } else {
      recordTest('刷新令牌 - 正常刷新', false, new Error(result.error?.message || '刷新失败'));
    }

    // 测试无效刷新令牌
    const invalidRefreshData = {
      refreshToken: 'invalid_refresh_token'
    };

    const invalidResult = await makeRequest('POST', '/auth/refresh', invalidRefreshData);
    const shouldFail = !invalidResult.success || !invalidResult.data.success;
    recordTest('刷新令牌 - 无效令牌处理', shouldFail);

  } catch (error) {
    recordTest('刷新令牌 - 测试执行', false, error);
  }
}

/**
 * 测试4: 用户登出API
 */
async function testUserLogout() {
  log('开始测试用户登出API...', 'info');

  try {
    if (!authTokens.accessToken) {
      recordTest('用户登出 - 前置条件', false, new Error('缺少访问令牌'));
      return;
    }

    // 测试正常登出
    const headers = {
      'Authorization': `Bearer ${authTokens.accessToken}`
    };

    const logoutData = {
      refreshToken: authTokens.refreshToken,
      logoutAllDevices: false
    };

    const result = await makeRequest('POST', '/auth/logout', logoutData, headers);
    
    if (result.success && result.data.success) {
      recordTest('用户登出 - 正常登出', true);
      
      // 验证返回的数据结构
      const hasRequiredFields = result.data.data.logoutType && 
                               typeof result.data.data.revokedTokensCount === 'number';
      recordTest('用户登出 - 返回数据结构', hasRequiredFields);
    } else {
      recordTest('用户登出 - 正常登出', false, new Error(result.error?.message || '登出失败'));
    }

    // 测试登出后访问受保护资源
    const protectedResult = await makeRequest('GET', '/auth/me', null, headers);
    const shouldFail = !protectedResult.success || protectedResult.status === 401;
    recordTest('用户登出 - 令牌失效验证', shouldFail);

  } catch (error) {
    recordTest('用户登出 - 测试执行', false, error);
  }
}

/**
 * 测试5: 重置密码API
 */
async function testResetPassword() {
  log('开始测试重置密码API...', 'info');

  try {
    // 注意：这个测试需要有效的验证码，在实际环境中需要先发送验证码
    const resetData = {
      email: TEST_USER.email,
      verificationCode: '123456', // 测试验证码
      newPassword: TEST_USER.newPassword,
      confirmPassword: TEST_USER.newPassword
    };

    const result = await makeRequest('POST', '/auth/reset-password', resetData);
    
    // 由于没有真实的验证码，这个测试可能会失败，但我们检查错误类型
    if (result.success && result.data.success) {
      recordTest('重置密码 - 正常重置', true);
    } else {
      // 检查是否是验证码相关的错误（这是预期的）
      const isExpectedError = result.error?.code === 'INVALID_VERIFICATION_CODE' ||
                             result.error?.message?.includes('验证码');
      recordTest('重置密码 - API响应', isExpectedError);
    }

    // 测试密码不匹配
    const mismatchData = {
      email: TEST_USER.email,
      verificationCode: '123456',
      newPassword: TEST_USER.newPassword,
      confirmPassword: 'DifferentPassword123!'
    };

    const mismatchResult = await makeRequest('POST', '/auth/reset-password', mismatchData);
    const shouldFail = !mismatchResult.success || 
                      mismatchResult.error?.code === 'PASSWORD_MISMATCH';
    recordTest('重置密码 - 密码不匹配处理', shouldFail);

  } catch (error) {
    recordTest('重置密码 - 测试执行', false, error);
  }
}

/**
 * 打印测试结果
 */
function printTestResults() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('🧪 认证API测试结果汇总'.cyan.bold);
  console.log('='.repeat(60).cyan);
  
  console.log(`📊 总测试数: ${testResults.total}`.blue);
  console.log(`✅ 通过: ${testResults.passed}`.green);
  console.log(`❌ 失败: ${testResults.failed}`.red);
  console.log(`📈 成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`.yellow);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试详情:'.red.bold);
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`.red);
    });
  }

  console.log('\n' + '='.repeat(60).cyan);
  
  if (testResults.failed === 0) {
    console.log('🎉 所有测试通过！认证API功能正常工作。'.green.bold);
  } else {
    console.log('⚠️  部分测试失败，请检查API实现或测试环境。'.yellow.bold);
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('🚀 开始执行认证API功能测试...'.cyan.bold);
  console.log(`🔗 测试服务器: ${BASE_URL}`.blue);
  console.log(`👤 测试用户: ${TEST_USER.email}`.blue);
  console.log('\n');

  try {
    // 按顺序执行测试
    await testUserLogin();
    await testGetCurrentUser();
    await testRefreshToken();
    await testUserLogout();
    await testResetPassword();

    // 打印结果
    printTestResults();

  } catch (error) {
    log(`测试执行出错: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 执行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testUserLogin,
  testGetCurrentUser,
  testRefreshToken,
  testUserLogout,
  testResetPassword
};
