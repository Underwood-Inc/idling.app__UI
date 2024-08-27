/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { usePathname, useRouter } from 'next/navigation';
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
  const { state: filtersState } = useFilters();
  const { state: shouldUpdate, dispatch: dispatchShouldUpdate } =
    useShouldUpdate();
  const { state: paginationState, dispatch: dispatchPagination } =
    usePagination();
  const pagination = paginationState[contextId];

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
    const data: {
      currentPage: number;
      onlyMine: boolean;
      providerAccountId: string;
      filters: Filter[];
      pageSize: number;
    } = {
      currentPage: pagination?.currentPage || page,
      filters,
      onlyMine,
      providerAccountId,
      pageSize: pagination?.pageSize || PageSize.TEN
    };

    return data;
  }, [pagination, page, filters, onlyMine, providerAccountId]);

  const fetchSubmissions = useCallback(
    async (args: GetSubmissionsActionArguments) => {
      setLoading(true);
      setResponse(await getSubmissionsAction(args));
      setLoading(false);
    },
    []
  );

  /** listener + handler to manager total pages */
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
    // listener - if pagination data changes, ensure latest total pages is consumed
  }, [
    dispatchPagination,
    response?.data?.pagination.totalRecords,
    response?.data?.pagination.currentPage,
    contextId
  ]);

  /**
   * shouldUpdate listener + handler
   * when "captured", fetch submissions with current state of pagination & filter context
   * but with current page and page size reset to the defaults
   * scenario: get latest data that matches current filters when external component update should_update
   * state to true (i.e. deletion of submission via <DeleteSubmissionForm />)
   * */
  useEffect(() => {
    if (shouldUpdate) {
      dispatchShouldUpdate({ type: 'SET_SHOULD_UPDATE', payload: false });

      dispatchPagination({
        payload: {
          id: contextId,
          pageSize: PageSize.TEN
        },
        type: 'SET_PAGE_SIZE'
      });

      fetchSubmissions({ ...getArgs(), pageSize: PageSize.TEN });
    }
  }, [shouldUpdate]); // should update listener ("external" trigger)

  useEffect(() => {
    const latestFilters = filtersState[contextId]?.filters.find(
      (filter) => filter.name === 'tags'
    )?.value;
    const params = new URLSearchParams();

    if (latestFilters) {
      params.set('tags', latestFilters);
    }

    if (page || page === 0) {
      const maxPage = Number(paginationState[contextId]?.totalPages);
      let newPage = paginationState[contextId]?.currentPage?.toString() || '1';

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

    fetchSubmissions({
      ...getArgs(),
      // as filter listener can update pagination and should in this filterable pagination
      // ecosystem, ensure latest filters are being provided on page change event
      filters: filtersState[contextId]?.filters || [],
      currentPage: paginationState[contextId]?.currentPage || 1
    });
  }, [
    paginationState[contextId]?.currentPage,
    filtersState[contextId]?.filters
  ]); // page/filters change listener

  const onPageChange = (newPage: number) => {
    const args: GetSubmissionsActionArguments = {
      ...getArgs(),
      currentPage: newPage
    };

    fetchSubmissions(args);
  };

  const onPageSizeChange = (newPageSize: number) => {
    const args: GetSubmissionsActionArguments = {
      ...getArgs(),
      currentPage: 1,
      pageSize: newPageSize
    };

    fetchSubmissions(args);
  };

  const isAuthorized = (authorId: string) => {
    return providerAccountId === authorId;
  };

  return (
    <article
      data-testid={SUBMISSIONS_LIST_SELECTORS.CONTAINER}
      className="submissions-list__container"
    >
      <div className="submissions-list__header">
        <Pagination
          id={contextId}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
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
