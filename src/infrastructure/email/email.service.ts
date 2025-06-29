/**
 * 邮件服务实现
 */

import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Injectable } from '../../core/di/decorators';
import { VerificationCodeType } from '../../shared/types/auth.types';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

@Injectable()
export class EmailService {
  private transporter!: Transporter;
  private config: EmailConfig;

  constructor() {
    // 确保发件人邮箱与SMTP认证用户一致
    const smtpUser = process.env.SMTP_USER || '';
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || smtpUser;

    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: process.env.SMTP_PASS || ''
      },
      from: emailFrom, // 使用与SMTP用户相同的邮箱地址
      fromName: process.env.EMAIL_FROM_NAME || 'AMTools'
    };

    console.log('📧 邮件服务配置:');
    console.log(`  SMTP服务器: ${this.config.host}:${this.config.port}`);
    console.log(`  安全连接: ${this.config.secure}`);
    console.log(`  认证用户: ${this.config.auth.user}`);
    console.log(`  发件人: ${this.config.fromName} <${this.config.from}>`);

    this.initializeTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  private initializeTransporter(): void {
    const transportConfig: any = {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // 每秒最多发送10封邮件
      // 添加TLS配置
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
      },
      // 添加连接超时配置
      connectionTimeout: parseInt(process.env.EMAIL_TIMEOUT || '30000'),
      greetingTimeout: 30000,
      socketTimeout: 30000
    };

    // 如果是QQ邮箱，添加特殊配置
    if (this.config.host.includes('qq.com')) {
      transportConfig.tls.servername = this.config.host;
      transportConfig.requireTLS = true;
    }

    this.transporter = nodemailer.createTransport(transportConfig);

    // 验证配置
    this.transporter.verify((error, _success) => {
      if (error) {
        console.error('❌ 邮件配置错误:', error);
      } else {
        console.log('✅ 邮件服务器连接成功，准备发送邮件');
      }
    });
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationEmail(
    email: string, 
    code: string, 
    type: VerificationCodeType
  ): Promise<void> {
    const template = this.getVerificationTemplate(type, code);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const template = this.getWelcomeTemplate(username);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const template = this.getPasswordResetTemplate(resetToken);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * 发送账户锁定通知邮件
   */
  async sendAccountLockedEmail(email: string, unlockTime: Date): Promise<void> {
    const template = this.getAccountLockedTemplate(unlockTime);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * 发送通用邮件
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
  }): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.config.fromName} <${this.config.from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      console.log('📧 准备发送邮件:');
      console.log(`  收件人: ${options.to}`);
      console.log(`  主题: ${options.subject}`);
      console.log(`  发件人: ${this.config.fromName} <${this.config.from}>`);

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ 邮件发送成功:', result.messageId);
      console.log(`  响应: ${result.response}`);
    } catch (error: any) {
      console.error('❌ 邮件发送失败:', error);
      console.error('  错误详情:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      throw new EmailSendError(`邮件发送失败: ${error.message}`);
    }
  }

  /**
   * 批量发送邮件
   */
  async sendBulkEmails(emails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }>): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          email: email.to,
          error: error?.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * 获取验证码邮件模板
   */
  private getVerificationTemplate(type: VerificationCodeType, code: string): {
    subject: string;
    html: string;
    text: string;
  } {
    const typeMap = {
      // 字符串类型映射（兼容API调用）
      'register': {
        subject: '验证您的邮箱地址 - AMTools',
        action: '注册账户'
      },
      'email_verification': {
        subject: '验证您的邮箱地址 - AMTools',
        action: '验证邮箱'
      },
      'password_reset': {
        subject: '重置您的密码 - AMTools',
        action: '重置密码'
      },
      'login_verification': {
        subject: '登录验证码 - AMTools',
        action: '登录验证'
      },
      'phone_verification': {
        subject: '验证您的手机号码 - AMTools',
        action: '验证手机'
      },
      // 枚举值映射
      [VerificationCodeType.EMAIL_VERIFICATION]: {
        subject: '验证您的邮箱地址 - AMTools',
        action: '验证邮箱'
      },
      [VerificationCodeType.PASSWORD_RESET]: {
        subject: '重置您的密码 - AMTools',
        action: '重置密码'
      },
      [VerificationCodeType.LOGIN_VERIFICATION]: {
        subject: '登录验证码 - AMTools',
        action: '登录验证'
      },
      [VerificationCodeType.PHONE_VERIFICATION]: {
        subject: '验证您的手机号码 - AMTools',
        action: '验证手机'
      }
    };

    const config = typeMap[type] || {
      subject: 'AMTools 验证码',
      action: '验证操作'
    };

    console.log(`📧 邮件模板配置 - 类型: ${type}, 配置:`, config);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${config.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .code-box { 
            background: #f8f9fa; 
            border: 2px dashed #007bff; 
            padding: 20px; 
            text-align: center; 
            margin: 20px 0; 
            border-radius: 8px;
          }
          .code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #007bff; 
            letter-spacing: 5px;
            font-family: 'Courier New', monospace;
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            font-size: 14px; 
            color: #666; 
          }
          .warning { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AMTools</h1>
            <h2>${config.subject}</h2>
          </div>
          
          <p>您好，</p>
          <p>您正在进行${config.action}操作，请使用以下验证码：</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <p><strong>重要提醒：</strong></p>
          <ul>
            <li>验证码有效期为 <span class="warning">10分钟</span></li>
            <li>请勿将验证码告诉他人</li>
            <li>如果这不是您的操作，请忽略此邮件</li>
          </ul>
          
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>如有疑问，请联系客服：support@amtools.com</p>
            <p>&copy; 2024 AMTools. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      AMTools - ${config.subject}
      
      您好，
      
      您正在进行${config.action}操作，请使用以下验证码：
      
      验证码：${code}
      
      重要提醒：
      - 验证码有效期为10分钟
      - 请勿将验证码告诉他人
      - 如果这不是您的操作，请忽略此邮件
      
      此邮件由系统自动发送，请勿回复。
      如有疑问，请联系客服：support@amtools.com
      
      © 2024 AMTools. All rights reserved.
    `;

    return { subject: config.subject, html, text };
  }

  /**
   * 获取欢迎邮件模板
   */
  private getWelcomeTemplate(username: string): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = '欢迎加入 AMTools！';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .welcome-box { 
            background: linear-gradient(135deg, #007bff, #0056b3); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .features { margin: 20px 0; }
          .feature { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
          .cta { 
            text-align: center; 
            margin: 30px 0; 
          }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            font-weight: bold;
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            font-size: 14px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AMTools</h1>
          </div>
          
          <div class="welcome-box">
            <h2>欢迎加入 AMTools，${username}！</h2>
            <p>感谢您注册我们的多工具平台</p>
          </div>
          
          <p>您现在可以使用以下功能：</p>
          
          <div class="features">
            <div class="feature">🔐 <strong>密码生成器</strong> - 生成安全的随机密码</div>
            <div class="feature">🔒 <strong>文本加密</strong> - 保护您的敏感信息</div>
            <div class="feature">📱 <strong>二维码生成</strong> - 快速生成各种二维码</div>
            <div class="feature">📄 <strong>文件转换</strong> - 多格式文件转换工具</div>
            <div class="feature">🔗 <strong>短链生成</strong> - 创建简洁的短链接</div>
          </div>
          
          <div class="cta">
            <a href="${process.env.FRONTEND_URL || 'https://amtools.com'}" class="button">
              开始使用 AMTools
            </a>
          </div>
          
          <div class="footer">
            <p>如有任何问题，请随时联系我们：support@amtools.com</p>
            <p>&copy; 2024 AMTools. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      欢迎加入 AMTools，${username}！
      
      感谢您注册我们的多工具平台。
      
      您现在可以使用以下功能：
      - 密码生成器 - 生成安全的随机密码
      - 文本加密 - 保护您的敏感信息
      - 二维码生成 - 快速生成各种二维码
      - 文件转换 - 多格式文件转换工具
      - 短链生成 - 创建简洁的短链接
      
      立即访问：${process.env.FRONTEND_URL || 'https://amtools.com'}
      
      如有任何问题，请随时联系我们：support@amtools.com
      
      © 2024 AMTools. All rights reserved.
    `;

    return { subject, html, text };
  }

  /**
   * 获取密码重置邮件模板
   */
  private getPasswordResetTemplate(resetToken: string): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = '重置您的密码';
    const resetUrl = `${process.env.FRONTEND_URL || 'https://amtools.com'}/reset-password?token=${resetToken}`;
    
    // 这里简化实现，实际应该有完整的HTML模板
    const html = `
      <h2>密码重置</h2>
      <p>请点击以下链接重置您的密码：</p>
      <a href="${resetUrl}">重置密码</a>
      <p>链接有效期为30分钟。</p>
    `;

    const text = `
      密码重置
      
      请访问以下链接重置您的密码：
      ${resetUrl}
      
      链接有效期为30分钟。
    `;

    return { subject, html, text };
  }

  /**
   * 获取账户锁定邮件模板
   */
  private getAccountLockedTemplate(unlockTime: Date): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = '账户安全提醒';
    const unlockTimeStr = unlockTime.toLocaleString('zh-CN');
    
    const html = `
      <h2>账户安全提醒</h2>
      <p>由于多次登录失败，您的账户已被临时锁定。</p>
      <p>解锁时间：${unlockTimeStr}</p>
      <p>如果这不是您的操作，请立即联系客服。</p>
    `;

    const text = `
      账户安全提醒
      
      由于多次登录失败，您的账户已被临时锁定。
      解锁时间：${unlockTimeStr}
      
      如果这不是您的操作，请立即联系客服。
    `;

    return { subject, html, text };
  }
}

export class EmailSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailSendError';
  }
}
