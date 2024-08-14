'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import reactStringReplace from 'react-string-replace';
import { useFilters } from '../../../lib/state/FiltersContext';
import { tagRegex } from '../../../lib/utils/string/tag-regex';

export function TagLink({
  value,
  appendSearchParam = false
}: {
  value: string;
  appendSearchParam?: boolean;
}) {
  const { dispatch } = useFilters();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tagSearchParams = searchParams.get('tags');

  const onClick = (tag: string) => {
    if (!tagSearchParams?.includes(tag)) {
      dispatch({
        payload: {
          filters: [
            {
              name: 'tags',
              value: tagSearchParams
                ? `${tagSearchParams},${tag.toLowerCase()}`
                : tag.toLowerCase()
            }
          ],
          id: 'default'
        },
        type: 'SET_CURRENT_FILTERS'
      });
    }
  };

  const getHref = (tag: string) => {
    if (!tagSearchParams?.includes(tag)) {
      return tagSearchParams
        ? `${pathname}?tags=${tagSearchParams},${tag.toLowerCase()}`
        : `${pathname}?tags=${tag.toLowerCase()}`;
    }

    return `${pathname}?tags=${tagSearchParams}`;
  };

  return reactStringReplace(value, tagRegex, (match, i) => (
    <Link
      key={`${match}_${i}`}
      onClick={() => onClick(match)}
      href={getHref(match)}
    >
      #{match}
    </Link>
  ));
}
