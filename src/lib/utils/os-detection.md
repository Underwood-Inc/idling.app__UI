---
title: os-detection
description: User-agent OS detection for emoji table selection
---

# os-detection

Maps browser user agents to supported emoji catalogs (`emojis_windows` vs `emojis_mac`).

## Types

- **`SupportedOS`** — `windows` | `mac` | `unknown`
- **`OSInfo`** — `os`, optional `version`, `userAgent`, `isSupported`

## `OSDetection`

| Method | Use |
| ------ | --- |
| `detectFromUserAgent(ua?)` | Client UA parse; iOS maps to `mac` set |
| `detectFromHeaders(headers)` | Server request headers |
| `getEmojiTableName(osInfo)` | `emojis_windows` \| `emojis_mac` \| `null` |

Android/Linux return `unknown` with `isSupported: false`.

## Helpers

- **`getOSFromRequest(req)`** — App Router / Next request wrapper.
- **`useOSDetection()`** — React hook returning current `OSInfo`.

---

**Sources:** `src/lib/utils/os-detection.ts`