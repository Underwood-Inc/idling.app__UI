'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';
import { FiltersProvider } from '../../../lib/state/FiltersContext';
import { PostFilters } from '../../posts/page';
import { Filter } from '../filter-bar/FilterBar';

export function PageContainer({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tagSearchParams = searchParams.get('tags');

  const filters: Filter<PostFilters>[] = tagSearchParams
    ? [{ name: 'tags', value: tagSearchParams }]
    : [];

  return (
    <FiltersProvider value={{ default: { filters, id: 'default' } }}>
      {children}
    </FiltersProvider>
  );
}
