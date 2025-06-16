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
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: () => '/test'
}));

// Mock useSubmissionsManager to avoid next-auth import issues
jest.mock('../../../lib/state/useSubmissionsManager', () => ({
  useSubmissionsManager: jest.fn().mockReturnValue({
    addFilter: jest.fn(),
    removeFilter: jest.fn(),
    clearFilters: jest.fn()
  })
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
    const mockAddFilter = jest.fn();
    const {
      useSubmissionsManager
    } = require('../../../lib/state/useSubmissionsManager');

    useSubmissionsManager.mockReturnValue({
      addFilter: mockAddFilter,
      removeFilter: jest.fn(),
      clearFilters: jest.fn()
    });

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    fireEvent.click(tagLink);

    expect(mockAddFilter).toHaveBeenCalledWith({
      name: 'tags',
      value: 'test-tag'
    });
  });

  it('shows active state when tag is selected', () => {
    // Mock useSearchParams to return tags that include our test tag
    const mockSearchParams = new URLSearchParams('tags=test-tag,other-tag');
    const { useSearchParams } = require('next/navigation');
    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveClass('active');
  });

  it('handles multiple tags correctly', () => {
    // Mock useSearchParams to return multiple tags including our test tag
    const mockSearchParams = new URLSearchParams('tags=tag1,tag2,test-tag');
    const { useSearchParams } = require('next/navigation');
    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveClass('active');
  });

  it('handles contextId correctly', () => {
    const {
      useSubmissionsManager
    } = require('../../../lib/state/useSubmissionsManager');

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    expect(useSubmissionsManager).toHaveBeenCalledWith({
      contextId: 'test-context'
    });
  });

  it('handles onTagClick callback correctly', () => {
    const mockOnTagClick = jest.fn();

    render(
      <Provider>
        <TagLink {...defaultProps} onTagClick={mockOnTagClick} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    fireEvent.click(tagLink);

    expect(mockOnTagClick).toHaveBeenCalledWith('test-tag');
  });
});
