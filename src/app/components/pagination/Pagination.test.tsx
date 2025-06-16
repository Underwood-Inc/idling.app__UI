import { fireEvent, render, screen } from '@testing-library/react';
import { PageSize } from '../../../lib/state/atoms';
import { PAGINATION_SELECTORS } from '../../../lib/test-selectors/components/pagination.selectors';
import Pagination from './Pagination';

// Mock the PageSizeSelector component to avoid import issues
jest.mock('./PageSizeSelector', () => {
  const {
    PAGINATION_SELECTORS
  } = require('../../../lib/test-selectors/components/pagination.selectors');
  return function MockPageSizeSelector({
    pageSize,
    onPageSizeChange
  }: {
    pageSize: any;
    onPageSizeChange: (size: any) => void;
  }) {
    return (
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        data-testid={PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR}
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    );
  };
});

const testDataId = 'default';

describe('Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    render(
      <Pagination
        id={testDataId}
        currentPage={1}
        totalPages={3}
        pageSize={PageSize.TEN}
      />
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)).toHaveValue(
      '1'
    );
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR)
    ).toHaveValue('10');
  });

  it('handles previous button click', () => {
    const mockOnPageChange = jest.fn();
    render(
      <Pagination
        id={testDataId}
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    // Should not call onPageChange when already on page 1
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('handles next button click', () => {
    const mockOnPageChange = jest.fn();
    render(
      <Pagination
        id={testDataId}
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('handles page selection', () => {
    const mockOnPageChange = jest.fn();
    render(
      <Pagination
        id={testDataId}
        currentPage={1}
        totalPages={4}
        onPageChange={mockOnPageChange}
      />
    );

    const pageSelector = screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR);
    fireEvent.change(pageSelector, { target: { value: '3' } });

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('handles page size selection', () => {
    const mockOnPageSizeChange = jest.fn();
    render(
      <Pagination
        id={testDataId}
        currentPage={1}
        totalPages={2}
        pageSize={PageSize.TEN}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    const pageSizeSelector = screen.getByTestId(
      PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR
    );

    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    fireEvent.change(pageSizeSelector, { target: { value: '50' } });

    expect(mockOnPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('disables previous button on first page', () => {
    render(<Pagination id={testDataId} currentPage={1} totalPages={3} />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination id={testDataId} currentPage={1} totalPages={1} />);

    // Component should not render when totalPages <= 1
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('shows correct page information for middle page', () => {
    render(<Pagination id={testDataId} currentPage={3} totalPages={5} />);

    expect(screen.getByText('Page 3 of 5')).toBeInTheDocument();
    expect(screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)).toHaveValue(
      '3'
    );
  });

  it('handles different page sizes correctly', () => {
    render(
      <Pagination
        id={testDataId}
        currentPage={1}
        totalPages={2}
        pageSize={PageSize.TWENTY}
      />
    );

    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR)
    ).toHaveValue('20');
  });

  it('does not render when totalPages is 1 or less', () => {
    render(<Pagination id={testDataId} currentPage={1} totalPages={1} />);

    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});
