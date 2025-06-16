'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Filter } from '../../../lib/state/atoms';
import { PostFilters } from '../../../lib/types/filters';
import Pagination from '../pagination/Pagination';
import { ReplyForm } from '../thread/ReplyForm';
import { SubmissionWithReplies } from './actions';
import './SubmissionsList.css';
import { SubmissionThread } from './SubmissionThread';

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

  // eslint-disable-next-line no-console
  console.log('📋 [SUBMISSIONS_LIST] Rendering with state:', {
    submissionsCount: submissions.length,
    isLoading,
    hasError: !!error,
    error,
    pagination,
    enableThreadMode
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
    return <div className="submissions-list__loading">Loading session...</div>;
  }

  if (isLoading) {
    return <div className="submissions-list__loading">Loading...</div>;
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error('📋 [SUBMISSIONS_LIST] Rendering error state:', error);
    return <div className="submissions-list__error">Error: {error}</div>;
  }

  if (submissions.length === 0) {
    return <div className="submissions-list__empty">No submissions found</div>;
  }

  return (
    <div className="submissions-list__container">
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
                </div>
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
                      <span
                        key={tag}
                        className="submission__tag"
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reply functionality */}
                <div className="submission__actions">
                  <button
                    className="submission__reply-button"
                    onClick={() => toggleReply(submission.submission_id)}
                  >
                    {activeReplies[submission.submission_id]
                      ? 'Cancel'
                      : 'Reply'}
                  </button>
                  {submission.thread_parent_id === null &&
                    submission.replies &&
                    submission.replies.length > 0 && (
                      <button
                        className="submission__expand-button"
                        onClick={() => toggleExpand(submission.submission_id)}
                      >
                        {expandedThreads[submission.submission_id]
                          ? 'Collapse'
                          : `Expand (${submission.replies.length})`}
                      </button>
                    )}
                </div>

                {activeReplies[submission.submission_id] && (
                  <div className="submission__reply-form">
                    <ReplyForm parentId={submission.submission_id} />
                  </div>
                )}

                {/* Show expanded replies in flat mode */}
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
                            <p className="submission__description">
                              {reply.submission_name}
                            </p>
                          </div>
                          {reply.tags && reply.tags.length > 0 && (
                            <div className="submission__tags">
                              {reply.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="submission__tag"
                                  onClick={() => handleTagClick(tag)}
                                >
                                  {tag}
                                </span>
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
