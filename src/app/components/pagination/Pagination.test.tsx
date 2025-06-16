import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import React from 'react';
import { PageSize } from '../../../lib/state/atoms';
import { PAGINATION_SELECTORS } from '../../../lib/test-selectors/components/pagination.selectors';
import Pagination from './Pagination';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/test'),
  useSearchParams: jest.fn(() => new URLSearchParams())
}));

// Mock the atoms
jest.mock('../../../lib/state/atoms', () => ({
  ...jest.requireActual('../../../lib/state/atoms'),
  getSubmissionsStateAtom: jest.fn(),
  getSubmissionsFiltersAtom: jest.fn()
}));

// Mock jotai useAtom
jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn()
}));

const testDataId = 'default';

const renderWithProvider = (
  component: React.ReactNode,
  totalPages = 1,
  currentPage = 1,
  pageSize = PageSize.TEN
) => {
  const { useAtom } = require('jotai');

  // Mock the submissions state atom
  useAtom.mockReturnValueOnce([
    {
      loading: false,
      data: {
        submissions: [],
        pagination: {
          currentPage,
          pageSize,
          totalRecords: totalPages * pageSize
        }
      }
    },
    jest.fn()
  ]);

  // Mock the submissions filters atom
  useAtom.mockReturnValueOnce([
    {
      onlyMine: false,
      providerAccountId: '',
      filters: [],
      page: currentPage,
      pageSize,
      initialized: true
    },
    jest.fn()
  ]);

  return render(<Provider>{component}</Provider>);
};

describe('Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    renderWithProvider(<Pagination id={testDataId} />, 3);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toBeVisible();
    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toHaveTextContent(
      'Page'
    );
    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toHaveTextContent(
      'of 3'
    );
    expect(screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)).toHaveValue(
      '1'
    );
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_STATE)
    ).toHaveTextContent('Page Size 10');
  });

  it('handles previous button click', () => {
    const mockOnPageChange = jest.fn();
    renderWithProvider(
      <Pagination id={testDataId} onPageChange={mockOnPageChange} />
    );

    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    // Should not call onPageChange when already on page 1
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('handles next button click', () => {
    const mockOnPageChange = jest.fn();
    renderWithProvider(
      <Pagination id={testDataId} onPageChange={mockOnPageChange} />,
      3
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('handles page selection', () => {
    const mockOnPageChange = jest.fn();
    renderWithProvider(
      <Pagination id={testDataId} onPageChange={mockOnPageChange} />,
      4
    );

    const pageSelector = screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR);
    fireEvent.change(pageSelector, { target: { value: '3' } });

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('handles page size selection', () => {
    const mockOnPageSizeChange = jest.fn();
    renderWithProvider(
      <Pagination id={testDataId} onPageSizeChange={mockOnPageSizeChange} />
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
    renderWithProvider(<Pagination id={testDataId} />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    renderWithProvider(<Pagination id={testDataId} />, 1, 1);

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('shows correct page information for middle page', () => {
    renderWithProvider(<Pagination id={testDataId} />, 5, 3);

    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toHaveTextContent(
      'Page 3 of 5'
    );
    expect(screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)).toHaveValue(
      '3'
    );
  });

  it('handles different page sizes correctly', () => {
    renderWithProvider(<Pagination id={testDataId} />, 2, 1, PageSize.TWENTY);

    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_STATE)
    ).toHaveTextContent('Page Size 20');
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR)
    ).toHaveValue('20');
  });
});
