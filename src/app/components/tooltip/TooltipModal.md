---
title: TooltipModal
description: Portal modal iframe for extended link previews (ctrl-click path)
---

# TooltipModal

Rendered only when `showModal && enableCtrlClick`.

## Props

| Prop | Role |
|------|------|
| `url` | iframe `src` |
| `isFullscreen`, `showControls` | Layout toggles |
| `modalContentRef` | Focus/measure target |
| `onModalClose` | Backdrop click |
| `onModalContentClick` | Stop propagation into iframe shell |
| `onFullscreenToggle`, `onControlsToggle` | Chrome buttons |

## Markup

`ReactDOM.createPortal` → `link-preview-modal` with optional fullscreen class on content; control bar can hide until toggled. `data-testid="link-preview-modal"`.

---

**Sources:** `src/app/components/tooltip/TooltipModal.tsx`