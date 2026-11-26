---
title: tooltip index
description: Public exports for tooltip components
---

# tooltip (barrel)

Re-exports the tooltip surface used across posts, mentions, and links.

## Exports

- `InteractiveTooltip`
- `LinkTooltip`
- `MentionTooltip`
- `TooltipContent`
- `TooltipModal`

`InfoTooltip` and `WebPreviewPortal` are imported directly from their files when needed. Modal global state for link tooltips may use `link-tooltip-modal-atom.ts` (Jotai).

---

**Sources:** `src/app/components/tooltip/index.ts`