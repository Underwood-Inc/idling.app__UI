'use client';
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
    <div className="page-aside__container">
      <aside className={className}>{children}</aside>
      {bottomMargin ? (
        <div style={{ height: `${bottomMargin}rem`, display: 'block' }} />
      ) : null}
    </div>
  );
}
