/**
 * 邮件发送测试脚本
 * 用于诊断邮件发送问题
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailSending() {
  console.log('🔧 开始邮件发送测试...');
  
  // 邮件配置
  const config = {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };

  console.log('📧 邮件配置:');
  console.log(`  SMTP服务器: ${config.host}:${config.port}`);
  console.log(`  安全连接: ${config.secure}`);
  console.log(`  认证用户: ${config.auth.user}`);
  console.log(`  密码长度: ${config.auth.pass.length}位`);

  try {
    // 创建传输器
    const transporter = nodemailer.createTransport({
      ...config,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    });

    console.log('\n🔍 验证SMTP连接...');
    
    // 验证连接
    const verified = await transporter.verify();
    console.log('✅ SMTP连接验证成功:', verified);

    // 发送测试邮件
    console.log('\n📤 发送测试邮件...');
    
    const testEmail = {
      from: `AMTools测试 <${config.auth.user}>`,
      to: config.auth.user, // 发送给自己
      subject: '🧪 AMTools邮件服务测试 - ' + new Date().toLocaleString(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>邮件测试</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; background: #007bff; color: white; padding: 20px; border-radius: 8px; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .code { 
              font-size: 24px; 
              font-weight: bold; 
              color: #007bff; 
              text-align: center;
              background: white;
              padding: 15px;
              border-radius: 4px;
              border: 2px dashed #007bff;
              margin: 15px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 AMTools 邮件服务测试</h1>
              <p>这是一封测试邮件，用于验证邮件发送功能</p>
            </div>
            
            <div class="content">
              <h3>📋 测试信息</h3>
              <ul>
                <li><strong>发送时间:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>SMTP服务器:</strong> ${config.host}:${config.port}</li>
                <li><strong>发送账户:</strong> ${config.auth.user}</li>
                <li><strong>安全连接:</strong> ${config.secure ? '是' : '否'}</li>
              </ul>
              
              <h3>🎯 测试验证码</h3>
              <div class="code">123456</div>
              
              <h3>✅ 测试结果</h3>
              <p>如果您收到这封邮件，说明AMTools邮件服务配置正确，可以正常发送邮件。</p>
            </div>
            
            <div class="footer">
              <p>此邮件由 AMTools 邮件服务测试脚本自动发送</p>
              <p>© 2024 AMTools. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        AMTools 邮件服务测试
        
        这是一封测试邮件，用于验证邮件发送功能。
        
        测试信息:
        - 发送时间: ${new Date().toLocaleString()}
        - SMTP服务器: ${config.host}:${config.port}
        - 发送账户: ${config.auth.user}
        - 安全连接: ${config.secure ? '是' : '否'}
        
        测试验证码: 123456
        
        如果您收到这封邮件，说明AMTools邮件服务配置正确，可以正常发送邮件。
        
        此邮件由 AMTools 邮件服务测试脚本自动发送
        © 2024 AMTools. All rights reserved.
      `
    };

    const result = await transporter.sendMail(testEmail);
    
    console.log('✅ 测试邮件发送成功!');
    console.log('📧 邮件ID:', result.messageId);
    console.log('📤 服务器响应:', result.response);
    console.log('📬 收件人:', testEmail.to);
    console.log('📝 主题:', testEmail.subject);
    
    console.log('\n🎉 邮件发送测试完成!');
    console.log('📋 请检查您的邮箱 (包括垃圾邮件文件夹)');
    
    // 关闭连接
    transporter.close();
    
  } catch (error) {
    console.error('❌ 邮件发送测试失败:');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    console.error('SMTP命令:', error.command);
    console.error('服务器响应:', error.response);
    console.error('响应代码:', error.responseCode);
    
    // 常见错误解决建议
    if (error.code === 'EAUTH') {
      console.log('\n💡 认证失败解决建议:');
      console.log('1. 检查QQ邮箱是否开启了SMTP服务');
      console.log('2. 确认使用的是授权码而不是QQ密码');
      console.log('3. 检查用户名和授权码是否正确');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 连接失败解决建议:');
      console.log('1. 检查网络连接');
      console.log('2. 确认SMTP服务器地址和端口');
      console.log('3. 检查防火墙设置');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 连接超时解决建议:');
      console.log('1. 检查网络稳定性');
      console.log('2. 尝试增加连接超时时间');
      console.log('3. 检查SMTP服务器状态');
    }
    
    process.exit(1);
  }
}

// 运行测试
testEmailSending().catch(console.error);
