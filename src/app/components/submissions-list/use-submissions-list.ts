/* eslint-disable react-hooks/exhaustive-deps */
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useFilters } from '../../../lib/state/FiltersContext';
import { PageSize, usePagination } from '../../../lib/state/PaginationContext';
import { useShouldUpdate } from '../../../lib/state/ShouldUpdateContext';
import { PostFilters } from '../../posts/page';
import { Filter } from '../filter-bar/FilterBar';
import { Submission } from '../submission-forms/schema';
import {
  getSubmissionsAction,
  GetSubmissionsActionArguments,
  PaginatedResponse
} from './actions';

export function useSubmissionsList(
  contextId: string,
  providerAccountId: string,
  onlyMine: boolean,
  page: number,
  filters: Filter<PostFilters>[]
) {
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const tagSearchParams = searchParams.get('tags');
  const pageSearchParam = searchParams.get('page');
  const { state: filtersState, dispatch: dispatchFilters } = useFilters();
  const { state: shouldUpdate, dispatch: dispatchShouldUpdate } =
    useShouldUpdate();
  const { state: paginationState, dispatch: dispatchPagination } =
    usePagination();
  const paginationContext = paginationState[contextId];
  const filtersContext = filtersState[contextId];
  const tagSearchParamFilters: Filter<PostFilters>[] = tagSearchParams
    ? [{ name: 'tags', value: tagSearchParams }]
    : [];

  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(getSubmissionsAction, initialState)
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<
    | {
        data?: PaginatedResponse<Submission>;
        message?: string;
        error?: string;
      }
    | undefined
  >();

  const getArgs = useCallback(() => {
    // prioritize url params, context state data, and then defer to prop data
    const data: {
      currentPage: number;
      onlyMine: boolean;
      providerAccountId: string;
      filters: Filter[];
      pageSize: number;
    } = {
      currentPage:
        Number(pageSearchParam) || paginationContext?.currentPage || page,
      filters: tagSearchParamFilters || filtersContext?.filters || filters,
      onlyMine,
      providerAccountId,
      pageSize: paginationContext?.pageSize || PageSize.TEN
    };

    return data;
  }, [
    paginationContext,
    page,
    tagSearchParams,
    pageSearchParam,
    filters,
    onlyMine,
    providerAccountId
  ]);

  const fetchSubmissions = useCallback(
    async (args: GetSubmissionsActionArguments) => {
      setLoading(true);
      setResponse(await getSubmissionsAction(args));
      setLoading(false);
    },
    []
  );

  // Initial fetch and page change effect
  useEffect(() => {
    fetchSubmissions(getArgs());
  }, [page, getArgs, fetchSubmissions]);

  /** response listener/handler */
  useEffect(() => {
    if (response && response.data?.pagination) {
      const newTotalPages =
        response.data.pagination.totalRecords /
        (response.data.pagination.pageSize || 10);
      const totalPages = Math.ceil(newTotalPages);
      const requestedPage = response?.data?.pagination.currentPage;

      // Always dispatch total pages first
      dispatchPagination({
        type: 'SET_TOTAL_PAGES',
        payload: {
          id: contextId,
          totalPages
        }
      });

      // Then handle invalid page numbers
      if (requestedPage > totalPages) {
        // replace requested page with last available page
        dispatchPagination({
          type: 'SET_CURRENT_PAGE',
          payload: {
            id: contextId,
            currentPage: totalPages
          }
        });
      } else if (requestedPage < 1) {
        // replace requested page with first page
        dispatchPagination({
          type: 'SET_CURRENT_PAGE',
          payload: {
            id: contextId,
            currentPage: 1
          }
        });
      }
    }
  }, [
    dispatchPagination,
    response?.data?.pagination.totalRecords,
    response?.data?.pagination.currentPage,
    response?.data?.pagination.pageSize,
    contextId
  ]);

  /**
   * TODO: add dispatch of shouldUpdate to delete and reply actions
   * shouldUpdate listener + handler
   * triggers a refetch of latest data with latest filters/pagination withi initial page size of 10
   * */
  useEffect(() => {
    if (shouldUpdate) {
      dispatchShouldUpdate({ type: 'SET_SHOULD_UPDATE', payload: false });

      fetchSubmissions(getArgs());
    }
  }, [shouldUpdate]);

  /**
   * context listeners: filter context filters, pagination context current page
   *
   * will update the url search params to match latest context data
   */
  useEffect(() => {
    const latestFilters = filtersContext?.filters.find(
      (filter) => filter.name === 'tags'
    )?.value;
    const params = new URLSearchParams();

    if (latestFilters) {
      params.set('tags', latestFilters);
    }

    if (page || page === 0) {
      const maxPage = Number(paginationContext?.totalPages);
      let newPage = paginationContext?.currentPage?.toString() || '1';

      if (Number(newPage) > maxPage) {
        newPage = maxPage.toString();
      }
      if (Number(newPage) < 1) {
        newPage = '1';
      }

      // update url param page to the current pagination state value
      params.set('page', newPage);
    }

    const newRoute = `${pathName}?${params.toString()}`;
    router.push(newRoute);
  }, [paginationContext?.currentPage, filtersContext?.filters]);

  // page size listener
  useEffect(() => {
    // manual fetch so that default page size of 10 is not used from shouldUpdate dispatch handler
    dispatchShouldUpdate({ payload: true, type: 'SET_SHOULD_UPDATE' });
  }, [paginationContext?.pageSize]);

  // route params listener: tags & current page
  useEffect(() => {
    // ensure context state is updated on manual url change (i.e. browser navigation action)
    if (Number(pageSearchParam) !== paginationContext?.currentPage) {
      dispatchPagination({
        type: 'SET_CURRENT_PAGE',
        payload: {
          id: contextId,
          currentPage: Number(pageSearchParam)
        }
      });
    }

    if (
      tagSearchParams !==
      filtersContext?.filters.find((filter) => filter.name === 'tags')?.value
    ) {
      dispatchFilters({
        type: 'SET_CURRENT_FILTERS',
        payload: {
          id: contextId,
          filters: tagSearchParamFilters
        }
      });
    }

    dispatchShouldUpdate({ type: 'SET_SHOULD_UPDATE', payload: true });
  }, [tagSearchParams?.length, pageSearchParam]);

  const isAuthorized = (authorId: string) => {
    return providerAccountId === authorId;
  };

  return { loading, response, fetchSubmissions, isAuthorized };
}
