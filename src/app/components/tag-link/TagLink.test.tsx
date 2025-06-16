import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { TagLink } from './TagLink';

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

// Mock the atoms module
jest.mock('../../../lib/state/atoms', () => ({
  getDisplayFiltersAtom: jest.fn().mockReturnValue({
    read: jest.fn(),
    write: jest.fn()
  }),
  paginationActionAtom: jest.fn()
}));

jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn().mockReturnValue([[], jest.fn()]) // displayFilters is an array
}));

describe('TagLink', () => {
  const defaultProps = {
    value: 'test-tag',
    contextId: 'test-context'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tag link correctly', () => {
    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('handles click correctly', () => {
    const mockSetFilters = jest.fn();
    const mockDispatchPagination = jest.fn();
    const { useAtom } = require('jotai');

    // Mock multiple useAtom calls
    useAtom
      .mockReturnValueOnce([null, mockDispatchPagination]) // paginationActionAtom
      .mockReturnValueOnce([[], mockSetFilters]); // displayFilters

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    fireEvent.click(tagLink);

    expect(mockSetFilters).toHaveBeenCalled();
    expect(mockDispatchPagination).toHaveBeenCalledWith({
      type: 'SET_CURRENT_PAGE',
      payload: {
        id: 'test-context',
        currentPage: 1
      }
    });
  });

  it('shows active state when tag is selected', () => {
    const { useAtom } = require('jotai');
    useAtom
      .mockReturnValueOnce([null, jest.fn()]) // paginationActionAtom
      .mockReturnValueOnce([[{ name: 'tags', value: 'test-tag' }], jest.fn()]); // displayFilters

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveClass('active');
  });

  it('handles multiple tags correctly', () => {
    const { useAtom } = require('jotai');
    useAtom
      .mockReturnValueOnce([null, jest.fn()]) // paginationActionAtom
      .mockReturnValueOnce([
        [{ name: 'tags', value: 'tag1,tag2,test-tag' }],
        jest.fn()
      ]); // displayFilters

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveClass('active');
  });

  it('handles contextId correctly', () => {
    const { getDisplayFiltersAtom } = require('../../../lib/state/atoms');

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    expect(getDisplayFiltersAtom).toHaveBeenCalledWith('test-context');
  });

  it('handles appendSearchParam prop correctly', () => {
    const mockRouter = { push: jest.fn() };
    const { useRouter } = require('next/navigation');
    useRouter.mockReturnValue(mockRouter);

    const { useAtom } = require('jotai');
    useAtom
      .mockReturnValueOnce([null, jest.fn()]) // paginationActionAtom
      .mockReturnValueOnce([[], jest.fn()]); // displayFilters

    render(
      <Provider>
        <TagLink {...defaultProps} appendSearchParam={true} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    fireEvent.click(tagLink);

    expect(mockRouter.push).toHaveBeenCalledWith('?tags=test-tag&page=1');
  });
});
