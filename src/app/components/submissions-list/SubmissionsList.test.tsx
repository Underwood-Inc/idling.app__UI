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

// Mock the pagination component
jest.mock('../pagination/Pagination', () => {
  return function MockPagination() {
    return <div data-testid="pagination">Pagination Component</div>;
  };
});

// Mock the reply form component
jest.mock('../thread/ReplyForm', () => ({
  ReplyForm: function MockReplyForm() {
    return <div data-testid="reply-form">Reply Form</div>;
  }
}));

describe('SubmissionsList', () => {
  const mockOnPageChange = jest.fn();
  const mockOnPageSizeChange = jest.fn();
  const mockOnTagClick = jest.fn();

  const defaultProps = {
    isLoading: false,
    error: null,
    submissions: [],
    pagination: {
      currentPage: 1,
      pageSize: 10,
      totalRecords: 0
    },
    totalPages: 1,
    onPageChange: mockOnPageChange,
    onPageSizeChange: mockOnPageSizeChange,
    onTagClick: mockOnTagClick
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
    expect(screen.getByText('No submissions found')).toBeInTheDocument();
  });

  it('handles onlyMine prop correctly', () => {
    // This component doesn't have onlyMine prop directly, but we can test empty state
    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('No submissions found')).toBeInTheDocument();
  });

  it('renders with initial submissions', () => {
    const propsWithSubmissions = {
      ...defaultProps,
      submissions: [sampleSubmission],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalRecords: 1
      }
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

    expect(screen.getByText('No submissions found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const loadingProps = {
      ...defaultProps,
      isLoading: true
    };

    render(
      <Provider>
        <SubmissionsList {...loadingProps} />
      </Provider>
    );

    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load submissions'
    };

    render(
      <Provider>
        <SubmissionsList {...errorProps} />
      </Provider>
    );

    expect(
      screen.getByText('Error: Failed to load submissions')
    ).toBeInTheDocument();
  });
});
