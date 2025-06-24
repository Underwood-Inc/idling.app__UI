'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSpacingTheme } from '../../../../lib/context/SpacingThemeContext';

export interface PostsManagerState {
  includeThreadReplies: boolean;
  setIncludeThreadReplies: (value: boolean) => void;
  isMobile: boolean;
  infiniteScrollMode: boolean;
  setInfiniteScrollMode: (value: boolean) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
}

export function usePostsManagerState(): PostsManagerState {
  const { theme } = useSpacingTheme();
  const pathname = usePathname();
  const [includeThreadReplies, setIncludeThreadReplies] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize pagination mode with per-route persistence
  const [infiniteScrollMode, setInfiniteScrollModeState] = useState(() => {
    // Default to false on server side to avoid hydration mismatch
    if (typeof window === 'undefined') {
      return false;
    }

    // Get route-specific pagination mode from localStorage
    const routeKey = `pagination-mode-${pathname}`;
    const routeMode = localStorage.getItem(routeKey);

    if (routeMode === 'infinite') {
      return true;
    } else if (routeMode === 'traditional') {
      return false;
    }

    // Fallback to global pagination mode if no route-specific setting
    const globalMode = localStorage.getItem('pagination-mode-global');
    if (globalMode === 'infinite') {
      return true;
    }

    // Default to traditional pagination
    return false;
  });

  // Load pagination mode when route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const routeKey = `pagination-mode-${pathname}`;
    const routeMode = localStorage.getItem(routeKey);

    if (routeMode === 'infinite') {
      setInfiniteScrollModeState(true);
    } else if (routeMode === 'traditional') {
      setInfiniteScrollModeState(false);
    } else {
      // Use global mode as fallback
      const globalMode = localStorage.getItem('pagination-mode-global');
      if (globalMode === 'infinite') {
        setInfiniteScrollModeState(true);
      } else {
        setInfiniteScrollModeState(false);
      }
    }
  }, [pathname]);

  const setInfiniteScrollMode = (newMode: boolean) => {
    setInfiniteScrollModeState(newMode);

    if (typeof window !== 'undefined') {
      // Save pagination mode for current route
      const routeKey = `pagination-mode-${pathname}`;
      const modeValue = newMode ? 'infinite' : 'traditional';
      localStorage.setItem(routeKey, modeValue);

      // Also update global mode as fallback for new routes
      localStorage.setItem('pagination-mode-global', modeValue);
    }
  };

  // Initialize filter visibility state properly to avoid flicker
  const [showFilters, setShowFilters] = useState(() => {
    // Only access localStorage on client side to avoid hydration mismatch
    if (typeof window === 'undefined') {
      return false; // Default to collapsed on server side
    }

    // Check localStorage first, fallback to theme-based default
    const saved = localStorage.getItem('posts-manager-filters-expanded');
    if (saved !== null) {
      return saved === 'true';
    }
    return theme === 'cozy'; // Show filters by default in cozy mode, hide in compact mode
  });

  // Save filter visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      'posts-manager-filters-expanded',
      showFilters.toString()
    );
  }, [showFilters]);

  return {
    includeThreadReplies,
    setIncludeThreadReplies,
    isMobile,
    infiniteScrollMode,
    setInfiniteScrollMode,
    showFilters,
    setShowFilters
  };
}
