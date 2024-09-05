/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useCallback, useState } from 'react';
import { SUBMISSIONS_LIST_SELECTORS } from '../../../lib/test-selectors/components/submissions-list.selectors';
import { PostFilters } from '../../posts/page';
import Empty from '../empty/Empty';
import FadeIn, { DisplayType } from '../fade-in/FadeIn';
import { Filter } from '../filter-bar/FilterBar';
import Loader from '../loader/Loader';
import Pagination from '../pagination/Pagination';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { Submission } from '../submission-forms/schema';
import { TagLink } from '../tag-link/TagLink';
import { ReplyForm } from '../thread/ReplyForm';
import './SubmissionsList.css';
import { useSubmissionsList } from './use-submissions-list';

// Add this new interface
interface SubmissionWithReplies extends Submission {
  replies?: SubmissionWithReplies[];
}

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

  // New function to organize submissions into a tree structure
  const organizeSubmissions = useCallback(
    (submissions: Submission[]): SubmissionWithReplies[] => {
      const submissionMap = new Map<number, SubmissionWithReplies>();
      const rootSubmissions: SubmissionWithReplies[] = [];

      submissions.forEach((submission) => {
        submissionMap.set(submission.submission_id, {
          ...submission,
          replies: []
        });
      });

      submissions.forEach((submission) => {
        if (submission.thread_parent_id) {
          const parent = submissionMap.get(submission.thread_parent_id);
          if (parent) {
            parent.replies?.push(submissionMap.get(submission.submission_id)!);
          }
        } else {
          rootSubmissions.push(submissionMap.get(submission.submission_id)!);
        }
      });

      return rootSubmissions;
    },
    []
  );

  // New component to render a single submission and its replies
  const SubmissionThread = ({
    submission,
    depth = 0
  }: {
    submission: SubmissionWithReplies;
    depth?: number;
  }) => {
    const canDelete = isAuthorized(submission.author_id);
    const createdDate = new Date(
      submission.submission_datetime
    ).toLocaleDateString();

    return (
      <FadeIn
        display={DisplayType.LI}
        key={submission.submission_id}
        className="submission__wrapper"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <p className="submission__content">
          {submission.author && (
            <span className="submission__author">
              {submission.author}:&nbsp;
            </span>
          )}
          <span>
            <TagLink
              value={submission.submission_name}
              contextId={contextId}
              appendSearchParam
            />
          </span>
        </p>

        <div className="submission__meta">
          <p className="submission__datetime">{createdDate}</p>
          {canDelete && (
            <DeleteSubmissionForm
              id={submission.submission_id}
              name={submission.submission_name}
              isAuthorized={!!providerAccountId}
            />
          )}
          <button
            onClick={() => toggleReplyForm(submission.submission_id)}
            className="thread-button"
          >
            {activeThreadId === submission.submission_id
              ? 'Close Reply'
              : 'Reply'}
          </button>
        </div>

        {activeThreadId === submission.submission_id && (
          <ReplyForm parentId={submission.submission_id} />
        )}

        {submission.replies && submission.replies.length > 0 && (
          <ol className="submission__replies">
            {submission.replies.map((reply) => (
              <SubmissionThread
                key={reply.submission_id}
                submission={reply}
                depth={depth + 1}
              />
            ))}
          </ol>
        )}
      </FadeIn>
    );
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
              organizeSubmissions(response.data.result).map((submission) => (
                <SubmissionThread
                  key={submission.submission_id}
                  submission={submission}
                />
              ))}
          </ol>
        </>
      )}
    </article>
  );
}
