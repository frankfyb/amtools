/**
 * 验证码服务实现
 */

import Redis from 'ioredis';
import { Injectable, Inject } from '../../core/di/decorators';
import { EXTERNAL_TOKENS, SERVICE_TOKENS } from '../../core/di/tokens';
import { 
  VerificationCodeType, 
  SendCodeResult, 
  VerifyCodeResult 
} from '../../shared/types/auth.types';
import { 
  VERIFICATION_CODE, 
  CACHE_KEYS, 
  AUTH_ERROR_CODES 
} from '../../shared/constants/auth.constants';
import { CryptoUtil } from '../../shared/utils/crypto.util';

export interface EmailService {
  sendVerificationEmail(email: string, code: string, type: VerificationCodeType): Promise<void>;
}

@Injectable()
export class VerificationCodeService {
  constructor(
    @Inject(EXTERNAL_TOKENS.REDIS_CLIENT)
    private readonly redisClient: Redis,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: EmailService
  ) {}

  /**
   * 发送验证码
   */
  async sendVerificationCode(
    email: string, 
    type: VerificationCodeType,
    options?: {
      forceResend?: boolean;
      customTemplate?: string;
    }
  ): Promise<SendCodeResult> {
    try {
      // 检查冷却时间
      if (!options?.forceResend) {
        const cooldownCheck = await this.checkCooldown(email, type);
        if (!cooldownCheck.canSend) {
          return {
            success: false,
            message: '请稍后再试',
            cooldownSeconds: cooldownCheck.remainingSeconds
          };
        }
      }

      // 检查发送次数限制
      const attemptsCheck = await this.checkSendAttempts(email, type);
      if (!attemptsCheck.canSend) {
        return {
          success: false,
          message: '今日发送次数已达上限',
          attemptsRemaining: 0
        };
      }

      // 生成验证码
      const code = CryptoUtil.generateVerificationCode();

      // 缓存验证码
      await this.cacheVerificationCode(email, type, code);

      // 尝试发送邮件（在开发环境下，即使邮件发送失败也继续）
      try {
        await this.emailService.sendVerificationEmail(email, code, type);
      } catch (emailError) {
        console.error('Email send failed:', emailError);
        // 在开发环境下，即使邮件发送失败也继续
        if (process.env.NODE_ENV !== 'development') {
          throw emailError;
        }
      }

      // 记录发送次数和冷却时间
      await this.recordSendAttempt(email, type);
      await this.setCooldown(email, type);

      return {
        success: true,
        message: '验证码已发送',
        attemptsRemaining: attemptsCheck.remainingAttempts - 1,
        // 仅在开发环境下返回验证码用于测试
        ...(process.env.NODE_ENV === 'development' && { verificationCode: code })
      };

    } catch (error) {
      console.error('Send verification code failed:', error);
      return {
        success: false,
        message: '发送失败，请稍后重试'
      };
    }
  }

  /**
   * 验证验证码
   */
  async verifyCode(
    email: string,
    code: string,
    type: VerificationCodeType,
    options?: {
      deleteAfterVerify?: boolean;
    }
  ): Promise<VerifyCodeResult> {
    try {
      console.log(`🔐 开始验证验证码:`);
      console.log(`  邮箱: ${email}`);
      console.log(`  类型: ${type}`);
      console.log(`  验证码: ${code}`);

      // 检查验证次数限制
      const attemptsCheck = await this.checkVerifyAttempts(email, type);
      console.log(`📊 验证次数检查:`, attemptsCheck);

      if (!attemptsCheck.canVerify) {
        console.log(`❌ 验证次数超限`);
        return {
          success: false,
          message: '验证次数过多，请重新获取验证码',
          attemptsRemaining: 0
        };
      }

      // 获取缓存的验证码
      const cachedData = await this.getCachedCode(email, type);
      console.log(`🔍 缓存的验证码数据:`, cachedData);

      if (!cachedData) {
        console.log(`❌ 验证码不存在或已过期`);
        return {
          success: false,
          message: '验证码不存在或已过期',
          isExpired: true
        };
      }

      // 验证码比较
      console.log(`🔍 验证码比较: 输入=${code}, 缓存=${cachedData.code}`);
      if (cachedData.code !== code) {
        // 记录验证失败
        await this.recordVerifyAttempt(email, type);
        console.log(`❌ 验证码错误，记录验证失败`);

        return {
          success: false,
          message: '验证码错误',
          attemptsRemaining: attemptsCheck.remainingAttempts - 1
        };
      }

      // 验证成功，清理相关缓存
      if (options?.deleteAfterVerify !== false) {
        await this.clearVerificationData(email, type);
        console.log(`✅ 验证码验证成功，已清理缓存`);
      } else {
        console.log(`✅ 验证码验证成功，保留缓存`);
      }

      return {
        success: true,
        message: '验证成功'
      };

    } catch (error) {
      console.error('Verify code failed:', error);
      return {
        success: false,
        message: '验证失败，请稍后重试'
      };
    }
  }

  /**
   * 检查验证码是否存在且有效
   */
  async isCodeValid(email: string, type: VerificationCodeType): Promise<boolean> {
    const cachedData = await this.getCachedCode(email, type);
    return !!cachedData;
  }

  /**
   * 清理用户的所有验证码数据
   */
  async clearAllVerificationData(email: string): Promise<void> {
    const types = Object.values(VerificationCodeType);
    const promises = types.map(type => this.clearVerificationData(email, type));
    await Promise.all(promises);
  }

  /**
   * 获取验证码剩余时间
   */
  async getCodeRemainingTime(email: string, type: VerificationCodeType): Promise<number> {
    const key = this.getCodeKey(email, type);
    const ttl = await this.redisClient.ttl(key);
    return Math.max(0, ttl);
  }

  /**
   * 缓存验证码
   */
  private async cacheVerificationCode(
    email: string,
    type: VerificationCodeType,
    code: string
  ): Promise<void> {
    const key = this.getCodeKey(email, type);
    const ttl = VERIFICATION_CODE.EXPIRY_MINUTES * 60;
    const data = {
      code,
      email,
      type,
      createdAt: new Date().toISOString(),
      attempts: 0
    };

    console.log(`💾 缓存验证码:`);
    console.log(`  键名: ${key}`);
    console.log(`  TTL: ${ttl}秒 (${VERIFICATION_CODE.EXPIRY_MINUTES}分钟)`);
    console.log(`  数据:`, data);

    await this.redisClient.setex(key, ttl, JSON.stringify(data));

    // 验证存储
    const stored = await this.redisClient.get(key);
    const storedTtl = await this.redisClient.ttl(key);
    console.log(`✅ 验证码已存储，TTL: ${storedTtl}秒`);
    console.log(`  存储的数据:`, stored ? JSON.parse(stored) : null);
  }

  /**
   * 获取缓存的验证码
   */
  private async getCachedCode(
    email: string, 
    type: VerificationCodeType
  ): Promise<{ code: string; attempts: number; createdAt: string } | null> {
    const key = this.getCodeKey(email, type);
    const data = await this.redisClient.get(key);
    
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * 检查发送冷却时间
   */
  private async checkCooldown(
    email: string, 
    type: VerificationCodeType
  ): Promise<{ canSend: boolean; remainingSeconds: number }> {
    const key = this.getCooldownKey(email, type);
    const ttl = await this.redisClient.ttl(key);
    
    return {
      canSend: ttl <= 0,
      remainingSeconds: Math.max(0, ttl)
    };
  }

  /**
   * 设置发送冷却时间
   */
  private async setCooldown(email: string, type: VerificationCodeType): Promise<void> {
    const key = this.getCooldownKey(email, type);
    await this.redisClient.setex(key, VERIFICATION_CODE.COOLDOWN_SECONDS, '1');
  }

  /**
   * 检查发送次数限制
   */
  private async checkSendAttempts(
    email: string, 
    type: VerificationCodeType
  ): Promise<{ canSend: boolean; remainingAttempts: number }> {
    const key = this.getSendAttemptsKey(email, type);
    const attempts = await this.redisClient.get(key);
    const currentAttempts = attempts ? parseInt(attempts) : 0;
    const maxAttempts = 10; // 每日最大发送次数

    return {
      canSend: currentAttempts < maxAttempts,
      remainingAttempts: Math.max(0, maxAttempts - currentAttempts)
    };
  }

  /**
   * 记录发送次数
   */
  private async recordSendAttempt(email: string, type: VerificationCodeType): Promise<void> {
    const key = this.getSendAttemptsKey(email, type);
    const ttl = await this.redisClient.ttl(key);
    
    if (ttl <= 0) {
      // 设置24小时过期
      await this.redisClient.setex(key, 24 * 60 * 60, '1');
    } else {
      await this.redisClient.incr(key);
    }
  }

  /**
   * 检查验证次数限制
   */
  private async checkVerifyAttempts(
    email: string, 
    type: VerificationCodeType
  ): Promise<{ canVerify: boolean; remainingAttempts: number }> {
    const key = this.getVerifyAttemptsKey(email, type);
    const attempts = await this.redisClient.get(key);
    const currentAttempts = attempts ? parseInt(attempts) : 0;

    return {
      canVerify: currentAttempts < VERIFICATION_CODE.MAX_ATTEMPTS,
      remainingAttempts: Math.max(0, VERIFICATION_CODE.MAX_ATTEMPTS - currentAttempts)
    };
  }

  /**
   * 记录验证次数
   */
  private async recordVerifyAttempt(email: string, type: VerificationCodeType): Promise<void> {
    const key = this.getVerifyAttemptsKey(email, type);
    const ttl = await this.redisClient.ttl(key);
    
    if (ttl <= 0) {
      // 与验证码同样的过期时间
      await this.redisClient.setex(key, VERIFICATION_CODE.EXPIRY_MINUTES * 60, '1');
    } else {
      await this.redisClient.incr(key);
    }
  }

  /**
   * 清理验证数据
   */
  private async clearVerificationData(email: string, type: VerificationCodeType): Promise<void> {
    const keys = [
      this.getCodeKey(email, type),
      this.getVerifyAttemptsKey(email, type)
    ];
    
    await this.redisClient.del(...keys);
  }

  /**
   * 生成缓存键
   */
  private getCodeKey(email: string, type: VerificationCodeType): string {
    return `${CACHE_KEYS.VERIFICATION_CODE}${type}:${email}`;
  }

  private getCooldownKey(email: string, type: VerificationCodeType): string {
    return `${CACHE_KEYS.VERIFICATION_CODE}cooldown:${type}:${email}`;
  }

  private getSendAttemptsKey(email: string, type: VerificationCodeType): string {
    return `${CACHE_KEYS.VERIFICATION_CODE}send_attempts:${type}:${email}`;
  }

  private getVerifyAttemptsKey(email: string, type: VerificationCodeType): string {
    return `${CACHE_KEYS.VERIFICATION_CODE}verify_attempts:${type}:${email}`;
  }
}
