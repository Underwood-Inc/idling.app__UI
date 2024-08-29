'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  HEADER_NAV_PATHS,
  NAV_PATH_LABELS,
  NAV_PATHS,
  ROUTES
} from '../../../lib/routes';
import { Navbar } from '../navbar/Navbar';

export function NavPaths() {
  const [lastPath, setLastPath] = useState('');
  const currentPath = usePathname();
  const searchParams = useSearchParams();
  const paths = Object.entries(HEADER_NAV_PATHS) as [ROUTES, string][];

  useEffect(() => {
    setLastPath(`${currentPath}${searchParams.get('tags')}`);
  }, [currentPath, searchParams]);

  return (
    <>
      {paths.map(([key, value]) => {
        const isActive = currentPath === value;
        const isDisabled = key === 'GAME';
        let path = value;
        const tentativePath = `${value}?tags=${searchParams.get('tags')}`;

        if (lastPath !== `${currentPath}${searchParams.get('tags')}`) {
          const isTagSupportedRoute =
            value === NAV_PATHS.POSTS || value === NAV_PATHS.MY_POSTS;
          const canAppendTags =
            isTagSupportedRoute && !!searchParams.get('tags');

          if (canAppendTags) {
            path = tentativePath;
          }
        }

        return (
          <Navbar.Item key={`path--${key}`} isDisabled={isDisabled}>
            {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
            <Link
              href={path}
              className={isActive ? 'active' : ''}
              aria-disabled={isDisabled}
            >
              {NAV_PATH_LABELS[key]}
            </Link>
          </Navbar.Item>
        );
      })}
    </>
  );
}
