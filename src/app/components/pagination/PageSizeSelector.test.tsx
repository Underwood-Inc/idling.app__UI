import { fireEvent, render, screen } from '@testing-library/react';
import { PageSize } from 'src/lib/state/PaginationContext';
import { PAGINATION_SELECTORS } from 'src/lib/test-selectors/components/pagination.selectors';
import PageSizeSelector from './PageSizeSelector';

describe('PageSizeSelector', () => {
  const mockOnPageSizeChange = jest.fn();

  beforeEach(() => {
    mockOnPageSizeChange.mockClear();
  });

  it('renders with correct options', () => {
    render(
      <PageSizeSelector
        pageSize={PageSize.TEN}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    const selector = screen.getByTestId(
      PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR
    );
    expect(selector).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    const pageSizeValues = Object.values(PageSize).filter(
      (value) => typeof value === 'number'
    );

    expect(options).toHaveLength(pageSizeValues.length);

    options.forEach((option, index) => {
      expect(option).toHaveValue(pageSizeValues[index].toString());
      expect(option).toHaveTextContent(pageSizeValues[index].toString());
    });
  });

  it('selects the correct option based on pageSize prop', () => {
    render(
      <PageSizeSelector
        pageSize={PageSize.TWENTY}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    const selector = screen.getByTestId(
      PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR
    ) as HTMLSelectElement;
    expect(selector.value).toBe(PageSize.TWENTY.toString());
  });

  it('calls onPageSizeChange when a new option is selected', () => {
    render(
      <PageSizeSelector
        pageSize={PageSize.TEN}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    const selector = screen.getByTestId(
      PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR
    );
    fireEvent.change(selector, {
      target: { value: PageSize.FIFTY.toString() }
    });

    expect(mockOnPageSizeChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(PageSize.FIFTY);
  });

  it('has the correct aria-label', () => {
    render(
      <PageSizeSelector
        pageSize={PageSize.TEN}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    const selector = screen.getByLabelText('Page size selector');
    expect(selector).toBeInTheDocument();
  });
});
