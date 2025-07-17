'use client';

import { useUserPreferences } from '@lib/context/UserPreferencesContext';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface PostsManagerState {
  spacingTheme: 'cozy' | 'compact';
  includeThreadReplies: boolean;
  setIncludeThreadReplies: (include: boolean) => void;
  isMobile: boolean;
  infiniteScrollMode: boolean;
  setInfiniteScrollMode: (mode: boolean) => Promise<void>;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

export function usePostsManagerState(): PostsManagerState {
  const { spacingTheme, paginationMode, setPaginationMode } =
    useUserPreferences();
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

  // Convert pagination mode to boolean for backward compatibility
  const infiniteScrollMode = paginationMode === 'infinite';
  const setInfiniteScrollMode = async (mode: boolean) => {
    await setPaginationMode(mode ? 'infinite' : 'traditional');
  };

  // Initialize filter visibility state properly to avoid flicker
  const [showFilters, setShowFilters] = useState(() => {
    // Only access localStorage on client side to avoid hydration mismatch
    if (typeof window === 'undefined') {
      return false; // Default to collapsed on server side
    }

    // Check localStorage first, fallback to collapsed by default
    const saved = localStorage.getItem('posts-manager-filters-expanded');
    if (saved !== null) {
      return saved === 'true';
    }
    return false; // Always default to collapsed/hidden
  });

  // Save filter visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      'posts-manager-filters-expanded',
      showFilters.toString()
    );
  }, [showFilters]);

  return {
    spacingTheme,
    includeThreadReplies,
    setIncludeThreadReplies,
    isMobile,
    infiniteScrollMode,
    setInfiniteScrollMode,
    showFilters,
    setShowFilters
  };
}
