'use client';
import { Suspense, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { PostFilters } from '../../posts/page';
import { usePagination } from '../../state/PaginationContext';
import Empty from '../empty/Empty';
import { Filter } from '../filter-bar/FilterBar';
import Loader from '../loader/Loader';
import Pagination from '../pagination/Pagination';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { TagLink } from '../tag-link/TagLink';
import { getSubmissionsAction } from './actions';
import './SubmissionsList.css';

const initialState = {
  message: '',
  error: '',
  data: undefined
};

export default function SubmissionsList({
  providerAccountId,
  onlyMine = false,
  filters = []
}: {
  providerAccountId: string;
  onlyMine?: boolean;
  filters?: Filter<PostFilters>[];
}) {
  // noStore();
  const { state: paginationState, dispatch } = usePagination();
  const { currentPage, totalPages } = paginationState;
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(getSubmissionsAction, initialState)
  const [state, formAction] = useFormState(getSubmissionsAction, initialState);
  // TODO: 10 records per page pagination
  // select * from (select *, ROW_NUMBER() OVER (ORDER BY submission_id) as row_num from submissions) sub where row_num BETWEEN 0 AND 10;
  // ^ get first page.
  // select * from (select *, ROW_NUMBER() OVER (ORDER BY submission_id) as row_num from submissions) sub where row_num BETWEEN 11 AND 20;
  // ^ get second page.
  // USE URL PARAMS on full pages
  // forms to store current page as fake, hidden inputs
  // store last loaded pagination info in sessionstorage
  // https://dev.to/w3tsa/mastering-nextjs-14-adding-search-and-pagination-5fd2
  // server action:
  //   submit current page from client
  //   return new page from server action
  //   update client pagination with new page
  const onlyMineFormValue = onlyMine ? '1' : '0';
  const currentPageFormValue = currentPage.toString();

  useEffect(() => {
    formAction(getFormData());
  }, []);

  useEffect(() => {
    console.info(
      'state.data?.pagination.totalRecords',
      state.data?.pagination.totalRecords
    );
    const newTotalPages = (state.data?.pagination.totalRecords || 1) / 10;

    dispatch({
      type: 'SET_TOTAL_PAGES',
      payload: Math.ceil(newTotalPages)
    });
  }, [state]);

  // TODO: update action to be regular args and not formData
  const getFormData = () => {
    const formdata = new FormData();

    formdata.append('current_page', currentPageFormValue);
    formdata.append('only_mine', onlyMineFormValue);
    formdata.append('provider_account_id', providerAccountId);

    return formdata;
  };

  const onPageChange = async (newPage: number) => {
    console.info('new page is: ', newPage);
    const data = getFormData();
    data.set('current_page', newPage.toString());
    return formAction(data);
  };

  const isAuthorized = (authorId: string) => {
    return providerAccountId === authorId;
  };

  // const submissions = await getSubmissions();
  // const submissions = state.data;
  // const submissions = [] as Submission[];

  return (
    <article>
      <Pagination onPageChange={onPageChange} />

      <Suspense fallback={<Loader />}>
        <ol className="submission__list">
          {state.data?.result.length === 0 && (
            <Empty label="No posts to show" />
          )}

          {!!state.data?.result.length &&
            state.data.result.map(
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
      </Suspense>
    </article>
  );
}
