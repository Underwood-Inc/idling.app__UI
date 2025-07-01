/**
 * Pagination Section Component
 *
 * Handles pagination information display and controls for both traditional
 * and infinite scroll modes. This component is focused solely on pagination.
 */

import React from 'react';
import type { ManagementUser } from './types';

interface PaginationSectionProps {
  paginationMode: 'traditional' | 'infinite';
  currentPage: number;
  totalPages: number;
  paginatedUsers: ManagementUser[];
  filteredUsers: ManagementUser[];
  users: ManagementUser[];
  activeFiltersCount: number;
  hasMoreUsers: boolean;
  onGoToPage: (page: number) => void;
}

export const PaginationSection: React.FC<PaginationSectionProps> = ({
  paginationMode,
  currentPage,
  totalPages,
  paginatedUsers,
  filteredUsers,
  users,
  activeFiltersCount,
  hasMoreUsers,
  onGoToPage
}) => {
  return (
    <div className="pagination">
      <div className="pagination-info-section">
        {paginationMode === 'traditional' ? (
          <>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <span className="results-info">
              {activeFiltersCount > 0 ? (
                <>
                  Showing {paginatedUsers.length} of {filteredUsers.length}{' '}
                  filtered results
                  {filteredUsers.length !== users.length && (
                    <span className="total-results">
                      {' '}
                      (from {users.length} total)
                    </span>
                  )}
                </>
              ) : (
                <>
                  Showing {paginatedUsers.length} of {users.length} users
                </>
              )}
            </span>
          </>
        ) : (
          <span className="results-info">
            {activeFiltersCount > 0 ? (
              <>
                Showing {paginatedUsers.length} of {filteredUsers.length}{' '}
                filtered results
                {filteredUsers.length !== users.length && (
                  <span className="total-results">
                    {' '}
                    (from {users.length} total)
                  </span>
                )}
                {hasMoreUsers && (
                  <span className="scroll-hint">
                    {' '}
                    • Scroll down to load more
                  </span>
                )}
              </>
            ) : (
              <>
                Showing {paginatedUsers.length} of {users.length} users
                {hasMoreUsers && (
                  <span className="scroll-hint">
                    {' '}
                    • Scroll down to load more
                  </span>
                )}
              </>
            )}
          </span>
        )}
      </div>

      {/* Traditional Pagination Controls */}
      {paginationMode === 'traditional' && (
        <div className="pagination-controls">
          <button
            className="btn btn--secondary"
            onClick={() => onGoToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => onGoToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
