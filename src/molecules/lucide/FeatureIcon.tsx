'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';

export interface FeatureIconProps {
  iconId: SiteIconId;
  className?: string;
  sizeRem?: number;
}

export function FeatureIcon({ iconId, className, sizeRem = 1.25 }: FeatureIconProps) {
  return <SiteIcon id={iconId} className={className} sizeRem={sizeRem} />;
}
