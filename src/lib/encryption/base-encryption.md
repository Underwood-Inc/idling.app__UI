---
title: base-encryption
description: AES-GCM encryption with personal and global scopes
---

# base-encryption

`BaseEncryptionService` — key derivation, storage in Postgres via `sql`, encrypt/decrypt round-trip with `EncryptedPayload` (iv, authTag, keyId).

## Types

- **`EncryptionScope`** — `personal` | `global`
- **`EncryptionContext`** — string namespace (`emoji`, `message`, …)
- **`EncryptionKey`**, **`EncryptedPayload`**, **`EncryptionOptions`**

Uses Node `crypto`; logs via `createLogger` when enabled.

Subclassed by emoji-specific service.

---

**Sources:** `src/lib/encryption/base-encryption.ts`