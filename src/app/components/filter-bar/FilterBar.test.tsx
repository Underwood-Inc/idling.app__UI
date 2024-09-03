import { fireEvent, render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useFilters } from '../../../lib/state/FiltersContext';
import FilterBar from './FilterBar';

// Mock the useFilters hook
jest.mock('../../../lib/state/FiltersContext', () => ({
  useFilters: jest.fn()
}));

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn()
}));

describe('FilterBar', () => {
  let dispatchSpy: jest.Mock;
  const mockState = {
    '1': {
      filters: [
        { name: 'tags', value: 'tag1,tag2' },
        { name: 'category', value: 'cat1' }
      ]
    }
  };

  const mockSearchParams = {
    get: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dispatchSpy = jest.fn();
    (useFilters as jest.Mock).mockReturnValue({
      state: mockState,
      dispatch: dispatchSpy
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders the FilterBar component with filters', () => {
    render(<FilterBar filterId="1" />);
    expect(screen.getByText('tags:')).toBeInTheDocument();
    expect(screen.getByText('category:')).toBeInTheDocument();
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('cat1')).toBeInTheDocument();
  });

  it('does not render the FilterBar component if no filters', () => {
    (useFilters as jest.Mock).mockReturnValue({
      state: {},
      dispatch: dispatchSpy
    });
    const { container } = render(<FilterBar filterId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it('calls dispatch with correct payload on clear button click', () => {
    render(<FilterBar filterId="1" />);
    const clearButton = screen.getAllByText('Clear')[0];
    fireEvent.click(clearButton);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith({
      payload: {
        filters: [
          {
            name: 'tags',
            value: ''
          }
        ],
        id: '1'
      },
      type: 'SET_CURRENT_FILTERS'
    });
  });

  it('should not render filters without values', () => {
    (useFilters as jest.Mock).mockReturnValue({
      state: {
        testFilter: {
          filters: [
            { name: 'category', value: undefined },
            { name: 'color', value: 'red' }
          ]
        }
      },
      dispatch: dispatchSpy
    });

    render(<FilterBar filterId="testFilter" />);

    expect(screen.queryByText('color:')).toBeInTheDocument();
    expect(screen.queryByText('red')).toBeInTheDocument();
    expect(screen.queryByText('category:')).not.toBeInTheDocument();
  });
});
