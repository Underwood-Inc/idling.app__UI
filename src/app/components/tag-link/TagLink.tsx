'use client';
import Link from 'next/link';
import reactStringReplace from 'react-string-replace';
import { tagRegex } from '../../../lib/utils/string/tag-regex';

export function TagLink({ value }: { value: string }) {
  return reactStringReplace(value, tagRegex, (match) => (
    <Link
      key={match}
      href={{
        pathname: '/posts',
        query: { tags: match }
      }}
      shallow={true} // prevents entire page of refetching
    >
      #{match}
    </Link>
  ));
}
