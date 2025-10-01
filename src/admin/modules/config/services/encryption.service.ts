import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  constructor(private configService: ConfigService) {}

  /**
   * Encrypt a plaintext string
   */
  encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
    try {
      // Get encryption key from environment
      const encryptionKey = this.getEncryptionKey();

      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);
      cipher.setAAD(Buffer.from('api-key')); // Additional authenticated data

      // Encrypt the plaintext
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string
   */
  decrypt(encrypted: string, iv: string, tag: string): string {
    try {
      // Get encryption key from environment
      const encryptionKey = this.getEncryptionKey();

      // Convert hex strings back to buffers
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        encryptionKey,
        ivBuffer,
      );
      decipher.setAAD(Buffer.from('api-key'));
      decipher.setAuthTag(tagBuffer);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Create a hash for integrity verification
   */
  createHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity using hash
   */
  verifyHash(data: string, hash: string): boolean {
    const calculatedHash = this.createHash(data);
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(hash, 'hex'),
    );
  }

  /**
   * Generate a secure random key for encryption
   */
  generateEncryptionKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Rotate encryption key (for key rotation)
   */
  rotateEncryptionKey(oldKey: string, newKey: string): boolean {
    // This would be used in a key rotation process
    // For now, just validate that both keys are provided
    return oldKey.length === 64 && newKey.length === 64;
  }

  /**
   * Get encryption key from environment or generate one
   */
  private getEncryptionKey(): Buffer {
    let keyString = this.configService.get<string>('ENCRYPTION_KEY');

    if (!keyString) {
      this.logger.warn(
        'ENCRYPTION_KEY not found in environment, using default (NOT SECURE FOR PRODUCTION)',
      );
      // Generate a default key for development (NEVER use in production)
      // Use a fixed but valid 256-bit key for development consistency
      keyString =
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    }

    // Ensure key is the correct length and format
    if (keyString.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (256-bit key)',
      );
    }

    // Validate that it's a valid hex string
    if (!/^[a-fA-F0-9]{64}$/.test(keyString)) {
      throw new Error('ENCRYPTION_KEY must be a valid hexadecimal string');
    }

    // Convert hex string to Buffer for crypto operations
    return Buffer.from(keyString, 'hex');
  }

  /**
   * Validate encryption key format
   */
  validateEncryptionKey(key: string): boolean {
    // Check if it's a valid hex string of correct length
    return /^[a-fA-F0-9]{64}$/.test(key);
  }

  /**
   * Encrypt API key with metadata
   */
  encryptAPIKey(keyValue: string): {
    encrypted: string;
    iv: string;
    tag: string;
    hash: string;
  } {
    const encryption = this.encrypt(keyValue);
    const hash = this.createHash(keyValue);

    return {
      encrypted: encryption.encrypted,
      iv: encryption.iv,
      tag: encryption.tag,
      hash,
    };
  }

  /**
   * Decrypt API key and verify integrity
   */
  decryptAPIKey(
    encrypted: string,
    iv: string,
    tag: string,
    hash?: string,
  ): string {
    const decrypted = this.decrypt(encrypted, iv, tag);

    // Verify integrity if hash is provided
    if (hash && !this.verifyHash(decrypted, hash)) {
      throw new Error('API key integrity check failed');
    }

    return decrypted;
  }

  /**
   * Generate a secure API key (for services that need key generation)
   */
  generateSecureAPIKey(prefix?: string, length: number = 32): string {
    const randomBytes = crypto.randomBytes(length);
    const key = randomBytes.toString('hex');

    if (prefix) {
      return `${prefix}_${key}`;
    }

    return key;
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const masked = '*'.repeat(data.length - visibleChars * 2);

    return `${start}${masked}${end}`;
  }

  /**
   * Check if a string looks like it contains sensitive data
   */
  containsSensitiveData(text: string): boolean {
    const sensitivePatterns = [
      /sk_[a-zA-Z0-9]{20,}/, // Stripe secret keys
      /xox[baprs]-[a-zA-Z0-9-]+/, // Slack tokens
      /AIza[0-9A-Za-z-_]{35}/, // Google API keys
      /SG\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, // SendGrid API keys
      /AC[a-f0-9]{32}/, // Twilio Account SID
      /[a-f0-9]{64}/, // Generic 256-bit keys
    ];

    return sensitivePatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Sanitize log data by masking sensitive information
   */
  sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      if (this.containsSensitiveData(data)) {
        return this.maskSensitiveData(data);
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeLogData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized = { ...data };
      for (const key in sanitized) {
        if (this.isSensitiveKey(key)) {
          if (typeof sanitized[key] === 'string') {
            sanitized[key] = this.maskSensitiveData(sanitized[key]);
          }
        } else {
          sanitized[key] = this.sanitizeLogData(sanitized[key]);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Check if a key name indicates sensitive data
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'secret',
      'token',
      'key',
      'api_key',
      'apiKey',
      'apikey',
      'access_token',
      'accessToken',
      'refresh_token',
      'refreshToken',
      'private_key',
      'privateKey',
      'encryption_key',
      'encryptionKey',
    ];

    return sensitiveKeys.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase()),
    );
  }
}
