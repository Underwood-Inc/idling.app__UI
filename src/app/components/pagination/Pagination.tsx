'use client';
import { usePagination } from '../../state/PaginationContext';

function Pagination({
  onPageChange
}: {
  onPageChange: (newPage: number) => void;
}) {
  const { state, dispatch } = usePagination();
  const { currentPage, totalPages } = state;

  const handlePrevious = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      dispatch({ type: 'SET_CURRENT_PAGE', payload: newPage });
      onPageChange(newPage);
    }
  };

  const handleNext = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      dispatch({ type: 'SET_CURRENT_PAGE', payload: newPage });
      onPageChange(newPage);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
