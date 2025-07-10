import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { PostFilters } from '../../types/filters';
import { Filter, SubmissionsFilters } from '../atoms';

interface UseUrlSyncProps {
  filtersState: SubmissionsFilters;
  setFiltersState: (updater: (prevState: SubmissionsFilters) => SubmissionsFilters) => void;
  initialFilters: Filter<PostFilters>[];
  infiniteScroll: boolean;
}

export function useUrlSync({
  filtersState,
  setFiltersState,
  initialFilters,
  infiniteScroll
}: UseUrlSyncProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL ONCE on mount only
  useEffect(() => {
    if (filtersState.initialized) {
      return;
    }

    // Parse URL parameters into filters (one-time only)
    const urlFilters: Filter<PostFilters>[] = [];

    // Parse tags - create separate filters for each tag
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      const tags = tagsParam.split(',').filter(Boolean);
      tags.forEach(tag => {
        urlFilters.push({ name: 'tags', value: tag.trim() });
      });
    }

    // Parse other filters
    const authorParam = searchParams.get('author');
    if (authorParam) {
      // Handle comma-separated author values
      const authors = authorParam.split(',').filter(Boolean);
      authors.forEach(author => {
        urlFilters.push({ name: 'author', value: author.trim() });
      });
    }

    const mentionsParam = searchParams.get('mentions');
    if (mentionsParam) {
      // Handle comma-separated mention values
      const mentions = mentionsParam.split(',').filter(Boolean);
      mentions.forEach(mention => {
        urlFilters.push({ name: 'mentions', value: mention.trim() });
      });
    }

    const searchParam = searchParams.get('search');
    if (searchParam) urlFilters.push({ name: 'search', value: searchParam });

    const onlyRepliesParam = searchParams.get('onlyReplies');
    if (onlyRepliesParam === 'true') urlFilters.push({ name: 'onlyReplies', value: 'true' });

    const globalLogicParam = searchParams.get('globalLogic');
    if (globalLogicParam) urlFilters.push({ name: 'globalLogic', value: globalLogicParam });

    const tagLogicParam = searchParams.get('tagLogic');
    if (tagLogicParam) urlFilters.push({ name: 'tagLogic', value: tagLogicParam });

    const authorLogicParam = searchParams.get('authorLogic');
    if (authorLogicParam) urlFilters.push({ name: 'authorLogic', value: authorLogicParam });

    const mentionsLogicParam = searchParams.get('mentionsLogic');
    if (mentionsLogicParam) urlFilters.push({ name: 'mentionsLogic', value: mentionsLogicParam });

    // Use URL filters if available, otherwise use initial filters
    const combinedFilters = urlFilters.length > 0 ? urlFilters : initialFilters;
    
    // Deduplicate filters by type and value
    const deduplicatedFilters: Filter<PostFilters>[] = [];
    const seen = new Set<string>();
    
    for (const filter of combinedFilters) {
      const key = `${filter.name}:${filter.value}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedFilters.push(filter);
      }
    }
    
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    // Debug logging for initialization
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔍 useUrlSync INITIALIZATION:', {
        urlFilters,
        combinedFilters,
        deduplicatedFilters,
        searchParamsString: searchParams.toString(),
        page,
        initialFilters
      });
    }

    setFiltersState((prevState) => ({
      ...prevState,
      filters: deduplicatedFilters as Filter[], // Cast to match atom type
      page,
      initialized: true
    }));
  }, [filtersState.initialized, initialFilters, searchParams, setFiltersState]);

  // Memoize URL params to prevent unnecessary URL updates
  const urlParams = useMemo(() => {
    if (!filtersState.initialized || infiniteScroll) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 urlParams memo: Early return', {
          initialized: filtersState.initialized,
          infiniteScroll,
          filters: filtersState.filters
        });
      }
      return null;
    }

    const params = new URLSearchParams();

    // Group filters by type
    const filterGroups: Record<string, string[]> = {};
    filtersState.filters.forEach((filter) => {
      if (!filterGroups[filter.name]) {
        filterGroups[filter.name] = [];
      }
      filterGroups[filter.name].push(filter.value);
    });

    // Add tags (combine multiple tag filters, remove # prefix)
    if (filterGroups.tags && filterGroups.tags.length > 0) {
      const tagsForUrl = filterGroups.tags.map(tag => 
        tag.startsWith('#') ? tag.slice(1) : tag
      );
      // Remove duplicates
      const uniqueTags = [...new Set(tagsForUrl)];
      params.set('tags', uniqueTags.join(','));
    }

    // Add other filters
    Object.entries(filterGroups).forEach(([name, values]) => {
      if (name === 'tags') return; // Already handled
      if (values.length > 0) {
        if (name === 'onlyReplies' && values[0] === 'true') {
          params.set('onlyReplies', 'true');
        } else if (name === 'author') {
          // Remove duplicates before joining
          const uniqueValues = [...new Set(values)];
          params.set('author', uniqueValues.join(','));
        } else if (name === 'mentions') {
          // Remove duplicates before joining
          const uniqueValues = [...new Set(values)];
          params.set('mentions', uniqueValues.join(','));
        } else if (name === 'search') {
          params.set('search', values[0]);
        } else if (name === 'globalLogic' || name === 'tagLogic' || name === 'authorLogic' || name === 'mentionsLogic') {
          params.set(name, values[0]);
        }
      }
    });

    // Add page if not 1
    if (filtersState.page > 1) {
      params.set('page', filtersState.page.toString());
    }

    const result = params.toString();
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔍 urlParams memo: Generated', {
        filters: filtersState.filters,
        filterGroups,
        result,
        initialized: filtersState.initialized
      });
    }

    return result;
  }, [
    filtersState.filters,
    filtersState.page,
    filtersState.initialized,
    infiniteScroll
  ]);

  // One-way URL sync: filters → URL (never URL → filters after init)
  useEffect(() => {
    if (urlParams === null) return;

    // Build new URL
    const newUrl = `${pathname}${urlParams ? `?${urlParams}` : ''}`;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔍 useUrlSync URL update check:', {
        urlParams,
        newUrl,
        currentUrl,
        willUpdate: newUrl !== currentUrl,
        filtersInitialized: filtersState.initialized,
        filterCount: filtersState.filters.length,
        filters: filtersState.filters.map(f => ({ name: f.name, value: f.value }))
      });
    }

    // Only update URL if it changed
    if (newUrl !== currentUrl) {
      router.replace(newUrl); // Use replace to avoid history pollution
    }
      }, [urlParams, pathname, router, searchParams]);

  return {
    urlParams
  };
} 