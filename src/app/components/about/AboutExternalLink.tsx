'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';

export interface AboutExternalLinkProps {
  href: string;
  label: string;
}

export function AboutExternalLink({ href, label }: AboutExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}{' '}
      <SiteIcon id="arrowUpRight" className="about__link-icon" sizeRem={0.75} title="Opens in new tab" />
    </a>
  );
}
