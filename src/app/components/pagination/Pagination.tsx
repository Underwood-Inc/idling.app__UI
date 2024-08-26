'use client';
import { PageSize, usePagination } from '../../../lib/state/PaginationContext';
import { PAGINATION_SELECTORS } from '../../../lib/test-selectors/components/pagination.selectors';
import PageSizeSelector from './PageSizeSelector';
import './Pagination.css';

function Pagination({
  onPageChange,
  onPageSizeChange,
  id = 'default'
}: {
  // eslint-disable-next-line no-unused-vars
  onPageChange: (newPage: number) => void;
  // eslint-disable-next-line no-unused-vars
  onPageSizeChange: (newPageSize: number) => void;
  id: string;
}) {
  const { state, dispatch } = usePagination();
  const pagination = state[id];

  if (!pagination) {
    return null;
  }

  const { currentPage, totalPages, pageSize } = pagination;

  const handlePrevious = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    if (currentPage && currentPage > 1) {
      const newPage = currentPage - 1;

      dispatch({
        type: 'SET_CURRENT_PAGE',
        payload: {
          id,
          currentPage: newPage
        }
      });

      onPageChange(newPage);
    }
  };

  const handleNext = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    if (currentPage && totalPages && currentPage < totalPages) {
      const newPage = currentPage + 1;

      dispatch({
        type: 'SET_CURRENT_PAGE',
        payload: {
          id,
          currentPage: newPage
        }
      });

      onPageChange(newPage);
    }
  };

  const handlePageSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPage = Number(event.target.value);

    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        id,
        currentPage: newPage
      }
    });

    onPageChange(newPage);
  };

  const handlePageSizeSelect = (newPageSize: PageSize) => {
    dispatch({
      type: 'SET_PAGE_SIZE',
      payload: {
        id,
        pageSize: newPageSize
      }
    });

    onPageSizeChange(newPageSize);
  };

  return (
    <article className="pagination__container">
      <div className="flex ai-center">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="pagination__previous-button"
          data-testid={PAGINATION_SELECTORS.PREVIOUS}
        >
          Previous
        </button>

        <p data-testid={PAGINATION_SELECTORS.STATE}>
          Page&nbsp;
          <select
            aria-label="Current page selector"
            value={currentPage}
            onChange={handlePageSelect}
            className="pagination__page-selector"
            data-testid={PAGINATION_SELECTORS.PAGE_SELECTOR}
          >
            {totalPages
              ? Array.from({ length: totalPages }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1}
                  </option>
                ))
              : null}
          </select>
          &nbsp;of {totalPages}
        </p>
      </div>

      <div className="flex ai-center">
        {pageSize && (
          <p
            data-testid={PAGINATION_SELECTORS.PAGE_SIZE_STATE}
            className="pagination__page-size-selector"
          >
            Page Size&nbsp;
            <PageSizeSelector
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeSelect}
            />
          </p>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="pagination__next-button"
          data-testid={PAGINATION_SELECTORS.NEXT}
        >
          Next
        </button>
      </div>
    </article>
  );
}

export default Pagination;
