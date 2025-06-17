'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { Filter } from '../../../lib/state/atoms';
import { PostFilters } from '../../../lib/types/filters';
import Pagination from '../pagination/Pagination';
import {
  SkeletonBox,
  SkeletonText,
  SmartSkeletonLoader,
  useSmartSkeleton
} from '../skeleton/SmartSkeletonLoader';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { EditSubmissionForm } from '../submission-forms/edit-submission-form/EditSubmissionForm';
import { ReplyForm } from '../thread/ReplyForm';
import { SubmissionWithReplies } from './actions';
import './SubmissionsList.css';
import { SubmissionThread } from './SubmissionThread';

// Development-only import that gets tree-shaken in production
let useDevSkeletonState: () => {
  shouldShowSkeleton: boolean;
  isDevModeActive: boolean;
};

if (process.env.NODE_ENV === 'development') {
  const devModule = require('../dev-tools/DevSkeletonToggle');
  useDevSkeletonState = devModule.useDevSkeletonState;
} else {
  // Production fallback - returns inactive state
  useDevSkeletonState = () => ({
    shouldShowSkeleton: false,
    isDevModeActive: false
  });
}

// Default skeleton component for when we don't have captured content yet
const DefaultSubmissionsSkeleton = () => (
  <div className="submissions-list__container">
    <div className="submission__list">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="submission__wrapper skeleton--submission-card"
        >
          <div className="submission__meta" style={{ marginBottom: '0.5rem' }}>
            <SkeletonText
              width="120px"
              height="14px"
              className="skeleton--auto"
            />
            <SkeletonText
              width="140px"
              height="14px"
              className="skeleton--auto"
            />
          </div>
          <div
            className="submission__content"
            style={{ marginBottom: '0.75rem' }}
          >
            <SkeletonText
              width="85%"
              height="20px"
              className="skeleton--auto"
              style={{ marginBottom: '0.5rem' }}
            />
            <SkeletonText
              width="65%"
              height="16px"
              className="skeleton--auto"
            />
          </div>
          <div
            className="submission__actions"
            style={{ marginBottom: '0.5rem' }}
          >
            <SkeletonBox
              width="60px"
              height="24px"
              className="skeleton--auto skeleton--button-auto"
            />
            <SkeletonBox
              width="80px"
              height="24px"
              className="skeleton--auto skeleton--button-auto"
            />
          </div>
        </div>
      ))}
    </div>
    <div className="submissions-list__pagination">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem'
        }}
      >
        <SkeletonText width="100px" height="16px" className="skeleton--auto" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <SkeletonBox
            width="32px"
            height="32px"
            className="skeleton--auto skeleton--button-auto"
          />
          <SkeletonBox
            width="32px"
            height="32px"
            className="skeleton--auto skeleton--button-auto"
          />
          <SkeletonBox
            width="32px"
            height="32px"
            className="skeleton--auto skeleton--button-auto"
          />
        </div>
        <SkeletonText width="80px" height="16px" className="skeleton--auto" />
      </div>
    </div>
  </div>
);

interface Submission {
  submission_id: number;
  submission_name: string;
  submission_title: string;
  submission_datetime: Date;
  author_id: string;
  author: string;
  thread_parent_id: number | null;
  tags: string[];
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
}

interface SubmissionsListProps {
  isLoading: boolean;
  error: string | null;
  submissions: SubmissionWithReplies[];
  pagination: PaginationInfo;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onTagClick: (filter: Filter<PostFilters>) => void;
  enableThreadMode?: boolean;
}

export default function SubmissionsList({
  isLoading,
  error,
  submissions,
  pagination,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onTagClick,
  enableThreadMode = false
}: SubmissionsListProps) {
  const { data: session, status } = useSession();
  const [activeReplies, setActiveReplies] = useState<{
    [key: number]: boolean;
  }>({});
  const [expandedThreads, setExpandedThreads] = useState<{
    [key: number]: boolean;
  }>({});
  const [editingSubmissions, setEditingSubmissions] = useState<
    Record<number, boolean>
  >({});

  // Smart skeleton integration - ref to the actual content for analysis
  const containerRef = useRef<HTMLDivElement>(null);
  const { skeletonContent, captureLayout, clearCapture } =
    useSmartSkeleton(containerRef);

  // Track if we've captured layout for this component
  const [hasLayoutCaptured, setHasLayoutCaptured] = useState(false);

  // Get development mode state for overlay functionality
  const { shouldShowSkeleton, isDevModeActive } = useDevSkeletonState();

  // Capture layout when content becomes available
  useEffect(() => {
    if (
      !isLoading &&
      submissions.length > 0 &&
      containerRef.current &&
      !hasLayoutCaptured
    ) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        captureLayout();
        setHasLayoutCaptured(true);
      }, 100);
    }
  }, [isLoading, submissions.length, hasLayoutCaptured, captureLayout]);

  // Clear captured layout when component unmounts or submissions change dramatically
  useEffect(() => {
    return () => {
      clearCapture();
    };
  }, [clearCapture]);

  // eslint-disable-next-line no-console
  console.log('📋 [SUBMISSIONS_LIST] Rendering with state:', {
    submissionsCount: submissions.length,
    isLoading,
    hasError: !!error,
    error,
    pagination,
    enableThreadMode,
    hasLayoutCaptured,
    hasSkeletonContent: !!skeletonContent
  });

  // Log sample of submissions for verification
  if (submissions.length > 0) {
    // eslint-disable-next-line no-console
    console.log('📋 [SUBMISSIONS_LIST] Sample submissions:', {
      firstSubmission: {
        id: submissions[0].submission_id,
        title: submissions[0].submission_title,
        tags: submissions[0].tags,
        hasReplies: !!submissions[0].replies?.length
      },
      lastSubmission: {
        id: submissions[submissions.length - 1].submission_id,
        title: submissions[submissions.length - 1].submission_title,
        tags: submissions[submissions.length - 1].tags,
        hasReplies: !!submissions[submissions.length - 1].replies?.length
      }
    });
  }

  const handleTagClick = (tag: string) => {
    // eslint-disable-next-line no-console
    console.log('🏷️ [SUBMISSIONS_LIST] Tag clicked:', tag);
    // Sanitize tag input but preserve the hash symbol
    const sanitizedTag = tag.trim();
    if (!sanitizedTag || sanitizedTag.length > 50) {
      console.warn('Invalid tag:', tag);
      return;
    }

    onTagClick({ name: 'tags', value: sanitizedTag });
  };

  const toggleReply = (submissionId: number) => {
    setActiveReplies((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId]
    }));
  };

  const toggleExpand = (submissionId: number) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId]
    }));
  };

  const toggleEdit = (submissionId: number) => {
    setEditingSubmissions((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId]
    }));
  };

  const isCurrentUserPost = (authorId: string) => {
    return session?.user?.providerAccountId === authorId;
  };

  const handlePageChange = (page: number) => {
    // eslint-disable-next-line no-console
    console.log('📄 [SUBMISSIONS_LIST] Page change requested:', page);
    onPageChange(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    // eslint-disable-next-line no-console
    console.log('📏 [SUBMISSIONS_LIST] Page size change requested:', pageSize);
    onPageSizeChange(pageSize);
  };

  if (status === 'loading') {
    return (
      <div className="submissions-list__container">
        {skeletonContent ? (
          <div
            className="skeleton-container--smart"
            role="status"
            aria-label="Loading session"
          >
            {skeletonContent}
          </div>
        ) : (
          <DefaultSubmissionsSkeleton />
        )}
      </div>
    );
  }

  // Development mode: Force OFF means never show skeletons
  const forceSkeletonOff =
    process.env.NODE_ENV === 'development' &&
    isDevModeActive &&
    !shouldShowSkeleton;

  if (isLoading && !forceSkeletonOff) {
    return (
      <div className="submissions-list__container">
        {skeletonContent ? (
          <div
            className="skeleton-container--smart"
            role="status"
            aria-label="Loading submissions"
          >
            {skeletonContent}
          </div>
        ) : (
          <DefaultSubmissionsSkeleton />
        )}
      </div>
    );
  }

  // If force OFF and loading, show a simple loading message instead of skeleton
  if (isLoading && forceSkeletonOff) {
    return (
      <div className="submissions-list__container">
        <div className="submissions-list__loading">
          <div>🔄 Loading submissions...</div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            ⚠️ <strong>Dev Mode:</strong> Skeletons are disabled
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error('📋 [SUBMISSIONS_LIST] Rendering error state:', error);
    return <div className="submissions-list__error">Error: {error}</div>;
  }

  if (submissions.length === 0) {
    return <div className="submissions-list__empty">No submissions found</div>;
  }

  // Development mode: Show skeleton overlay if force-on is active
  const showSkeletonOverlay =
    process.env.NODE_ENV === 'development' &&
    isDevModeActive &&
    shouldShowSkeleton &&
    !isLoading &&
    submissions.length > 0;

  if (showSkeletonOverlay) {
    return (
      <div className="submissions-list__container" ref={containerRef}>
        <div style={{ position: 'relative' }}>
          {/* Smart skeleton overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 'var(--border-radius)'
            }}
          >
            {skeletonContent ? (
              <div
                className="skeleton-container--smart"
                role="status"
                aria-label="Skeleton preview"
              >
                {skeletonContent}
              </div>
            ) : (
              <SmartSkeletonLoader
                targetRef={containerRef}
                isLoading={true}
                forceShow={true}
              />
            )}
          </div>
          {/* Actual content (dimmed) */}
          <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
            <div className="submission__list">
              {enableThreadMode
                ? submissions.map((submission: SubmissionWithReplies) => (
                    <SubmissionThread
                      key={submission.submission_id}
                      submission={submission}
                      isAuthorized={!!session?.user?.providerAccountId}
                      activeReplies={activeReplies}
                      setActiveReplies={setActiveReplies}
                      expandedThreads={expandedThreads}
                      setExpandedThreads={setExpandedThreads}
                      onTagClick={handleTagClick}
                    />
                  ))
                : submissions.map((submission: SubmissionWithReplies) => (
                    <div
                      key={submission.submission_id}
                      className="submission__wrapper"
                    >
                      <div className="submission__meta">
                        <span className="submission__author">
                          {submission.author}
                        </span>
                        <span className="submission__datetime">
                          {submission.submission_datetime.toLocaleString()}
                        </span>
                        {/* Edit/Delete buttons for current user's posts */}
                        {isCurrentUserPost(submission.author_id) && (
                          <div className="submission__owner-actions">
                            <button
                              className="submission__edit-btn"
                              onClick={() =>
                                toggleEdit(submission.submission_id)
                              }
                              title="Edit post"
                            >
                              {editingSubmissions[submission.submission_id]
                                ? 'Cancel'
                                : 'Edit'}
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
                      {editingSubmissions[submission.submission_id] ? (
                        <div className="submission__edit-form">
                          <EditSubmissionForm
                            submission={{
                              submission_id: submission.submission_id,
                              submission_title: submission.submission_title,
                              submission_name: submission.submission_name,
                              tags: submission.tags || []
                            }}
                            onSuccess={() =>
                              toggleEdit(submission.submission_id)
                            }
                            onCancel={() =>
                              toggleEdit(submission.submission_id)
                            }
                          />
                        </div>
                      ) : (
                        <>
                          <div className="submission__content">
                            <h3 className="submission__title">
                              {submission.submission_title}
                            </h3>
                            {submission.submission_name &&
                              submission.submission_name !==
                                submission.submission_title && (
                                <p className="submission__description">
                                  {submission.submission_name}
                                </p>
                              )}
                          </div>
                          {submission.tags && submission.tags.length > 0 && (
                            <div className="submission__tags">
                              {submission.tags.map((tag: string) => (
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
                          )}
                        </>
                      )}

                      {session?.user?.providerAccountId && (
                        <div className="submission__actions">
                          <button
                            className="submission__reply-btn"
                            onClick={() =>
                              toggleReply(submission.submission_id)
                            }
                          >
                            {activeReplies[submission.submission_id]
                              ? 'Cancel'
                              : 'Reply'}
                          </button>

                          {submission.replies &&
                            submission.replies.length > 0 && (
                              <button
                                className="submission__expand-btn"
                                onClick={() =>
                                  toggleExpand(submission.submission_id)
                                }
                              >
                                {expandedThreads[submission.submission_id]
                                  ? `Hide ${submission.replies.length} Replies`
                                  : `Show ${submission.replies.length} Replies`}
                              </button>
                            )}
                        </div>
                      )}

                      {/* Show Replies button for non-authorized users too */}
                      {!session?.user?.providerAccountId &&
                        submission.replies &&
                        submission.replies.length > 0 && (
                          <div className="submission__actions">
                            <button
                              className="submission__expand-btn"
                              onClick={() =>
                                toggleExpand(submission.submission_id)
                              }
                            >
                              {expandedThreads[submission.submission_id]
                                ? `Hide ${submission.replies.length} Replies`
                                : `Show ${submission.replies.length} Replies`}
                            </button>
                          </div>
                        )}

                      {activeReplies[submission.submission_id] && (
                        <div className="submission__reply-form">
                          <ReplyForm
                            parentId={submission.submission_id}
                            onSuccess={() =>
                              toggleReply(submission.submission_id)
                            }
                          />
                        </div>
                      )}

                      {/* Expanded Replies Section */}
                      {expandedThreads[submission.submission_id] &&
                        submission.replies &&
                        submission.replies.length > 0 && (
                          <div className="submission__replies">
                            {submission.replies.map((reply) => (
                              <div
                                key={reply.submission_id}
                                className="submission__reply"
                              >
                                <div className="submission__meta">
                                  <span className="submission__author">
                                    {reply.author}
                                  </span>
                                  <span className="submission__datetime">
                                    {reply.submission_datetime.toLocaleString()}
                                  </span>
                                </div>
                                <div className="submission__content">
                                  <h4 className="submission__title">
                                    {reply.submission_title}
                                  </h4>
                                  {reply.submission_name &&
                                    reply.submission_name !==
                                      reply.submission_title && (
                                      <p className="submission__description">
                                        {reply.submission_name}
                                      </p>
                                    )}
                                </div>
                                {reply.tags && reply.tags.length > 0 && (
                                  <div className="submission__tags">
                                    {reply.tags.map((tag: string) => (
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
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
            </div>
            <div className="submissions-list__pagination">
              <Pagination
                id="submissions"
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submissions-list__container" ref={containerRef}>
      <div className="submission__list">
        {enableThreadMode
          ? // Thread mode: Use SubmissionThread component for nested view
            submissions.map((submission: SubmissionWithReplies) => (
              <SubmissionThread
                key={submission.submission_id}
                submission={submission}
                isAuthorized={!!session?.user?.providerAccountId}
                activeReplies={activeReplies}
                setActiveReplies={setActiveReplies}
                expandedThreads={expandedThreads}
                setExpandedThreads={setExpandedThreads}
                onTagClick={handleTagClick}
              />
            ))
          : // Flat mode: Original flat list view
            submissions.map((submission: SubmissionWithReplies) => (
              <div
                key={submission.submission_id}
                className="submission__wrapper"
              >
                <div className="submission__meta">
                  <span className="submission__author">
                    {submission.author}
                  </span>
                  <span className="submission__datetime">
                    {submission.submission_datetime.toLocaleString()}
                  </span>
                  {/* Edit/Delete buttons for current user's posts */}
                  {isCurrentUserPost(submission.author_id) && (
                    <div className="submission__owner-actions">
                      <button
                        className="submission__edit-btn"
                        onClick={() => toggleEdit(submission.submission_id)}
                        title="Edit post"
                      >
                        {editingSubmissions[submission.submission_id]
                          ? 'Cancel'
                          : 'Edit'}
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
                {editingSubmissions[submission.submission_id] ? (
                  <div className="submission__edit-form">
                    <EditSubmissionForm
                      submission={{
                        submission_id: submission.submission_id,
                        submission_title: submission.submission_title,
                        submission_name: submission.submission_name,
                        tags: submission.tags || []
                      }}
                      onSuccess={() => toggleEdit(submission.submission_id)}
                      onCancel={() => toggleEdit(submission.submission_id)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="submission__content">
                      <h3 className="submission__title">
                        {submission.submission_title}
                      </h3>
                      {submission.submission_name &&
                        submission.submission_name !==
                          submission.submission_title && (
                          <p className="submission__description">
                            {submission.submission_name}
                          </p>
                        )}
                    </div>
                    {submission.tags && submission.tags.length > 0 && (
                      <div className="submission__tags">
                        {submission.tags.map((tag: string) => (
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
                    )}
                  </>
                )}

                {session?.user?.providerAccountId && (
                  <div className="submission__actions">
                    <button
                      className="submission__reply-btn"
                      onClick={() => toggleReply(submission.submission_id)}
                    >
                      {activeReplies[submission.submission_id]
                        ? 'Cancel'
                        : 'Reply'}
                    </button>

                    {submission.replies && submission.replies.length > 0 && (
                      <button
                        className="submission__expand-btn"
                        onClick={() => toggleExpand(submission.submission_id)}
                      >
                        {expandedThreads[submission.submission_id]
                          ? `Hide ${submission.replies.length} Replies`
                          : `Show ${submission.replies.length} Replies`}
                      </button>
                    )}
                  </div>
                )}

                {/* Show Replies button for non-authorized users too */}
                {!session?.user?.providerAccountId &&
                  submission.replies &&
                  submission.replies.length > 0 && (
                    <div className="submission__actions">
                      <button
                        className="submission__expand-btn"
                        onClick={() => toggleExpand(submission.submission_id)}
                      >
                        {expandedThreads[submission.submission_id]
                          ? `Hide ${submission.replies.length} Replies`
                          : `Show ${submission.replies.length} Replies`}
                      </button>
                    </div>
                  )}

                {activeReplies[submission.submission_id] && (
                  <div className="submission__reply-form">
                    <ReplyForm
                      parentId={submission.submission_id}
                      onSuccess={() => toggleReply(submission.submission_id)}
                    />
                  </div>
                )}

                {/* Expanded Replies Section */}
                {expandedThreads[submission.submission_id] &&
                  submission.replies &&
                  submission.replies.length > 0 && (
                    <div className="submission__replies">
                      {submission.replies.map((reply) => (
                        <div
                          key={reply.submission_id}
                          className="submission__reply"
                        >
                          <div className="submission__meta">
                            <span className="submission__author">
                              {reply.author}
                            </span>
                            <span className="submission__datetime">
                              {reply.submission_datetime.toLocaleString()}
                            </span>
                          </div>
                          <div className="submission__content">
                            <h4 className="submission__title">
                              {reply.submission_title}
                            </h4>
                            {reply.submission_name &&
                              reply.submission_name !==
                                reply.submission_title && (
                                <p className="submission__description">
                                  {reply.submission_name}
                                </p>
                              )}
                          </div>
                          {reply.tags && reply.tags.length > 0 && (
                            <div className="submission__tags">
                              {reply.tags.map((tag: string) => (
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
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
      </div>
      <div className="submissions-list__pagination">
        <Pagination
          id="submissions"
          currentPage={pagination.currentPage}
          totalPages={totalPages}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}
