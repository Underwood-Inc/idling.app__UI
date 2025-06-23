/**
 * Scroll position management utilities for navigation between paginated lists and thread pages
 */

export interface ScrollPositionData {
  scrollY: number;
  timestamp: number;
  pathname: string;
  searchParams?: string;
  // For paginated lists
  currentPage?: number;
  infiniteMode?: boolean;
  totalPages?: number;
  // For filtering
  filters?: Record<string, any>;
}

const SCROLL_STORAGE_KEY = 'app-scroll-positions';
const MAX_STORED_POSITIONS = 10;
const POSITION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Store current scroll position with context data
 */
export function storeScrollPosition(
  referrerKey: string,
  additionalData?: Partial<ScrollPositionData>,
  customScrollY?: number
): void {
  if (typeof window === 'undefined') return;

  // Use custom scroll position if provided, otherwise use window scroll
  const scrollY = customScrollY !== undefined ? customScrollY : window.scrollY;

  const scrollData: ScrollPositionData = {
    scrollY,
    timestamp: Date.now(),
    pathname: window.location.pathname,
    searchParams: window.location.search,
    ...additionalData
  };

  try {
    const stored = localStorage.getItem(SCROLL_STORAGE_KEY);
    const positions: Record<string, ScrollPositionData> = stored
      ? JSON.parse(stored)
      : {};

    // Clean up expired positions
    const now = Date.now();
    Object.keys(positions).forEach((key) => {
      if (now - positions[key].timestamp > POSITION_EXPIRY_MS) {
        delete positions[key];
      }
    });

    // Add new position
    positions[referrerKey] = scrollData;

    // Keep only the most recent positions
    const entries = Object.entries(positions);
    if (entries.length > MAX_STORED_POSITIONS) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const trimmed = entries.slice(0, MAX_STORED_POSITIONS);
      const newPositions: Record<string, ScrollPositionData> = {};
      trimmed.forEach(([key, data]) => {
        newPositions[key] = data;
      });
      localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(newPositions));
    } else {
      localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
    }
  } catch (error) {
    console.warn('Failed to store scroll position:', error);
  }
}

/**
 * Retrieve stored scroll position data
 */
export function getStoredScrollPosition(
  referrerKey: string
): ScrollPositionData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SCROLL_STORAGE_KEY);
    if (!stored) return null;

    const positions: Record<string, ScrollPositionData> = JSON.parse(stored);
    const position = positions[referrerKey];

    if (!position) return null;

    // Check if position is expired
    if (Date.now() - position.timestamp > POSITION_EXPIRY_MS) {
      // Clean up expired position
      delete positions[referrerKey];
      localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
      return null;
    }

    return position;
  } catch (error) {
    console.warn('Failed to retrieve scroll position:', error);
    return null;
  }
}

/**
 * Restore scroll position with smooth scrolling
 */
export function restoreScrollPosition(
  referrerKey: string,
  options: { smooth?: boolean; offset?: number } = {}
): boolean {
  const position = getStoredScrollPosition(referrerKey);
  if (!position) return false;

  const { smooth = true, offset = 0 } = options;
  const targetY = Math.max(0, position.scrollY - offset);

  if (smooth) {
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  } else {
    window.scrollTo(0, targetY);
  }

  return true;
}

/**
 * Generate a unique key for the current page state
 */
export function generateScrollKey(
  basePath: string,
  params?: {
    page?: number;
    filters?: Record<string, any>;
    searchParams?: URLSearchParams;
  }
): string {
  const parts = [basePath];

  if (params?.page) {
    parts.push(`page-${params.page}`);
  }

  if (params?.filters && Object.keys(params.filters).length > 0) {
    const filterStr = Object.entries(params.filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    parts.push(`filters-${btoa(filterStr)}`);
  }

  if (params?.searchParams) {
    const searchStr = params.searchParams.toString();
    if (searchStr) {
      parts.push(`search-${btoa(searchStr)}`);
    }
  }

  return parts.join('|');
}

/**
 * Clear all stored scroll positions
 */
export function clearScrollPositions(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SCROLL_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear scroll positions:', error);
  }
}

/**
 * Clear specific scroll position
 */
export function clearScrollPosition(referrerKey: string): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(SCROLL_STORAGE_KEY);
    if (!stored) return;

    const positions: Record<string, ScrollPositionData> = JSON.parse(stored);
    delete positions[referrerKey];
    localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.warn('Failed to clear scroll position:', error);
  }
}

/**
 * Update existing scroll position with new scroll data
 * This is useful when the user scrolls to a new position and we want to update the stored position
 */
export function updateScrollPosition(
  referrerKey: string,
  newScrollY?: number,
  additionalData?: Partial<ScrollPositionData>
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(SCROLL_STORAGE_KEY);
    if (!stored) return false;

    const positions: Record<string, ScrollPositionData> = JSON.parse(stored);
    const existingPosition = positions[referrerKey];

    if (!existingPosition) return false;

    // Use provided scroll position or current window scroll
    const scrollY = newScrollY !== undefined ? newScrollY : window.scrollY;

    // Update the existing position with new data
    positions[referrerKey] = {
      ...existingPosition,
      scrollY,
      timestamp: Date.now(), // Update timestamp to keep it fresh
      ...additionalData
    };

    localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));

    console.log('📍 Updated scroll position:', {
      referrerKey,
      newScrollY: scrollY,
      previousScrollY: existingPosition.scrollY,
      additionalData
    });

    return true;
  } catch (error) {
    console.warn('Failed to update scroll position:', error);
    return false;
  }
}

/**
 * Store or update scroll position based on whether it already exists
 */
export function storeOrUpdateScrollPosition(
  referrerKey: string,
  additionalData?: Partial<ScrollPositionData>,
  customScrollY?: number
): void {
  // Try to update first, if that fails, store new position
  const updated = updateScrollPosition(
    referrerKey,
    customScrollY,
    additionalData
  );

  if (!updated) {
    storeScrollPosition(referrerKey, additionalData, customScrollY);
  }
}
