/**
 * 邮件配置
 * 
 * 管理邮件发送相关配置
 */

/**
 * SMTP配置接口
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
    ciphers?: string;
  };
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
  rateDelta?: number;
  rateLimit?: number;
}

/**
 * 邮件模板配置接口
 */
export interface EmailTemplateConfig {
  engine: 'handlebars' | 'ejs' | 'pug';
  directory: string;
  extension: string;
  cache: boolean;
  options: Record<string, any>;
}

/**
 * 邮件队列配置接口
 */
export interface EmailQueueConfig {
  enabled: boolean;
  concurrency: number;
  attempts: number;
  backoff: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete: number;
  removeOnFail: number;
}

/**
 * 邮件发送者配置接口
 */
export interface EmailSenderConfig {
  name: string;
  email: string;
  replyTo?: string;
}

/**
 * 邮件限制配置接口
 */
export interface EmailLimitConfig {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  maxPerUser: number;
  cooldownPeriod: number; // 秒
}

/**
 * 邮件追踪配置接口
 */
export interface EmailTrackingConfig {
  enabled: boolean;
  openTracking: boolean;
  clickTracking: boolean;
  unsubscribeTracking: boolean;
  bounceTracking: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
}

/**
 * 完整邮件配置接口
 */
export interface EmailConfig {
  enabled: boolean;
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'postmark';
  smtp: SmtpConfig;
  apiKey?: string;
  apiSecret?: string;
  region?: string;
  domain?: string;
  sender: EmailSenderConfig;
  templates: EmailTemplateConfig;
  queue: EmailQueueConfig;
  limits: EmailLimitConfig;
  tracking: EmailTrackingConfig;
  security: {
    dkim: {
      enabled: boolean;
      keySelector?: string;
      privateKey?: string;
      domain?: string;
    };
    spf: {
      enabled: boolean;
      record?: string;
    };
    dmarc: {
      enabled: boolean;
      policy?: 'none' | 'quarantine' | 'reject';
      percentage?: number;
    };
  };
  testing: {
    enabled: boolean;
    catchAll?: string;
    logOnly: boolean;
    mockProvider: boolean;
  };
}

/**
 * 获取邮件配置
 */
export function getEmailConfig(): EmailConfig {
  const environment = process.env.NODE_ENV || 'development';

  const baseConfig: EmailConfig = {
    enabled: process.env.EMAIL_ENABLED === 'true',
    provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        ciphers: process.env.SMTP_TLS_CIPHERS
      },
      connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '60000'),
      greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '30000'),
      socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '60000'),
      pool: process.env.SMTP_POOL === 'true',
      maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '5'),
      maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '100'),
      rateDelta: parseInt(process.env.SMTP_RATE_DELTA || '1000'),
      rateLimit: parseInt(process.env.SMTP_RATE_LIMIT || '3')
    },
    apiKey: process.env.EMAIL_API_KEY,
    apiSecret: process.env.EMAIL_API_SECRET,
    region: process.env.EMAIL_REGION || 'us-east-1',
    domain: process.env.EMAIL_DOMAIN,
    sender: {
      name: process.env.EMAIL_SENDER_NAME || 'AMTools',
      email: process.env.EMAIL_SENDER_EMAIL || 'noreply@amtools.dev',
      replyTo: process.env.EMAIL_REPLY_TO
    },
    templates: {
      engine: (process.env.EMAIL_TEMPLATE_ENGINE as any) || 'handlebars',
      directory: process.env.EMAIL_TEMPLATE_DIR || './src/infrastructure/email/templates',
      extension: process.env.EMAIL_TEMPLATE_EXT || '.hbs',
      cache: process.env.EMAIL_TEMPLATE_CACHE !== 'false',
      options: {
        partials: process.env.EMAIL_TEMPLATE_PARTIALS || './src/infrastructure/email/templates/partials',
        helpers: process.env.EMAIL_TEMPLATE_HELPERS || './src/infrastructure/email/templates/helpers'
      }
    },
    queue: {
      enabled: process.env.EMAIL_QUEUE_ENABLED === 'true',
      concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY || '5'),
      attempts: parseInt(process.env.EMAIL_QUEUE_ATTEMPTS || '3'),
      backoff: {
        type: (process.env.EMAIL_QUEUE_BACKOFF_TYPE as any) || 'exponential',
        delay: parseInt(process.env.EMAIL_QUEUE_BACKOFF_DELAY || '2000')
      },
      removeOnComplete: parseInt(process.env.EMAIL_QUEUE_REMOVE_COMPLETE || '100'),
      removeOnFail: parseInt(process.env.EMAIL_QUEUE_REMOVE_FAIL || '50')
    },
    limits: {
      enabled: process.env.EMAIL_LIMITS_ENABLED === 'true',
      maxPerHour: parseInt(process.env.EMAIL_LIMITS_PER_HOUR || '100'),
      maxPerDay: parseInt(process.env.EMAIL_LIMITS_PER_DAY || '1000'),
      maxPerUser: parseInt(process.env.EMAIL_LIMITS_PER_USER || '10'),
      cooldownPeriod: parseInt(process.env.EMAIL_LIMITS_COOLDOWN || '300')
    },
    tracking: {
      enabled: process.env.EMAIL_TRACKING_ENABLED === 'true',
      openTracking: process.env.EMAIL_TRACKING_OPENS === 'true',
      clickTracking: process.env.EMAIL_TRACKING_CLICKS === 'true',
      unsubscribeTracking: process.env.EMAIL_TRACKING_UNSUBSCRIBE === 'true',
      bounceTracking: process.env.EMAIL_TRACKING_BOUNCES === 'true',
      webhookUrl: process.env.EMAIL_WEBHOOK_URL,
      webhookSecret: process.env.EMAIL_WEBHOOK_SECRET
    },
    security: {
      dkim: {
        enabled: process.env.EMAIL_DKIM_ENABLED === 'true',
        keySelector: process.env.EMAIL_DKIM_SELECTOR,
        privateKey: process.env.EMAIL_DKIM_PRIVATE_KEY,
        domain: process.env.EMAIL_DKIM_DOMAIN
      },
      spf: {
        enabled: process.env.EMAIL_SPF_ENABLED === 'true',
        record: process.env.EMAIL_SPF_RECORD
      },
      dmarc: {
        enabled: process.env.EMAIL_DMARC_ENABLED === 'true',
        policy: (process.env.EMAIL_DMARC_POLICY as any) || 'none',
        percentage: parseInt(process.env.EMAIL_DMARC_PERCENTAGE || '100')
      }
    },
    testing: {
      enabled: process.env.EMAIL_TESTING_ENABLED === 'true',
      catchAll: process.env.EMAIL_TESTING_CATCH_ALL,
      logOnly: process.env.EMAIL_TESTING_LOG_ONLY === 'true',
      mockProvider: process.env.EMAIL_TESTING_MOCK === 'true'
    }
  };

  // 环境特定配置
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        enabled: true,
        testing: {
          ...baseConfig.testing,
          enabled: true,
          logOnly: true,
          mockProvider: true
        },
        limits: {
          ...baseConfig.limits,
          enabled: false
        },
        tracking: {
          ...baseConfig.tracking,
          enabled: false
        }
      };

    case 'test':
      return {
        ...baseConfig,
        enabled: false,
        testing: {
          ...baseConfig.testing,
          enabled: true,
          logOnly: true,
          mockProvider: true
        },
        queue: {
          ...baseConfig.queue,
          enabled: false
        }
      };

    case 'production':
      return {
        ...baseConfig,
        enabled: true,
        testing: {
          ...baseConfig.testing,
          enabled: false,
          logOnly: false,
          mockProvider: false
        },
        queue: {
          ...baseConfig.queue,
          enabled: true
        },
        limits: {
          ...baseConfig.limits,
          enabled: true
        },
        tracking: {
          ...baseConfig.tracking,
          enabled: true
        },
        security: {
          ...baseConfig.security,
          dkim: {
            ...baseConfig.security.dkim,
            enabled: true
          },
          spf: {
            ...baseConfig.security.spf,
            enabled: true
          },
          dmarc: {
            ...baseConfig.security.dmarc,
            enabled: true
          }
        }
      };

    default:
      return baseConfig;
  }
}

/**
 * 验证邮件配置
 */
export function validateEmailConfig(config: EmailConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.enabled) {
    return { valid: true, errors: [] };
  }

  // 验证发送者配置
  if (!config.sender.email) {
    errors.push('发送者邮箱不能为空');
  }

  if (!config.sender.name) {
    errors.push('发送者名称不能为空');
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (config.sender.email && !emailRegex.test(config.sender.email)) {
    errors.push('发送者邮箱格式无效');
  }

  if (config.sender.replyTo && !emailRegex.test(config.sender.replyTo)) {
    errors.push('回复邮箱格式无效');
  }

  // 验证SMTP配置
  if (config.provider === 'smtp') {
    if (!config.smtp.host) {
      errors.push('SMTP主机不能为空');
    }

    if (config.smtp.port <= 0 || config.smtp.port > 65535) {
      errors.push('SMTP端口必须在1-65535之间');
    }

    if (!config.smtp.auth.user) {
      errors.push('SMTP用户名不能为空');
    }

    if (!config.smtp.auth.pass) {
      errors.push('SMTP密码不能为空');
    }
  }

  // 验证API配置
  if (['sendgrid', 'mailgun', 'postmark'].includes(config.provider)) {
    if (!config.apiKey) {
      errors.push(`${config.provider}的API密钥不能为空`);
    }
  }

  if (config.provider === 'ses') {
    if (!config.apiKey || !config.apiSecret) {
      errors.push('AWS SES需要提供访问密钥和秘密密钥');
    }

    if (!config.region) {
      errors.push('AWS SES需要指定区域');
    }
  }

  if (config.provider === 'mailgun' && !config.domain) {
    errors.push('Mailgun需要指定域名');
  }

  // 验证模板配置
  if (!config.templates.directory) {
    errors.push('模板目录不能为空');
  }

  // 验证限制配置
  if (config.limits.enabled) {
    if (config.limits.maxPerHour <= 0) {
      errors.push('每小时最大发送数必须大于0');
    }

    if (config.limits.maxPerDay <= 0) {
      errors.push('每天最大发送数必须大于0');
    }

    if (config.limits.maxPerUser <= 0) {
      errors.push('每用户最大发送数必须大于0');
    }
  }

  // 验证队列配置
  if (config.queue.enabled) {
    if (config.queue.concurrency <= 0) {
      errors.push('队列并发数必须大于0');
    }

    if (config.queue.attempts <= 0) {
      errors.push('重试次数必须大于0');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 获取邮件提供商特定配置
 */
export function getProviderSpecificConfig(provider: string, config: EmailConfig): Record<string, any> {
  switch (provider) {
    case 'sendgrid':
      return {
        apiKey: config.apiKey,
        trackingSettings: config.tracking.enabled ? {
          clickTracking: { enable: config.tracking.clickTracking },
          openTracking: { enable: config.tracking.openTracking },
          subscriptionTracking: { enable: config.tracking.unsubscribeTracking }
        } : undefined
      };

    case 'mailgun':
      return {
        apiKey: config.apiKey,
        domain: config.domain,
        host: config.region === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net',
        tracking: config.tracking.enabled,
        trackingClicks: config.tracking.clickTracking,
        trackingOpens: config.tracking.openTracking
      };

    case 'ses':
      return {
        accessKeyId: config.apiKey,
        secretAccessKey: config.apiSecret,
        region: config.region,
        apiVersion: '2010-12-01'
      };

    case 'postmark':
      return {
        serverToken: config.apiKey,
        trackOpens: config.tracking.openTracking,
        trackLinks: config.tracking.clickTracking ? 'HtmlAndText' : 'None'
      };

    default:
      return {};
  }
}
