'use client';

import { useSearchParams } from 'next/navigation';
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

  return <div className={`navbar__body ${className}`}>{children}</div>;
}
