import type { IconNode } from 'lucide';

/** Lucide icon node array (vanilla `lucide` package export shape). */
export type LucideIconComponent = IconNode;

export type LucideIconElementNode = [string, Record<string, string | number | undefined>];

export interface LucideIconProps {
  icon: LucideIconComponent;
  /** Icon box size as a multiple of the parent font size (default 1em). */
  sizeRem?: number;
  className?: string;
  title?: string;
}
