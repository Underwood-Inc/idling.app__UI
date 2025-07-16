import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { urlParamsAtom } from '../atoms';

export interface Filter {
  name: string;
  value: string;
}

export interface UseSimpleUrlFiltersReturn {
  filters: Filter[];
  addFilter: (filter: Filter) => void;
  removeFilter: (name: string, value?: string) => void;
  clearFilters: () => void;
  hasFilter: (name: string, value?: string) => boolean;
  getFilterValues: (name: string) => string[];
  updateFilter: (name: string, value: string) => void;
  updateUrl: (filters: Filter[]) => void;
}

/**
 * Simple URL-first filter system
 * URL parameters are the single source of truth
 * No complex state management or circular dependencies
 */
export function useSimpleUrlFilters(): UseSimpleUrlFiltersReturn {
  const router = useRouter();
  const [searchParams, setSearchParams] = useAtom(urlParamsAtom);

  // Use ref to track if we're already updating to prevent loops
  const isUpdatingRef = useRef(false);

  if (process.env.NODE_ENV === 'development') {
    // // eslint-disable-next-line no-console
    // console.log('🔍 useSimpleUrlFilters: searchParams from atom:', {
    //   searchParams,
    //   paramsString: searchParams.toString(),
    //   windowLocationSearch:
    //     typeof window !== 'undefined' ? window.location.search : 'SSR'
    // });
  }

  // Keep atom in sync with browser URL changes (back/forward buttons)
  useEffect(() => {
    const handleUrlChange = () => {
      if (!isUpdatingRef.current && typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        const currentParamsString = currentParams.toString();
        const atomParamsString = searchParams.toString();

        // Only sync if URL actually changed to prevent loops
        if (currentParamsString !== atomParamsString) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('🔍 handleUrlChange: syncing atom with URL:', {
              currentParams: currentParamsString,
              atomParams: atomParamsString,
              willSync: true
            });
          }
          setSearchParams(currentParams);
        } else {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('🔍 handleUrlChange: URLs match, no sync needed');
          }
        }
      }
    };

    const handleCustomUrlChange = (event: Event) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 Custom URL filters change event received:', event);
      }
      // Force a sync check after custom event
      handleUrlChange();
    };

    // Listen for browser navigation
    window.addEventListener('popstate', handleUrlChange);

    // Listen for custom filter change events
    window.addEventListener('urlfilterschange', handleCustomUrlChange);

    // Initial sync on mount - but only if needed
    if (typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      const currentParamsString = currentParams.toString();
      const atomParamsString = searchParams.toString();

      if (currentParamsString !== atomParamsString) {
        handleUrlChange();
      }
    }

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlfilterschange', handleCustomUrlChange);
    };
  }, [setSearchParams]); // Remove searchParams from dependencies to prevent loops

  // Parse current URL parameters into filters
  const filters = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔍 Recalculating filters from searchParams:', {
        searchParamsString: searchParams.toString(),
        timestamp: Date.now()
      });
    }

    const result: Filter[] = [];

    // Parse each parameter type
    searchParams.forEach((value, key) => {
      if (key === 'page') return; // Skip pagination

      if (key === 'author' || key === 'mentions' || key === 'tags') {
        // Handle comma-separated values
        const values = value.split(',').filter(Boolean);
        values.forEach((v) => {
          result.push({ name: key, value: v.trim() });
        });
      } else {
        // Single value parameters
        result.push({ name: key, value });
      }
    });

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔍 Calculated filters:', result);
    }

    return result;
  }, [searchParams]);

  // Create a stable string representation for comparison
  const filtersString = useMemo(() => {
    return filters
      .map((f) => `${f.name}:${f.value}`)
      .sort()
      .join('|');
  }, [filters]);

  // Update URL with new filter state - direct browser URL update
  const updateUrl = useCallback(
    (newFilters: Filter[]) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 updateUrl called with filters:', newFilters);
      }

      if (typeof window === 'undefined') {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('❌ updateUrl: window is undefined');
        }
        return;
      }

      // Prevent update loops
      if (isUpdatingRef.current) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('❌ updateUrl: already updating, skipping');
        }
        return;
      }

      const params = new URLSearchParams();

      // Group filters by name
      const filterGroups: Record<string, string[]> = {};
      newFilters.forEach((filter) => {
        if (!filterGroups[filter.name]) {
          filterGroups[filter.name] = [];
        }
        filterGroups[filter.name].push(filter.value);
      });

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 filterGroups:', filterGroups);
      }

      // Build URL parameters - use same format as filter actions
      Object.entries(filterGroups).forEach(([name, values]) => {
        if (values.length > 0) {
          if (name === 'tags') {
            // Use tag formatting utility for consistency
            const {
              formatTagsForUrl
            } = require('../../utils/string/tag-utils');
            const allTags = values.flatMap((value) =>
              value.split(',').map((tag) => tag.trim())
            );
            const formattedTags = formatTagsForUrl(allTags);
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('🔍 formatting tags:', { allTags, formattedTags });
            }
            params.set(name, formattedTags);
          } else if (
            name === 'author' ||
            name === 'mentions' ||
            name === 'search'
          ) {
            params.set(name, values.join(','));
          } else if (name === 'onlyReplies') {
            if (values[0] === 'true') {
              params.set('onlyReplies', 'true');
            }
          } else if (name.endsWith('Logic')) {
            // Special case for globalLogic - always add it
            if (name === 'globalLogic') {
              params.set(name, values[0]);
            } else {
              // Only add other logic params if the corresponding filter exists
              const baseFilterName = name.replace('Logic', '');
              // Handle plural forms: tagLogic -> tags, authorLogic -> author, etc.
              const filterGroupName =
                baseFilterName === 'tag' ? 'tags' : baseFilterName;
              if (filterGroups[filterGroupName]) {
                params.set(name, values[0]);
              }
            }
          } else {
            params.set(name, values[0]);
          }
        }
      });

      // Keep existing page parameter if it exists
      const currentPage = searchParams.get('page');
      if (currentPage && currentPage !== '1') {
        params.set('page', currentPage);
      }

      // Update URL using direct browser history
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      const currentUrl = window.location.href;

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 URL comparison:', {
          newUrl,
          currentUrl,
          paramsString: params.toString(),
          willUpdate: newUrl !== currentUrl
        });
      }

      if (newUrl !== currentUrl) {
        isUpdatingRef.current = true;

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('✅ Updating URL to:', newUrl);
        }

        // Use browser history directly - more reliable than router
        window.history.pushState({}, '', newUrl);

        // CRITICAL FIX: Use microtask queue to ensure proper synchronization
        queueMicrotask(() => {
          // Update the atom to trigger reactivity after URL is set
          const updatedParams = new URLSearchParams(window.location.search);
          setSearchParams(updatedParams);

          // Trigger events to notify other listeners
          window.dispatchEvent(new PopStateEvent('popstate'));

          // Custom event for better component synchronization
          window.dispatchEvent(
            new CustomEvent('urlfilterschange', {
              detail: { filters: newFilters }
            })
          );

          // Reset flag after all updates are complete
          isUpdatingRef.current = false;
        });
      } else {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('❌ URLs match, no update needed');
        }
        // Reset flag even when no update is needed
        isUpdatingRef.current = false;
      }
    },
    [searchParams, setSearchParams]
  );

  // Add a filter - use stable filtersString instead of filters array
  const addFilter = useCallback(
    (filter: Filter) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 addFilter called with:', filter);
      }

      // Check if filter already exists by parsing current URL
      const currentFilters = filters;
      const exists = currentFilters.some(
        (f) => f.name === filter.name && f.value === filter.value
      );

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 addFilter check:', {
          currentFilters,
          filterExists: exists,
          willAdd: !exists
        });
      }

      if (!exists) {
        const newFilters = [...currentFilters, filter];
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('🔍 addFilter: calling updateUrl with:', newFilters);
        }
        updateUrl(newFilters);
      } else {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('🔍 addFilter: filter already exists, skipping');
        }
      }
    },
    [filters, updateUrl]
  );

  // Remove a filter - use stable filtersString instead of filters array
  const removeFilter = useCallback(
    (name: string, value?: string) => {
      const currentFilters = filters;
      const newFilters = currentFilters.filter((f) => {
        const shouldKeep =
          f.name !== name || (value !== undefined && f.value !== value);

        if (f.name !== name) return true;
        if (value !== undefined) {
          return f.value !== value;
        }
        return false; // Remove all filters with this name
      });

      updateUrl(newFilters);
    },
    [filters, updateUrl]
  );

  // Clear all filters - doesn't need to depend on filters
  const clearFilters = useCallback(() => {
    updateUrl([]);
  }, [updateUrl]);

  // Check if a filter exists - use stable filtersString
  const hasFilter = useCallback(
    (name: string, value?: string) => {
      return filters.some((f) => {
        if (f.name !== name) return false;
        if (value !== undefined) {
          return f.value === value;
        }
        return true; // Just check if name exists
      });
    },
    [filtersString]
  ); // Use stable string instead of filters array

  // Get all values for a filter name - use stable filtersString
  const getFilterValues = useCallback(
    (name: string) => {
      return filters.filter((f) => f.name === name).map((f) => f.value);
    },
    [filtersString]
  ); // Use stable string instead of filters array

  // Update a specific filter value
  const updateFilter = useCallback(
    (name: string, value: string) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 updateFilter called with:', { name, value });
      }

      const currentFilters = filters;
      let filterFound = false;

      const updatedFilters = currentFilters.map((f) => {
        if (f.name === name) {
          filterFound = true;
          return { ...f, value };
        }
        return f;
      });

      // If filter doesn't exist, add it
      if (!filterFound) {
        updatedFilters.push({ name, value });
      }

      updateUrl(updatedFilters);
    },
    [filters, updateUrl]
  );

  return {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    hasFilter,
    getFilterValues,
    updateFilter,
    updateUrl
  };
}
