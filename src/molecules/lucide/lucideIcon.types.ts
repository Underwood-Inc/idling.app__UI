import type { Undo2 } from 'lucide';

/** Lucide icon node array (vanilla `lucide` package export shape). */
export type LucideIconComponent = typeof Undo2;

export interface LucideIconElementNode {
  0: string;
  1: Record<string, string | number | undefined>;
  2?: LucideIconElementNode[];
  length: 2 | 3;
}

export interface LucideIconProps {
  icon: LucideIconComponent;
  /** Icon box size as a multiple of the parent font size (default 1em). */
  sizeRem?: number;
  className?: string;
  title?: string;
}
