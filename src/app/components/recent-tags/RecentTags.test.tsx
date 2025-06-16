import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import { useRouter, useSearchParams } from 'next/navigation';
import { EMPTY_SELECTORS } from 'src/lib/test-selectors/components/empty.selectors';
import { RECENT_TAGS_SELECTORS } from 'src/lib/test-selectors/components/recent-tags.selectors';
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

// Mock Jotai atoms instead of old context hooks
jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn().mockReturnValue([false, jest.fn()])
}));

describe('RecentTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recent tags when available', async () => {
    // Mock the auth and getRecentTags functions
    (auth as jest.Mock).mockResolvedValue({
      user: { providerAccountId: '123' }
    });
    (getRecentTags as jest.Mock).mockResolvedValue({
      tags: ['tag1', 'tag2', 'tag3'],
      error: '',
      message: ''
    });

    // Render the component wrapped in JotaiProvider
    const RecentTagsComponent = await RecentTags({ contextId: 'test' });
    render(<Provider>{RecentTagsComponent}</Provider>);

    // Check if the component renders correctly
    expect(screen.getByTestId(RECENT_TAGS_SELECTORS.TITLE)).toHaveTextContent(
      'Recent Tags'
    );
    expect(screen.getAllByText(/^#tag/)).toHaveLength(3);
  });

  it('renders empty state when no tags are available', async () => {
    // Mock the auth and getRecentTags functions
    (auth as jest.Mock).mockResolvedValue({
      user: { providerAccountId: '123' }
    });
    (getRecentTags as jest.Mock).mockResolvedValue({
      tags: [],
      error: '',
      message: ''
    });

    // Render the component wrapped in JotaiProvider
    const RecentTagsComponent = await RecentTags({ contextId: 'test' });
    render(<Provider>{RecentTagsComponent}</Provider>);

    // Check if the component renders the empty state
    expect(screen.getByTestId(RECENT_TAGS_SELECTORS.TITLE)).toHaveTextContent(
      'Recent Tags'
    );
    expect(screen.getByTestId(EMPTY_SELECTORS.CONTAINER)).toBeInTheDocument();
  });

  it('renders only user tags when onlyMine is true', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { providerAccountId: '123' }
    });
    (getRecentTags as jest.Mock).mockResolvedValue({
      tags: ['userTag1', 'userTag2'],
      error: '',
      message: ''
    });

    const RecentTagsComponent = await RecentTags({
      contextId: 'test',
      onlyMine: true
    });
    render(<Provider>{RecentTagsComponent}</Provider>);

    expect(screen.getByTestId(RECENT_TAGS_SELECTORS.TITLE)).toHaveTextContent(
      'Recent Tags'
    );
    expect(screen.getAllByText(/^#userTag/)).toHaveLength(2);
    expect(getRecentTags).toHaveBeenCalledWith('months', '123');
  });
});

describe('RecentTagsClient', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  const mockSession = {
    user: {
      providerAccountId: 'test-user-id'
    },
    expires: '2024-12-31T23:59:59.999Z'
  } as any;

  const defaultProps = {
    contextId: 'test',
    onlyMine: false,
    initialRecentTags: { tags: ['#javascript', '#react', '#typescript'] },
    session: mockSession
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders recent tags correctly', () => {
    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Recent Tags')).toBeInTheDocument();
    expect(screen.getByText('#javascript')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#typescript')).toBeInTheDocument();
  });

  it('does not show AND/OR toggle with single tag selected', () => {
    // Mock URL with single tag
    const singleTagParams = new URLSearchParams('tags=%23javascript');
    (useSearchParams as jest.Mock).mockReturnValue(singleTagParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Should not show the toggle
    expect(screen.queryByText('ANY')).not.toBeInTheDocument();
    expect(screen.queryByText('ALL')).not.toBeInTheDocument();
  });

  it('shows AND/OR toggle with multiple tags selected', () => {
    // Mock URL with multiple tags
    const multiTagParams = new URLSearchParams('tags=%23javascript,%23react');
    (useSearchParams as jest.Mock).mockReturnValue(multiTagParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Should show the toggle
    expect(screen.getByText('ANY')).toBeInTheDocument();
    expect(screen.getByText('ALL')).toBeInTheDocument();
  });

  it('handles tag selection correctly', async () => {
    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Click on a tag
    const tagButton = screen.getByText('#javascript');
    fireEvent.click(tagButton);

    // Should call router.push with the tag
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('?tags=%23javascript&page=1');
    });
  });

  it('handles multiple tag selection correctly', async () => {
    // Start with one tag selected
    const oneTagParams = new URLSearchParams('tags=%23javascript');
    (useSearchParams as jest.Mock).mockReturnValue(oneTagParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Click on another tag
    const reactButton = screen.getByText('#react');
    fireEvent.click(reactButton);

    // Should call router.push with both tags and default OR logic
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '?tags=%23javascript,%23react&tagLogic=OR&page=1'
      );
    });
  });

  it('handles AND/OR logic toggle correctly', async () => {
    // Mock URL with multiple tags
    const multiTagParams = new URLSearchParams(
      'tags=%23javascript,%23react&tagLogic=OR'
    );
    (useSearchParams as jest.Mock).mockReturnValue(multiTagParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Find and click the toggle slider
    const toggleSlider = screen.getByRole('button', {
      name: /Switch to AND logic/
    });
    fireEvent.click(toggleSlider);

    // Should call router.push with AND logic
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '?tags=%23javascript,%23react&tagLogic=AND&page=1'
      );
    });
  });

  it('updates smart title based on selected tags and logic', () => {
    // Mock URL with multiple tags and AND logic
    const andLogicParams = new URLSearchParams(
      'tags=%23javascript,%23react&tagLogic=AND'
    );
    (useSearchParams as jest.Mock).mockReturnValue(andLogicParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Should show smart title with "all of"
    expect(
      screen.getByText(/Posts with all of: #javascript, #react/)
    ).toBeInTheDocument();
  });

  it('updates smart title for OR logic', () => {
    // Mock URL with multiple tags and OR logic
    const orLogicParams = new URLSearchParams(
      'tags=%23javascript,%23react&tagLogic=OR'
    );
    (useSearchParams as jest.Mock).mockReturnValue(orLogicParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Should show smart title with "any of"
    expect(
      screen.getByText(/Posts with any of: #javascript, #react/)
    ).toBeInTheDocument();
  });

  it('handles tag removal correctly', async () => {
    // Mock URL with multiple tags
    const multiTagParams = new URLSearchParams('tags=%23javascript,%23react');
    (useSearchParams as jest.Mock).mockReturnValue(multiTagParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Click on an already selected tag to remove it
    const tagButton = screen.getByText('#javascript');
    fireEvent.click(tagButton);

    // Should call router.push with only the remaining tag (no tagLogic for single tag)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('?tags=%23react&page=1');
    });
  });

  it('clears all filters when removing last tag', async () => {
    // Mock URL with single tag
    const singleTagParams = new URLSearchParams('tags=%23javascript');
    (useSearchParams as jest.Mock).mockReturnValue(singleTagParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Click on the selected tag to remove it
    const tagButton = screen.getByText('#javascript');
    fireEvent.click(tagButton);

    // Should call router.push with no parameters (clear all)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/.*$/)); // Should be pathname only
    });
  });

  it('renders empty state when no tags', () => {
    const propsWithNoTags = {
      ...defaultProps,
      initialRecentTags: { tags: [] }
    };

    const { container } = render(
      <Provider>
        <RecentTagsClient {...propsWithNoTags} />
      </Provider>
    );

    // Should not render anything when no tags
    expect(container.firstChild).toBeNull();
  });

  it('shows active state for selected tags', () => {
    // Mock URL with selected tags
    const selectedTagParams = new URLSearchParams(
      'tags=%23javascript,%23react'
    );
    (useSearchParams as jest.Mock).mockReturnValue(selectedTagParams);

    render(
      <Provider>
        <RecentTagsClient {...defaultProps} />
      </Provider>
    );

    // Selected tags should have active class and checkmark
    const jsButton = screen.getByText('#javascript').closest('button');
    const reactButton = screen.getByText('#react').closest('button');
    const tsButton = screen.getByText('#typescript').closest('button');

    expect(jsButton).toHaveClass('active');
    expect(reactButton).toHaveClass('active');
    expect(tsButton).not.toHaveClass('active');

    // Should show checkmarks for active tags
    expect(screen.getAllByText('✓')).toHaveLength(2);
  });
});
