'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import React from 'react';
import { CONTEXT_IDS } from 'src/lib/context-ids';
import { NAV_PATHS } from 'src/lib/routes';
import { PaginationProvider } from 'src/lib/state/PaginationContext';
import { FiltersProvider } from '../../../lib/state/FiltersContext';
import { PostFilters } from '../../posts/page';
import { Filter } from '../filter-bar/FilterBar';
import './PageContainer.css';

export function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tagSearchParams = searchParams.get('tags');
  const pageSearchParam = searchParams.get('page');
  const isPosts = pathname === NAV_PATHS.POSTS;
  const isMyPosts = pathname === NAV_PATHS.MY_POSTS;

  let contextId = CONTEXT_IDS.DEFAULT.toString();

  if (isPosts) {
    contextId = CONTEXT_IDS.POSTS.toString();
  }

  if (isMyPosts) {
    contextId = CONTEXT_IDS.MY_POSTS.toString();
  }

  const filters: Filter<PostFilters>[] = tagSearchParams
    ? [{ name: 'tags', value: tagSearchParams }]
    : [];

  const currentPage = Number(pageSearchParam) || 1;

  return (
    <PaginationProvider
      value={{
        [contextId]: {
          id: contextId,
          currentPage
        }
      }}
    >
      <FiltersProvider value={{ [contextId]: { filters, id: contextId } }}>
        <section className="page__container">{children}</section>
      </FiltersProvider>
    </PaginationProvider>
  );
}
