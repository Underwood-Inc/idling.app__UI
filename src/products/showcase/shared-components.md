---
title: Shared Components
description: React and Svelte component library with Storybook for Stream Suite apps
---

# Shared Components

**What this is:** Workspace package **`@strixun/shared-components`** — dual-framework UI primitives (DataTable, CodeBlock, MultiFileViewer, Tooltips, ErrorDisplay, StatusFlair, charts) consumed by Mods Hub, Access Hub, OTP auth UI, and other suite apps. Storybook 8 for visual docs.

## Package entry

- **Exports:** subpath exports for `./react/*` and `./svelte/*` (see `package.json` — no single root `main`; importers use explicit paths like `@strixun/shared-components/react/DataTable`).
- **Scripts:** `vitest`, `storybook dev -p 6006`, `build-storybook`
- **Stack:** TanStack Table + Virtual, Prism.js, peer React 19 / Svelte 5 in dev

## Representative components (source paths)

| Export | Path under package |
| ------ | ------------------ |
| DataTable | `react/DataTable.tsx`, `svelte/DataTable.svelte` |
| CodeBlock | `react/CodeBlock.tsx`, `svelte/CodeBlock.svelte` |
| ErrorDisplay | `react/ErrorDisplay.tsx`, `svelte/ErrorDisplay.svelte` |
| StrixunSuiteLink | `svelte/StrixunSuiteLink.svelte` |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Import resolution in Vite | Use documented export subpaths — deep imports outside `exports` fail in strict bundlers |
| Storybook vs app React version | App `package.json` may pin React 18 while package dev uses 19 — match consumer peers |

---

**Sources (audited):** `strixun-stream-suite/packages/shared-components/package.json`