import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFilters } from '../../../lib/state/FiltersContext';
import { usePagination } from '../../../lib/state/PaginationContext';
import { TagLink } from './TagLink';

// Mock the necessary hooks and modules
jest.mock('../../../lib/state/FiltersContext', () => ({
  useFilters: jest.fn()
}));
jest.mock('../../../lib/state/PaginationContext', () => ({
  usePagination: jest.fn()
}));
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn()
}));

describe('TagLink', () => {
  const mockDispatchFilters = jest.fn();
  const mockDispatchPagination = jest.fn();
  const mockPathname = '/posts';
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    (useFilters as jest.Mock).mockReturnValue({
      dispatch: mockDispatchFilters
    });
    (usePagination as jest.Mock).mockReturnValue({
      dispatch: mockDispatchPagination
    });
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders a single tag link correctly', () => {
    render(<TagLink value="#singleTag" contextId="test" />);
    expect(screen.getByText('#singleTag')).toBeInTheDocument();
  });

  it('renders multiple tag links correctly', () => {
    render(<TagLink value="#firstTag #secondTag" contextId="test" />);
    expect(screen.getByText('#firstTag')).toBeInTheDocument();
    expect(screen.getByText('#secondTag')).toBeInTheDocument();
  });

  it('handles click event and dispatches actions', () => {
    render(<TagLink value="#clickableTag" contextId="test" />);
    fireEvent.click(screen.getByText('#clickableTag'));

    expect(mockDispatchFilters).toHaveBeenCalledWith({
      payload: {
        filters: [{ name: 'tags', value: 'clickabletag' }],
        id: 'test'
      },
      type: 'SET_CURRENT_FILTERS'
    });

    expect(mockDispatchPagination).toHaveBeenCalledWith({
      payload: {
        currentPage: 1,
        id: 'test'
      },
      type: 'SET_CURRENT_PAGE'
    });
  });

  it('appends tag to existing search params when appendSearchParam is true', () => {
    mockSearchParams.set('tags', 'existingTag');
    render(
      <TagLink value="#newTag" contextId="test" appendSearchParam={true} />
    );
    fireEvent.click(screen.getByText('#newTag'));

    expect(mockDispatchFilters).toHaveBeenCalledWith({
      payload: {
        filters: [{ name: 'tags', value: 'existingTag,newtag' }],
        id: 'test'
      },
      type: 'SET_CURRENT_FILTERS'
    });
  });

  it('does not dispatch actions when tag is already in search params', () => {
    mockSearchParams.set('tags', 'existingTag');
    render(<TagLink value="#existingTag" contextId="test" />);
    fireEvent.click(screen.getByText('#existingTag'));

    expect(mockDispatchFilters).not.toHaveBeenCalled();
    expect(mockDispatchPagination).not.toHaveBeenCalled();
  });

  it('generates correct href for new tag', () => {
    render(<TagLink value="#newTag" contextId="test" />);
    const link = screen.getByText('#newTag');
    expect(link.getAttribute('href')).toBe('/posts?tags=newtag');
  });

  it('generates correct href for appending tag', () => {
    mockSearchParams.set('tags', 'existingTag');
    render(<TagLink value="#newTag" contextId="test" />);
    const link = screen.getByText('#newTag');
    expect(link.getAttribute('href')).toBe('/posts?tags=existingTag,newtag');
  });

  it('generates correct href for existing tag', () => {
    mockSearchParams.set('tags', 'existingTag');
    render(<TagLink value="#existingTag" contextId="test" />);
    const link = screen.getByText('#existingTag');
    expect(link.getAttribute('href')).toBe('/posts?tags=existingTag');
  });
});
