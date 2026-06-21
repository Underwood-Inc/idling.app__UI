'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import {
  ABOUT_SECTION_ICON_IDS,
  type AboutSectionIconId,
} from '@molecules/lucide/siteIconCatalog';

export interface AboutSectionTitleProps {
  sectionId: AboutSectionIconId;
  title: string;
}

export function AboutSectionTitle({ sectionId, title }: AboutSectionTitleProps) {
  return (
    <h3 className="about__section-title icon-inline">
      <SiteIcon
        id={ABOUT_SECTION_ICON_IDS[sectionId]}
        className="about__section-icon"
        sizeRem={1}
      />
      {title}
    </h3>
  );
}
