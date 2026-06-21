import type { MermaidContentBox, MermaidViewerState } from './mermaidViewer.types';

export interface FitDiagramToViewportInput {
  viewportWidth: number;
  viewportHeight: number;
  contentBox: MermaidContentBox;
  padding?: number;
  allowUpscale?: boolean;
  maxScale?: number;
}

export function fitDiagramToViewport({
  viewportWidth,
  viewportHeight,
  contentBox,
  padding = 24,
  allowUpscale = true,
  maxScale = 5,
}: FitDiagramToViewportInput): MermaidViewerState {
  const safeWidth = Math.max(contentBox.width, 1);
  const safeHeight = Math.max(contentBox.height, 1);
  const innerWidth = Math.max(viewportWidth - padding * 2, 1);
  const innerHeight = Math.max(viewportHeight - padding * 2, 1);

  const rawScale = Math.min(innerWidth / safeWidth, innerHeight / safeHeight);
  const cappedScale = allowUpscale ? Math.min(rawScale, maxScale) : Math.min(rawScale, 1);
  const scale = Math.max(cappedScale, 0.05);

  const translateX =
    padding + (innerWidth - safeWidth * scale) / 2 - contentBox.x * scale;
  const translateY =
    padding + (innerHeight - safeHeight * scale) / 2 - contentBox.y * scale;

  return { scale, translateX, translateY };
}
