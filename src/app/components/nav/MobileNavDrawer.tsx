'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { HEADER_NAV_PATHS, isExternalLink, NAV_GROUPS, NAV_PATHS, ROUTE_KEYS } from '@lib/routes';
import { resolveNavGroupLabel, resolveNavRouteLabel } from '@molecules/i18n/idlingNavI18n';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { InstantLink } from '../ui/InstantLink';
import { IDLING_PRODUCT_NAME } from '@molecules/i18n/idlingProductName';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { LocalizedUserSearch } from './LocalizedUserSearch';
import { MobileNavAuth } from './MobileNavAuth';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MobileNavContentProps {
  onClose: () => void;
}

function MobileNavContent({ onClose }: MobileNavContentProps) {
  const { data: session } = useSession();
  const { ll } = useIdlingLocale();
  const currentPath = usePathname();
  const searchParams = useSearchParams();

  const handleLinkClick = () => {
    // Close drawer when any link is clicked
    onClose();
  };

  return (
    <div className="mobile-nav-drawer__content">
      <div className="mobile-nav-drawer__header">
        <InstantLink
          href="/"
          className="mobile-nav-drawer__brand-link instant-link--brand"
          onClick={handleLinkClick}
        >
          <h2 className="mobile-nav-drawer__title">{IDLING_PRODUCT_NAME}</h2>
        </InstantLink>
        <button
          className="mobile-nav-drawer__close"
          onClick={onClose}
          aria-label={ll.mobile.closeMenuAria()}
        >
          ✕
        </button>
      </div>

      {session ? (
        <div className="mobile-nav-drawer__search">
          <LocalizedUserSearch />
        </div>
      ) : null}

      <nav className="mobile-nav-drawer__nav">
        {Object.entries(NAV_GROUPS).map(([groupKey, group]) => (
          <div
            key={`mobile-group-${groupKey}`}
            className="mobile-nav-drawer__group"
          >
            <h3 className="mobile-nav-drawer__group-title">
              {resolveNavGroupLabel(groupKey, ll)}
            </h3>
            <div className="mobile-nav-drawer__group-items">
              {group.items.map((item) => {
                const key = item as keyof typeof HEADER_NAV_PATHS;
                const value = NAV_PATHS[key as ROUTE_KEYS];
                const isActive = currentPath === value;
                const isExternal = isExternalLink(value);

                const path = value;

                const label = resolveNavRouteLabel(key as ROUTE_KEYS, ll);

                return (
                  <InstantLink
                    key={`mobile-${groupKey}-${item}`}
                    href={path}
                    className={`instant-link instant-link--nav mobile-nav-drawer__item ${isActive ? 'mobile-nav-drawer__item--active' : ''}`}
                    target={isExternal ? '_blank' : undefined}
                    onClick={handleLinkClick}
                  >
                    {label}
                    {isExternal && (
                      <SiteIcon
                        id="arrowUpRight"
                        className="mobile-nav-drawer__external-icon"
                        sizeRem={0.75}
                      />
                    )}
                  </InstantLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mobile-nav-drawer__auth">
        <MobileNavAuth onClose={onClose} />
      </div>
    </div>
  );
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { ll } = useIdlingLocale();
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        overlayRef.current &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector(
        'button, a, input, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const drawerElement = (
    <div
      className="mobile-nav-drawer__overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={ll.mobile.menuAria()}
    >
      <div className="mobile-nav-drawer" ref={drawerRef}>
        <Suspense
          fallback={
            <div className="mobile-nav-drawer__content">
              <div className="mobile-nav-drawer__header">
                <h2 className="mobile-nav-drawer__title">{IDLING_PRODUCT_NAME}</h2>
                <button className="mobile-nav-drawer__close" onClick={onClose}>
                  ✕
                </button>
              </div>
              <div className="mobile-nav-drawer__loading">{ll.common.actions.loading()}</div>
            </div>
          }
        >
          <MobileNavContent onClose={onClose} />
        </Suspense>
      </div>
    </div>
  );

  // Use portal to render outside normal component tree for better z-index control
  if (typeof window !== 'undefined') {
    const portalRoot =
      document.getElementById('overlay-portal') || document.body;
    return createPortal(drawerElement, portalRoot);
  }

  return drawerElement;
}
