import { useAtom } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { PostFilters } from '../../posts/page';
import { Filter } from '../filter-bar/FilterBar';
import { getSubmissionsAction } from './actions';
import {
  getSubmissionsComputedAtom,
  getSubmissionsFiltersAtom,
  getSubmissionsStateAtom
} from './submissions-atom';

export function useSubmissions(
  contextId: string,
  providerAccountId: string,
  onlyMine: boolean,
  initialPage: number,
  initialFilters: Filter<PostFilters>[]
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useAtom(getSubmissionsStateAtom(contextId));
  const [filters, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );
  const computed = useAtom(getSubmissionsComputedAtom(contextId))[0];
  const isInitialized = useRef(false);
  const filtersRef = useRef(filters);
  const mounted = useRef(false);
  const fetchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Update ref when filters change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Initialize filters from URL or props
  useEffect(() => {
    if (isInitialized.current) return;

    const pageParam = searchParams.get('page');
    const tagsParam = searchParams.get('tags');

    setFiltersState({
      onlyMine,
      providerAccountId,
      filters: tagsParam
        ? [{ name: 'tags' as PostFilters, value: tagsParam }]
        : initialFilters,
      page: pageParam ? parseInt(pageParam) : initialPage,
      pageSize: 10,
      initialized: true
    });
    isInitialized.current = true;
  }, [
    onlyMine,
    providerAccountId,
    initialFilters,
    initialPage,
    searchParams,
    setFiltersState
  ]);

  const fetchSubmissions = useCallback(async () => {
    if (
      !filtersRef.current.providerAccountId ||
      !isInitialized.current ||
      !mounted.current
    )
      return;

    // Clear any existing timeout
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }

    // Set a new timeout to debounce the fetch
    fetchTimeout.current = setTimeout(async () => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const result = await getSubmissionsAction({
          onlyMine: filtersRef.current.onlyMine,
          providerAccountId: filtersRef.current.providerAccountId,
          filters: filtersRef.current.filters,
          page: filtersRef.current.page,
          pageSize: filtersRef.current.pageSize
        });

        if (!mounted.current) return;

        if (result.error) {
          setState({
            loading: false,
            error: result.error
          });
          return;
        }

        setState({
          loading: false,
          data: result.data
            ? {
                submissions: result.data.data,
                pagination: result.data.pagination
              }
            : undefined,
          error: undefined
        });
      } catch (error) {
        if (!mounted.current) return;

        setState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch submissions'
        });
      }
    }, 300); // 300ms debounce
  }, [setState]);

  // Set mounted ref
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, []);

  // Fetch submissions when filters or providerAccountId changes
  useEffect(() => {
    if (!isInitialized.current || !mounted.current) return;
    fetchSubmissions();
  }, [fetchSubmissions, filters, providerAccountId]);

  const updateUrl = useCallback(
    (newPage: number, newTags?: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newPage > 1) {
        params.set('page', newPage.toString());
      } else {
        params.delete('page');
      }

      if (newTags) {
        params.set('tags', newTags);
      } else {
        params.delete('tags');
      }

      router.replace(
        `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
      );
    },
    [router, pathname, searchParams]
  );

  const setPage = useCallback(
    (page: number) => {
      setFiltersState((prev) => ({ ...prev, page }));
      updateUrl(page);
    },
    [setFiltersState, updateUrl]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      setFiltersState((prev) => ({ ...prev, pageSize, page: 1 }));
      updateUrl(1);
    },
    [setFiltersState, updateUrl]
  );

  const updateFilters = useCallback(
    (newFilters: Filter<PostFilters>[]) => {
      setFiltersState((prev) => ({ ...prev, filters: newFilters, page: 1 }));
      const tagFilter = newFilters.find((f) => f.name === 'tags')?.value;
      updateUrl(1, tagFilter);
    },
    [setFiltersState, updateUrl]
  );

  return {
    ...computed,
    setPage,
    setPageSize,
    setFilters: updateFilters,
    refetch: fetchSubmissions
  };
}
