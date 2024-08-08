import React from 'react';
import './PageHeader.css';

export default async function PageHeader({
  children
}: {
  children: React.ReactNode;
}) {
  return <article className="page-header__section">{children}</article>;
}
