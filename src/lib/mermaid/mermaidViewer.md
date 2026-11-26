---
title: mermaidViewer
description: Pan/zoom controls for rendered Mermaid diagrams
---

# mermaidViewer

Client utilities ported from legacy static viewer — wraps rendered `.mermaid` nodes with interactive controls (zoom, pan, fit, fullscreen).

## API

- **`enhanceMermaidDiagram(diagram)`** — Upgrade one element.
- **`enhanceMermaidDiagrams(root?)`** — Scan `document` or container.
- Re-exports **`MermaidContentBox`**, **`MermaidDiagramElement`**, **`MermaidViewerState`** from `mermaidViewer.types`.

Uses `fitDiagramToViewport` and diagram-type detection for flowchart, sequence, class, etc.

---

**Sources:** `src/lib/mermaid/mermaidViewer.ts`, `src/lib/mermaid/mermaidViewer.types.ts`