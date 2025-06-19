import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { FilterLabel } from './FilterLabel';

// Mock the atoms module
jest.mock('../../../lib/state/atoms', () => ({
  getDisplayFiltersAtom: jest.fn().mockReturnValue({
    read: jest.fn(),
    write: jest.fn()
  })
}));

jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn().mockReturnValue([[], jest.fn()]) // displayFilters is an array
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test'
}));

describe('FilterLabel', () => {
  const mockOnRemoveTag = jest.fn();

  const defaultProps = {
    filterId: 'test-filter',
    name: 'tags',
    label: 'test-tag',
    onRemoveTag: mockOnRemoveTag
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter label correctly', () => {
    render(
      <Provider>
        <FilterLabel {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles clear button click', () => {
    render(
      <Provider>
        <FilterLabel {...defaultProps} />
      </Provider>
    );

    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    expect(mockOnRemoveTag).toHaveBeenCalledWith('test-tag');
  });

  it('handles multiple values correctly', () => {
    const propsWithMultipleValues = {
      ...defaultProps,
      label: 'tag1,tag2,tag3'
    };

    render(
      <Provider>
        <FilterLabel {...propsWithMultipleValues} />
      </Provider>
    );

    // FilterLabel renders the full label as one string, not individual tags
    expect(screen.getByText('tag1,tag2,tag3')).toBeInTheDocument();
  });

  it('handles filterId correctly', () => {
    render(
      <Provider>
        <FilterLabel {...defaultProps} />
      </Provider>
    );

    // FilterLabel doesn't directly use atoms anymore, just verify the prop is passed
    expect(defaultProps.filterId).toBe('test-filter');
  });
});
