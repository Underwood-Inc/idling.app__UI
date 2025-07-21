'use client';

import { NAV_GROUPS } from '@lib/routes';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { InstantLink } from '../ui/InstantLink';
import { UserSearch } from '../user-search/UserSearch';
import { MobileNavAuth } from './MobileNavAuth';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MobileNavContentProps {
  onClose: () => void;
}

function MobileNavContent({ onClose }: MobileNavContentProps) {
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
          className="mobile-nav-drawer__brand-link"
          onClick={handleLinkClick}
        >
          <h2 className="mobile-nav-drawer__title">Idling.app</h2>
        </InstantLink>
        <button
          className="mobile-nav-drawer__close"
          onClick={onClose}
          aria-label="Close mobile menu"
        >
          ✕
        </button>
      </div>

      <div className="mobile-nav-drawer__search">
        <UserSearch placeholder="Find users..." />
      </div>

      <nav className="mobile-nav-drawer__nav">
        {Object.entries(NAV_GROUPS).map(([groupKey, group]) => (
          <div
            key={`mobile-group-${groupKey}`}
            className="mobile-nav-drawer__group"
          >
            <h3 className="mobile-nav-drawer__group-title">{group.label}</h3>
            <div className="mobile-nav-drawer__group-items">
              {group.items.map((item) => {
                const key =
                  item as keyof typeof import('@lib/routes').NAV_PATHS;
                const routeModule = require('@lib/routes');
                const value = routeModule.NAV_PATHS[key];
                const isActive = currentPath === value;
                const isExternal = value.startsWith('http');

                let path = value;
                const tags = searchParams.get('tags');
                const isTagSupportedRoute =
                  value === routeModule.NAV_PATHS.POSTS ||
                  value === routeModule.NAV_PATHS.MY_POSTS;

                if (isTagSupportedRoute && tags) {
                  path = `${value}?tags=${tags}`;
                }

                const label = routeModule.NAV_PATH_LABELS[key] || item;

                return (
                  <InstantLink
                    key={`mobile-${groupKey}-${item}`}
                    href={path}
                    className={`mobile-nav-drawer__item ${isActive ? 'mobile-nav-drawer__item--active' : ''}`}
                    target={isExternal ? '_blank' : undefined}
                    onClick={handleLinkClick}
                  >
                    {label}
                    {isExternal && (
                      <span className="mobile-nav-drawer__external-icon">
                        ↗
                      </span>
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
      aria-label="Mobile navigation menu"
    >
      <div className="mobile-nav-drawer" ref={drawerRef}>
        <Suspense
          fallback={
            <div className="mobile-nav-drawer__content">
              <div className="mobile-nav-drawer__header">
                <h2 className="mobile-nav-drawer__title">Idling.app</h2>
                <button className="mobile-nav-drawer__close" onClick={onClose}>
                  ✕
                </button>
              </div>
              <div className="mobile-nav-drawer__loading">Loading...</div>
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
