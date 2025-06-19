'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { buildThreadUrl } from '../../../lib/routes';
import { Author } from '../author/Author';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { EditSubmissionForm } from '../submission-forms/edit-submission-form/EditSubmissionForm';
import { TagLink } from '../tag-link/TagLink';
import { ReplyForm } from '../thread/ReplyForm';
import { ContentWithPills } from '../ui/ContentWithPills';
import { SubmissionWithReplies } from './actions';

interface SubmissionItemProps {
  submission: SubmissionWithReplies;
  onTagClick: (tag: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string, filterType: 'author' | 'mentions') => void;
  isReply?: boolean;
  depth?: number;
  maxDepth?: number;
  onSubmissionUpdate?: () => void;
  contextId?: string;
}

export function SubmissionItem({
  submission,
  onTagClick,
  onHashtagClick,
  onMentionClick,
  isReply = false,
  depth = 0,
  maxDepth = 3,
  onSubmissionUpdate,
  contextId
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
    return session?.user?.id === authorId;
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
        {tags.map((tag, index) => (
          <TagLink
            key={`${tag}-${index}`}
            value={tag}
            contextId={contextId || 'default'}
            onTagClick={handleTagClick}
          />
        ))}
      </div>
    );
  };

  const canReply = session?.user?.id && depth < maxDepth;
  const hasReplies = submission.replies && submission.replies.length > 0;
  const hasOwnerActions = isCurrentUserPost(submission.author_id);

  return (
    <div
      className={`submission__wrapper ${isReply ? 'submission__wrapper--reply' : ''}`}
      style={{ marginLeft: isReply ? `${depth * 1.5}rem` : 0 }}
    >
      <div
        className={`submission__meta ${!hasOwnerActions ? 'submission__meta--no-actions' : ''}`}
      >
        <Author
          authorId={submission.author_id}
          authorName={submission.author}
          showFullName={true}
        />
        <span className="submission__datetime">
          {submission.submission_datetime.toLocaleString()}
        </span>

        {/* Edit/Delete buttons */}
        <div className="submission__owner-actions">
          {hasOwnerActions && (
            <>
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
                isAuthorized={true}
                authorId={session?.user?.id}
              />
            </>
          )}
        </div>
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
            {/* Title field label and content */}
            <div className="submission__field">
              <span className="submission__field-label">Title:</span>
              <h3
                className={`submission__title ${isReply ? 'submission__title--reply' : ''}`}
              >
                {hasReplies && !isReply ? (
                  <Link
                    href={buildThreadUrl(submission.submission_id)}
                    className="submission__title-link"
                    title="View thread"
                  >
                    <ContentWithPills
                      content={submission.submission_title}
                      onHashtagClick={onHashtagClick}
                      onMentionClick={onMentionClick}
                      contextId={contextId || 'submission-item'}
                    />
                  </Link>
                ) : (
                  <ContentWithPills
                    content={submission.submission_title}
                    onHashtagClick={onHashtagClick}
                    onMentionClick={onMentionClick}
                    contextId={contextId || 'submission-item'}
                  />
                )}
              </h3>
            </div>

            {/* Content field label and content (only if different from title) */}
            {submission.submission_name &&
              submission.submission_name !== submission.submission_title && (
                <div className="submission__field">
                  <span className="submission__field-label">Content:</span>
                  <div className="submission__description">
                    <ContentWithPills
                      content={submission.submission_name}
                      onHashtagClick={onHashtagClick}
                      onMentionClick={onMentionClick}
                      contextId={contextId || 'submission-item'}
                    />
                  </div>
                </div>
              )}
          </div>

          {/* Tags field label and content (only if tags exist) */}
          {submission.tags && submission.tags.length > 0 && (
            <div className="submission__field">
              <span className="submission__field-label">Tags:</span>
              {renderTags(submission.tags)}
            </div>
          )}
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
                onHashtagClick={onHashtagClick}
                onMentionClick={onMentionClick}
                isReply={true}
                depth={depth + 1}
                maxDepth={maxDepth}
                onSubmissionUpdate={onSubmissionUpdate}
                contextId={contextId || 'submission-item'}
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
              {session?.user?.id && depth + 1 < maxDepth && (
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
