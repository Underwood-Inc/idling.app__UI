/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useFilters } from '../../../lib/state/FiltersContext';
import { PageSize, usePagination } from '../../../lib/state/PaginationContext';
import { useShouldUpdate } from '../../../lib/state/ShouldUpdateContext';
import { SUBMISSIONS_LIST_SELECTORS } from '../../../lib/test-selectors/components/submissions-list.selectors';
import { PostFilters } from '../../posts/page';
import Empty from '../empty/Empty';
import FadeIn from '../fade-in/FadeIn';
import { Filter } from '../filter-bar/FilterBar';
import Loader from '../loader/Loader';
import Pagination from '../pagination/Pagination';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { Submission } from '../submission-forms/schema';
import { TagLink } from '../tag-link/TagLink';
import {
  getSubmissionsAction,
  GetSubmissionsActionArguments,
  PaginatedResponse
} from './actions';
import './SubmissionsList.css';

export default function SubmissionsList({
  contextId = 'default',
  providerAccountId,
  onlyMine = false,
  filters = [],
  page = 1
}: {
  contextId: string;
  providerAccountId: string;
  page?: number;
  onlyMine?: boolean;
  filters?: Filter<PostFilters>[];
}) {
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

  /** response listener/handler */
  useEffect(() => {
    if (response && response.data?.pagination) {
      const newTotalPages =
        response.data.pagination.totalRecords /
        (response.data.pagination.pageSize || 10);
      const totalPages = Math.ceil(newTotalPages);
      const requestedPage = response?.data?.pagination.currentPage;

      if (requestedPage > totalPages) {
        // replace requested page with last available page
        dispatchPagination({
          type: 'SET_CURRENT_PAGE',
          payload: {
            id: contextId,
            currentPage: totalPages
          }
        });
      }

      if (requestedPage < 1) {
        // replace requested page with first page
        dispatchPagination({
          type: 'SET_CURRENT_PAGE',
          payload: {
            id: contextId,
            currentPage: 1
          }
        });
      }

      dispatchPagination({
        type: 'SET_TOTAL_PAGES',
        payload: {
          id: contextId,
          totalPages
        }
      });
    }
  }, [
    dispatchPagination,
    response?.data?.pagination.totalRecords,
    response?.data?.pagination.currentPage,
    response?.data?.pagination.pageSize,
    contextId
  ]);

  /**
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

  return (
    <article
      data-testid={SUBMISSIONS_LIST_SELECTORS.CONTAINER}
      className="submissions-list__container"
    >
      <div className="submissions-list__header">
        <Pagination id={contextId} />
      </div>

      {loading && <Loader color="black" />}

      {!loading && (
        <>
          {response?.data?.result.length === 0 && (
            <Empty label="No posts to show" />
          )}
          <ol className="submission__list">
            {!!response?.data?.result.length &&
              response?.data.result.map(
                ({
                  submission_id,
                  submission_name,
                  author,
                  author_id,
                  submission_datetime
                }) => {
                  const canDelete = isAuthorized(author_id);
                  const createdDate = new Date(
                    submission_datetime
                  ).toLocaleDateString();

                  return (
                    <FadeIn
                      display="li"
                      key={submission_id}
                      className="submission__wrapper"
                    >
                      <p className="submission__content">
                        {author && (
                          <span className="submission__author">
                            {author}:&nbsp;
                          </span>
                        )}
                        <span>
                          <TagLink
                            value={submission_name}
                            contextId={contextId}
                            appendSearchParam
                          />
                        </span>
                      </p>

                      <div className="submission__meta">
                        <p className="submission__datetime">{createdDate}</p>
                        {canDelete && (
                          <DeleteSubmissionForm
                            id={submission_id}
                            name={submission_name}
                            isAuthorized={!!providerAccountId}
                          />
                        )}
                      </div>
                    </FadeIn>
                  );
                }
              )}
          </ol>
        </>
      )}
    </article>
  );
}
