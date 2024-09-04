import { render, screen } from '@testing-library/react';
import { EMPTY_SELECTORS } from 'src/lib/test-selectors/components/empty.selectors';
import { LOADER_SELECTORS } from 'src/lib/test-selectors/components/loader.selectors';
import { RECENT_TAGS_SELECTORS } from 'src/lib/test-selectors/components/recent-tags.selectors';
import { auth } from '../../../lib/auth';
import { getRecentTags } from './actions';
import { RecentTags, RecentTagsLoader } from './RecentTags';

// Mock the modules
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn()
}));

jest.mock('./actions', () => ({
  getRecentTags: jest.fn()
}));

// Mock the TagLink component (it has hooks that are not needed to be accurate for this test suite)
jest.mock('../tag-link/TagLink', () => ({
  TagLink: ({ value }: { value: string }) => <span>#{value}</span>
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

    // Render the component
    const RecentTagsComponent = await RecentTags({ contextId: 'test' });
    render(RecentTagsComponent);

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

    // Render the component
    const RecentTagsComponent = await RecentTags({ contextId: 'test' });
    render(RecentTagsComponent);

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
    render(RecentTagsComponent);

    expect(screen.getByTestId(RECENT_TAGS_SELECTORS.TITLE)).toHaveTextContent(
      'Recent Tags'
    );
    expect(screen.getAllByText(/^#userTag/)).toHaveLength(2);
    expect(getRecentTags).toHaveBeenCalledWith('months', '123');
  });
});

describe('RecentTagsLoader', () => {
  it('renders loader component', () => {
    render(<RecentTagsLoader />);

    expect(screen.getByText('Recent Tags (3 months)')).toBeInTheDocument();
    expect(screen.getByTestId(LOADER_SELECTORS.LOADER)).toBeInTheDocument();
  });
});
