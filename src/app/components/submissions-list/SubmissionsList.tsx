'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Filter } from '../../../lib/state/atoms';
import { PostFilters } from '../../../lib/types/filters';
import Pagination from '../pagination/Pagination';
import { ReplyForm } from '../thread/ReplyForm';
import './SubmissionsList.css';

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
  submissions: Submission[];
  pagination: PaginationInfo;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onTagClick: (filter: Filter<PostFilters>) => void;
}

export default function SubmissionsList({
  isLoading,
  error,
  submissions,
  pagination,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onTagClick
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
    pagination
  });

  // Log sample of submissions for verification
  if (submissions.length > 0) {
    // eslint-disable-next-line no-console
    console.log('📋 [SUBMISSIONS_LIST] Sample submissions:', {
      firstSubmission: {
        id: submissions[0].submission_id,
        title: submissions[0].submission_title,
        tags: submissions[0].tags
      },
      lastSubmission: {
        id: submissions[submissions.length - 1].submission_id,
        title: submissions[submissions.length - 1].submission_title,
        tags: submissions[submissions.length - 1].tags
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
    console.log('📄 [SUBMISSIONS_LIST] Page change requested:', {
      from: pagination.currentPage,
      to: page
    });
    onPageChange(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    // eslint-disable-next-line no-console
    console.log('📏 [SUBMISSIONS_LIST] Page size change requested:', {
      from: pagination.pageSize,
      to: pageSize
    });
    onPageSizeChange(pageSize);
  };

  // Security check - ensure user is authenticated for sensitive operations
  if (status === 'loading' || isLoading) {
    return <div className="submissions-list__loading">Loading...</div>;
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error('📋 [SUBMISSIONS_LIST] Rendering error state:', error);
    return <div className="submissions-list__error">Error: {error}</div>;
  }

  if (!submissions || submissions.length === 0) {
    return <div className="submissions-list__empty">No submissions found</div>;
  }

  return (
    <div className="submissions-list__container">
      <div className="submission__list">
        {submissions.map((submission: Submission) => (
          <div key={submission.submission_id} className="submission__wrapper">
            <div className="submission__meta">
              <span className="submission__author">{submission.author}</span>
              <span className="submission__datetime">
                {submission.submission_datetime.toLocaleString()}
              </span>
            </div>
            <div className="submission__content">
              <h3 className="submission__title">
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
                {activeReplies[submission.submission_id] ? 'Cancel' : 'Reply'}
              </button>
              {submission.thread_parent_id === null && (
                <button
                  className="submission__expand-button"
                  onClick={() => toggleExpand(submission.submission_id)}
                >
                  {expandedThreads[submission.submission_id]
                    ? 'Collapse'
                    : 'Expand'}
                </button>
              )}
            </div>

            {activeReplies[submission.submission_id] && (
              <div className="submission__reply-form">
                <ReplyForm parentId={submission.submission_id} />
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
