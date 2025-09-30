const crypto = require('crypto');

// Simular el comportamiento del servicio de encriptación
class TestEncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }

  getEncryptionKey() {
    // Simular la nueva implementación
    let keyString = process.env.ENCRYPTION_KEY;

    if (!keyString) {
      console.log('ENCRYPTION_KEY not found in environment, using default (NOT SECURE FOR PRODUCTION)');
      // Use a fixed but valid 256-bit key for development consistency
      keyString = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    }

    // Ensure key is the correct length and format
    if (keyString.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (256-bit key)');
    }

    // Validate that it's a valid hex string
    if (!/^[a-fA-F0-9]{64}$/.test(keyString)) {
      throw new Error('ENCRYPTION_KEY must be a valid hexadecimal string');
    }

    // Convert hex string to Buffer for crypto operations
    return Buffer.from(keyString, 'hex');
  }

  encrypt(plaintext) {
    try {
      const encryptionKey = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);
      cipher.setAAD(Buffer.from('api-key'));

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encrypted, iv, tag) {
    try {
      const encryptionKey = this.getEncryptionKey();
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, encryptionKey, ivBuffer);
      decipher.setAAD(Buffer.from('api-key'));
      decipher.setAuthTag(tagBuffer);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  encryptAPIKey(keyValue) {
    const encryption = this.encrypt(keyValue);
    const hash = crypto.createHash('sha256').update(keyValue).digest('hex');

    return {
      encrypted: encryption.encrypted,
      iv: encryption.iv,
      tag: encryption.tag,
      hash,
    };
  }

  decryptAPIKey(encrypted, iv, tag, hash) {
    const decrypted = this.decrypt(encrypted, iv, tag);

    if (hash) {
      const calculatedHash = crypto.createHash('sha256').update(decrypted).digest('hex');
      if (calculatedHash !== hash) {
        throw new Error('API key integrity check failed');
      }
    }

    return decrypted;
  }
}

// Probar la encriptación
async function testEncryption() {
  const encryptionService = new TestEncryptionService();

  try {
    console.log('Testing encryption service...');

    // Test data
    const testKey = 'sk_live_1234567890abcdef';
    console.log('Original key:', testKey);

    // Encrypt
    console.log('Encrypting...');
    const encrypted = encryptionService.encryptAPIKey(testKey);
    console.log('Encrypted successfully:', {
      encrypted: encrypted.encrypted.substring(0, 20) + '...',
      iv: encrypted.iv,
      tag: encrypted.tag,
      hash: encrypted.hash.substring(0, 20) + '...'
    });

    // Decrypt
    console.log('Decrypting...');
    const decrypted = encryptionService.decryptAPIKey(
      encrypted.encrypted,
      encrypted.iv,
      encrypted.tag,
      encrypted.hash
    );
    console.log('Decrypted key:', decrypted);

    // Verify
    if (decrypted === testKey) {
      console.log('✅ SUCCESS: Encryption/Decryption works correctly!');
    } else {
      console.log('❌ FAILED: Decrypted key does not match original');
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

testEncryption();
