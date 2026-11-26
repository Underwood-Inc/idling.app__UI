---
title: linkTooltipModalAtom
description: Jotai atom for link preview modal open state
---

# linkTooltipModalAtom

```typescript
export const linkTooltipModalAtom = atom<boolean>(false);
```

Boolean Jotai atom toggling link-preview modal visibility where tooltip flows need shared client state outside React context trees.

## Usage

Import from this module in client components; read/write with Jotai hooks alongside `LinkTooltip` / `TooltipModal` ctrl-click UX.

---

**Sources:** `src/app/components/tooltip/link-tooltip-modal-atom.ts`