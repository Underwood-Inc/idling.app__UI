import { fireEvent, render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useFilters } from '../../../lib/state/FiltersContext';
import { FilterLabel } from './FilterLabel';

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn()
}));

// Mock the useFilters hook
jest.mock('../../../lib/state/FiltersContext', () => ({
  useFilters: jest.fn()
}));

describe('FilterLabel', () => {
  let dispatchSpy: jest.Mock;
  const mockSearchParams = {
    get: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    dispatchSpy = jest.fn();
    (useFilters as jest.Mock).mockReturnValue({ dispatch: dispatchSpy });
  });

  it('renders the FilterLabel component', () => {
    mockSearchParams.get.mockReturnValue('tag1,tag2');
    render(<FilterLabel label="tag1" name="tags" filterId="1" />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
  });

  it('calls dispatch with correct payload on click', () => {
    mockSearchParams.get.mockReturnValue('tag1,tag2');
    render(<FilterLabel label="tag1" name="tags" filterId="1" />);
    const badge = screen.getByText('✕');
    expect(badge).toBeInTheDocument();
    fireEvent.click(badge!);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith({
      payload: {
        filters: [
          {
            name: 'tags',
            value: 'tag2'
          }
        ],
        id: '1'
      },
      type: 'SET_CURRENT_FILTERS'
    });
  });

  it('removes the tag if it is the only one', () => {
    mockSearchParams.get.mockReturnValue('tag1');
    render(<FilterLabel label="tag1" name="tags" filterId="1" />);
    const badge = screen.getByText('✕');
    fireEvent.click(badge!);

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
});
