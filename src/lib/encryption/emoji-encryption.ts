/**
 * Emoji Encryption Service
 * Specialized encryption service for emoji data using the base encryption system
 */

import {
  BaseEncryptionService,
  DecryptionOptions,
  EncryptedPayload,
  EncryptionOptions,
  EncryptionUtils
} from './base-encryption';

export type EncryptionType = 'personal' | 'global';

export interface EmojiEncryptedData extends EncryptedPayload {
  context: 'emoji';
}

/**
 * Emoji-specific encryption service that extends the base encryption system
 */
export class EmojiEncryptionService extends BaseEncryptionService {
  private static readonly EMOJI_CONTEXT = 'emoji';
  private static readonly MAX_IMAGE_SIZE = 1048576; // 1MB
  private static readonly MAX_EMOJI_DIMENSIONS = 512;

  /**
   * Encrypt emoji image data
   */
  static async encryptImageData(
    imageBuffer: Buffer,
    encryptionType: EncryptionType,
    userId?: number
  ): Promise<EmojiEncryptedData> {
    const options: EncryptionOptions = {
      scope: encryptionType,
      context: this.EMOJI_CONTEXT,
      userId: encryptionType === 'personal' ? userId : undefined
    };

    const result = await this.encryptBinary(imageBuffer, options);
    return result as EmojiEncryptedData;
  }

  /**
   * Decrypt emoji image data
   */
  static async decryptImageData(
    encryptedPayload: EmojiEncryptedData,
    userId?: number
  ): Promise<Buffer> {
    const options: DecryptionOptions = {
      userId: encryptedPayload.scope === 'personal' ? userId : undefined
    };

    return await this.decryptBinary(encryptedPayload, options);
  }

  /**
   * Re-encrypt personal emoji data for global access (when approved)
   */
  static async reencryptForGlobalAccess(
    personalEncryptedData: EmojiEncryptedData,
    originalUserId: number
  ): Promise<EmojiEncryptedData> {
    const result = await this.reencryptPersonalToGlobal(
      personalEncryptedData,
      originalUserId
    );
    return result as EmojiEncryptedData;
  }

  /**
   * Validate image constraints for custom emojis
   */
  static validateImageConstraints(
    imageBuffer: Buffer,
    format: string
  ): {
    isValid: boolean;
    errors: string[];
    metadata?: {
      size: number;
      width?: number;
      height?: number;
    };
  } {
    const errors: string[] = [];
    const size = imageBuffer.length;

    // Size validation (max 1MB)
    if (size > this.MAX_IMAGE_SIZE) {
      errors.push(
        `Image size must be less than ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`
      );
    }

    // Format validation
    const allowedFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      errors.push(`Image format must be one of: ${allowedFormats.join(', ')}`);
    }

    // Basic image header validation
    const isValidImage = this.validateImageHeader(imageBuffer, format);
    if (!isValidImage) {
      errors.push('Invalid image file or corrupted data');
    }

    // Additional emoji-specific validations could go here
    // (e.g., checking dimensions, color depth, etc.)

    return {
      isValid: errors.length === 0,
      errors,
      metadata: {
        size,
        // In production, you'd extract actual width/height from image headers
        width: undefined,
        height: undefined
      }
    };
  }

  /**
   * Basic image header validation
   */
  private static validateImageHeader(buffer: Buffer, format: string): boolean {
    if (buffer.length < 8) return false;

    const header = buffer.subarray(0, 8);

    switch (format.toLowerCase()) {
      case 'png':
        return header.equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
      case 'jpg':
      case 'jpeg':
        return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
      case 'gif':
        return (
          header.subarray(0, 6).equals(Buffer.from('GIF87a')) ||
          header.subarray(0, 6).equals(Buffer.from('GIF89a'))
        );
      case 'webp':
        return (
          header.subarray(0, 4).equals(Buffer.from('RIFF')) &&
          buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
        );
      default:
        return false;
    }
  }

  /**
   * Rotate emoji encryption key for a user
   */
  static async rotateEmojiKey(userId: number): Promise<void> {
    await this.rotatePersonalKey(userId, this.EMOJI_CONTEXT);
  }
}

/**
 * Utility functions for emoji encryption
 */
export class EmojiEncryptionUtils extends EncryptionUtils {
  /**
   * Create a serialized encrypted payload for emoji data
   */
  static createEncryptedPayload(encryptedData: EmojiEncryptedData): string {
    return this.serializePayload(encryptedData);
  }

  /**
   * Parse a serialized encrypted payload for emoji data
   */
  static parseEncryptedPayload(payload: string): EmojiEncryptedData {
    const parsed = this.parsePayload(payload);

    if (parsed.context !== 'emoji') {
      throw new Error('Invalid emoji encrypted payload - wrong context');
    }

    return parsed as EmojiEncryptedData;
  }

  /**
   * Generate a unique emoji ID
   */
  static generateEmojiId(name: string, userId?: number): string {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return this.generateSecureId(
      `emoji_${sanitizedName}${userId ? `_u${userId}` : ''}`
    );
  }

  /**
   * Validate emoji metadata
   */
  static validateEmojiMetadata(metadata: {
    name: string;
    aliases: string[];
    tags: string[];
    category?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name validation
    if (!metadata.name || metadata.name.length < 2) {
      errors.push('Emoji name must be at least 2 characters long');
    }
    if (metadata.name.length > 50) {
      errors.push('Emoji name must be less than 50 characters');
    }
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(metadata.name)) {
      errors.push(
        'Emoji name can only contain letters, numbers, spaces, hyphens, and underscores'
      );
    }

    // Aliases validation
    if (metadata.aliases.length > 10) {
      errors.push('Maximum 10 aliases allowed');
    }
    for (const alias of metadata.aliases) {
      if (alias.length > 30) {
        errors.push('Alias length must be less than 30 characters');
      }
    }

    // Tags validation
    if (metadata.tags.length > 15) {
      errors.push('Maximum 15 tags allowed');
    }
    for (const tag of metadata.tags) {
      if (tag.length > 20) {
        errors.push('Tag length must be less than 20 characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize emoji data for XSS prevention
   */
  static sanitizeEmojiData(data: {
    name: string;
    description?: string;
    aliases: string[];
    tags: string[];
  }): typeof data {
    return {
      name: this.sanitizeData(data.name.trim()),
      description: data.description
        ? this.sanitizeData(data.description.trim())
        : undefined,
      aliases: data.aliases.map((alias) => this.sanitizeData(alias.trim())),
      tags: data.tags.map((tag) => this.sanitizeData(tag.trim()))
    };
  }

  /**
   * Validate emoji image constraints
   */
  static validateEmojiImageConstraints(
    imageBuffer: Buffer,
    format: string
  ): { isValid: boolean; errors: string[] } {
    return this.validateDataConstraints(imageBuffer, {
      maxSize: 1048576, // 1MB
      allowedTypes: ['png', 'jpg', 'jpeg', 'gif', 'webp']
    });
  }
}
