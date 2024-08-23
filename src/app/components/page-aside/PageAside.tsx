'use client';
import React from 'react';
import './PageAside.css';
import { useSearchParams } from 'next/navigation';
import { Filter } from '../filter-bar/FilterBar';
import { PostFilters } from 'src/app/posts/page';
import { FiltersProvider } from 'src/lib/state/FiltersContext';

export function PageAside({
  bottomMargin = 0,
  children,
  className
}: {
  children: React.ReactNode;
  bottomMargin?: number;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const tagSearchParams = searchParams.get('tags');

  const filters: Filter<PostFilters>[] = tagSearchParams
    ? [{ name: 'tags', value: tagSearchParams }]
    : [];

  return (
    <FiltersProvider value={{ default: { filters, id: 'default' } }}>
      <div className="page-aside__container">
        <aside className={className}>{children}</aside>
        {bottomMargin ? (
          <div style={{ height: `${bottomMargin}rem`, display: 'block' }} />
        ) : null}
      </div>
    </FiltersProvider>
  );
}
