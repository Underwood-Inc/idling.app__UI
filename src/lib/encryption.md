---
title: 'Encryption Utilities'
description: 'Encryption, hashing, and cryptographic utility functions'
sidebar_position: 6
---

# Encryption System Documentation

This directory contains the encryption system for the application, providing secure data encryption/decryption capabilities with support for both personal (per-user) and global (application-level) encryption.

## Architecture Overview

The encryption system is built with a modular architecture:

- **Base Encryption Service**: Generic encryption service that can be used for any type of data
- **Specialized Services**: Context-specific implementations (e.g., EmojiEncryptionService)
- **Utilities**: Helper functions for serialization, validation, and data sanitization

## Security Features

### Dual Encryption Scopes

1. **Personal Encryption**: Per-user encryption keys for private data

   - Each user has their own encryption key
   - Only the user can decrypt their personal data
   - Keys are derived from user ID + context + master key

2. **Global Encryption**: Application-level encryption for shared data
   - Single key per context (e.g., 'emoji', 'message')
   - All authenticated users can decrypt global data
   - Used for approved/public content

### Key Management

- **Key Derivation**: Uses PBKDF2 with 100,000 iterations
- **Key Caching**: In-memory caching for performance
- **Key Rotation**: Support for rotating encryption keys
- **Secure Storage**: Keys are never stored in plaintext

### Encryption Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **IV Size**: 128 bits (randomly generated per encryption)
- **Authentication**: Built-in authentication with GCM mode
- **Additional Authenticated Data**: Context-specific AAD for integrity

## Base Encryption Service

### Core Classes

#### `BaseEncryptionService`

Generic encryption service that provides the foundation for all encryption operations.

```typescript
import { BaseEncryptionService } from './base-encryption';

// Encrypt personal data
const encrypted = await BaseEncryptionService.encrypt(data, {
  scope: 'personal',
  context: 'message',
  userId: 123
});

// Encrypt global data
const globalEncrypted = await BaseEncryptionService.encrypt(data, {
  scope: 'global',
  context: 'announcement'
});

// Decrypt data
const decrypted = await BaseEncryptionService.decrypt(encrypted, {
  userId: 123 // Only needed for personal scope
});
```

#### `EncryptionUtils`

Utility functions for encryption operations.

```typescript
import { EncryptionUtils } from './base-encryption';

// Serialize encrypted payload for storage
const serialized = EncryptionUtils.serializePayload(encrypted);

// Parse serialized payload
const parsed = EncryptionUtils.parsePayload(serialized);

// Generate secure IDs
const id = EncryptionUtils.generateSecureId('prefix');

// Sanitize data for XSS prevention
const clean = EncryptionUtils.sanitizeData(userInput);
```

### Types and Interfaces

```typescript
// Encryption scope
type EncryptionScope = 'personal' | 'global';

// Context identifier
type EncryptionContext = string; // e.g., 'emoji', 'message', 'file'

// Encryption options
interface EncryptionOptions {
  scope: EncryptionScope;
  context: EncryptionContext;
  userId?: number; // Required for personal scope
  additionalData?: string; // Additional authenticated data
}

// Encrypted payload
interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  authTag: string;
  scope: EncryptionScope;
  context: EncryptionContext;
  keyId: string;
}
```

## Emoji Encryption Service

### Overview

The `EmojiEncryptionService` is a specialized implementation of the base encryption service for emoji data.

### Features

- **Image Encryption**: Specialized methods for encrypting/decrypting emoji images
- **Validation**: Image format and size validation
- **Re-encryption**: Convert personal emojis to global when approved
- **Metadata Sanitization**: XSS protection for emoji metadata

### Usage Example

```typescript
import {
  EmojiEncryptionService,
  EmojiEncryptionUtils
} from './emoji-encryption';

// Encrypt emoji image (personal)
const encryptedImage = await EmojiEncryptionService.encryptImageData(
  imageBuffer,
  'personal',
  userId
);

// Decrypt emoji image
const decryptedImage = await EmojiEncryptionService.decryptImageData(
  encryptedImage,
  userId
);

// Re-encrypt for global access (admin approval)
const globalEncrypted = await EmojiEncryptionService.reencryptForGlobalAccess(
  personalEncrypted,
  originalUserId
);

// Validate image constraints
const validation = EmojiEncryptionService.validateImageConstraints(
  imageBuffer,
  'png'
);

// Generate emoji ID
const emojiId = EmojiEncryptionUtils.generateEmojiId('happy_face', userId);

// Sanitize emoji metadata
const clean = EmojiEncryptionUtils.sanitizeEmojiData({
  name: 'Happy Face',
  description: 'A smiling emoji',
  aliases: ['smile', 'happy'],
  tags: ['emotion', 'positive']
});
```

## Database Schema

### User Encryption Keys

```sql
CREATE TABLE user_encryption_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encryption_key_hash TEXT NOT NULL,
    key_salt TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

### Application Encryption Keys

```sql
CREATE TABLE application_encryption_keys (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL UNIQUE,
    key_purpose VARCHAR(200) NOT NULL,
    encryption_key_hash TEXT NOT NULL,
    key_salt TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(key_name, is_active)
);
```

## Environment Variables

Set these environment variables for production:

```bash
# Global encryption master key
GLOBAL_ENCRYPTION_MASTER_KEY=your-secure-global-master-key

# Personal encryption master key
PERSONAL_ENCRYPTION_MASTER_KEY=your-secure-personal-master-key
```

⚠️ **Security Warning**: Never use the default keys in production!

## Security Considerations

### Best Practices

1. **Key Rotation**: Regularly rotate encryption keys
2. **Environment Variables**: Use secure, random master keys in production
3. **Access Control**: Implement proper permission checks before encryption/decryption
4. **Input Validation**: Always validate and sanitize input data
5. **Audit Logging**: Log encryption/decryption operations for security monitoring

### Admin Role Security

⚠️ **CRITICAL SECURITY**: Admin roles can ONLY be assigned through direct database access.

The permission system includes the following security measures:

- Admin role assignment is blocked in all UI/API endpoints
- Role assignment requires `admin.roles.manage` permission
- All role operations are logged for audit purposes
- Multiple security checks prevent bypassing admin role restrictions

To assign admin role to a user, use direct database access:

```sql
-- Only run this with direct database access
INSERT INTO user_role_assignments (user_id, role_id, assigned_by)
SELECT
    (SELECT id FROM users WHERE username = 'target_username'),
    (SELECT id FROM user_roles WHERE name = 'admin'),
    (SELECT id FROM users WHERE username = 'admin_username');
```

### Data Flow Security

1. **Personal Data**: User uploads → Personal encryption → Database storage
2. **Admin Approval**: Personal data → Decrypt → Re-encrypt with global key
3. **Global Access**: Global encrypted data → Any authenticated user can decrypt

## Performance Considerations

### Caching

- Keys are cached in memory to avoid repeated database calls
- Cache is automatically cleared on key rotation
- Use `BaseEncryptionService.clearKeyCache()` to manually clear cache

### Optimization Tips

1. **Batch Operations**: Process multiple items together when possible
2. **Key Reuse**: Cache frequently used keys
3. **Async Operations**: Use async/await for all encryption operations
4. **Validation First**: Validate data before encryption to avoid unnecessary work

## Error Handling

### Common Errors

- `User ID required for personal encryption`: Missing userId for personal scope
- `Invalid encrypted payload format`: Corrupted or invalid encrypted data
- `Failed to retrieve encryption key`: Database or key derivation issues
- `Can only re-encrypt personal data to global`: Attempting to re-encrypt global data

### Error Recovery

1. **Key Issues**: Try clearing cache and regenerating keys
2. **Validation Errors**: Check input data format and constraints
3. **Permission Errors**: Verify user has required permissions
4. **Database Errors**: Check database connectivity and schema

## Migration Guide

### From Old Emoji System

The new system is backward compatible with the old emoji encryption system:

1. **Existing Data**: Old encrypted emojis continue to work
2. **New Features**: Use new encryption methods for new data
3. **Gradual Migration**: Migrate data during admin approval process

### API Changes

- `EncryptionType` remains the same (`'personal' | 'global'`)
- `EmojiEncryptedData` extends `EncryptedPayload` with emoji context
- All existing API endpoints continue to work

## Testing

### Unit Tests

```typescript
import { BaseEncryptionService, EncryptionUtils } from './base-encryption';

describe('BaseEncryptionService', () => {
  test('should encrypt and decrypt personal data', async () => {
    const data = 'test data';
    const encrypted = await BaseEncryptionService.encrypt(data, {
      scope: 'personal',
      context: 'test',
      userId: 123
    });

    const decrypted = await BaseEncryptionService.decrypt(encrypted, {
      userId: 123
    });

    expect(decrypted).toBe(data);
  });
});
```

### Integration Tests

Test the complete flow from API to encryption:

1. User uploads emoji
2. Emoji is encrypted with personal key
3. Admin approves emoji
4. Emoji is re-encrypted with global key
5. All users can access approved emoji

## Troubleshooting

### Debug Checklist

1. **Environment Variables**: Verify master keys are set
2. **Database Schema**: Ensure encryption tables exist
3. **Permissions**: Check user has required permissions
4. **Key Cache**: Try clearing cache if key issues persist
5. **Logs**: Check console for encryption error messages

### Common Issues

- **Performance**: Clear key cache if operations are slow
- **Permissions**: Verify admin permissions are correctly set
- **Data Corruption**: Validate encrypted payloads before processing
- **Key Rotation**: Ensure old data is re-encrypted after key rotation

## API Reference

### BaseEncryptionService Methods

- `encrypt(data, options)`: Encrypt data with specified options
- `decrypt(payload, options)`: Decrypt encrypted payload
- `encryptBinary(buffer, options)`: Encrypt binary data
- `decryptBinary(payload, options)`: Decrypt binary data
- `reencryptPersonalToGlobal(payload, userId)`: Re-encrypt personal to global
- `getPersonalKey(userId, context)`: Get/generate personal key
- `getGlobalKey(context)`: Get/generate global key
- `rotatePersonalKey(userId, context)`: Rotate personal key
- `clearKeyCache()`: Clear key cache

### EmojiEncryptionService Methods

- `encryptImageData(buffer, type, userId)`: Encrypt emoji image
- `decryptImageData(payload, userId)`: Decrypt emoji image
- `reencryptForGlobalAccess(payload, userId)`: Re-encrypt for global access
- `validateImageConstraints(buffer, format)`: Validate image
- `rotateEmojiKey(userId)`: Rotate emoji key for user

### EmojiEncryptionUtils Methods

- `createEncryptedPayload(data)`: Serialize encrypted data
- `parseEncryptedPayload(payload)`: Parse encrypted data
- `generateEmojiId(name, userId)`: Generate unique emoji ID
- `validateEmojiMetadata(metadata)`: Validate emoji metadata
- `sanitizeEmojiData(data)`: Sanitize emoji data for XSS prevention
