/**
 * 加密工具函数
 */

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PASSWORD, VERIFICATION_CODE } from '../constants/auth.constants';

export class CryptoUtil {
  /**
   * 生成验证码
   */
  static generateVerificationCode(): string {
    const min = Math.pow(10, VERIFICATION_CODE.LENGTH - 1);
    const max = Math.pow(10, VERIFICATION_CODE.LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * 生成随机字符串
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成UUID
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * 哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(PASSWORD.BCRYPT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * 验证密码
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 生成安全的随机令牌
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * 创建HMAC签名
   */
  static createHMAC(data: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  /**
   * 验证HMAC签名
   */
  static verifyHMAC(data: string, signature: string, secret: string, algorithm: string = 'sha256'): boolean {
    const expectedSignature = this.createHMAC(data, secret, algorithm);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * AES加密
   */
  static encrypt(text: string, key: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    cipher.setAutoPadding(true);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * AES解密
   */
  static decrypt(encryptedData: { encrypted: string; iv: string }, key: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * 生成密码盐
   */
  static generateSalt(rounds: number = PASSWORD.BCRYPT_ROUNDS): Promise<string> {
    return bcrypt.genSalt(rounds);
  }

  /**
   * 创建SHA256哈希
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 创建MD5哈希
   */
  static md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * 生成基于时间的一次性密码 (TOTP)
   */
  static generateTOTP(secret: string, timeStep: number = 30): string {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(time, 4);
    
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    return (code % 1000000).toString().padStart(6, '0');
  }

  /**
   * 验证TOTP
   */
  static verifyTOTP(token: string, secret: string, window: number = 1): boolean {
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000 / timeStep);
    
    for (let i = -window; i <= window; i++) {
      const time = currentTime + i;
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeUInt32BE(time, 4);
      
      const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
      hmac.update(timeBuffer);
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0xf;
      const code = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
      
      const expectedToken = (code % 1000000).toString().padStart(6, '0');
      if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 安全比较字符串（防止时序攻击）
   */
  static safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
