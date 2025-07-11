import { useCallback } from 'react';
import { SubmissionWithReplies } from '../../../app/components/submissions-list/actions';
import { PostFilters } from '../../types/filters';
import { Filter, SubmissionsFilters } from '../atoms';

interface UseFiltersManagerProps {
  setFiltersState: (updater: (prevState: SubmissionsFilters) => SubmissionsFilters) => void;
  infiniteScroll: boolean;
  setInfiniteData: (data: SubmissionWithReplies[]) => void;
  setInfinitePage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
}

export function useFiltersManager({
  setFiltersState,
  infiniteScroll,
  setInfiniteData,
  setInfinitePage,
  setHasMore
}: UseFiltersManagerProps) {
  
  const addFilter = useCallback(
    (filter: Filter<PostFilters>) => {
      setFiltersState((prevState) => {
        // Check if this exact filter already exists
        const filterKey = `${filter.name}:${filter.value}`;
        const filterExists = prevState.filters.some(
          existingFilter => `${existingFilter.name}:${existingFilter.value}` === filterKey
        );
        
        // If filter already exists, don't add it again
        if (filterExists) {
          return prevState;
        }
        
        return {
          ...prevState,
          filters: [...prevState.filters, filter as Filter],
          page: 1
        };
      });
    },
    [setFiltersState]
  );

  const addFilters = useCallback(
    (filters: Filter<PostFilters>[]) => {
      setFiltersState((prevState) => {
        // Combine existing and new filters
        const allFilters = [...prevState.filters, ...filters as Filter[]];
        
        // Deduplicate by creating a unique key for each filter
        const deduplicatedFilters: Filter[] = [];
        const seen = new Set<string>();
        
        for (const filter of allFilters) {
          const key = `${filter.name}:${filter.value}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduplicatedFilters.push(filter);
          }
        }
        
        return {
          ...prevState,
          filters: deduplicatedFilters,
          page: 1
        };
      });
    },
    [setFiltersState]
  );

  const removeFilter = useCallback(
    (filterName: PostFilters, filterValue?: string) => {
      setFiltersState((prevState) => {
        const newFilters = prevState.filters
          .map((filter) => {
            if (filter.name === filterName) {
              if (!filterValue) {
                // Remove entire filter if no specific value provided
                return null;
              }

              // Handle comma-separated values for author/mentions filters
              if (filterName === 'author' || filterName === 'mentions') {
                const currentValues = filter.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean);

                const updatedValues = currentValues.filter(
                  (value) => value !== filterValue
                );

                if (updatedValues.length === 0) {
                  return null; // Remove the entire filter
                }

                return {
                  ...filter,
                  value: updatedValues.join(',')
                };
              } else {
                // For other filter types, use exact match
                return filter.value === filterValue ? null : filter;
              }
            }
            return filter;
          })
          .filter((filter): filter is Filter => filter !== null);

        return {
          ...prevState,
          filters: newFilters,
          page: 1
        };
      });
    },
    [setFiltersState]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      // Check if this is a special search text removal format: "search:removedTerm:newSearchText"
      if (tagToRemove.startsWith('search:')) {
        const parts = tagToRemove.split(':');
        if (parts.length === 3) {
          const [, removedTerm, newSearchText] = parts;
          
          setFiltersState((prevState) => {
            const newFilters = prevState.filters.map((filter) => {
              if (filter.name === 'search') {
                return {
                  ...filter,
                  value: newSearchText
                };
              }
              return filter;
            });

            return {
              ...prevState,
              filters: newFilters,
              page: 1
            };
          });
          return;
        }
      }

      setFiltersState((prevState) => {
        const newFilters = prevState.filters
          .map((filter) => {
            if (filter.name === 'tags') {
              const currentTags = filter.value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

              // Handle both formats: with and without # prefix
              // Try to match the tag as-is first, then try with/without # prefix
              const tagVariants = [
                tagToRemove,
                tagToRemove.startsWith('#')
                  ? tagToRemove.slice(1)
                  : `#${tagToRemove}`
              ];

              const updatedTags = currentTags.filter(
                (tag) => !tagVariants.includes(tag)
              );

              if (updatedTags.length === 0) {
                return null; // Remove the entire filter
              }

              return {
                ...filter,
                value: updatedTags.join(',')
              };
            }
            return filter;
          })
          .filter((filter): filter is Filter => filter !== null);

        return {
          ...prevState,
          filters: newFilters,
          page: 1
        };
      });
    },
    [setFiltersState]
  );

  const setPage = useCallback(
    (page: number) => {
      setFiltersState((prevState) => ({
        ...prevState,
        page
      }));
    },
    [setFiltersState]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      setFiltersState((prevState) => ({
        ...prevState,
        pageSize,
        page: 1
      }));
    },
    [setFiltersState]
  );

  const clearFilters = useCallback(() => {
    setFiltersState((prevState) => ({
      ...prevState,
      filters: [],
      page: 1
    }));

    if (infiniteScroll) {
      setInfiniteData([]);
      setInfinitePage(1);
      setHasMore(true);
    }
  }, [setFiltersState, infiniteScroll, setInfiniteData, setInfinitePage, setHasMore]);

  const updateFilter = useCallback(
    (filterName: PostFilters, newValue: string) => {
      setFiltersState((prevState) => {
        const newFilters = prevState.filters.map((filter) => {
          if (filter.name === filterName) {
            return { ...filter, value: newValue };
          }
          return filter;
        });

        // If filter doesn't exist, add it
        const filterExists = prevState.filters.some(f => f.name === filterName);
        if (!filterExists) {
          newFilters.push({ name: filterName, value: newValue } as Filter);
        }

        return {
          ...prevState,
          filters: newFilters
        };
      });
    },
    [setFiltersState]
  );

  return {
    addFilter,
    addFilters,
    removeFilter,
    removeTag,
    setPage,
    setPageSize,
    clearFilters,
    updateFilter
  };
} 