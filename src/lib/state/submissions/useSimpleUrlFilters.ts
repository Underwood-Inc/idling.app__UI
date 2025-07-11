import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';

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
}

/**
 * Simple URL-first filter system
 * URL parameters are the single source of truth
 * No complex state management or circular dependencies
 */
export function useSimpleUrlFilters(): UseSimpleUrlFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Use ref to track if we're already updating to prevent loops
  const isUpdatingRef = useRef(false);

  // Parse current URL parameters into filters
  const filters = useMemo(() => {
    const result: Filter[] = [];

    // Parse each parameter type
    searchParams.forEach((value, key) => {
      if (key === 'page') return; // Skip pagination

      if (key === 'author' || key === 'mentions' || key === 'tags') {
        // Handle comma-separated values
        const values = value.split(',').filter(Boolean);
        values.forEach(v => {
          result.push({ name: key, value: v.trim() });
        });
      } else {
        // Single value parameters
        result.push({ name: key, value });
      }
    });

    return result;
  }, [searchParams]);

  // Create a stable string representation for comparison
  const filtersString = useMemo(() => {
    return filters
      .map(f => `${f.name}:${f.value}`)
      .sort()
      .join('|');
  }, [filters]);

  // Update URL with new filter state - use stable searchParams reference
  const updateUrl = useCallback((newFilters: Filter[]) => {
    // Prevent update loops
    if (isUpdatingRef.current) return;
    
    const params = new URLSearchParams();

    // Group filters by name
    const filterGroups: Record<string, string[]> = {};
    newFilters.forEach(filter => {
      if (!filterGroups[filter.name]) {
        filterGroups[filter.name] = [];
      }
      filterGroups[filter.name].push(filter.value);
    });

    // Build URL parameters
    Object.entries(filterGroups).forEach(([name, values]) => {
      if (values.length > 0) {
        if (name === 'author' || name === 'mentions' || name === 'tags') {
          // Join multiple values with comma
          const uniqueValues = [...new Set(values)]; // Remove duplicates
          params.set(name, uniqueValues.join(','));
        } else {
          // Single value
          params.set(name, values[0]);
        }
      }
    });

    // Keep existing page parameter if it exists
    const currentPage = searchParams.get('page');
    if (currentPage && currentPage !== '1') {
      params.set('page', currentPage);
    }

    // Update URL
    const newUrl = params.toString();
    const currentUrl = searchParams.toString();
    
    if (newUrl !== currentUrl) {
      isUpdatingRef.current = true;
      const pathname = window.location.pathname;
      router.replace(`${pathname}${newUrl ? `?${newUrl}` : ''}`, { scroll: false });
      
      // Reset flag after a short delay to allow URL change to propagate
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [router, searchParams]);

  // Add a filter - use stable filtersString instead of filters array
  const addFilter = useCallback((filter: Filter) => {
    // Check if filter already exists by parsing current URL
    const currentFilters = filters;
    const exists = currentFilters.some(f => f.name === filter.name && f.value === filter.value);
    
    if (!exists) {
      const newFilters = [...currentFilters, filter];
      updateUrl(newFilters);
    }
  }, [filters, updateUrl]);

  // Remove a filter - use stable filtersString instead of filters array
  const removeFilter = useCallback((name: string, value?: string) => {
    const currentFilters = filters;
    const newFilters = currentFilters.filter(f => {
      if (f.name !== name) return true;
      if (value !== undefined) {
        return f.value !== value;
      }
      return false; // Remove all filters with this name
    });
    
    updateUrl(newFilters);
  }, [filters, updateUrl]);

  // Clear all filters - doesn't need to depend on filters
  const clearFilters = useCallback(() => {
    updateUrl([]);
  }, [updateUrl]);

  // Check if a filter exists - use stable filtersString
  const hasFilter = useCallback((name: string, value?: string) => {
    return filters.some(f => {
      if (f.name !== name) return false;
      if (value !== undefined) {
        return f.value === value;
      }
      return true; // Just check if name exists
    });
  }, [filtersString]); // Use stable string instead of filters array

  // Get all values for a filter name - use stable filtersString
  const getFilterValues = useCallback((name: string) => {
    return filters
      .filter(f => f.name === name)
      .map(f => f.value);
  }, [filtersString]); // Use stable string instead of filters array

  return {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    hasFilter,
    getFilterValues
  };
} 