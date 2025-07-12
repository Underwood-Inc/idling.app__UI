/**
 * Base Encryption Service
 * Generic encryption system that can be used for any type of data
 * Supports both personal (per-user) and global (application-level) encryption
 */

import { createLogger } from '@lib/logging';
import crypto from 'crypto';
import sql from '../db';

const logger = createLogger({
  context: {
    component: 'BaseEncryption',
    module: 'encryption'
  },
  enabled: false
});

export type EncryptionScope = 'personal' | 'global';
export type EncryptionContext = string; // e.g., 'emoji', 'message', 'file', etc.

export interface EncryptionKey {
  keyId: string;
  encryptionKey: Buffer;
  keyHash: string;
  salt: string;
  scope: EncryptionScope;
  context: EncryptionContext;
}

export interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  authTag: string;
  scope: EncryptionScope;
  context: EncryptionContext;
  keyId: string;
}

export interface EncryptionOptions {
  scope: EncryptionScope;
  context: EncryptionContext;
  userId?: number; // Required for personal scope
  additionalData?: string; // Additional authenticated data
}

export interface DecryptionOptions {
  userId?: number; // Required for personal scope decryption
  additionalData?: string; // Must match encryption AAD
}

/**
 * Base encryption service that provides generic encryption/decryption capabilities
 */
export class BaseEncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly PBKDF2_ITERATIONS = 100000;

  // Cache for keys to avoid repeated database calls
  private static keyCache: Map<string, EncryptionKey> = new Map();

  /**
   * Generate a new personal encryption key for a user and context
   */
  static async generatePersonalKey(
    userId: number,
    context: EncryptionContext
  ): Promise<EncryptionKey> {
    const keyId = `personal:${context}:${userId}`;
    const encryptionKey = crypto.randomBytes(this.KEY_LENGTH);
    const salt = crypto.randomBytes(this.SALT_LENGTH);

    const keyHash = crypto
      .createHash('sha256')
      .update(encryptionKey)
      .update(salt)
      .digest('hex');

    // Store in database
    await sql`
      INSERT INTO user_encryption_keys (user_id, encryption_key_hash, key_salt)
      VALUES (${userId}, ${keyHash}, ${salt.toString('base64')})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        encryption_key_hash = EXCLUDED.encryption_key_hash,
        key_salt = EXCLUDED.key_salt,
        updated_at = CURRENT_TIMESTAMP
    `;

    const key: EncryptionKey = {
      keyId,
      encryptionKey,
      keyHash,
      salt: salt.toString('base64'),
      scope: 'personal',
      context
    };

    // Cache the key
    this.keyCache.set(keyId, key);
    return key;
  }

  /**
   * Generate or retrieve global encryption key for a context
   */
  static async getGlobalKey(
    context: EncryptionContext
  ): Promise<EncryptionKey> {
    const keyId = `global:${context}`;

    // Check cache first
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    try {
      const keyName = `global_${context}_key`;

      // Check if global key exists
      const result = await sql`
        SELECT encryption_key_hash, key_salt 
        FROM application_encryption_keys 
        WHERE key_name = ${keyName} AND is_active = true
      `;

      let keyHash: string;
      let salt: string;

      if (
        result.length === 0 ||
        result[0].encryption_key_hash ===
          'placeholder_hash_will_be_replaced_by_app'
      ) {
        // Generate new global key
        const encryptionKey = crypto.randomBytes(this.KEY_LENGTH);
        const saltBuffer = crypto.randomBytes(this.SALT_LENGTH);

        keyHash = crypto
          .createHash('sha256')
          .update(encryptionKey)
          .update(saltBuffer)
          .digest('hex');

        salt = saltBuffer.toString('base64');

        // Store the new key
        await sql`
          INSERT INTO application_encryption_keys (key_name, key_purpose, encryption_key_hash, key_salt)
          VALUES (
            ${keyName}, 
            ${`Encryption key for globally accessible ${context} data`},
            ${keyHash}, 
            ${salt}
          )
          ON CONFLICT (key_name) 
          DO UPDATE SET 
            encryption_key_hash = EXCLUDED.encryption_key_hash,
            key_salt = EXCLUDED.key_salt,
            updated_at = CURRENT_TIMESTAMP
        `;
      } else {
        keyHash = result[0].encryption_key_hash;
        salt = result[0].key_salt;
      }

      // Derive the key from master key + context + salt
      const masterKey =
        process.env.GLOBAL_ENCRYPTION_MASTER_KEY ||
        'default-global-master-key-change-in-production';
      const encryptionKey = crypto.pbkdf2Sync(
        masterKey + context,
        Buffer.from(salt, 'base64'),
        this.PBKDF2_ITERATIONS,
        this.KEY_LENGTH,
        'sha256'
      );

      const key: EncryptionKey = {
        keyId,
        encryptionKey,
        keyHash,
        salt,
        scope: 'global',
        context
      };

      // Cache the key
      this.keyCache.set(keyId, key);
      return key;
    } catch (error) {
      logger.error('Error retrieving global encryption key', error as Error, {
        context,
        operation: 'getGlobalKey'
      });
      throw new Error(
        `Failed to retrieve global encryption key for ${context}`
      );
    }
  }

  /**
   * Get or generate personal encryption key for a user and context
   */
  static async getPersonalKey(
    userId: number,
    context: EncryptionContext
  ): Promise<EncryptionKey> {
    const keyId = `personal:${context}:${userId}`;

    // Check cache first
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    try {
      // Check if user already has an encryption key
      const result = await sql`
        SELECT encryption_key_hash, key_salt 
        FROM user_encryption_keys 
        WHERE user_id = ${userId}
      `;

      if (result.length === 0) {
        // Generate new key if none exists
        return await this.generatePersonalKey(userId, context);
      }

      const { encryption_key_hash, key_salt } = result[0];

      // Derive the key from master key + user ID + context + salt
      const masterKey =
        process.env.PERSONAL_ENCRYPTION_MASTER_KEY ||
        'default-personal-master-key-change-in-production';
      const encryptionKey = crypto.pbkdf2Sync(
        masterKey + userId.toString() + context,
        Buffer.from(key_salt, 'base64'),
        this.PBKDF2_ITERATIONS,
        this.KEY_LENGTH,
        'sha256'
      );

      const key: EncryptionKey = {
        keyId,
        encryptionKey,
        keyHash: encryption_key_hash,
        salt: key_salt,
        scope: 'personal',
        context
      };

      // Cache the key
      this.keyCache.set(keyId, key);
      return key;
    } catch (error) {
      logger.error('Error retrieving personal encryption key', error as Error, {
        userId,
        context,
        operation: 'getPersonalKey'
      });
      throw new Error(
        `Failed to retrieve personal encryption key for ${context}`
      );
    }
  }

  /**
   * Encrypt data with specified options
   */
  static async encrypt(
    data: string,
    options: EncryptionOptions
  ): Promise<EncryptedPayload> {
    let encryptionKey: EncryptionKey;

    if (options.scope === 'personal') {
      if (!options.userId) {
        throw new Error('User ID required for personal encryption');
      }
      encryptionKey = await this.getPersonalKey(
        options.userId,
        options.context
      );
    } else {
      encryptionKey = await this.getGlobalKey(options.context);
    }

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      this.ALGORITHM,
      encryptionKey.encryptionKey,
      iv
    );

    // Create additional authenticated data
    const aadData = `${options.scope}:${options.context}${options.userId ? `:${options.userId}` : ''}${options.additionalData ? `:${options.additionalData}` : ''}`;
    cipher.setAAD(Buffer.from(aadData));

    let encryptedData = cipher.update(data, 'utf8', 'base64');
    encryptedData += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      encryptedData,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      scope: options.scope,
      context: options.context,
      keyId: encryptionKey.keyId
    };
  }

  /**
   * Decrypt data with specified options
   */
  static async decrypt(
    payload: EncryptedPayload,
    options: DecryptionOptions = {}
  ): Promise<string> {
    let encryptionKey: EncryptionKey;

    if (payload.scope === 'personal') {
      if (!options.userId) {
        throw new Error('User ID required for personal decryption');
      }
      encryptionKey = await this.getPersonalKey(
        options.userId,
        payload.context
      );
    } else {
      encryptionKey = await this.getGlobalKey(payload.context);
    }

    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');

    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      encryptionKey.encryptionKey,
      iv
    );

    // Recreate the same AAD used during encryption
    const aadData = `${payload.scope}:${payload.context}${options.userId ? `:${options.userId}` : ''}${options.additionalData ? `:${options.additionalData}` : ''}`;
    decipher.setAAD(Buffer.from(aadData));
    decipher.setAuthTag(authTag);

    let decryptedData = decipher.update(
      payload.encryptedData,
      'base64',
      'utf8'
    );
    decryptedData += decipher.final('utf8');

    return decryptedData;
  }

  /**
   * Re-encrypt data from personal to global scope
   */
  static async reencryptPersonalToGlobal(
    personalPayload: EncryptedPayload,
    originalUserId: number,
    additionalData?: string
  ): Promise<EncryptedPayload> {
    if (personalPayload.scope !== 'personal') {
      throw new Error('Can only re-encrypt personal data to global');
    }

    // First decrypt with personal key
    const decryptedData = await this.decrypt(personalPayload, {
      userId: originalUserId,
      additionalData
    });

    // Then encrypt with global key
    return await this.encrypt(decryptedData, {
      scope: 'global',
      context: personalPayload.context,
      additionalData
    });
  }

  /**
   * Encrypt binary data (e.g., images, files)
   */
  static async encryptBinary(
    buffer: Buffer,
    options: EncryptionOptions
  ): Promise<EncryptedPayload> {
    const base64Data = buffer.toString('base64');
    return await this.encrypt(base64Data, options);
  }

  /**
   * Decrypt binary data
   */
  static async decryptBinary(
    payload: EncryptedPayload,
    options: DecryptionOptions = {}
  ): Promise<Buffer> {
    const decryptedBase64 = await this.decrypt(payload, options);
    return Buffer.from(decryptedBase64, 'base64');
  }

  /**
   * Clear key cache (useful for key rotation)
   */
  static clearKeyCache(): void {
    this.keyCache.clear();
  }

  /**
   * Rotate personal key for user and context
   */
  static async rotatePersonalKey(
    userId: number,
    context: EncryptionContext
  ): Promise<EncryptionKey> {
    const keyId = `personal:${context}:${userId}`;
    this.keyCache.delete(keyId);

    // Generate new key (this will replace the old one)
    return await this.generatePersonalKey(userId, context);
  }

  /**
   * Validate encryption payload structure
   */
  static validatePayload(payload: any): payload is EncryptedPayload {
    return (
      typeof payload === 'object' &&
      typeof payload.encryptedData === 'string' &&
      typeof payload.iv === 'string' &&
      typeof payload.authTag === 'string' &&
      typeof payload.scope === 'string' &&
      typeof payload.context === 'string' &&
      typeof payload.keyId === 'string' &&
      ['personal', 'global'].includes(payload.scope)
    );
  }
}

/**
 * Utility functions for encryption
 */
export class EncryptionUtils {
  /**
   * Create a serialized encrypted payload
   */
  static serializePayload(payload: EncryptedPayload): string {
    return JSON.stringify({
      data: payload.encryptedData,
      iv: payload.iv,
      tag: payload.authTag,
      scope: payload.scope,
      context: payload.context,
      keyId: payload.keyId
    });
  }

  /**
   * Parse a serialized encrypted payload
   */
  static parsePayload(serialized: string): EncryptedPayload {
    try {
      const parsed = JSON.parse(serialized);

      if (
        !BaseEncryptionService.validatePayload({
          encryptedData: parsed.data,
          iv: parsed.iv,
          authTag: parsed.tag,
          scope: parsed.scope,
          context: parsed.context,
          keyId: parsed.keyId
        })
      ) {
        throw new Error('Invalid payload structure');
      }

      return {
        encryptedData: parsed.data,
        iv: parsed.iv,
        authTag: parsed.tag,
        scope: parsed.scope || 'personal',
        context: parsed.context,
        keyId: parsed.keyId
      };
    } catch (error) {
      throw new Error('Invalid encrypted payload format');
    }
  }

  /**
   * Generate a secure random ID
   */
  static generateSecureId(prefix?: string): string {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now().toString(36);
    return prefix
      ? `${prefix}_${timestamp}_${randomBytes}`
      : `${timestamp}_${randomBytes}`;
  }

  /**
   * Sanitize data for XSS prevention
   */
  static sanitizeData(data: string): string {
    return data
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Validate data constraints
   */
  static validateDataConstraints(
    data: Buffer | string,
    constraints: {
      maxSize?: number;
      allowedTypes?: string[];
      minLength?: number;
      maxLength?: number;
    }
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const size = Buffer.isBuffer(data)
      ? data.length
      : Buffer.byteLength(data, 'utf8');

    if (constraints.maxSize && size > constraints.maxSize) {
      errors.push(
        `Data size ${size} bytes exceeds maximum of ${constraints.maxSize} bytes`
      );
    }

    if (typeof data === 'string') {
      if (constraints.minLength && data.length < constraints.minLength) {
        errors.push(
          `Data length ${data.length} is below minimum of ${constraints.minLength}`
        );
      }
      if (constraints.maxLength && data.length > constraints.maxLength) {
        errors.push(
          `Data length ${data.length} exceeds maximum of ${constraints.maxLength}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
