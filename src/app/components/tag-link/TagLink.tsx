'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import reactStringReplace from 'react-string-replace';
import { usePagination } from 'src/lib/state/PaginationContext';
import { useFilters } from '../../../lib/state/FiltersContext';
import { tagRegex } from '../../../lib/utils/string/tag-regex';

/**
 * A component that will return a nextjs link component instance that navigates to the /posts page with a filter applied that
 * matches the TagLink
 * @example <TagLink value="bacon" /> => a link that navigates to '/posts?tags=bacon'
 */
export function TagLink({
  value,
  appendSearchParam = false,
  contextId
}: {
  value: string;
  appendSearchParam?: boolean;
  contextId: string;
}) {
  const { dispatch: dispatchFilters } = useFilters();
  const { dispatch: dispatchPagination } = usePagination();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tagSearchParams = searchParams.get('tags');

  // you normally would not use an onClick with a nextjs Link component however, we need to ensure filters are updated in the
  // client context so as to ensure certain UI/X behaviours occur
  const onClick = (tag: string) => {
    if (!tagSearchParams?.includes(tag)) {
      dispatchFilters({
        payload: {
          filters: [
            {
              name: 'tags',
              value:
                tagSearchParams && appendSearchParam
                  ? `${tagSearchParams},${tag.toLowerCase()}`
                  : tag.toLowerCase()
            }
          ],
          id: contextId
        },
        type: 'SET_CURRENT_FILTERS'
      });
      // ensure we are on page 1
      dispatchPagination({
        payload: {
          currentPage: 1,
          id: contextId
        },
        type: 'SET_CURRENT_PAGE'
      });
    }
  };

  // dynamic anchors, huzzah
  const getHref = (tag: string) => {
    // ensure we do not construct URLs with duplicate tags
    if (!tagSearchParams?.includes(tag)) {
      return tagSearchParams
        ? `${pathname}?tags=${tagSearchParams},${tag.toLowerCase()}`
        : `${pathname}?tags=${tag.toLowerCase()}`;
    }

    return `${pathname}?tags=${tagSearchParams}`;
  };

  // using reactStringReplace we can leverage the power of regex and return React nodes.
  // normally, this would blow up using a vanilla regex replace string match
  return reactStringReplace(value, tagRegex, (match, i) => (
    <Link
      key={`${match}_${i}`}
      onClick={() => onClick(match)}
      href={getHref(match)}
      prefetch={false}
    >
      #{match}
    </Link>
  ));
}
