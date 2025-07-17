'use client';

import { createLogger } from '@lib/logging';
import { getStoredScrollPosition } from '@lib/utils/scroll-position';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'BackButton',
    module: 'components/ui'
  },
  enabled: false
});

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
  fallbackHref?: string;
  scrollRestoreKey?: string;
  onBack?: () => void;
}

export function BackButton({
  className = '',
  children = '← Back',
  fallbackHref = '/',
  scrollRestoreKey,
  onBack
}: BackButtonProps) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const [scrollPosition, setScrollPosition] = useState<any>(null);
  const [targetHref, setTargetHref] = useState(fallbackHref);

  useEffect(() => {
    // Check if we can go back in history
    setCanGoBack(window.history.length > 1);

    // Check if we have stored scroll position and construct target URL
    if (scrollRestoreKey) {
      const position = getStoredScrollPosition(scrollRestoreKey);
      setScrollPosition(position);

      if (position) {
        // Construct the target URL with pagination and filters
        const targetPath = position.pathname || fallbackHref;
        let targetSearch = position.searchParams || '';

        // Add pagination parameters if they exist in stored position
        if (position.currentPage && position.currentPage > 1) {
          const urlParams = new URLSearchParams(targetSearch);
          urlParams.set('page', position.currentPage.toString());
          targetSearch = '?' + urlParams.toString();
        }

        const fullUrl = targetPath + targetSearch;
        setTargetHref(fullUrl);
      }
    }
  }, [scrollRestoreKey, fallbackHref]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onBack) {
      e.preventDefault();
      onBack();
      return;
    }

    // Handle scroll restoration for navigation
    if (scrollRestoreKey && scrollPosition) {
      logger.debug('Preparing scroll restoration for navigation', {
        scrollRestoreKey,
        scrollPosition,
        currentPage: scrollPosition.currentPage,
        targetHref
      });

      // Store the scroll restoration info in sessionStorage for the target page
      // This ensures PostsManager can pick it up after navigation
      sessionStorage.setItem('restore-scroll-key', scrollRestoreKey);
      sessionStorage.setItem(
        'restore-scroll-position',
        JSON.stringify(scrollPosition)
      );

      // Use router.push instead of Link to ensure proper page transition
      // and scroll restoration context
      e.preventDefault();
      router.push(targetHref);
    }
    // For cases without scroll restoration, let Link handle navigation normally
  };

  return (
    <Link
      href={targetHref}
      className={`back-button ${className}`}
      title={
        scrollPosition
          ? `Back to previous page (page ${scrollPosition.currentPage || 1})`
          : 'Go back'
      }
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
