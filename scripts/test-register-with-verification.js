const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/auth';

async function testRegisterWithAutoVerification() {
  console.log('🧪 测试注册后自动验证邮箱功能...\n');
  
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testUsername = `testuser${timestamp}`;
  const testPassword = 'TestPassword123!';
  
  try {
    // 1. 发送验证码
    console.log('📧 1. 发送验证码...');
    const codeResponse = await axios.post(`${BASE_URL}/send-verification-code`, {
      email: testEmail,
      type: 'register'
    });
    
    console.log('✅ 验证码发送成功');
    console.log('📋 验证码:', codeResponse.data.data.verificationCode);
    
    const verificationCode = codeResponse.data.data.verificationCode;
    
    // 2. 注册用户
    console.log('\n👤 2. 注册用户...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, {
      email: testEmail,
      username: testUsername,
      password: testPassword,
      confirmPassword: testPassword,
      verificationCode: verificationCode,
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('✅ 用户注册成功');
    console.log('📋 注册响应:', JSON.stringify(registerResponse.data, null, 2));
    
    // 3. 立即尝试登录
    console.log('\n🔐 3. 尝试登录...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      emailOrUsername: testUsername,
      password: testPassword,
      rememberMe: false
    });
    
    if (loginResponse.data.success) {
      console.log('🎉 登录成功！邮箱自动验证功能正常工作！');
      console.log('📋 登录响应:', JSON.stringify(loginResponse.data, null, 2));
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
      console.log('📋 错误详情:', JSON.stringify(loginResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:');
    if (error.response) {
      console.error('📋 响应状态:', error.response.status);
      console.error('📋 响应数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('📋 错误信息:', error.message);
    }
  }
}

// 运行测试
testRegisterWithAutoVerification();
