'use client';
import Link from 'next/link';
import reactStringReplace from 'react-string-replace';
import { useFilters } from '../../../lib/state/FiltersContext';
import { tagRegex } from '../../../lib/utils/string/tag-regex';

export function TagLink({ value }: { value: string }) {
  const { dispatch } = useFilters();

  return reactStringReplace(value, tagRegex, (match, i) => (
    <Link
      key={`${match}_${i}`}
      onClick={() => {
        dispatch({
          payload: {
            filters: [{ name: 'tags', value: match.toLowerCase() }],
            id: 'default'
          },
          type: 'SET_CURRENT_FILTERS'
        });
      }}
      href={{
        pathname: '/posts',
        query: { tags: match.toLowerCase() }
      }}
    >
      #{match}
    </Link>
  ));
}
