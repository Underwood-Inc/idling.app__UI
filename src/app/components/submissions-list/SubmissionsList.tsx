'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { NAV_PATHS } from '../../../lib/routes';
import { useFilters } from '../../../lib/state/FiltersContext';
import { usePagination } from '../../../lib/state/PaginationContext';
import { useShouldUpdate } from '../../../lib/state/ShouldUpdateContext';
import { SUBMISSIONS_LIST_SELECTORS } from '../../../lib/test-selectors/components/submissions-list.selectors';
import { PostFilters } from '../../posts/page';
import Empty from '../empty/Empty';
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
  listId = 'default',
  providerAccountId,
  onlyMine = false,
  filters = []
}: {
  listId: string;
  providerAccountId: string;
  onlyMine?: boolean;
  filters?: Filter<PostFilters>[];
}) {
  const router = useRouter();
  const { state: filtersState } = useFilters();
  const { state: shouldUpdate, dispatch: dispatchShouldUpdate } =
    useShouldUpdate();
  const { state: paginationState, dispatch: dispatchPagination } =
    usePagination();
  const pagination = paginationState[listId];

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
    } = {
      currentPage: pagination?.currentPage || 1,
      filters,
      onlyMine,
      providerAccountId
    };

    return data;
  }, [pagination, filters, onlyMine, providerAccountId]);

  const fetchSubmissions = useCallback(
    async (args: GetSubmissionsActionArguments) => {
      setLoading(true);
      setResponse(await getSubmissionsAction(args));
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    const newTotalPages =
      (response?.data?.pagination.totalRecords || 1) / 10 || 1;

    dispatchPagination({
      type: 'SET_TOTAL_PAGES',
      payload: {
        id: listId,
        page: Math.ceil(newTotalPages)
      }
    });
  }, [dispatchPagination, response?.data?.pagination.totalRecords, listId]);

  useEffect(() => {
    dispatchShouldUpdate({ type: 'SET_SHOULD_UPDATE', payload: false });
    dispatchPagination({
      payload: {
        id: listId,
        page: 1
      },
      type: 'SET_CURRENT_PAGE'
    });
    fetchSubmissions({ ...getArgs(), currentPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUpdate]);

  useEffect(() => {
    const latestFilters = filtersState.default?.filters.find(
      (filter) => filter.name === 'tags'
    )?.value;
    const newRoute = `${NAV_PATHS.POSTS}${latestFilters ? `?tags=${latestFilters}` : ''}`;
    router.push(newRoute);

    dispatchPagination({
      payload: { id: listId, page: 1 },
      type: 'SET_CURRENT_PAGE'
    });

    fetchSubmissions({
      ...getArgs(),
      currentPage: 1,
      filters: filtersState.default?.filters || []
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersState]);

  const onPageChange = (newPage: number) => {
    const args: GetSubmissionsActionArguments = {
      ...getArgs(),
      currentPage: newPage
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
        <Pagination id={listId} onPageChange={onPageChange} />
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
                    <li key={submission_id} className="submission__wrapper">
                      <p>
                        {author && (
                          <span className="submission__author">
                            {author}:&nbsp;
                          </span>
                        )}
                        <span>
                          <TagLink value={submission_name} />
                        </span>
                        <span className="submission__datetime">
                          {createdDate}
                        </span>
                      </p>

                      {canDelete && (
                        <DeleteSubmissionForm
                          id={submission_id}
                          name={submission_name}
                          isAuthorized={!!providerAccountId}
                        />
                      )}
                    </li>
                  );
                }
              )}
          </ol>
        </>
      )}
    </article>
  );
}
