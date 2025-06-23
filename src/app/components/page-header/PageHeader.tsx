import React from 'react';
import './PageHeader.css';

export default function PageHeader({
  children
}: {
  children: React.ReactNode;
}) {
  return <section className="page-header__section">{children}</section>;
}
