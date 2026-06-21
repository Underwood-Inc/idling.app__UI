'use client';

import { createElement } from 'react';
import './lucide-icon.css';
import type { LucideIconElementNode, LucideIconProps } from './lucideIcon.types';

const DEFAULT_SVG_ATTRIBUTES = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function lucideIconClassName(className?: string): string {
  return className ? `lucide-icon ${className}` : 'lucide-icon';
}

function renderLucideNode(node: LucideIconElementNode, key: string) {
  const [tag, attrs] = node;

  return createElement(tag, { key, ...attrs });
}

export function LucideIcon({ icon, sizeRem = 1, className, title }: LucideIconProps) {
  return (
    <span
      className={lucideIconClassName(className)}
      style={{ fontSize: `${sizeRem}em` }}
      aria-hidden={title ? undefined : true}
      title={title}
      role={title ? 'img' : undefined}
    >
      {createElement(
        'svg',
        {
          ...DEFAULT_SVG_ATTRIBUTES,
          color: 'currentColor',
        },
        icon.map((node, index) => renderLucideNode(node, `icon-${index}`))
      )}
    </span>
  );
}
