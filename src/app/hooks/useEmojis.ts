/**
 * useEmojis Hook
 * React hook for fetching and managing emojis with OS detection
 */

import { noCacheFetch } from '@lib/utils/no-cache-fetch';
import { useOSDetection } from '@lib/utils/os-detection';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface EmojiData {
  id: number;
  emoji_id: string;
  unicode_codepoint?: string;
  unicode_char?: string;
  name: string;
  description?: string;
  category: {
    id: number;
    name: string;
    display_name: string;
  };
  tags: string[];
  aliases: string[];
  keywords?: string[];
  is_custom?: boolean;
  custom_image_url?: string;
  usage_count?: number;
  version_min?: string;
}

export interface EmojiCategory {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  emoji_count: number;
}

export interface EmojiFilters {
  category?: string;
  search?: string;
  includeCustom?: boolean;
  includeUsage?: boolean;
}

export interface EmojiResponse {
  emojis: EmojiData[];
  categories: EmojiCategory[];
  os_info: {
    os: string;
    version?: string;
    is_supported: boolean;
    emoji_support: {
      supports_unicode: boolean;
      supports_custom: boolean;
      max_emoji_version: string;
      recommended_format: string;
    };
  };
  total_count: number;
  page: number;
  per_page: number;
}

export interface UseEmojisOptions {
  autoFetch?: boolean;
  defaultFilters?: EmojiFilters;
  pageSize?: number;
}

export interface UseEmojisReturn {
  emojis: EmojiData[];
  categories: EmojiCategory[];
  osInfo: EmojiResponse['os_info'] | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalCount: number;
  filters: EmojiFilters;

  // Actions
  fetchEmojis: (filters?: EmojiFilters, page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: EmojiFilters) => void;
  searchEmojis: (query: string) => void;
  selectCategory: (category: string | null) => void;
  refreshEmojis: () => Promise<void>;
  trackEmojiUsage: (
    emojiId: string,
    emojiType: 'windows' | 'mac' | 'custom'
  ) => Promise<void>;
}

// Global cache to prevent duplicate API requests
interface EmojiCache {
  data: EmojiResponse | null;
  timestamp: number;
  promise: Promise<EmojiResponse> | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let globalEmojiCache: EmojiCache = {
  data: null,
  timestamp: 0,
  promise: null
};

export function useEmojis(options: UseEmojisOptions = {}): UseEmojisReturn {
  const { autoFetch = true, defaultFilters = {}, pageSize = 50 } = options;

  const osInfo = useOSDetection();

  // State
  const [emojis, setEmojis] = useState<EmojiData[]>([]);
  const [categories, setCategories] = useState<EmojiCategory[]>([]);
  const [apiOsInfo, setApiOsInfo] = useState<EmojiResponse['os_info'] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFiltersState] = useState<EmojiFilters>({
    includeCustom: true,
    includeUsage: true,
    ...defaultFilters
  });

  // Memoize filters to prevent unnecessary re-renders of fetchEmojis
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.category,
      filters.search,
      filters.includeCustom,
      filters.includeUsage
    ]
  );

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    return (
      globalEmojiCache.data &&
      Date.now() - globalEmojiCache.timestamp < CACHE_DURATION
    );
  }, []);

  // Fetch emojis from API with caching - Remove filters dependency to prevent re-renders
  const fetchEmojis = useCallback(
    async (newFilters?: EmojiFilters, page: number = 1) => {
      try {
        setLoading(true);
        setError(null);

        // Use memoized filters to prevent re-renders
        const activeFilters = newFilters || memoizedFilters;

        // For initial fetch without filters, use cache
        if (page === 1 && !activeFilters.category && !activeFilters.search) {
          if (isCacheValid()) {
            const cachedData = globalEmojiCache.data!;
            setEmojis(cachedData.emojis);
            setCategories(cachedData.categories);
            setApiOsInfo(cachedData.os_info);
            setCurrentPage(page);
            setTotalCount(cachedData.total_count);
            setHasMore(
              cachedData.emojis.length === pageSize &&
                cachedData.emojis.length < cachedData.total_count
            );
            if (newFilters) {
              setFiltersState(newFilters);
            }
            setLoading(false);
            return;
          }

          // If there's already a pending request, wait for it
          if (globalEmojiCache.promise) {
            const cachedData = await globalEmojiCache.promise;
            setEmojis(cachedData.emojis);
            setCategories(cachedData.categories);
            setApiOsInfo(cachedData.os_info);
            setCurrentPage(page);
            setTotalCount(cachedData.total_count);
            setHasMore(
              cachedData.emojis.length === pageSize &&
                cachedData.emojis.length < cachedData.total_count
            );
            if (newFilters) {
              setFiltersState(newFilters);
            }
            setLoading(false);
            return;
          }
        }

        const params = new URLSearchParams({
          page: page.toString(),
          per_page: pageSize.toString(),
          ...(activeFilters.category && { category: activeFilters.category }),
          ...(activeFilters.search && { search: activeFilters.search }),
          ...(activeFilters.includeCustom !== undefined && {
            include_custom: activeFilters.includeCustom.toString()
          }),
          ...(activeFilters.includeUsage !== undefined && {
            include_usage: activeFilters.includeUsage.toString()
          })
        });

        // Create the fetch promise
        const fetchPromise = noCacheFetch(`/api/emojis?${params}`).then(
          async (response) => {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch emojis');
            }
            return response.json() as Promise<EmojiResponse>;
          }
        );

        // Cache the promise for initial requests
        if (page === 1 && !activeFilters.category && !activeFilters.search) {
          globalEmojiCache.promise = fetchPromise;
        }

        const data = await fetchPromise;

        // Cache the result for initial requests
        if (page === 1 && !activeFilters.category && !activeFilters.search) {
          globalEmojiCache.data = data;
          globalEmojiCache.timestamp = Date.now();
          globalEmojiCache.promise = null;
        }

        if (page === 1) {
          setEmojis(data.emojis);
        } else {
          setEmojis((prev) => [...prev, ...data.emojis]);
        }

        setCategories(data.categories);
        setApiOsInfo(data.os_info);
        setCurrentPage(page);
        setTotalCount(data.total_count);
        setHasMore(
          data.emojis.length === pageSize &&
            data.emojis.length < data.total_count
        );

        if (newFilters) {
          setFiltersState(newFilters);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching emojis:', err);

        // Clear cache on error
        if (globalEmojiCache.promise) {
          globalEmojiCache.promise = null;
        }
      } finally {
        setLoading(false);
      }
    },
    [pageSize, isCacheValid, memoizedFilters]
  );

  // Load more emojis (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchEmojis(memoizedFilters, currentPage + 1);
  }, [fetchEmojis, memoizedFilters, currentPage, hasMore, loading]);

  // Set filters and refetch - FIXED: Use current filters from state
  const setFilters = useCallback(
    (newFilters: EmojiFilters) => {
      setFiltersState((currentFilters) => {
        const mergedFilters = { ...currentFilters, ...newFilters };
        setCurrentPage(1);
        fetchEmojis(mergedFilters, 1);
        return mergedFilters;
      });
    },
    [fetchEmojis]
  );

  // Search emojis - FIXED: Use current filters from state
  const searchEmojis = useCallback(
    (query: string) => {
      setFiltersState((currentFilters) => {
        const searchFilters = { ...currentFilters, search: query || undefined };
        setCurrentPage(1);
        fetchEmojis(searchFilters, 1);
        return searchFilters;
      });
    },
    [fetchEmojis]
  );

  // Select category - FIXED: Use current filters from state
  const selectCategory = useCallback(
    (category: string | null) => {
      setFiltersState((currentFilters) => {
        const categoryFilters = {
          ...currentFilters,
          category: category || undefined
        };
        setCurrentPage(1);
        fetchEmojis(categoryFilters, 1);
        return categoryFilters;
      });
    },
    [fetchEmojis]
  );

  // Refresh emojis - FIXED: Use current filters from state
  const refreshEmojis = useCallback(async () => {
    // Clear cache on refresh
    globalEmojiCache.data = null;
    globalEmojiCache.timestamp = 0;
    globalEmojiCache.promise = null;

    setCurrentPage(1);
    // Use current filters from state
    setFiltersState((currentFilters) => {
      fetchEmojis(currentFilters, 1);
      return currentFilters;
    });
  }, [fetchEmojis]);

  // Track emoji usage
  const trackEmojiUsage = useCallback(
    async (emojiId: string, emojiType: 'windows' | 'mac' | 'custom') => {
      try {
        await noCacheFetch('/api/emojis/usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            emoji_id: emojiId,
            emoji_type: emojiType
          })
        });

        // Don't refresh emojis immediately to avoid double renders
        // Usage counts will be updated on next natural refresh
      } catch (err) {
        console.error('Error tracking emoji usage:', err);
        // Don't throw error for usage tracking failures
      }
    },
    [filters.includeUsage] // Remove refreshEmojis dependency to prevent re-renders
  );

  // Auto-fetch on mount if enabled - FIXED: Only run once on mount
  useEffect(() => {
    if (autoFetch && osInfo.isSupported) {
      fetchEmojis();
    }
  }, [autoFetch, osInfo.isSupported, fetchEmojis]);

  return {
    emojis,
    categories,
    osInfo: apiOsInfo,
    loading,
    error,
    hasMore,
    currentPage,
    totalCount,
    filters,

    // Actions
    fetchEmojis,
    loadMore,
    setFilters,
    searchEmojis,
    selectCategory,
    refreshEmojis,
    trackEmojiUsage
  };
}

// Helper hook for emoji picker
export function useEmojiPicker() {
  const {
    emojis,
    categories,
    loading,
    error,
    searchEmojis,
    selectCategory,
    trackEmojiUsage,
    filters
  } = useEmojis({
    autoFetch: true,
    defaultFilters: {
      includeCustom: true,
      includeUsage: true
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle category selection
  const handleCategorySelect = useCallback(
    (categoryName: string | null) => {
      setSelectedCategory(categoryName);
      selectCategory(categoryName);
    },
    [selectCategory]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      searchEmojis(query);
    },
    [searchEmojis]
  );

  // Handle emoji selection
  const handleEmojiSelect = useCallback(
    (emoji: EmojiData) => {
      const emojiType = emoji.is_custom
        ? 'custom'
        : filters.category === 'windows'
          ? 'windows'
          : 'mac';

      trackEmojiUsage(emoji.emoji_id, emojiType);

      return emoji.is_custom ? emoji.custom_image_url : emoji.unicode_char;
    },
    [trackEmojiUsage, filters.category]
  );

  return {
    emojis,
    categories,
    loading,
    error,
    selectedCategory,
    searchQuery,
    handleCategorySelect,
    handleSearch,
    handleEmojiSelect
  };
}

// Helper function to get emoji display value
export function getEmojiDisplay(emoji: EmojiData): string {
  if (emoji.is_custom && emoji.custom_image_url) {
    return emoji.custom_image_url; // Return data URL for custom emojis
  }
  return emoji.unicode_char || emoji.name;
}

// Helper function to format emoji for text insertion
export function formatEmojiForText(emoji: EmojiData): string {
  // Always use colon syntax for both custom and standard emojis
  // This ensures they are properly tokenized by the RichTextParser
  return `:${emoji.emoji_id}:`;
}
