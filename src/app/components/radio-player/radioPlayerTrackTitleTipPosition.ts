export interface RadioPlayerTrackTitleTipRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface RadioPlayerTrackTitleTipViewport {
  width: number;
  height: number;
}

export type RadioPlayerTrackTitleTipPlacement = 'above' | 'below';

export interface RadioPlayerTrackTitleTipPosition {
  top: number;
  left: number;
  placement: RadioPlayerTrackTitleTipPlacement;
}

export interface ResolveRadioPlayerTrackTitleTipPositionInput {
  trigger: RadioPlayerTrackTitleTipRect;
  tip: RadioPlayerTrackTitleTipRect;
  viewport: RadioPlayerTrackTitleTipViewport;
  margin?: number;
  gap?: number;
}

export interface RadioPlayerTrackTitleTipMaxSize {
  maxWidth: number;
  maxHeight: number;
}

const DEFAULT_MARGIN_PX = 8;
const DEFAULT_GAP_PX = 8;
const MAX_WIDTH_CAP_PX = 416;
const MAX_HEIGHT_CAP_PX = 192;

export function resolveRadioPlayerTrackTitleTipMaxSize(
  viewport: RadioPlayerTrackTitleTipViewport
): RadioPlayerTrackTitleTipMaxSize {
  return {
    maxWidth: Math.min(Math.floor(viewport.width * 0.92), MAX_WIDTH_CAP_PX),
    maxHeight: Math.min(Math.floor(viewport.height * 0.4), MAX_HEIGHT_CAP_PX),
  };
}

export function resolveRadioPlayerTrackTitleTipPosition({
  trigger,
  tip,
  viewport,
  margin = DEFAULT_MARGIN_PX,
  gap = DEFAULT_GAP_PX,
}: ResolveRadioPlayerTrackTitleTipPositionInput): RadioPlayerTrackTitleTipPosition {
  const triggerBottom = trigger.top + trigger.height;
  const spaceAbove = trigger.top - margin;
  const spaceBelow = viewport.height - triggerBottom - margin;
  const fitsAbove = spaceAbove >= tip.height + gap;
  const fitsBelow = spaceBelow >= tip.height + gap;

  let placement: RadioPlayerTrackTitleTipPlacement;
  if (fitsAbove && (!fitsBelow || spaceAbove >= spaceBelow)) {
    placement = 'above';
  } else if (fitsBelow) {
    placement = 'below';
  } else {
    placement = spaceAbove >= spaceBelow ? 'above' : 'below';
  }

  let top =
    placement === 'above' ? trigger.top - tip.height - gap : triggerBottom + gap;
  top = Math.max(margin, Math.min(top, viewport.height - tip.height - margin));

  let left = trigger.left + (trigger.width - tip.width) / 2;
  left = Math.max(margin, Math.min(left, viewport.width - tip.width - margin));

  return { top, left, placement };
}
