import React from 'react';
import './PageContent.css';

export default function PageContent({
  children
}: {
  children: React.ReactNode;
}) {
  return <section className="page-content__section">{children}</section>;
}
