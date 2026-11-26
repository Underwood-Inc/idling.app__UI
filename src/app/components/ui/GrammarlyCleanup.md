---
title: GrammarlyCleanup
description: Strips Grammarly body attributes that break React hydration
---

# GrammarlyCleanup

Renderless client component (`return null`) that removes Grammarly-injected `data-*` attributes from `document.body` after hydration.

## Behavior

- Runs `cleanupGrammarlyAttributes` on mount (`data-new-gr-c-s-check-loaded`, `data-gr-ext-installed`).
- `MutationObserver` on `body` attribute changes re-runs cleanup when Grammarly re-attaches.
- Disconnects observer on unmount.

## Usage

Mount once in the root client shell (alongside other global hygiene components) on pages where Grammarly browser extension is common.

---

**Sources:** `src/app/components/ui/GrammarlyCleanup.tsx`