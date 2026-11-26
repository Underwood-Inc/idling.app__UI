---
title: Control Panel
description: Local React dev shell for suite component experiments
---

# Control Panel

**What this is:** Vite **React 19** app **`@strixun/control-panel`** — lightweight local UI for developing and previewing suite patterns without loading the full Streamkit root Svelte app. **Not** deployed to a public `*.idling.app` hostname in `wrangler.toml`; operators run it on the monorepo dev port (**5175** per suite `DEV_SCRIPTS.md`).

## Frontend entry

- **Package:** `strixun-stream-suite/apps/control-panel/package.json` (v1.0.0)
- **Bootstrap:** `apps/control-panel/src/main.tsx` → `App`
- **Scripts:** `vite` dev; `tsc -b && vite build` for production bundle
- **Stack:** `styled-components` theming (tokens aligned with idling.app gold/dark palette)

## Dev workflow

From monorepo root:

```text
pnpm --filter @strixun/control-panel dev
```

No OTP wiring in this app (see suite login E2E coverage matrix — control-panel is auth N/A).

Part of [Stream Suite](/products/stream-suite) operator tooling.

---

**Sources (audited):** `strixun-stream-suite/apps/control-panel/package.json`, `strixun-stream-suite/apps/control-panel/src/main.tsx`