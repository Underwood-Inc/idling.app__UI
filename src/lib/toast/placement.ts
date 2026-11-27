import type { ToastVariant } from './types';

export type ToastViewportPlacement =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left';

export const DEFAULT_TOAST_PLACEMENT: ToastViewportPlacement = 'top-right';

/** Per-variant anchors — all top-right until product asks for split viewports. */
export const TOAST_PLACEMENT_BY_VARIANT: Record<
  ToastVariant,
  ToastViewportPlacement
> = {
  info: 'top-right',
  success: 'top-right',
  warning: 'top-right',
  error: 'top-right',
};

export const ACTIVE_TOAST_VIEWPORTS: readonly ToastViewportPlacement[] = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
] as const;

export function resolveToastPlacement(variant: ToastVariant): ToastViewportPlacement {
  return TOAST_PLACEMENT_BY_VARIANT[variant] ?? DEFAULT_TOAST_PLACEMENT;
}