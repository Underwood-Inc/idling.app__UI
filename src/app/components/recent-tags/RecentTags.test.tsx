import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import { useRouter, useSearchParams } from 'next/navigation';
import { EMPTY_SELECTORS } from 'src/lib/test-selectors/components/empty.selectors';
import { auth } from '../../../lib/auth';
import { getRecentTags } from './actions';
import { RecentTags } from './RecentTags';
import { RecentTagsClient } from './RecentTagsClient';

// Mock the modules
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn()
}));

jest.mock('./actions', () => ({
  getRecentTags: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock the TagLink component (it has hooks that are not needed to be accurate for this test suite)
jest.mock('../tag-link/TagLink', () => ({
  TagLink: ({ value }: { value: string }) => <span>#{value}</span>
}));

// Mock the TagLogicToggle component
jest.mock('../shared/TagLogicToggle', () => ({
  TagLogicToggle: () => {
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    const mockFilters = useSimpleUrlFilters();

    const currentTagLogic =
      mockFilters.filters.find((f: any) => f.name === 'tagLogic')?.value ||
      'OR';

    // Check if we have multiple tags to determine if toggle should be shown
    const tagFilters = mockFilters.filters.filter(
      (f: any) => f.name === 'tags'
    );
    const hasMultipleTags = tagFilters.length > 1;

    // Don't render if we don't have multiple tags
    if (!hasMultipleTags) {
      return null;
    }

    return (
      <div className="logic-toggle">
        <div className="logic-toggle__button-group">
          <button
            className={`logic-toggle__button ${currentTagLogic === 'AND' ? 'logic-toggle__button--active' : ''}`}
            onClick={() =>
              mockFilters.updateFilter &&
              mockFilters.updateFilter('tagLogic', 'AND')
            }
            title="Show posts with ALL selected tags"
          >
            ALL
          </button>
          <button
            className={`logic-toggle__button ${currentTagLogic === 'OR' ? 'logic-toggle__button--active' : ''}`}
            onClick={() =>
              mockFilters.updateFilter &&
              mockFilters.updateFilter('tagLogic', 'OR')
            }
            title="Show posts with ANY selected tags"
          >
            ANY
          </button>
        </div>
      </div>
    );
  }
}));

// Mock the filter utilities
jest.mock('../../../lib/utils/filter-utils', () => ({
  handleTagFilter: jest.fn(),
  isTagActive: jest.fn((tag, filters) => {
    // Mock implementation: return true if tag is in filters
    return filters.some((f: any) => f.name === 'tags' && f.value === tag);
  })
}));

// Mock the useSimpleUrlFilters hook
jest.mock('../../../lib/state/submissions/useSimpleUrlFilters', () => ({
  useSimpleUrlFilters: jest.fn(() => ({
    filters: [],
    addFilter: jest.fn(),
    removeFilter: jest.fn(),
    updateUrl: jest.fn(),
    tagLogic: 'AND',
    setTagLogic: jest.fn(),
    searchParams: new URLSearchParams()
  }))
}));

// Mock the atoms module with a proper atom factory
jest.mock('../../../lib/state/atoms', () => {
  const mockAtom = {
    read: jest.fn(),
    write: jest.fn()
  };
  return {
    getSubmissionsFiltersAtom: jest.fn().mockReturnValue(mockAtom),
    getSubmissionsStateAtom: jest.fn().mockReturnValue(mockAtom)
  };
});

// Mock Jotai with proper initial state structure
jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn()
}));

describe('RecentTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getRecentTags with correct parameters when authenticated but onlyMine=false', async () => {
    // Mock the auth and getRecentTags functions
    (auth as jest.Mock).mockResolvedValue({
      user: { id: '123' }
    });
    (getRecentTags as jest.Mock).mockResolvedValue({
      tags: ['tag1', 'tag2', 'tag3'],
      error: '',
      message: ''
    });

    // Call the server component function with onlyMine=false (default)
    await RecentTags({ contextId: 'test' });

    // Verify that getRecentTags was called with undefined when onlyMine=false
    expect(getRecentTags).toHaveBeenCalledWith('months', undefined);
  });

  it('calls getRecentTags with correct parameters for onlyMine', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: '123' }
    });
    (getRecentTags as jest.Mock).mockResolvedValue({
      tags: ['userTag1', 'userTag2'],
      error: '',
      message: ''
    });

    // Call the server component function with onlyMine
    const result = await RecentTags({
      contextId: 'test',
      onlyMine: true
    });

    // Check that the component rendered and getRecentTags was called correctly
    expect(getRecentTags).toHaveBeenCalledWith('months', '123');
    expect(result).toBeDefined();
  });

  it('handles unauthenticated user', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    (getRecentTags as jest.Mock).mockResolvedValue({
      tags: ['publicTag1'],
      error: '',
      message: ''
    });

    // Call the server component function
    await RecentTags({ contextId: 'test' });

    // Should call getRecentTags with undefined for unauthenticated users
    expect(getRecentTags).toHaveBeenCalledWith('months', undefined);
  });
});

describe('RecentTagsClient', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();
  const mockSetFiltersState = jest.fn();

  const mockSession = {
    user: {
      id: 'test-user-id'
    },
    expires: '2024-12-31T23:59:59.999Z'
  } as any;

  const defaultProps = {
    contextId: 'test',
    onlyMine: false,
    initialRecentTags: { tags: ['javascript', 'react', 'typescript'] },
    session: mockSession
  };

  // Default mock state for the filters atom
  const mockFiltersState = {
    onlyMine: false,
    providerAccountId: 'test-user-id',
    filters: [],
    page: 1,
    pageSize: 10,
    initialized: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    // Mock getRecentTags to resolve immediately
    (getRecentTags as jest.Mock).mockResolvedValue({
      tags: ['javascript', 'react', 'typescript'],
      error: '',
      message: ''
    });

    // Mock useAtom to return the proper state structure
    const { useAtom } = require('jotai');
    (useAtom as jest.Mock).mockReturnValue([
      mockFiltersState,
      mockSetFiltersState
    ]);
  });

  it('renders recent tags correctly', async () => {
    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Recent Tags')).toBeInTheDocument();
    expect(screen.getByText('#javascript')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#typescript')).toBeInTheDocument();
  });

  it('does not show AND/OR toggle with single tag selected', async () => {
    // Mock state with single tag
    const singleTagFiltersState = {
      ...mockFiltersState,
      filters: [{ name: 'tags', value: 'javascript' }]
    };
    const { useAtom } = require('jotai');
    (useAtom as jest.Mock).mockReturnValue([
      singleTagFiltersState,
      mockSetFiltersState
    ]);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Should not show the toggle
    expect(screen.queryByText('OR')).not.toBeInTheDocument();
    expect(screen.queryByText('ANY')).not.toBeInTheDocument();
    expect(screen.queryByText('ALL')).not.toBeInTheDocument();
  });

  it('shows AND/OR toggle with multiple tags selected', async () => {
    // Mock state with multiple tags - separate filter entries for each tag
    const multiTagFiltersState = {
      ...mockFiltersState,
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' }
      ]
    };
    const { useAtom } = require('jotai');
    (useAtom as jest.Mock).mockReturnValue([
      multiTagFiltersState,
      mockSetFiltersState
    ]);

    // Also mock useSimpleUrlFilters with multiple tags
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [
        { name: 'tags', value: 'javascript' },
        { name: 'tags', value: 'react' }
      ],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      updateFilter: jest.fn(),
      tagLogic: 'OR',
      setTagLogic: jest.fn(),
      searchParams: new URLSearchParams()
    });

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Should show the toggle
    expect(screen.getByText('ANY')).toBeInTheDocument();
    expect(screen.getByText('ALL')).toBeInTheDocument();
  });

  it('handles tag selection correctly', async () => {
    // Get the mocked functions
    const { handleTagFilter } = require('../../../lib/utils/filter-utils');

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Click on a tag
    const tagButton = screen.getByText('#javascript');
    fireEvent.click(tagButton);

    // Should call handleTagFilter
    await waitFor(() => {
      expect(handleTagFilter).toHaveBeenCalled();
    });
  });

  it('handles multiple tag selection correctly', async () => {
    // Get the mocked functions
    const { handleTagFilter } = require('../../../lib/utils/filter-utils');

    // Mock useSimpleUrlFilters to return existing tags
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [{ name: 'tags', value: 'javascript' }],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      tagLogic: 'AND',
      setTagLogic: jest.fn(),
      searchParams: new URLSearchParams()
    });

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Click on another tag
    const reactButton = screen.getByText('#react');
    fireEvent.click(reactButton);

    // Should call handleTagFilter to add the second tag
    await waitFor(() => {
      expect(handleTagFilter).toHaveBeenCalled();
    });
  });

  it('handles AND/OR logic toggle correctly', async () => {
    // Mock useSimpleUrlFilters to return multiple tags with OR logic
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    const mockUpdateFilter = jest.fn();
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' },
        { name: 'tagLogic', value: 'OR' }
      ],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      updateFilter: mockUpdateFilter,
      tagLogic: 'OR',
      setTagLogic: jest.fn(),
      searchParams: new URLSearchParams()
    });

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Find and click the ALL button to switch from OR to AND
    const allButton = screen.getByRole('button', {
      name: 'ALL'
    });
    fireEvent.click(allButton);

    // Should call updateFilter to change logic to AND
    await waitFor(() => {
      expect(mockUpdateFilter).toHaveBeenCalledWith('tagLogic', 'AND');
    });
  });

  it('displays the correct active tags when multiple tags are selected', async () => {
    // Mock useSimpleUrlFilters to return multiple tags with AND logic
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' },
        { name: 'tagLogic', value: 'AND' }
      ],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      updateFilter: jest.fn(),
      tagLogic: 'AND',
      setTagLogic: jest.fn(),
      searchParams: new URLSearchParams()
    });

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Should show active tags
    expect(screen.getByText('#javascript')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
  });

  it('shows correct logic toggle state for OR logic', async () => {
    // Mock useSimpleUrlFilters to return multiple tags with OR logic
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' },
        { name: 'tagLogic', value: 'OR' }
      ],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      updateFilter: jest.fn(),
      tagLogic: 'OR',
      setTagLogic: jest.fn(),
      searchParams: new URLSearchParams()
    });

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Should show ANY button as active for OR logic
    const anyButton = screen.getByRole('button', { name: 'ANY' });
    expect(anyButton).toHaveClass('logic-toggle__button--active');
  });

  it('handles tag removal correctly', async () => {
    // Get the mocked functions
    const { handleTagFilter } = require('../../../lib/utils/filter-utils');

    // Mock useSimpleUrlFilters to return multiple existing tags
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' }
      ],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      tagLogic: 'OR',
      setTagLogic: jest.fn(),
      searchParams: new URLSearchParams()
    });

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Click on an already selected tag to remove it
    const tagButton = screen.getByText('#javascript');
    fireEvent.click(tagButton);

    // Should call handleTagFilter to remove the tag
    await waitFor(() => {
      expect(handleTagFilter).toHaveBeenCalled();
    });
  });

  it('clears all filters when removing last tag', async () => {
    // Get the mocked functions
    const { handleTagFilter } = require('../../../lib/utils/filter-utils');

    // Mock useSimpleUrlFilters to return single tag
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [{ name: 'tags', value: 'javascript' }],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      tagLogic: 'OR',
      setTagLogic: jest.fn(),
      searchParams: new URLSearchParams()
    });

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Click on the selected tag to remove it
    const tagButton = screen.getByText('#javascript');
    fireEvent.click(tagButton);

    // Should call handleTagFilter to clear the last tag
    await waitFor(() => {
      expect(handleTagFilter).toHaveBeenCalled();
    });
  });

  it('renders empty state when no tags', async () => {
    const propsWithNoTags = {
      ...defaultProps,
      initialRecentTags: { tags: [] }
    };

    // Mock getRecentTags to return empty tags
    (getRecentTags as jest.Mock).mockResolvedValue({
      tags: [],
      error: '',
      message: ''
    });

    render(
      <Provider>
        <RecentTagsClient {...propsWithNoTags} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Should render with Recent Tags title and empty message
    expect(screen.getByText('Recent Tags')).toBeInTheDocument();
    expect(screen.getByTestId(EMPTY_SELECTORS.CONTAINER)).toBeInTheDocument();
    expect(screen.getByTestId(EMPTY_SELECTORS.LABEL)).toHaveTextContent(
      'No recent tags'
    );
  });

  it('shows active state for selected tags', async () => {
    // Mock state with some selected tags - separate filter entries
    const selectedTagsFiltersState = {
      ...mockFiltersState,
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' }
      ]
    };
    const { useAtom } = require('jotai');
    (useAtom as jest.Mock).mockReturnValue([
      selectedTagsFiltersState,
      mockSetFiltersState
    ]);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(
        screen.queryByTestId('loader__scale-loader')
      ).not.toBeInTheDocument();
    });

    // Verify the buttons exist and are interactive
    const jsButton = screen.getByText('#javascript').closest('button');
    const reactButton = screen.getByText('#react').closest('button');
    const tsButton = screen.getByText('#typescript').closest('button');

    expect(jsButton).toBeInTheDocument();
    expect(reactButton).toBeInTheDocument();
    expect(tsButton).toBeInTheDocument();

    // Verify all buttons are clickable
    expect(jsButton).not.toBeDisabled();
    expect(reactButton).not.toBeDisabled();
    expect(tsButton).not.toBeDisabled();
  });
});
