'use client';

import { useEffect, useState } from 'react';
import Loader from '../loader/Loader';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { Submission } from '../submission-forms/schema';
import { TagLink } from '../tag-link/TagLink';
import { getSubmissionThread } from './actions';
import { ReplyForm } from './ReplyForm';

interface ThreadProps {
  submissionId: number;
  providerAccountId: string;
}

export default function Thread({
  submissionId,
  providerAccountId
}: ThreadProps) {
  const [loading, setLoading] = useState(true);
  const [parentSubmission, setParentSubmission] = useState<Submission | null>(
    null
  );
  const [replies, setReplies] = useState<Submission[]>([]);

  const fetchThread = async () => {
    setLoading(true);
    const threadData = await getSubmissionThread(submissionId);
    setParentSubmission(threadData.parent);
    setReplies(threadData.replies);
    setLoading(false);
  };

  useEffect(() => {
    fetchThread();
  }, [submissionId]);

  const isAuthorized = (authorId: string) => {
    return providerAccountId === authorId;
  };

  const renderSubmission = (submission: Submission) => {
    const createdDate = new Date(
      submission.submission_datetime
    ).toLocaleDateString();
    const canDelete = isAuthorized(submission.author_id);

    return (
      <div key={submission.submission_id} className="submission__wrapper">
        <p className="submission__content">
          <span className="submission__author">{submission.author}:&nbsp;</span>
          <span>
            <TagLink
              value={submission.submission_name}
              contextId="thread"
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
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loader color="black" />;
  }

  if (!parentSubmission) {
    return <div>Submission not found</div>;
  }

  return (
    <div className="thread__container">
      <h2>Thread</h2>
      <div className="thread__parent">
        <h3>Original Post</h3>
        {renderSubmission(parentSubmission)}
      </div>
      <ReplyForm
        parentId={submissionId}
        onSuccess={() => {
          // Refresh the thread data to show the new reply
          fetchThread();
        }}
      />
      <div className="thread__replies">
        <h3>Replies</h3>
        {replies.length === 0 ? (
          <p>No replies yet</p>
        ) : (
          replies.map(renderSubmission)
        )}
      </div>
    </div>
  );
}
