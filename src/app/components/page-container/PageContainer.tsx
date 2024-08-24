'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import React from 'react';
import { FILTER_IDS } from 'src/lib/filter-ids';
import { NAV_PATHS } from 'src/lib/routes';
import { FiltersProvider } from '../../../lib/state/FiltersContext';
import { PostFilters } from '../../posts/page';
import { Filter } from '../filter-bar/FilterBar';
import './PageContainer.css';

export function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tagSearchParams = searchParams.get('tags');
  const isPosts = pathname === NAV_PATHS.POSTS;
  const isMyPosts = pathname === NAV_PATHS.MY_POSTS;

  let filterId = FILTER_IDS.DEFAULT.toString();

  if (isPosts) {
    filterId = FILTER_IDS.POSTS.toString();
  }

  if (isMyPosts) {
    filterId = FILTER_IDS.MY_POSTS.toString();
  }

  const filters: Filter<PostFilters>[] = tagSearchParams
    ? [{ name: 'tags', value: tagSearchParams }]
    : [];

  return (
    <FiltersProvider value={{ default: { filters, id: filterId } }}>
      <section className="page__container">{children}</section>
    </FiltersProvider>
  );
}
