import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  PageSize,
  PaginationProvider
} from '../../../lib/state/PaginationContext';
import { PAGINATION_SELECTORS } from '../../../lib/test-selectors/components/pagination.selectors';
import Pagination from './Pagination';

const testDataId = 'default';

const renderWithProvider = (component: React.ReactNode, totalPages = 1) => {
  return render(
    <PaginationProvider
      value={{
        [testDataId]: {
          id: testDataId,
          currentPage: 1,
          totalPages: totalPages,
          pageSize: PageSize.TEN
        }
      }}
    >
      {component}
    </PaginationProvider>
  );
};

describe('Pagination', () => {
  it('renders correctly with initial state', () => {
    renderWithProvider(<Pagination id={testDataId} />, 3);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toBeVisible();
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)
    ).toHaveTextContent('123');
    expect(screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)).toHaveValue(
      '1'
    );
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_STATE)
    ).toHaveTextContent('Page Size 10');
  });

  it('handles previous button click', () => {
    renderWithProvider(<Pagination id={testDataId} />);

    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    // Ensure it stays on page 1 (can't go below 1)
    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toHaveTextContent(
      'Page 1 of'
    );
  });

  it('handles next button click', async () => {
    renderWithProvider(<Pagination id={testDataId} />, 3);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)
      ).toHaveTextContent('123');
      expect(
        screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)
      ).toHaveValue('2');
      expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toHaveTextContent(
        'Page 123 of 3'
      );
    });
  });

  it('handles page selection', () => {
    renderWithProvider(<Pagination id={testDataId} />, 4);

    const pageSelector = screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR);
    fireEvent.change(pageSelector, { target: { value: '3' } });

    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)
    ).toHaveTextContent('1234');
    expect(screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)).toHaveValue(
      '3'
    );
    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toHaveTextContent(
      'Page 1234 of 4'
    );
  });

  it('handles page size selection', () => {
    renderWithProvider(<Pagination id={testDataId} />);

    const pageSizeSelector = screen.getByTestId(
      PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR
    );
    fireEvent.change(pageSizeSelector, { target: { value: '50' } });

    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_STATE)
    ).toHaveTextContent('Page Size 1020304050');
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR)
    ).toHaveValue('50');
  });

  it('disables previous button on first page', () => {
    renderWithProvider(<Pagination id={testDataId} />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    renderWithProvider(<Pagination id={testDataId} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it('returns null when pagination state is not available', () => {
    const { container } = renderWithProvider(<Pagination id="non-existent" />);
    expect(container.firstChild).toBeNull();
  });

  it('handles previous button click when not on first page', async () => {
    renderWithProvider(<Pagination id={testDataId} />, 3);

    // First, move to page 2
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)
      ).toHaveValue('2');
    });

    // Now click previous
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(
        screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)
      ).toHaveValue('1');
      expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toHaveTextContent(
        'Page 123 of 3'
      );
    });
  });

  it('renders correctly when totalPages is not available', () => {
    render(
      <PaginationProvider
        value={{
          default: {
            id: 'default',
            currentPage: 1,
            totalPages: undefined,
            pageSize: PageSize.TEN
          }
        }}
      >
        <Pagination id={testDataId} />
      </PaginationProvider>
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toBeVisible();
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)
    ).toBeEmptyDOMElement();
    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toHaveTextContent(
      'Page of'
    );
  });

  it('uses default id when not provided', () => {
    // @ts-expect-error default prop value test
    renderWithProvider(<Pagination />);

    expect(screen.getByTestId(PAGINATION_SELECTORS.STATE)).toBeInTheDocument();
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SELECTOR)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(PAGINATION_SELECTORS.PAGE_SIZE_STATE)
    ).toBeInTheDocument();
  });
});
