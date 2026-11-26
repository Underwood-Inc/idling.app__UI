---
title: EmojiEncryptionService
description: Encrypt/decrypt custom emoji image payloads
---

# EmojiEncryptionService

Extends `BaseEncryptionService` for `context: 'emoji'`.

## Types

`EncryptionType` (`personal` | `global`), `EmojiEncryptedData`.

## API

- `encryptImageData(buffer, type, userId?)` — personal scope requires `userId`
- `decryptImageData(payload, userId?)` — validates max 1MB / 512px dimensions (see class constants)

Used by `emoji.actions` on upload and when serving custom emoji bytes.

---

**Sources:** `src/lib/encryption/emoji-encryption.ts`