'use client';

import { createLogger } from '@lib/logging';
import { buildThreadUrl } from '@lib/routes';
import {
  generateScrollKey,
  storeScrollPosition
} from '@lib/utils/scroll-position';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Author } from '../author/Author';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { EditSubmissionForm } from '../submission-forms/edit-submission-form/EditSubmissionForm';
import { Submission } from '../submission-forms/schema';
import { TagLink } from '../tag-link/TagLink';
import { ReplyForm } from '../thread/ReplyForm';
import { ContentWithPills } from '../ui/ContentWithPills';
import { InstantLink } from '../ui/InstantLink';
import { RefreshButton } from '../ui/RefreshButton';
import { TimestampWithTooltip } from '../ui/TimestampWithTooltip';
import { getSubmissionById } from './actions';
import { SubmissionWithReplies } from './types';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'SubmissionItem',
    module: 'components/submissions-list'
  },
  enabled: false
});

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
  // Optimistic update functions
  optimisticUpdateSubmission?: (
    submissionId: number,
    updatedSubmission: Submission
  ) => void;
  optimisticRemoveSubmission?: (submissionId: number) => void;
  // Scroll position context
  currentPage?: number;
  currentFilters?: Record<string, any>;
  // Control parent link display
  showParentLinkForFirstLevel?: boolean;
  // Refresh functionality
  onRefreshSubmission?: (
    submissionId: number,
    refreshedSubmission: SubmissionWithReplies
  ) => void;
  // Context for determining button positioning
  isThreadPage?: boolean;
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
  contextId,
  optimisticUpdateSubmission,
  optimisticRemoveSubmission,
  currentPage,
  currentFilters,
  showParentLinkForFirstLevel = true,
  onRefreshSubmission,
  isThreadPage = false
}: SubmissionItemProps) {
  const { data: session } = useSession();

  // Local state for this submission
  const [isEditing, setIsEditing] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showNestedReplyForms, setShowNestedReplyForms] = useState<
    Record<number, boolean>
  >({});

  const isCurrentUserPost = (authorUserId: number) => {
    // Direct comparison of internal database user ID
    const currentUserId = session?.user?.id;
    if (!currentUserId) return false;

    // Handle both string and number types for session.user.id
    const userIdNumber =
      typeof currentUserId === 'string'
        ? parseInt(currentUserId)
        : currentUserId;
    return userIdNumber === authorUserId;
  };

  const handleTagClick = (tag: string) => {
    onTagClick(tag);
  };

  const handleThreadNavigation = () => {
    // Store current scroll position before navigating to thread
    if (typeof window !== 'undefined') {
      const scrollKey = generateScrollKey(window.location.pathname, {
        page: currentPage,
        filters: currentFilters,
        searchParams: new URLSearchParams(window.location.search)
      });

      // Get scroll position from the submissions list container, not the window
      const submissionsContainer = document.querySelector(
        '.submissions-list--virtual'
      ) as HTMLElement;

      const scrollY = submissionsContainer
        ? submissionsContainer.scrollTop
        : window.scrollY;

      logger.debug('Storing scroll position for thread navigation', {
        scrollKey,
        currentPage,
        currentFilters,
        scrollY,
        containerFound: !!submissionsContainer,
        pathname: window.location.pathname
      });

      storeScrollPosition(
        scrollKey,
        {
          currentPage,
          filters: currentFilters,
          infiniteMode: false // You can adjust this based on your pagination mode
        },
        scrollY
      );
    }
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

  const onEditSuccess = (updatedSubmissionData?: Submission) => {
    setIsEditing(false);
    // Use optimistic update if available and we have the updated data
    if (optimisticUpdateSubmission && updatedSubmissionData) {
      optimisticUpdateSubmission(
        submission.submission_id,
        updatedSubmissionData
      );
    } else {
      // Fallback to refresh mechanism
      onSubmissionUpdate?.();
    }
  };

  const onNestedReplySuccess = (replyId: number) => {
    setShowNestedReplyForms((prev) => ({
      ...prev,
      [replyId]: false
    }));
    onSubmissionUpdate?.();
  };

  const onDeleteSuccess = () => {
    // Use optimistic removal if available
    if (optimisticRemoveSubmission) {
      optimisticRemoveSubmission(submission.submission_id);
    } else {
      // Fallback to refresh mechanism
      onSubmissionUpdate?.();
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await getSubmissionById(submission.submission_id);

      if (result.data) {
        // Collapse replies when refreshing
        setShowReplies(false);
        setShowReplyForm(false);
        setShowNestedReplyForms({});

        // Use optimistic update if available
        if (onRefreshSubmission) {
          onRefreshSubmission(submission.submission_id, result.data);
        } else if (optimisticUpdateSubmission) {
          // Convert SubmissionWithReplies to Submission type for optimistic update
          const submissionData: Submission = {
            submission_id: result.data.submission_id,
            submission_title: result.data.submission_title,
            submission_name: result.data.submission_name,
            submission_datetime: result.data.submission_datetime || new Date(),
            user_id: result.data.user_id,
            author: result.data.author,
            author_bio: result.data.author_bio,
            tags: result.data.tags,
            thread_parent_id: result.data.thread_parent_id
          };
          optimisticUpdateSubmission(submission.submission_id, submissionData);
        } else {
          // Fallback to refresh mechanism
          onSubmissionUpdate?.();
        }
      } else {
        console.error('Failed to refresh submission:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing submission:', error);
    }
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
  const hasOwnerActions = isCurrentUserPost(submission.user_id || 0);

  // Check if this is a reply post (has a parent)
  const isReplyPost = !!submission.thread_parent_id;

  return (
    <div
      className={`submission__wrapper${
        isReplyPost ? ' submission__wrapper--reply' : ''
      } ${isReply ? 'submission__wrapper--reply-nested' : ''} ${
        isReplyPost ? 'submission__wrapper--is-reply' : ''
      }`}
      style={{
        marginLeft: isReply ? `${depth * 1.5}rem` : 0,
        position: 'relative'
      }}
      data-testid={`submission-item-${submission.submission_id}`}
    >
      {isReplyPost && (
        <span
          className="reply-dot-indicator"
          title="Reply"
          aria-label="Reply"
          style={{
            position: 'absolute',
            top: '0.25rem',
            left: '0.25rem',
            zIndex: 2
          }}
        />
      )}
      <div
        className={`submission__meta ${!hasOwnerActions ? 'submission__meta--no-actions' : ''}`}
      >
        <div className="submission__meta-left">
          <Author
            authorId={submission.user_id?.toString() || ''}
            authorName={submission.author}
            showFullName={true}
            bio={submission.author_bio}
          />
        </div>

        <div className="submission__meta-center">
          <TimestampWithTooltip
            date={submission.submission_datetime}
            className="submission__datetime"
          />
        </div>

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
                authorId={session?.user?.id?.toString()}
                onDeleteSuccess={onDeleteSuccess}
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
                  // eslint-disable-next-line custom-rules/enforce-link-target-blank
                  <InstantLink
                    href={buildThreadUrl(submission.submission_id)}
                    className="submission__title-link"
                    title="View thread"
                    onClick={handleThreadNavigation}
                  >
                    <ContentWithPills
                      content={submission.submission_title}
                      onHashtagClick={onHashtagClick}
                      onMentionClick={onMentionClick}
                      contextId={contextId || 'submission-item'}
                    />
                  </InstantLink>
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
        <div className="submission__actions-left">
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
        </div>

        <div className="submission__actions-right">
          {/* Refresh button */}
          <RefreshButton
            onRefresh={handleRefresh}
            className="submission__refresh-btn"
            title="Refresh post and collapse replies"
          />

          {/* View Parent button for replies */}
          {isReplyPost && submission.thread_parent_id && (
            <InstantLink
              href={buildThreadUrl(submission.thread_parent_id)}
              className="submission__parent-link submission__text-link"
              title="View parent post"
            >
              View Parent
            </InstantLink>
          )}

          {/* View Thread link for posts with replies */}
          {hasReplies && !isReply && (
            // eslint-disable-next-line custom-rules/enforce-link-target-blank
            <InstantLink
              href={buildThreadUrl(submission.submission_id)}
              className="submission__thread-link submission__text-link"
              title="View full thread"
              onClick={handleThreadNavigation}
            >
              View Thread
            </InstantLink>
          )}
        </div>
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
                showParentLinkForFirstLevel={false}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
