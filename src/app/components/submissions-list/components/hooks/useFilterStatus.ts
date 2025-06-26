import { useMemo } from 'react';

export interface FilterCounts {
  tags: number;
  authors: number;
  mentions: number;
  search: number;
}

export interface UseFilterStatusProps {
  filterCounts?: FilterCounts;
  totalActiveFilters?: number;
  hasValidSearch: boolean;
  searchTerms: string[];
}

export const useFilterStatus = ({
  filterCounts,
  totalActiveFilters,
  hasValidSearch,
  searchTerms
}: UseFilterStatusProps) => {
  const shouldShowStatus = useMemo(() => {
    return hasValidSearch || (filterCounts && totalActiveFilters && totalActiveFilters > 0);
  }, [hasValidSearch, filterCounts, totalActiveFilters]);

  const searchStatusText = useMemo(() => {
    if (!hasValidSearch) return null;
    
    return `Searching for ${searchTerms.length} term${searchTerms.length !== 1 ? 's' : ''}`;
  }, [hasValidSearch, searchTerms]);

  const filterStatusText = useMemo(() => {
    if (!filterCounts || !totalActiveFilters || totalActiveFilters <= 0) {
      return null;
    }

    const filterStrings = [
      filterCounts.tags > 0 &&
        `${filterCounts.tags} tag${filterCounts.tags !== 1 ? 's' : ''}`,
      filterCounts.authors > 0 &&
        `${filterCounts.authors} author${filterCounts.authors !== 1 ? 's' : ''}`,
      filterCounts.mentions > 0 &&
        `${filterCounts.mentions} mention${filterCounts.mentions !== 1 ? 's' : ''}`
    ].filter(Boolean);

    return filterStrings.length > 0 ? `Filtering by ${filterStrings.join(', ')}` : null;
  }, [filterCounts, totalActiveFilters]);

  const statusText = useMemo(() => {
    const parts = [searchStatusText, filterStatusText].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : null;
  }, [searchStatusText, filterStatusText]);

  return {
    shouldShowStatus,
    statusText
  };
}; 