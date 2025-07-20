/* eslint-disable custom-rules/enforce-link-target-blank */
'use client';

import {
  HEADER_NAV_PATHS,
  isExternalLink,
  NAV_GROUPS,
  NAV_PATH_LABELS,
  NAV_PATHS
} from '@lib/routes';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Navbar } from '../navbar/Navbar';
import { InstantLink } from '../ui/InstantLink';

/**
 * Component for rendering an external link icon
 */
function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginLeft: '4px', opacity: 0.7 }}
      aria-label="External link"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/**
 * Component for rendering a navigation group dropdown
 */
function NavGroup({
  groupKey,
  group,
  currentPath,
  searchParams,
  lastPath
}: {
  groupKey: string;
  group: { label: string; items: readonly string[] };
  currentPath: string;
  searchParams: URLSearchParams;
  lastPath: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveItem = group.items.some((item) => {
    const path = HEADER_NAV_PATHS[item as keyof typeof HEADER_NAV_PATHS];
    return currentPath === path;
  });

  return (
    <div className="nav__group">
      <button
        className={`nav__group-trigger ${hasActiveItem ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {group.label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            marginLeft: '4px',
            transition: 'transform 0.2s ease'
          }}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      <div className="nav__group-dropdown">
        {group.items.map((item) => {
          const key = item as keyof typeof HEADER_NAV_PATHS;
          const value = HEADER_NAV_PATHS[key];
          const isActive = currentPath === value;
          const isDisabled = false; // No disabled items in groups
          const isExternal = isExternalLink(value);

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
            <InstantLink
              key={`group-${groupKey}-${item}`}
              href={path}
              className={`nav__group-item ${isActive ? 'active' : ''}`}
              aria-disabled={isDisabled}
              target={isExternal ? '_blank' : undefined}
            >
              {NAV_PATH_LABELS[key]}
              {isExternal && <ExternalLinkIcon />}
            </InstantLink>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Internal NavPaths component that uses useSearchParams
 */
function NavPathsInternal() {
  const [lastPath, setLastPath] = useState('');
  const currentPath = usePathname();
  const searchParams = useSearchParams();
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
      {Object.entries(NAV_GROUPS).map(([groupKey, group]) => (
        <Navbar.Item key={`group--${groupKey}`}>
          <NavGroup
            groupKey={groupKey}
            group={group}
            currentPath={currentPath}
            searchParams={searchParams}
            lastPath={lastPath}
          />
        </Navbar.Item>
      ))}
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
          {Object.entries(NAV_GROUPS).map(([groupKey, group]) => (
            <Navbar.Item key={`group--${groupKey}`}>
              <div className="nav__group">
                <button className="nav__group-trigger">{group.label}</button>
              </div>
            </Navbar.Item>
          ))}
        </>
      }
    >
      <NavPathsInternal />
    </Suspense>
  );
}
