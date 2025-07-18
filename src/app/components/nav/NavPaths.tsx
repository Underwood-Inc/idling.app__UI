/* eslint-disable custom-rules/enforce-link-target-blank */
'use client';

import {
  HEADER_NAV_PATHS,
  NAV_PATH_LABELS,
  NAV_PATHS,
  ROUTES
} from '@lib/routes';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Navbar } from '../navbar/Navbar';
import { InstantLink } from '../ui/InstantLink';

/**
 * Internal NavPaths component that uses useSearchParams
 */
function NavPathsInternal() {
  const [lastPath, setLastPath] = useState('');
  const currentPath = usePathname();
  const searchParams = useSearchParams();
  const paths = Object.entries(HEADER_NAV_PATHS) as [ROUTES, string][];
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isFirstRender.current) {
      setLastPath(`${currentPath}${searchParams.get('tags') || ''}`);
    } else {
      isFirstRender.current = false;
    }
  }, [currentPath, searchParams]);

  return (
    <>
      {paths.map(([key, value]) => {
        const isActive = currentPath === value;
        const isDisabled = key === 'GAME';
        let path = value;
        const tags = searchParams.get('tags');

        const isTagSupportedRoute =
          value === NAV_PATHS.POSTS || value === NAV_PATHS.MY_POSTS;

        if (isTagSupportedRoute && tags) {
          if (lastPath === '' || lastPath.startsWith(value)) {
            path = `${value}?tags=${tags}`;
          }
        }

        return (
          <Navbar.Item key={`path--${key}`} isDisabled={isDisabled}>
            <InstantLink
              href={path}
              className={`instant-link--nav ${isActive ? 'active' : ''}`}
              aria-disabled={isDisabled}
            >
              {NAV_PATH_LABELS[key]}
            </InstantLink>
          </Navbar.Item>
        );
      })}
    </>
  );
}

/**
 * Main NavPaths component with Suspense wrapper
 */
export function NavPaths() {
  return (
    <Suspense
      fallback={
        <>
          {Object.entries(HEADER_NAV_PATHS).map(([key, value]) => (
            <Navbar.Item key={`path--${key}`} isDisabled={key === 'GAME'}>
              <InstantLink
                href={value}
                aria-disabled={key === 'GAME'}
                className="instant-link--nav"
              >
                {NAV_PATH_LABELS[key as ROUTES]}
              </InstantLink>
            </Navbar.Item>
          ))}
        </>
      }
    >
      <NavPathsInternal />
    </Suspense>
  );
}
