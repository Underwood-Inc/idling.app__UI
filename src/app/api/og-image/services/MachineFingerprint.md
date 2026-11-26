---
title: MachineFingerprintService
description: Guest identification for OG quota enforcement
---

# MachineFingerprintService

**Server-only** (not middleware). Builds stable guest identity from `NextRequest` headers plus optional client hints.

## `generateFingerprint(request, clientData?)`

Returns `MachineFingerprint` (`fingerprintId`, IP, UA, language, encoding, platform, timezone, screen) and `FingerprintComponents` for fuzzy overlap matching.

`fingerprintId` = first 16 hex chars of SHA-256 over joined component strings. IP hashed; UA parsed into browser/OS families.

Additional methods in file support similarity scoring across partial component matches (guest abuse resistance).

---

**Sources:** `src/app/api/og-image/services/MachineFingerprint.ts`