/**
 * useEmojis Hook
 * React hook for fetching and managing emojis with OS detection
 */

import { useCallback, useEffect, useState } from 'react';
import { useOSDetection } from '../../lib/utils/os-detection';

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

  // Fetch emojis from API
  const fetchEmojis = useCallback(
    async (newFilters?: EmojiFilters, page: number = 1) => {
      try {
        setLoading(true);
        setError(null);

        const activeFilters = newFilters || filters;
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

        const response = await fetch(`/api/emojis?${params}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch emojis');
        }

        const data: EmojiResponse = await response.json();

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
      } finally {
        setLoading(false);
      }
    },
    [filters, pageSize]
  );

  // Load more emojis (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchEmojis(filters, currentPage + 1);
  }, [fetchEmojis, filters, currentPage, hasMore, loading]);

  // Set filters and refetch
  const setFilters = useCallback(
    (newFilters: EmojiFilters) => {
      const mergedFilters = { ...filters, ...newFilters };
      setCurrentPage(1);
      fetchEmojis(mergedFilters, 1);
    },
    [filters, fetchEmojis]
  );

  // Search emojis
  const searchEmojis = useCallback(
    (query: string) => {
      setFilters({ search: query || undefined });
    },
    [setFilters]
  );

  // Select category
  const selectCategory = useCallback(
    (category: string | null) => {
      setFilters({ category: category || undefined });
    },
    [setFilters]
  );

  // Refresh emojis
  const refreshEmojis = useCallback(async () => {
    setCurrentPage(1);
    await fetchEmojis(filters, 1);
  }, [fetchEmojis, filters]);

  // Track emoji usage
  const trackEmojiUsage = useCallback(
    async (emojiId: string, emojiType: 'windows' | 'mac' | 'custom') => {
      try {
        await fetch('/api/emojis/usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            emoji_id: emojiId,
            emoji_type: emojiType
          })
        });

        // Optionally refresh emojis to update usage counts
        if (filters.includeUsage) {
          await refreshEmojis();
        }
      } catch (err) {
        console.error('Error tracking emoji usage:', err);
        // Don't throw error for usage tracking failures
      }
    },
    [filters.includeUsage, refreshEmojis]
  );

  // Auto-fetch on mount if enabled
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
  if (emoji.is_custom) {
    return `:${emoji.emoji_id}:`; // Custom emoji syntax
  }
  return emoji.unicode_char || `:${emoji.emoji_id}:`;
}
