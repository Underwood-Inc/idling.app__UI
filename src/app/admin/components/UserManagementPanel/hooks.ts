/**
 * Custom hooks for User Management Panel
 *
 * This module contains reusable hooks that encapsulate complex state
 * management logic, API calls, and data processing for the user
 * management system.
 */

import { noCacheFetch } from '@lib/utils/no-cache-fetch';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { USERS_PER_LOAD, USERS_PER_PAGE } from './constants';
import type {
  ColumnFilter,
  ColumnSort,
  ManagementUser,
  SearchResult
} from './types';
import { getFieldValue } from './utils';

// ================================
// DATA LOADING HOOKS
// ================================

/**
 * Hook for loading and managing users data
 */
export const useUsersData = () => {
  const [users, setUsers] = useState<ManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await noCacheFetch(
        `/api/admin/users?page=${page}&limit=20`
      );
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        loadUsers(page);
      }
    },
    [totalPages, loadUsers]
  );

  return {
    users,
    loading,
    error,
    currentPage,
    totalPages,
    loadUsers,
    goToPage,
    setError
  };
};

// ================================
// SEARCH HOOKS
// ================================

/**
 * Hook for managing smart search functionality
 */
export const useSmartSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(value.trim())}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchResultSelect = useCallback((user: SearchResult) => {
    const managementUser: ManagementUser = {
      ...user,
      created_at: new Date().toISOString(), // Placeholder, will be fetched with full details
      timeouts: []
    };
    setShowSearchResults(false);
    setSearchQuery('');
    return managementUser;
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    setSearchQuery,
    setShowSearchResults,
    handleSearchChange,
    handleSearchResultSelect
  };
};

// ================================
// FILTERING HOOKS
// ================================

/**
 * Hook for managing column filtering
 */
export const useColumnFiltering = (users: ManagementUser[]) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Apply column filters to users
  const applyColumnFilters = useCallback(
    (userList: ManagementUser[]): ManagementUser[] => {
      // If no filters are active, return all users
      if (columnFilters.length === 0 || activeFiltersCount === 0) {
        return userList;
      }

      const filtered = userList.filter((user) => {
        return columnFilters.every((filter) => {
          if (!filter.active) return true;

          const fieldValue = getFieldValue(user, filter.column);
          const filterValue = filter.value.toLowerCase().trim();

          switch (filter.operator) {
            case 'contains':
              return fieldValue.toLowerCase().includes(filterValue);
            case 'not_contains':
              return !fieldValue.toLowerCase().includes(filterValue);
            case 'equals':
              return fieldValue.toLowerCase() === filterValue;
            case 'not_equals':
              return fieldValue.toLowerCase() !== filterValue;
            case 'starts_with':
              return fieldValue.toLowerCase().startsWith(filterValue);
            case 'ends_with':
              return fieldValue.toLowerCase().endsWith(filterValue);
            case 'is_empty':
              return !fieldValue || fieldValue.trim() === '';
            case 'is_not_empty':
              return fieldValue && fieldValue.trim() !== '';
            case 'date_before':
              return new Date(fieldValue) < new Date(filter.value);
            case 'date_after':
              return new Date(fieldValue) > new Date(filter.value);
            case 'date_equals':
              return (
                new Date(fieldValue).toDateString() ===
                new Date(filter.value).toDateString()
              );
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    [columnFilters, activeFiltersCount]
  );

  // Update active filters count
  useEffect(() => {
    const activeCount = columnFilters.filter((filter) => filter.active).length;
    setActiveFiltersCount(activeCount);
  }, [columnFilters]);

  // Filter management functions
  const addColumnFilter = useCallback((column: string) => {
    const newFilter: ColumnFilter = {
      column,
      operator: 'contains',
      value: '',
      active: false
    };
    setColumnFilters((prev) => [...prev, newFilter]);
  }, []);

  const updateColumnFilter = useCallback(
    (index: number, updates: Partial<ColumnFilter>) => {
      setColumnFilters((prev) =>
        prev.map((filter, i) =>
          i === index ? { ...filter, ...updates } : filter
        )
      );
    },
    []
  );

  const removeColumnFilter = useCallback((index: number) => {
    setColumnFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllFilters = useCallback(() => {
    setColumnFilters([]);
    setActiveFiltersCount(0);
  }, []);

  return {
    columnFilters,
    showFilterPanel,
    activeFiltersCount,
    setShowFilterPanel,
    applyColumnFilters,
    addColumnFilter,
    updateColumnFilter,
    removeColumnFilter,
    clearAllFilters
  };
};

// ================================
// SORTING HOOKS
// ================================

/**
 * Hook for managing column sorting
 */
export const useColumnSorting = () => {
  const [currentSort, setCurrentSort] = useState<ColumnSort>({
    column: '',
    direction: null
  });

  const handleSort = useCallback((columnKey: string) => {
    setCurrentSort((prev) => {
      if (prev.column === columnKey) {
        // Cycle through: asc -> desc -> null -> asc
        const newDirection =
          prev.direction === 'asc'
            ? 'desc'
            : prev.direction === 'desc'
              ? null
              : 'asc';
        return { column: columnKey, direction: newDirection };
      } else {
        // New column, start with ascending
        return { column: columnKey, direction: 'asc' };
      }
    });
  }, []);

  const getSortIndicator = useCallback(
    (columnKey: string): string => {
      if (currentSort.column !== columnKey) return '';
      switch (currentSort.direction) {
        case 'asc':
          return ' ↑';
        case 'desc':
          return ' ↓';
        default:
          return '';
      }
    },
    [currentSort]
  );

  return {
    currentSort,
    handleSort,
    getSortIndicator
  };
};

// ================================
// PAGINATION HOOKS
// ================================

/**
 * Hook for managing infinite scroll pagination
 */
export const useInfiniteScroll = (filteredUsers: ManagementUser[]) => {
  const [displayedUsers, setDisplayedUsers] = useState<ManagementUser[]>([]);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load more users for infinite scroll
  const loadMoreUsers = useCallback(() => {
    if (isLoadingMore || !hasMoreUsers) return;

    setIsLoadingMore(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentDisplayed = displayedUsers.length;
      const nextBatch = filteredUsers.slice(
        currentDisplayed,
        currentDisplayed + USERS_PER_LOAD
      );

      if (nextBatch.length > 0) {
        setDisplayedUsers((prev) => [...prev, ...nextBatch]);
        setHasMoreUsers(
          currentDisplayed + nextBatch.length < filteredUsers.length
        );
      } else {
        setHasMoreUsers(false);
      }

      setIsLoadingMore(false);
    }, 300);
  }, [displayedUsers, filteredUsers, isLoadingMore, hasMoreUsers]);

  // Initialize displayed users when filteredUsers change
  useEffect(() => {
    const initialUsers = filteredUsers.slice(0, USERS_PER_LOAD);
    setDisplayedUsers(initialUsers);
    setHasMoreUsers(initialUsers.length < filteredUsers.length);
  }, [filteredUsers]);

  return {
    displayedUsers,
    hasMoreUsers,
    isLoadingMore,
    loadMoreUsers
  };
};

/**
 * Hook for getting paginated users based on pagination mode
 */
export const usePaginatedUsers = (
  filteredUsers: ManagementUser[],
  currentPage: number,
  paginationMode: 'traditional' | 'infinite',
  displayedUsers: ManagementUser[]
) => {
  return useMemo(() => {
    if (paginationMode === 'infinite') {
      return displayedUsers;
    } else {
      // Traditional pagination
      const startIndex = (currentPage - 1) * USERS_PER_PAGE;
      const endIndex = startIndex + USERS_PER_PAGE;
      return filteredUsers.slice(startIndex, endIndex);
    }
  }, [paginationMode, displayedUsers, filteredUsers, currentPage]);
};
