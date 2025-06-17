'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV_PATHS } from '../../../lib/routes';
import { Author } from '../author/Author';
import Loader from '../loader/Loader';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { Submission } from '../submission-forms/schema';
import { TagLink } from '../tag-link/TagLink';
import { getSubmissionThread } from './actions';
import { ReplyForm } from './ReplyForm';
import './Thread.css';

interface ThreadProps {
  submissionId: number;
  providerAccountId: string;
}

interface ThreadData {
  parent: Submission | null;
  replies: Submission[];
}

export default function Thread({
  submissionId,
  providerAccountId
}: ThreadProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parentSubmission, setParentSubmission] = useState<Submission | null>(
    null
  );
  const [replies, setReplies] = useState<Submission[]>([]);

  useEffect(() => {
    const loadThread = async () => {
      try {
        setLoading(true);
        const threadData: ThreadData = await getSubmissionThread(submissionId);

        if (!threadData.parent) {
          setParentSubmission(null);
        } else {
          setParentSubmission(threadData.parent);
          setReplies(threadData.replies || []);
        }
      } catch (error) {
        console.error('Error loading thread:', error);
        setParentSubmission(null);
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [submissionId]);

  const handleReplyAdded = async () => {
    // Refresh the thread data when a new reply is added
    try {
      const threadData: ThreadData = await getSubmissionThread(submissionId);
      setReplies(threadData.replies || []);
    } catch (error) {
      console.error('Error refreshing replies:', error);
    }
  };

  const handleSubmissionDeleted = (deletedId: number) => {
    if (deletedId === submissionId) {
      // Parent was deleted, redirect to posts
      router.push(NAV_PATHS.POSTS);
    } else {
      // A reply was deleted, remove it from the list
      setReplies(replies.filter((reply) => reply.submission_id !== deletedId));
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!parentSubmission) {
    return (
      <div className="thread__not-found">
        <h2>Thread not found</h2>
        <p>
          The post you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <Link href={NAV_PATHS.POSTS} className="thread__back-link">
          ← Back to Posts
        </Link>
      </div>
    );
  }

  const renderSubmission = (submission: Submission, isReply = false) => (
    <div
      key={submission.submission_id}
      className={`submission__wrapper ${isReply ? 'submission__wrapper--reply' : ''}`}
    >
      <div className="submission__meta">
        <Author
          authorId={submission.author_id}
          authorName={submission.author_id}
          size="sm"
          showFullName={false}
        />
        <span className="submission__datetime">
          {new Date(submission.submission_datetime).toLocaleDateString()}
        </span>
      </div>

      <div className="submission__content">
        <h3
          className={
            isReply ? 'submission__title--reply' : 'thread__main-title'
          }
        >
          {submission.submission_title}
        </h3>
        {submission.submission_name &&
          submission.submission_name !== submission.submission_title && (
            <p className="submission__description">
              {submission.submission_name}
            </p>
          )}
      </div>

      {submission.tags && submission.tags.length > 0 && (
        <div className="submission__tags">
          {submission.tags.map((tag) => (
            <TagLink key={tag} value={tag} contextId="thread" />
          ))}
        </div>
      )}

      {submission.author_id === providerAccountId && (
        <DeleteSubmissionForm
          id={submission.submission_id}
          name={submission.submission_name}
          isAuthorized={true}
        />
      )}
    </div>
  );

  return (
    <div className="thread__container">
      <nav className="thread__navigation">
        <Link href={NAV_PATHS.POSTS} className="thread__back-link">
          ← Back to Posts
        </Link>
        <span className="thread__breadcrumb">Thread Discussion</span>
      </nav>

      {/* Parent Post */}
      <div className="thread__parent">{renderSubmission(parentSubmission)}</div>

      {/* Reply Form */}
      <div className="thread__reply-section">
        <h3>Add a Reply</h3>
        <ReplyForm
          parentId={submissionId}
          onSuccess={handleReplyAdded}
          replyToAuthor={parentSubmission?.author_id}
        />
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="thread__replies">
          <h3 className="thread__replies-title">Replies ({replies.length})</h3>
          <div className="thread__replies-list">
            {replies.map((reply) => renderSubmission(reply, true))}
          </div>
        </div>
      )}
    </div>
  );
}
