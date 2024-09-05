/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useState } from 'react';
import { SUBMISSIONS_LIST_SELECTORS } from '../../../lib/test-selectors/components/submissions-list.selectors';
import { PostFilters } from '../../posts/page';
import Empty from '../empty/Empty';
import FadeIn from '../fade-in/FadeIn';
import { Filter } from '../filter-bar/FilterBar';
import Loader from '../loader/Loader';
import Pagination from '../pagination/Pagination';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { TagLink } from '../tag-link/TagLink';
import { ReplyForm } from '../thread/ReplyForm';
import './SubmissionsList.css';
import { useSubmissionsList } from './use-submissions-list';

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
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);

  const toggleReplyForm = (submissionId: number) => {
    setActiveThreadId(activeThreadId === submissionId ? null : submissionId);
  };

  const { isAuthorized, loading, response } = useSubmissionsList(
    contextId,
    providerAccountId,
    onlyMine,
    page,
    filters
  );

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
                        <button
                          onClick={() => toggleReplyForm(submission_id)}
                          className="thread-button"
                        >
                          {activeThreadId === submission_id
                            ? 'Close Thread'
                            : 'Create Thread'}
                        </button>
                      </div>

                      {activeThreadId === submission_id && (
                        <ReplyForm parentId={submission_id} />
                      )}
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
