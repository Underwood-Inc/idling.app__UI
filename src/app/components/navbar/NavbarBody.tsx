'use client';

import { useSearchParams } from 'next/navigation';
import { FiltersProvider } from '../../../lib/state/FiltersContext';
import { PaginationProvider } from '../../../lib/state/PaginationContext';
import { dedupeStringArray } from '../../../lib/utils/array/dedupe-string-array';
import { PostFilters } from '../../posts/page';
import { Filter } from '../filter-bar/FilterBar';

export function NavbarBody({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const tagSearchParams = searchParams.get('tags');

  const filters: Filter<PostFilters>[] = tagSearchParams
    ? [
        {
          name: 'tags',
          value: dedupeStringArray(tagSearchParams.split(',')).join(',')
        }
      ]
    : [];

  return (
    <PaginationProvider>
      <FiltersProvider value={{ default: { filters, id: 'default' } }}>
        <div className={`navbar__body ${className}`}>{children}</div>
      </FiltersProvider>
    </PaginationProvider>
  );
}
