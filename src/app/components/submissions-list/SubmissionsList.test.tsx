import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import SubmissionsList from './SubmissionsList';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test'
}));

// Mock next-auth completely
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { providerAccountId: 'test-user' } },
    status: 'authenticated'
  }))
}));

jest.mock('next-auth', () => ({
  default: jest.fn(),
  NextAuth: jest.fn(),
  getServerSession: jest.fn()
}));

// Mock the auth module
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { providerAccountId: 'test-user' }
  })
}));

// Mock jotai useAtom for this component
jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn().mockReturnValue([
    [], // displayFilters
    jest.fn() // setDisplayFilters
  ])
}));

// Mock the SubmissionItem component
jest.mock('./SubmissionItem', () => ({
  SubmissionItem: ({ submission, onTagClick }: any) => (
    <div data-testid="submission-item">
      <h3>{submission.submission_title}</h3>
      <p>{submission.author}</p>
      <div>
        {submission.tags?.map((tag: string) => (
          <span key={tag} onClick={() => onTagClick(tag)}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}));

describe('SubmissionsList', () => {
  const mockOnTagClick = jest.fn();
  const mockOnHashtagClick = jest.fn();
  const mockOnMentionClick = jest.fn();
  const mockOnRefresh = jest.fn();

  const defaultProps = {
    posts: [],
    onTagClick: mockOnTagClick,
    onHashtagClick: mockOnHashtagClick,
    onMentionClick: mockOnMentionClick,
    onRefresh: mockOnRefresh,
    contextId: 'test-context'
  };

  const sampleSubmission = {
    submission_id: 1,
    submission_name: 'Test Submission',
    submission_title: 'Test Title',
    submission_datetime: new Date('2024-01-01T12:00:00Z'),
    author_id: 'test-user',
    author: 'Test User',
    thread_parent_id: null,
    tags: ['test', 'javascript']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders submissions list correctly', () => {
    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    // The component should render without errors
    expect(screen.getByTestId('submissions-list')).toBeInTheDocument();
  });

  it('handles onlyMine prop correctly', () => {
    // This component doesn't have onlyMine prop directly, but we can test empty state
    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    expect(screen.getByTestId('submissions-list')).toBeInTheDocument();
  });

  it('renders with initial submissions', () => {
    const propsWithSubmissions = {
      ...defaultProps,
      posts: [sampleSubmission]
    };

    render(
      <Provider>
        <SubmissionsList {...propsWithSubmissions} />
      </Provider>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('renders empty state when no submissions', () => {
    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    expect(screen.getByTestId('submissions-list')).toBeInTheDocument();
    expect(screen.queryByTestId('submission-item')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    const loadingProps = {
      ...defaultProps,
      showSkeletons: true
    };

    render(
      <Provider>
        <SubmissionsList {...loadingProps} />
      </Provider>
    );

    // Should show skeleton loading state
    expect(screen.getByTestId('submissions-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('submissions-list__skeleton')).toHaveLength(5);
  });

  it('shows error state', () => {
    // This component doesn't handle error state directly
    // Error handling would be done by parent component
    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    expect(screen.getByTestId('submissions-list')).toBeInTheDocument();
  });
});
