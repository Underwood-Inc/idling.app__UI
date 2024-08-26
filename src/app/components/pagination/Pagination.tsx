'use client';
import { usePagination } from '../../../lib/state/PaginationContext';
import { PAGINATION_SELECTORS } from '../../../lib/test-selectors/components/pagination.selectors';
import './Pagination.css';

function Pagination({
  onPageChange,
  id = 'default'
}: {
  // eslint-disable-next-line no-unused-vars
  onPageChange: (newPage: number) => void;
  id: string;
}) {
  const { state, dispatch } = usePagination();
  const pagination = state[id];

  if (!pagination) {
    return null;
  }

  const { currentPage, totalPages } = pagination;

  const handlePrevious = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    if (currentPage > 1) {
      const newPage = currentPage - 1;

      dispatch({
        type: 'SET_CURRENT_PAGE',
        payload: {
          id,
          page: newPage
        }
      });

      onPageChange(newPage);
    }
  };

  const handleNext = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    if (currentPage < totalPages) {
      const newPage = currentPage + 1;

      dispatch({
        type: 'SET_CURRENT_PAGE',
        payload: {
          id,
          page: newPage
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
        page: newPage
      }
    });

    onPageChange(newPage);
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
            title="Current page selector"
            value={currentPage}
            onChange={handlePageSelect}
            className="pagination__page-selector"
            data-testid={PAGINATION_SELECTORS.PAGE_SELECTOR}
          >
            {Array.from({ length: totalPages }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          &nbsp; of {totalPages}
        </p>
      </div>
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="pagination__next-button"
        data-testid={PAGINATION_SELECTORS.NEXT}
      >
        Next
      </button>
    </article>
  );
}

export default Pagination;
