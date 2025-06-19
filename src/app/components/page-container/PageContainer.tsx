'use client';
import React from 'react';
import './PageContainer.css';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <section className="page__container">{children}</section>;
}
