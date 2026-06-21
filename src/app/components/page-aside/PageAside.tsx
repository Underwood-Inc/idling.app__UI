'use client';
import { PAGE_ASIDE_SELECTORS } from '@lib/test-selectors/components/page-aside.selectors';
import React from 'react';
import './PageAside.css';

export function PageAside({
  bottomMargin = 0,
  children,
  className
}: {
  children: React.ReactNode;
  bottomMargin?: number;
  className?: string;
}) {
  return (
    <div className="page-aside__container" data-testid="page-aside-container">
      <aside className={className} data-testid={PAGE_ASIDE_SELECTORS.ASIDE}>
        <div className="page-aside__panel">
          <div className="page-aside__scroll">{children}</div>
        </div>
      </aside>
      {bottomMargin ? (
        <div style={{ height: `${bottomMargin}rem`, display: 'block' }} />
      ) : null}
    </div>
  );
}
