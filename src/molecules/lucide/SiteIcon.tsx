'use client';

import { LucideIcon } from './LucideIcon';
import { SITE_ICON_CATALOG, type SiteIconId } from './siteIconCatalog';

export interface SiteIconProps {
  id: SiteIconId;
  /** Icon box size as a multiple of the parent font size (default 1em). */
  sizeRem?: number;
  className?: string;
  /** Accessible name when the icon conveys meaning without visible text. */
  title?: string;
}

export function SiteIcon({ id, sizeRem = 1, className, title }: SiteIconProps) {
  const entry = SITE_ICON_CATALOG[id];

  return (
    <LucideIcon
      icon={entry.icon}
      sizeRem={sizeRem}
      className={className}
      title={title ?? entry.label}
    />
  );
}
