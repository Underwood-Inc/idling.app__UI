'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useFilters } from '../../../lib/state/FiltersContext';
import { usePagination } from '../../../lib/state/PaginationContext';
import { PostFilters } from '../../posts/page';
import FilterBar, { Filter } from '../filter-bar/FilterBar';
import { PageSize } from '../pagination/PageSizeSelector';
import Pagination from '../pagination/Pagination';
import { ReplyForm } from '../thread/ReplyForm';
import './SubmissionsList.css';
import { useSubmissions } from './use-submissions';

interface Submission {
  submission_id: number;
  submission_name: string;
  submission_datetime: Date;
  author_id: string;
  author: string;
  thread_parent_id: number | null;
  tags: string[];
}

interface SubmissionsListProps {
  contextId: string;
  onlyMine?: boolean;
  filters?: Filter<PostFilters>[];
  providerAccountId?: string;
}

export default function SubmissionsList({
  contextId,
  onlyMine = false,
  filters = [],
  providerAccountId: initialProviderAccountId
}: SubmissionsListProps) {
  const { data: session, status } = useSession();
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const { state: paginationState, dispatch: paginationDispatch } =
    usePagination();
  const [activeReplies, setActiveReplies] = useState<{
    [key: number]: boolean;
  }>({});
  const [expandedThreads, setExpandedThreads] = useState<{
    [key: number]: boolean;
  }>({});

  // Memoize the provider account ID to prevent unnecessary re-renders
  const providerAccountId = useMemo(
    () => initialProviderAccountId || session?.user?.providerAccountId || '',
    [initialProviderAccountId, session?.user?.providerAccountId]
  );

  // Memoize the current filters to prevent unnecessary re-renders
  const currentFilters = useMemo(
    () => (filtersState[contextId]?.filters || []) as Filter<PostFilters>[],
    [filtersState, contextId]
  );

  // Initialize filters in context only once
  useEffect(() => {
    if (filters.length > 0 && !filtersState[contextId]?.filters?.length) {
      filtersDispatch({
        type: 'SET_CURRENT_FILTERS',
        payload: {
          id: contextId,
          filters: filters as Filter<string>[]
        }
      });
    }
  }, [contextId, filters, filtersDispatch, filtersState]);

  const { loading, data, error, currentPage, totalPages, setPage, setFilters } =
    useSubmissions(
      contextId,
      providerAccountId,
      onlyMine,
      paginationState[contextId]?.currentPage || 1,
      currentFilters
    );

  // Update pagination context when data changes
  useEffect(() => {
    if (data?.pagination) {
      paginationDispatch({
        type: 'SET_TOTAL_PAGES',
        payload: {
          id: contextId,
          totalPages: Math.ceil(
            data.pagination.totalRecords / data.pagination.pageSize
          )
        }
      });
    }
  }, [contextId, data?.pagination, paginationDispatch]);

  // Sync current page from pagination context to useSubmissions
  useEffect(() => {
    const contextPage = paginationState[contextId]?.currentPage;
    if (contextPage && contextPage !== currentPage) {
      setPage(contextPage);
    }
  }, [contextId, currentPage, paginationState, setPage]);

  const handleTagClick = (tag: string) => {
    const newFilters = [...currentFilters];
    const tagFilter = newFilters.find((f) => f.name === 'tags');
    if (tagFilter) {
      tagFilter.value = tag;
    } else {
      newFilters.push({ name: 'tags', value: tag });
    }
    setFilters(newFilters);
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    paginationDispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        id: contextId,
        currentPage: newPage
      }
    });
  };

  const handlePageSizeChange = (newPageSize: PageSize) => {
    paginationDispatch({
      type: 'SET_PAGE_SIZE',
      payload: {
        id: contextId,
        pageSize: newPageSize
      }
    });
    paginationDispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        id: contextId,
        currentPage: 1
      }
    });
  };

  if (status === 'loading' || loading) {
    return <div className="submissions-list__loading">Loading...</div>;
  }

  if (error) {
    return <div className="submissions-list__error">Error: {error}</div>;
  }

  if (!data?.submissions.length) {
    return <div className="submissions-list__empty">No submissions found</div>;
  }

  return (
    <div className="submissions-list__container">
      <FilterBar filterId={contextId} />
      <div className="submission__list">
        {data.submissions.map((submission: Submission) => (
          <div key={submission.submission_id} className="submission__wrapper">
            <div className="submission__meta">
              <span className="submission__author">{submission.author}</span>
              <span className="submission__datetime">
                {submission.submission_datetime.toLocaleString()}
              </span>
            </div>
            <div className="submission__content">
              {submission.submission_name}
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
            <div className="submission__actions">
              {session?.user?.providerAccountId && (
                <button
                  onClick={() => toggleReply(submission.submission_id)}
                  className="submission__action-btn"
                >
                  {activeReplies[submission.submission_id] ? 'Cancel' : 'Reply'}
                </button>
              )}
              {submission.thread_parent_id && (
                <button
                  onClick={() => toggleExpand(submission.submission_id)}
                  className="submission__action-btn"
                >
                  {expandedThreads[submission.submission_id]
                    ? 'Collapse'
                    : 'Expand'}
                </button>
              )}
            </div>
            {activeReplies[submission.submission_id] && (
              <ReplyForm parentId={submission.submission_id} />
            )}
          </div>
        ))}
      </div>
      <div className="submissions-list__pagination">
        <Pagination id={contextId} />
      </div>
    </div>
  );
}
