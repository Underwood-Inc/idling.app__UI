'use client';
import { PageSize } from '../../../lib/state/atoms';
import { PAGINATION_SELECTORS } from '../../../lib/test-selectors/components/pagination.selectors';
import PageSizeSelector from './PageSizeSelector';
import './Pagination.css';

interface PaginationProps {
  id: string;
  currentPage?: number;
  totalPages?: number;
  pageSize?: PageSize;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: PageSize) => void;
}

function Pagination({
  id,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const handlePrevious = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (currentPage > 1 && onPageChange) {
      const newPage = currentPage - 1;
      onPageChange(newPage);
    }
  };

  const handleNext = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (currentPage < totalPages && onPageChange) {
      const newPage = currentPage + 1;
      onPageChange(newPage);
    }
  };

  const handlePageSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPage = Number(event.target.value);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeSelect = (newPageSize: PageSize) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };

  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <div className="pagination__info">
        <span className="pagination__page-info">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="pagination__controls">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="pagination__button pagination__button--prev"
          data-testid={PAGINATION_SELECTORS.PREVIOUS}
          aria-label="Go to previous page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
          Previous
        </button>

        <div className="pagination__page-selector-container">
          <select
            aria-label="Current page selector"
            value={currentPage}
            onChange={handlePageSelect}
            className="pagination__page-select"
            data-testid={PAGINATION_SELECTORS.PAGE_SELECTOR}
          >
            {Array.from({ length: totalPages }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="pagination__button pagination__button--next"
          data-testid={PAGINATION_SELECTORS.NEXT}
          aria-label="Go to next page"
        >
          Next
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>
      </div>

      <div className="pagination__page-size">
        <label className="pagination__page-size-label">
          Show:
          <PageSizeSelector
            pageSize={pageSize as PageSize}
            onPageSizeChange={handlePageSizeSelect}
          />
        </label>
      </div>
    </div>
  );
}

export default Pagination;
