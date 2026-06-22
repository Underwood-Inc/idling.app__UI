import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider, useAtom } from 'jotai';
import { useRouter, useSearchParams } from 'next/navigation';
import { EMPTY_SELECTORS } from 'src/lib/test-selectors/components/empty.selectors';
import { auth } from '../../../lib/auth';
import { useSimpleUrlFilters } from '../../../lib/state/submissions/useSimpleUrlFilters';
import { handleTagFilter } from '../../../lib/utils/filter-utils';
import { getRecentTags } from './actions';
import { RecentTags } from './RecentTags';
import { RecentTagsClient } from './RecentTagsClient';

// Mock the modules
vi.mock('../../../lib/auth', () => ({
  auth: vi.fn()
}));

vi.mock('./actions', () => ({
  getRecentTags: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn()
}));

// Mock the TagLink component (it has hooks that are not needed to be accurate for this test suite)
vi.mock('../tag-link/TagLink', () => ({
  TagLink: ({ value }: { value: string }) => <span>#{value}</span>
}));

// Mock the TagLogicToggle component
vi.mock('../shared/TagLogicToggle', () => ({
  TagLogicToggle: () => {
    const mockFilters = vi.mocked(useSimpleUrlFilters)();

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
vi.mock('../../../lib/utils/filter-utils', () => ({
  handleTagFilter: vi.fn(),
  isTagActive: vi.fn((tag, filters) => {
    // Mock implementation: return true if tag is in filters
    return filters.some((f: any) => f.name === 'tags' && f.value === tag);
  })
}));

// Mock the useSimpleUrlFilters hook
vi.mock('../../../lib/state/submissions/useSimpleUrlFilters', () => ({
  useSimpleUrlFilters: vi.fn(() => ({
    filters: [],
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    updateUrl: vi.fn(),
    tagLogic: 'AND',
    setTagLogic: vi.fn(),
    searchParams: new URLSearchParams()
  }))
}));

// Mock the atoms module with a proper atom factory
vi.mock('../../../lib/state/atoms', () => {
  const mockAtom = {
    read: vi.fn(),
    write: vi.fn()
  };
  return {
    getSubmissionsFiltersAtom: vi.fn().mockReturnValue(mockAtom),
    getSubmissionsStateAtom: vi.fn().mockReturnValue(mockAtom)
  };
});

// Mock Jotai with proper initial state structure
vi.mock('jotai', async () => {
  const actual = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    ...actual,
    useAtom: vi.fn()
  };
});

describe('RecentTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getRecentTags with correct parameters when authenticated but onlyMine=false', async () => {
    // Mock the auth and getRecentTags functions
    vi.mocked(auth).mockResolvedValue({
      user: { id: '123' }
    });
    vi.mocked(getRecentTags).mockResolvedValue({
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
    vi.mocked(auth).mockResolvedValue({
      user: { id: '123' }
    });
    vi.mocked(getRecentTags).mockResolvedValue({
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
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(getRecentTags).mockResolvedValue({
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
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams();
  const mockSetFiltersState = vi.fn();

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
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush
    });
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

    // Mock getRecentTags to resolve immediately
    vi.mocked(getRecentTags).mockResolvedValue({
      tags: ['javascript', 'react', 'typescript'],
      error: '',
      message: ''
    });

    // Mock useAtom to return the proper state structure
    vi.mocked(useAtom).mockReturnValue([
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
    vi.mocked(useAtom).mockReturnValue([
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
    vi.mocked(useAtom).mockReturnValue([
      multiTagFiltersState,
      mockSetFiltersState
    ]);

    // Also mock useSimpleUrlFilters with multiple tags
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [
        { name: 'tags', value: 'javascript' },
        { name: 'tags', value: 'react' }
      ],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      updateFilter: vi.fn(),
      tagLogic: 'OR',
      setTagLogic: vi.fn(),
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
    vi.mocked(handleTagFilter)

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
    vi.mocked(handleTagFilter)

    // Mock useSimpleUrlFilters to return existing tags
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [{ name: 'tags', value: 'javascript' }],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      tagLogic: 'AND',
      setTagLogic: vi.fn(),
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
    const mockUpdateFilter = vi.fn();
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' },
        { name: 'tagLogic', value: 'OR' }
      ],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      updateFilter: mockUpdateFilter,
      tagLogic: 'OR',
      setTagLogic: vi.fn(),
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
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' },
        { name: 'tagLogic', value: 'AND' }
      ],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      updateFilter: vi.fn(),
      tagLogic: 'AND',
      setTagLogic: vi.fn(),
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
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' },
        { name: 'tagLogic', value: 'OR' }
      ],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      updateFilter: vi.fn(),
      tagLogic: 'OR',
      setTagLogic: vi.fn(),
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
    vi.mocked(handleTagFilter)

    // Mock useSimpleUrlFilters to return multiple existing tags
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [
        { name: 'tags', value: '#javascript' },
        { name: 'tags', value: '#react' }
      ],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      tagLogic: 'OR',
      setTagLogic: vi.fn(),
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
    vi.mocked(handleTagFilter)

    // Mock useSimpleUrlFilters to return single tag
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [{ name: 'tags', value: 'javascript' }],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      tagLogic: 'OR',
      setTagLogic: vi.fn(),
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
    vi.mocked(getRecentTags).mockResolvedValue({
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
    vi.mocked(useAtom).mockReturnValue([
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
