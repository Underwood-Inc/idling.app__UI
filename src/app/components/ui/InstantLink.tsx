'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigationLoader } from '../../../lib/hooks/useNavigationLoader';
import './InstantLink.css';

interface InstantLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  scroll?: boolean;
  'aria-disabled'?: boolean;
  'data-testid'?: string;
  target?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function InstantLink({
  href,
  children,
  className = '',
  prefetch = true,
  scroll = true,
  'aria-disabled': ariaDisabled,
  'data-testid': dataTestId,
  target,
  title,
  onClick
}: InstantLinkProps) {
  const { navigate, isNavigating, targetPath } = useNavigationLoader();
  const pathname = usePathname();
  const [isClicked, setIsClicked] = useState(false);

  const isCurrentPath = pathname === href;
  const isNavigatingToThisPath = isNavigating && targetPath === href;

  // Reset clicked state when navigation completes
  useEffect(() => {
    if (isClicked && !isNavigating) {
      setIsClicked(false);
    }
  }, [isClicked, isNavigating]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call custom onClick first if provided
      if (onClick) {
        onClick(e);
      }

      // Don't handle navigation for external links or disabled links
      if (target === '_blank' || ariaDisabled) {
        return;
      }

      // Don't handle if user is holding modifier keys (allow default browser behavior)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
        return;
      }

      // Don't navigate if already on the same path
      if (isCurrentPath) {
        e.preventDefault();
        return;
      }

      // Prevent default navigation and use our enhanced navigation
      e.preventDefault();
      setIsClicked(true);

      // Use navigate function which provides instant feedback
      navigate(href, { scroll });
    },
    [onClick, target, ariaDisabled, isCurrentPath, navigate, href, scroll]
  );

  const linkClasses = [
    'instant-link',
    className,
    isCurrentPath && 'instant-link--active',
    (isNavigatingToThisPath || isClicked) && 'instant-link--loading',
    ariaDisabled && 'instant-link--disabled'
  ]
    .filter(Boolean)
    .join(' ');

  const showSpinner = isNavigatingToThisPath || isClicked;

  return (
    <Link
      href={href}
      className={linkClasses}
      prefetch={prefetch}
      aria-disabled={ariaDisabled}
      data-testid={dataTestId}
      target={target}
      title={title}
      onClick={handleClick}
    >
      <span className="instant-link__content">{children}</span>
      {showSpinner && (
        <span className="instant-link__loader">
          <svg
            className="instant-link__spinner"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-6.22-8.56" />
          </svg>
        </span>
      )}
    </Link>
  );
}
