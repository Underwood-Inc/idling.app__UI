'use client';

import Pagination from '../../pagination/Pagination';
import { StickyPagination } from '../../pagination/StickyPagination';

export interface PostsManagerPaginationProps {
  isLoading: boolean;
  error: string | null;
  submissions: any[];
  infiniteScrollMode: boolean;
  hasMore: boolean;
  totalRecords: number;
  pagination: {
    currentPage: number;
    pageSize: number;
  };
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PostsManagerPagination({
  isLoading,
  error,
  submissions,
  infiniteScrollMode,
  hasMore,
  totalRecords,
  pagination,
  totalPages,
  onPageChange,
  onPageSizeChange
}: PostsManagerPaginationProps) {
  if (isLoading || error || submissions.length === 0) {
    return null;
  }

  return (
    <div className="posts-manager__pagination">
      {!infiniteScrollMode ? (
        <>
          <Pagination
            id="submissions"
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            pageSize={pagination.pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
          <StickyPagination
            id="submissions"
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            pageSize={pagination.pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            containerSelector=".posts-manager__pagination"
          />
        </>
      ) : (
        <div className="posts-manager__infinite-scroll">
          {/* Show completion message when no more posts */}
          {!hasMore && submissions.length > 0 && (
            <div className="posts-manager__infinite-info">
              Showing all {submissions.length} of{' '}
              {totalRecords.toLocaleString()} posts
            </div>
          )}
        </div>
      )}
    </div>
  );
}
