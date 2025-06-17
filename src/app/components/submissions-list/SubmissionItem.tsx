'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { buildThreadUrl } from '../../../lib/routes';
import { Author } from '../author/Author';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { EditSubmissionForm } from '../submission-forms/edit-submission-form/EditSubmissionForm';
import { ReplyForm } from '../thread/ReplyForm';
import { SubmissionWithReplies } from './actions';

interface SubmissionItemProps {
  submission: SubmissionWithReplies;
  onTagClick: (tag: string) => void;
  isReply?: boolean;
  depth?: number;
  maxDepth?: number;
  onSubmissionUpdate?: () => void;
}

export function SubmissionItem({
  submission,
  onTagClick,
  isReply = false,
  depth = 0,
  maxDepth = 3,
  onSubmissionUpdate
}: SubmissionItemProps) {
  const { data: session } = useSession();

  // Local state for this submission
  const [isEditing, setIsEditing] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showNestedReplyForms, setShowNestedReplyForms] = useState<
    Record<number, boolean>
  >({});

  const isCurrentUserPost = (authorId: string) => {
    return session?.user?.providerAccountId === authorId;
  };

  const handleTagClick = (tag: string) => {
    onTagClick(tag);
  };

  const toggleReplyForm = () => {
    setShowReplyForm(!showReplyForm);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const toggleNestedReplyForm = (replyId: number) => {
    setShowNestedReplyForms((prev) => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  };

  const onReplySuccess = () => {
    setShowReplyForm(false);
    onSubmissionUpdate?.();
  };

  const onEditSuccess = () => {
    setIsEditing(false);
    onSubmissionUpdate?.();
  };

  const onNestedReplySuccess = (replyId: number) => {
    setShowNestedReplyForms((prev) => ({
      ...prev,
      [replyId]: false
    }));
    onSubmissionUpdate?.();
  };

  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return null;

    return (
      <div className="submission__tags">
        {tags.map((tag: string) => (
          <button
            key={tag}
            className="submission__tag"
            onClick={() => handleTagClick(tag)}
            title={`Filter by ${tag}`}
          >
            {tag}
          </button>
        ))}
      </div>
    );
  };

  const canReply = session?.user?.providerAccountId && depth < maxDepth;
  const hasReplies = submission.replies && submission.replies.length > 0;

  return (
    <div
      className={`submission__wrapper ${isReply ? 'submission__wrapper--reply' : ''}`}
      style={{ marginLeft: isReply ? `${depth * 1.5}rem` : 0 }}
    >
      <div className="submission__meta">
        <Author
          authorId={submission.author_id}
          authorName={submission.author}
          size="sm"
          showFullName={true}
        />
        <span className="submission__datetime">
          {submission.submission_datetime.toLocaleString()}
        </span>

        {/* Edit/Delete buttons for current user's posts */}
        {isCurrentUserPost(submission.author_id) && (
          <div className="submission__owner-actions">
            <button
              className="submission__edit-btn"
              onClick={toggleEdit}
              title={`Edit ${isReply ? 'reply' : 'post'}`}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            <DeleteSubmissionForm
              id={submission.submission_id}
              name={submission.submission_name}
              isAuthorized={!!session?.user?.providerAccountId}
            />
          </div>
        )}
      </div>

      {/* Show edit form or regular content */}
      {isEditing ? (
        <div className="submission__edit-form">
          <EditSubmissionForm
            submission={{
              submission_id: submission.submission_id,
              submission_title: submission.submission_title,
              submission_name: submission.submission_name,
              tags: submission.tags || []
            }}
            onSuccess={onEditSuccess}
            onCancel={toggleEdit}
          />
        </div>
      ) : (
        <>
          <div className="submission__content">
            <h3
              className={`submission__title ${isReply ? 'submission__title--reply' : ''}`}
            >
              {hasReplies && !isReply ? (
                <Link
                  href={buildThreadUrl(submission.submission_id)}
                  className="submission__title-link"
                  title="View thread"
                >
                  {submission.submission_title}
                </Link>
              ) : (
                submission.submission_title
              )}
            </h3>
            {submission.submission_name &&
              submission.submission_name !== submission.submission_title && (
                <p className="submission__description">
                  {submission.submission_name}
                </p>
              )}
          </div>
          {renderTags(submission.tags || [])}
        </>
      )}

      {/* Action buttons */}
      <div className="submission__actions">
        {canReply && (
          <button className="submission__reply-btn" onClick={toggleReplyForm}>
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        )}

        {hasReplies && (
          <button className="submission__expand-btn" onClick={toggleReplies}>
            {showReplies
              ? `Hide ${submission.replies!.length} Replies`
              : `Show ${submission.replies!.length} Replies`}
          </button>
        )}

        {/* Thread view link for posts with replies */}
        {hasReplies && !isReply && (
          <Link
            href={buildThreadUrl(submission.submission_id)}
            className="submission__thread-link"
            title="View full thread"
          >
            💬 View Thread
          </Link>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="submission__reply-form">
          <ReplyForm
            parentId={submission.submission_id}
            onSuccess={onReplySuccess}
            replyToAuthor={submission.author}
          />
        </div>
      )}

      {/* Nested replies */}
      {showReplies && hasReplies && (
        <div className="submission__replies">
          {submission.replies!.map((reply) => (
            <div key={reply.submission_id}>
              <SubmissionItem
                submission={reply}
                onTagClick={onTagClick}
                isReply={true}
                depth={depth + 1}
                maxDepth={maxDepth}
                onSubmissionUpdate={onSubmissionUpdate}
              />

              {/* Nested reply form for this specific reply */}
              {showNestedReplyForms[reply.submission_id] && (
                <div
                  className="submission__nested-reply-form"
                  style={{ marginLeft: `${(depth + 1) * 1.5}rem` }}
                >
                  <ReplyForm
                    parentId={reply.submission_id}
                    onSuccess={() => onNestedReplySuccess(reply.submission_id)}
                    replyToAuthor={reply.author}
                  />
                </div>
              )}

              {/* Reply to reply button */}
              {session?.user?.providerAccountId && depth + 1 < maxDepth && (
                <div
                  className="submission__nested-actions"
                  style={{ marginLeft: `${(depth + 1) * 1.5}rem` }}
                >
                  <button
                    className="submission__nested-reply-btn"
                    onClick={() => toggleNestedReplyForm(reply.submission_id)}
                  >
                    {showNestedReplyForms[reply.submission_id]
                      ? 'Cancel'
                      : 'Reply'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
