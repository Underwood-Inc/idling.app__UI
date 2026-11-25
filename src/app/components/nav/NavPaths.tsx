/* eslint-disable custom-rules/enforce-link-target-blank */
'use client';

import {
  HEADER_NAV_PATHS,
  isExternalLink,
  NAV_GROUPS,
  ROUTE_KEYS,
} from '@lib/routes';
import {
  resolveNavExternalLinkAria,
  resolveNavGroupLabel,
  resolveNavRouteLabel,
} from '@molecules/i18n/idlingNavI18n';
import { usePathname } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Navbar } from '../navbar/Navbar';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { InstantLink } from '../ui/InstantLink';

/**
 * Component for rendering an external link icon
 */
function ExternalLinkIcon({ label }: { label: string }) {
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
      aria-label={label}
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
}: {
  groupKey: string;
  group: { items: readonly ROUTE_KEYS[] };
  currentPath: string;
}) {
  const { ll } = useIdlingLocale();
  const [isOpen, setIsOpen] = useState(false);
  const groupLabel = resolveNavGroupLabel(groupKey, ll);

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
        {groupLabel}
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

          const path = value;

          return (
            <InstantLink
              key={`group-${groupKey}-${item}`}
              href={path}
              className={`instant-link instant-link--nav nav__group-item ${isActive ? 'active' : ''}`}
              aria-disabled={isDisabled}
              target={isExternal ? '_blank' : undefined}
            >
              {resolveNavRouteLabel(key, ll)}
              {isExternal && <ExternalLinkIcon label={resolveNavExternalLinkAria(ll)} />}
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
function NavPathsFallback() {
  const { ll } = useIdlingLocale();
  return (
    <>
      {Object.entries(NAV_GROUPS).map(([groupKey, group]) => (
        <Navbar.Item key={`group--${groupKey}`}>
          <div className="nav__group">
            <button className="nav__group-trigger">
              {resolveNavGroupLabel(groupKey, ll)}
            </button>
          </div>
        </Navbar.Item>
      ))}
    </>
  );
}

function NavPathsInternal() {
  const currentPath = usePathname();

  return (
    <>
      {Object.entries(NAV_GROUPS).map(([groupKey, group]) => (
        <Navbar.Item key={`group--${groupKey}`}>
          <NavGroup
            groupKey={groupKey}
            group={group}
            currentPath={currentPath}
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
    <Suspense fallback={<NavPathsFallback />}>
      <NavPathsInternal />
    </Suspense>
  );
}
