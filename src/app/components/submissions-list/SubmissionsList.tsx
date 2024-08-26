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
    console.info('...set total pages listener');

    const newTotalPages =
      (response?.data?.pagination.totalRecords || 1) /
        (response?.data?.pagination.pageSize || 10) || 1;

    dispatchPagination({
      type: 'SET_TOTAL_PAGES',
      payload: {
        id: contextId,
        totalPages: Math.ceil(newTotalPages)
      }
    });
  }, [
    dispatchPagination,
    response?.data?.pagination.totalRecords,
    response?.data?.pagination.pageSize,
    contextId
  ]); // listener - if pagination data changes, ensure latest total pages is consumed

  /**
   * shouldUpdate listener + handler
   * when "captured", fetch submissions with current state of pagination & filter context
   * but with current page and page size reset to the defaults
   * scenario: get latest data that matches current filters when external component update should_update
   * state to true (i.e. deletion of submission via <DeleteSubmissionForm />)
   * */
  useEffect(() => {
    console.info('...should update listener');

    dispatchShouldUpdate({ type: 'SET_SHOULD_UPDATE', payload: false });
    // dispatchPagination({
    //   payload: {
    //     id: contextId,
    //     currentPage: 1
    //   },
    //   type: 'SET_CURRENT_PAGE'
    // });
    dispatchPagination({
      payload: {
        id: contextId,
        pageSize: PageSize.TEN
      },
      type: 'SET_PAGE_SIZE'
    });
    fetchSubmissions({ ...getArgs(), pageSize: PageSize.TEN });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUpdate]); // should update listener ("external" trigger)

  /**
   * filterState listener + handler
   * always fetch from page 1 on change of filters
   */
  useEffect(() => {
    console.info('...filterState listener');
    const latestFilters = filtersState[contextId]?.filters.find(
      (filter) => filter.name === 'tags'
    )?.value;
    const params = new URLSearchParams();

    if (latestFilters) {
      params.set('tags', latestFilters);
    }

    if (page) {
      params.set('page', page.toString());
    }

    const newRoute = `${pathName}?${params.toString()}`;

    // filter context does not have knowledge of pagination context
    // ensure filter changes result in pagination current page reset
    dispatchPagination({
      payload: { id: contextId, currentPage: 1 },
      type: 'SET_CURRENT_PAGE'
    });
    // router.push(newRoute);

    // because we fired a page change event, delegate refetch to pagination listener block
    // fetchSubmissions({
    //   ...getArgs(),
    //   currentPage: 1,
    //   filters: filtersState[contextId]?.filters || []
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersState]); // filter state listener

  useEffect(() => {
    console.info('...paginationState listener');
    const latestFilters = filtersState[contextId]?.filters.find(
      (filter) => filter.name === 'tags'
    )?.value;
    const currentFilters = filters.find((filter) => filter.name === 'tags');
    const areFiltersDifferent = latestFilters === currentFilters;
    console.log(
      'areFiltersDiff',
      areFiltersDifferent,
      latestFilters,
      currentFilters
    );
    const params = new URLSearchParams();

    if (latestFilters) {
      params.set('tags', latestFilters);
    }

    if (page) {
      params.set(
        'page',
        paginationState[contextId]?.currentPage?.toString() || '1'
      );
    }

    const newRoute = `${pathName}?${params.toString()}`;
    console.info('paginationstate lsitener new route', newRoute);
    router.push(newRoute);

    fetchSubmissions({
      ...getArgs(),
      // as filter listener can update pagination and should in this filterable pagination
      // ecosystem, ensure latest filters are being provided on page change event
      filters: filtersState[contextId]?.filters || [],
      currentPage: page
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paginationState[contextId]?.currentPage,
    filtersState[contextId]?.filters
  ]); // page change listener

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
