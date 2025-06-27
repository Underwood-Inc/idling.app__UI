'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV_PATHS } from '../../../lib/routes';
import {
  generateScrollKey,
  getStoredScrollPosition
} from '../../../lib/utils/scroll-position';
import { Author } from '../author/Author';
import Loader from '../loader/Loader';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { EditSubmissionForm } from '../submission-forms/edit-submission-form/EditSubmissionForm';
import { Submission } from '../submission-forms/schema';
import { getSubmissionById } from '../submissions-list/actions';
import { TagLink } from '../tag-link/TagLink';
import { BackButton } from '../ui/BackButton';
import { ContentWithPills } from '../ui/ContentWithPills';
import { InstantLink } from '../ui/InstantLink';
import { RefreshButton } from '../ui/RefreshButton';
import { TimestampWithTooltip } from '../ui/TimestampWithTooltip';
import { getSubmissionThread, NestedSubmission } from './actions';
import { ReplyForm } from './ReplyForm';
import './Thread.css';

interface ThreadProps {
  submissionId: number;
  userId?: string;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string, filterType: 'author' | 'mentions') => void;
  activeFilters?: {
    hashtags: string[];
    mentions: string[];
  };
  contextId?: string;
}

interface ThreadData {
  parent: NestedSubmission | null;
  replies: NestedSubmission[];
}

export default function Thread({
  submissionId,
  userId,
  onHashtagClick,
  onMentionClick,
  activeFilters,
  contextId
}: ThreadProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parentSubmission, setParentSubmission] =
    useState<NestedSubmission | null>(null);
  const [replies, setReplies] = useState<NestedSubmission[]>([]);
  const [editingSubmissions, setEditingSubmissions] = useState<Set<number>>(
    new Set()
  );
  const [showingReplyForms, setShowingReplyForms] = useState<Set<number>>(
    new Set()
  );

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

  // Handle scrolling to target submission when returning from parent thread
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const scrollKey = generateScrollKey(window.location.pathname, {
        searchParams: new URLSearchParams(window.location.search)
      });

      const storedPosition = getStoredScrollPosition(scrollKey);
      if (storedPosition?.targetSubmissionId) {
        // Use a more reliable approach with multiple attempts
        const attemptScroll = (attempts = 0) => {
          const targetElement = document.querySelector(
            `[data-testid="submission-item-${storedPosition.targetSubmissionId}"]`
          ) as HTMLElement;

          if (targetElement) {
            // Scroll to the target element
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });

            // Add a highlight effect
            targetElement.style.backgroundColor = 'var(--brand-tertiary)';
            setTimeout(() => {
              targetElement.style.backgroundColor = '';
            }, 2000);
          } else if (attempts < 10) {
            // Retry after a short delay if element not found
            setTimeout(() => attemptScroll(attempts + 1), 100);
          } else {
            console.warn(
              'Target submission element not found after multiple attempts:',
              storedPosition.targetSubmissionId
            );
          }
        };

        // Start the scroll attempt process
        attemptScroll();
      }
    }
  }, [loading, parentSubmission, replies]);

  const handleReplyAdded = async (result?: any) => {
    // Use optimistic update if we have the new reply data, otherwise refresh
    if (result && result.submission) {
      // Optimistically add the new reply to the current state
      const newReply: NestedSubmission = {
        ...result.submission,
        replies: [],
        depth: 1,
        author: userId || 'You', // Use current user as author
        author_bio: null
      };
      setReplies((prevReplies) => [...prevReplies, newReply]);

      // Hide the reply form after successful submission
      if (result.submission.thread_parent_id) {
        setShowingReplyForms((prev) => {
          const newSet = new Set(prev);
          newSet.delete(result.submission.thread_parent_id);
          return newSet;
        });
      }
    } else {
      // Fallback: refresh the thread data when a new reply is added
      try {
        const threadData: ThreadData = await getSubmissionThread(submissionId);
        setReplies(threadData.replies || []);
      } catch (error) {
        console.error('Error refreshing replies:', error);
      }
    }
  };

  const handleSubmissionDeleted = (deletedId: number) => {
    if (deletedId === submissionId) {
      // Parent was deleted, redirect to posts
      router.push(NAV_PATHS.POSTS);
    } else {
      // A reply was deleted, refresh the thread
      handleReplyAdded();
    }
  };

  const handleSubmissionUpdated = async (updatedSubmission?: Submission) => {
    // Refresh the thread data when a submission is updated
    try {
      const threadData: ThreadData = await getSubmissionThread(submissionId);
      setParentSubmission(threadData.parent);
      setReplies(threadData.replies || []);
      // Close edit mode for the updated submission
      if (updatedSubmission) {
        setEditingSubmissions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(updatedSubmission.submission_id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error refreshing thread after update:', error);
    }
  };

  const handleRefreshSubmission = async (refreshSubmissionId: number) => {
    try {
      const result = await getSubmissionById(refreshSubmissionId);

      if (result.data) {
        // Close any active reply forms for this submission
        setShowingReplyForms((prev) => {
          const newSet = new Set(prev);
          newSet.delete(refreshSubmissionId);
          return newSet;
        });

        // Close edit mode if active
        setEditingSubmissions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(refreshSubmissionId);
          return newSet;
        });

        // Update the submission in place
        if (refreshSubmissionId === submissionId) {
          // Refreshing the parent submission
          setParentSubmission(result.data as NestedSubmission);
        } else {
          // Refreshing a reply - update the replies array
          setReplies((prevReplies) => {
            const updateNestedReplies = (
              replies: NestedSubmission[]
            ): NestedSubmission[] => {
              return replies.map((reply) => {
                if (reply.submission_id === refreshSubmissionId) {
                  return {
                    ...result.data!,
                    replies: reply.replies // Keep existing nested replies structure
                  } as NestedSubmission;
                }
                return {
                  ...reply,
                  replies: updateNestedReplies(reply.replies)
                };
              });
            };

            return updateNestedReplies(prevReplies);
          });
        }
      } else {
        console.error('Failed to refresh submission:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing submission:', error);
    }
  };

  const toggleEdit = (submissionId: number) => {
    setEditingSubmissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const toggleReplyForm = (submissionId: number) => {
    setShowingReplyForms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
        // Scroll to the reply form after a short delay to ensure it's rendered
        setTimeout(() => {
          const formElement = document.querySelector(
            `[data-testid="reply-form-${submissionId}"]`
          ) as HTMLElement;
          if (formElement) {
            formElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            // Focus the title field using the RichTextEditor API
            const titleField = formElement.querySelector(
              '[data-testid="title-field"]'
            ) as HTMLElement;
            if (titleField) {
              // Find the RichTextEditor within the title field and focus it
              const richTextEditor = titleField.querySelector(
                '[data-rich-text-editor]'
              ) as HTMLElement;
              if (richTextEditor) {
                richTextEditor.focus();
              } else {
                // Fallback: focus the title field container
                titleField.focus();
              }
            }
          }
        }, 100);
      }
      return newSet;
    });
  };

  // Filter function to check if a submission matches the active filters
  const submissionMatchesFilters = (submission: NestedSubmission): boolean => {
    if (!activeFilters) return true;

    const { hashtags, mentions } = activeFilters;

    // If no filters are active, show all submissions
    if (hashtags.length === 0 && mentions.length === 0) {
      return true;
    }

    let matchesHashtags = true;
    let matchesMentions = true;

    // Check hashtag filters
    if (hashtags.length > 0) {
      const submissionContent = `${submission.submission_title} ${submission.submission_name || ''}`;
      const submissionTags = submission.tags || [];

      // Check if content contains any of the filtered hashtags
      matchesHashtags = hashtags.some((hashtag) => {
        const cleanHashtag = hashtag.replace('#', '');
        return (
          submissionContent
            .toLowerCase()
            .includes(`#${cleanHashtag.toLowerCase()}`) ||
          submissionTags.some((tag) =>
            tag.toLowerCase().includes(cleanHashtag.toLowerCase())
          )
        );
      });
    }

    // Check mention filters (author filter)
    if (mentions.length > 0) {
      matchesMentions = mentions.some((mentionUserId) => {
        return submission.user_id?.toString() === mentionUserId;
      });
    }

    // For multiple filter types, use AND logic (both must match)
    if (hashtags.length > 0 && mentions.length > 0) {
      return matchesHashtags && matchesMentions;
    }

    // For single filter type, return the result
    return matchesHashtags && matchesMentions;
  };

  // Recursive function to filter nested submissions
  const filterNestedSubmissions = (
    submissions: NestedSubmission[]
  ): NestedSubmission[] => {
    return submissions.filter(submissionMatchesFilters).map((submission) => ({
      ...submission,
      replies: submission.replies
        ? filterNestedSubmissions(submission.replies)
        : []
    }));
  };

  // Render a single submission (parent or reply)
  const renderSubmission = (
    submission: NestedSubmission,
    isReply: boolean = false,
    depth: number = 0
  ) => {
    const isEditing = editingSubmissions.has(submission.submission_id);
    // More robust author check with string comparison
    const isAuthor = userId && submission.user_id?.toString() === userId;
    const maxDepth = 5; // Maximum nesting depth

    return (
      <div
        key={submission.submission_id}
        className={`submission__wrapper ${isReply ? 'submission__wrapper--reply' : ''}`}
        style={{ marginLeft: isReply ? `${depth * 1.5}rem` : '0' }}
        data-testid={`submission-item-${submission.submission_id}`}
      >
        <div className="submission__meta">
          <div className="submission__meta-left">
            <Author
              authorId={submission.user_id?.toString() || ''}
              authorName={submission.author || 'Unknown'}
              bio={submission.author_bio}
              size="sm"
              showFullName={true}
            />
          </div>

          <div className="submission__meta-center">
            <span style={{ display: 'inline-block' }}>
              <TimestampWithTooltip
                date={submission.submission_datetime}
                className="submission__datetime"
              />
            </span>
          </div>

          <div className="submission__owner-actions">
            <div className="submission__actions-right">
              {/* Reply button for authenticated users */}
              {userId && depth < maxDepth && (
                <button
                  onClick={() => toggleReplyForm(submission.submission_id)}
                  className="submission__reply-btn"
                  aria-label="Reply to this post"
                  title="Reply to this post"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                  </svg>
                  Reply
                </button>
              )}

              {/* Refresh button for thread pages */}
              <RefreshButton
                onRefresh={() =>
                  handleRefreshSubmission(submission.submission_id)
                }
                className="submission__refresh-btn"
                title="Refresh this post and collapse replies"
              />

              {/* Edit/Delete buttons for post authors */}
              {isAuthor && (
                <>
                  <button
                    onClick={() => toggleEdit(submission.submission_id)}
                    className="submission__edit-btn"
                    aria-label={isEditing ? 'Cancel edit' : 'Edit submission'}
                  >
                    {isEditing ? '✕' : '✏️'}
                  </button>

                  <DeleteSubmissionForm
                    id={submission.submission_id}
                    name={submission.submission_name}
                    isAuthorized={true}
                    authorId={userId}
                    onDeleteSuccess={() =>
                      handleSubmissionDeleted(submission.submission_id)
                    }
                  />
                </>
              )}
            </div>
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
              onSuccess={handleSubmissionUpdated}
              onCancel={() => toggleEdit(submission.submission_id)}
            />
          </div>
        ) : (
          <>
            <div className="submission__content">
              <h3
                className={
                  isReply ? 'submission__title--reply' : 'thread__main-title'
                }
              >
                <ContentWithPills
                  content={submission.submission_title}
                  onHashtagClick={onHashtagClick}
                  onMentionClick={onMentionClick}
                  contextId={contextId || 'thread'}
                />
              </h3>
              {submission.submission_name &&
                submission.submission_name !== submission.submission_title && (
                  <p className="submission__description">
                    <ContentWithPills
                      content={submission.submission_name}
                      onHashtagClick={onHashtagClick}
                      onMentionClick={onMentionClick}
                      contextId={contextId || 'thread'}
                    />
                  </p>
                )}
            </div>

            {/* Tags */}
            {submission.tags && submission.tags.length > 0 && (
              <div className="submission__tags">
                {submission.tags.map((tag, index) => (
                  <TagLink
                    key={`${tag}-${index}`}
                    value={tag}
                    contextId={contextId || 'thread'}
                    onTagClick={(clickedTag) => {
                      if (onHashtagClick) {
                        onHashtagClick(clickedTag);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Nested replies */}
        {submission.replies && submission.replies.length > 0 && (
          <div className="thread__nested-replies">
            {submission.replies.map((reply) =>
              renderSubmission(reply, true, depth + 1)
            )}
          </div>
        )}

        {/* View Parent button for replies */}
        {isReply && submission.thread_parent_id && (
          <InstantLink
            href={`/thread/${submission.thread_parent_id}`}
            className="submission__parent-link submission__text-link"
            title="View parent post"
          >
            View Parent
          </InstantLink>
        )}

        {/* Reply form for this specific submission (only if not too deep) */}
        {userId &&
          depth < maxDepth &&
          showingReplyForms.has(submission.submission_id) && (
            <div
              data-testid={`reply-form-${submission.submission_id}`}
              style={{
                marginTop: '1rem'
                // No additional left margin since the form is already inside the indented submission
              }}
            >
              <ReplyForm
                parentId={submission.submission_id}
                onSuccess={handleReplyAdded}
                replyToAuthor={submission.author}
              />
            </div>
          )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="thread__loading">
        <Loader />
      </div>
    );
  }

  if (!parentSubmission) {
    return (
      <div className="thread__not-found">
        <h2>Thread Not Found</h2>
        <p>The requested thread could not be found or may have been deleted.</p>
        <InstantLink href={NAV_PATHS.POSTS}>← Back to Posts</InstantLink>
      </div>
    );
  }

  return (
    <div className="thread__container">
      {/* Navigation */}
      <div className="thread__navigation">
        <BackButton
          className="thread__back-button"
          fallbackHref={NAV_PATHS.POSTS}
          scrollRestoreKey={
            typeof window !== 'undefined'
              ? (() => {
                  // Try to reconstruct the scroll key from stored data or URL params
                  const urlParams = new URLSearchParams(window.location.search);
                  const page = urlParams.get('page')
                    ? parseInt(urlParams.get('page')!)
                    : undefined;

                  // Try to get stored scroll position to extract the original key
                  const stored = localStorage.getItem('app-scroll-positions');
                  if (stored) {
                    try {
                      const positions = JSON.parse(stored);
                      // Find the most recent posts page key
                      const postsKeys = Object.keys(positions).filter((key) =>
                        key.startsWith(NAV_PATHS.POSTS)
                      );
                      if (postsKeys.length > 0) {
                        // Use the most recent one
                        const mostRecent = postsKeys.reduce(
                          (latest, current) =>
                            positions[current].timestamp >
                            positions[latest].timestamp
                              ? current
                              : latest
                        );
                        return mostRecent;
                      }
                    } catch (e) {
                      console.warn('Failed to parse stored positions:', e);
                    }
                  }

                  // Fallback: generate basic key
                  return generateScrollKey(NAV_PATHS.POSTS, {
                    page,
                    searchParams: urlParams
                  });
                })()
              : undefined
          }
        >
          ← Back to Posts
        </BackButton>
      </div>

      {/* Parent submission - always show, but indicate if it matches filters */}
      <div className="thread__parent">
        {renderSubmission(parentSubmission, false, 0)}
      </div>

      {/* Direct replies */}
      {replies.length > 0 && (
        <div className="thread__replies">
          <h4 className="thread__replies-title">
            {(() => {
              const filteredReplies = filterNestedSubmissions(replies);
              const count = filteredReplies.length;
              const totalReplies = replies.length;
              const hasActiveFilters =
                activeFilters &&
                (activeFilters.hashtags.length > 0 ||
                  activeFilters.mentions.length > 0);

              if (hasActiveFilters && count !== totalReplies) {
                return `${count} of ${totalReplies} ${totalReplies === 1 ? 'Reply' : 'Replies'} (filtered)`;
              }

              return `${count} ${count === 1 ? 'Reply' : 'Replies'}`;
            })()}
          </h4>
          <div className="thread__replies-list">
            {filterNestedSubmissions(replies).map((reply) =>
              renderSubmission(reply, true, 1)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
