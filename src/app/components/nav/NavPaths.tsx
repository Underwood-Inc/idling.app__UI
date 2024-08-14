'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  HEADER_NAV_PATHS,
  NAV_PATH_LABELS,
  NAV_PATHS,
  ROUTES
} from '../../../lib/routes';
import { Navbar } from '../navbar/Navbar';

export function NavPaths() {
  const currentPath = usePathname();
  const searchParams = useSearchParams();
  const paths = Object.entries(HEADER_NAV_PATHS) as [ROUTES, string][];

  return (
    <>
      {paths.map(([key, value]) => {
        const isActive = currentPath === value;
        const isDisabled = key === 'GAME';
        let path = value;

        if (value === NAV_PATHS.POSTS && !!searchParams.get('tags')) {
          path = `${value}?tags=${searchParams.get('tags')}`;
        }

        return (
          <Navbar.Item key={`path--${key}`} isDisabled={isDisabled}>
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
