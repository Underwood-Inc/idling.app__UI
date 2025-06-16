import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import SubmissionsList from './SubmissionsList';

// Mock the useSubmissionsManager hook
jest.mock('../../../lib/state/useSubmissionsManager', () => ({
  useSubmissionsManager: jest.fn().mockReturnValue({
    loading: false,
    submissions: [],
    pagination: { totalRecords: 0, pageSize: 10, currentPage: 1 },
    error: null,
    setPage: jest.fn(),
    setPageSize: jest.fn(),
    addFilter: jest.fn(),
    removeFilter: jest.fn(),
    clearFilters: jest.fn(),
    hasFilters: false,
    isInitialized: true
  })
}));

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

describe('SubmissionsList', () => {
  const defaultProps = {
    contextId: 'test-context',
    onlyMine: false,
    providerAccountId: 'test-user-id',
    initialSubmissions: { submissions: [], totalCount: 0 }
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
    const onlyMineProps = {
      ...defaultProps,
      onlyMine: true
    };

    render(
      <Provider>
        <SubmissionsList {...onlyMineProps} />
      </Provider>
    );

    expect(screen.getByText('No submissions found')).toBeInTheDocument();
  });

  it('renders with initial submissions', () => {
    const {
      useSubmissionsManager
    } = require('../../../lib/state/useSubmissionsManager');
    useSubmissionsManager.mockReturnValue({
      loading: false,
      submissions: [
        {
          submission_id: 1,
          submission_name: 'Test Submission',
          submission_datetime: new Date(),
          author_id: 'test-user',
          author: 'Test User',
          thread_parent_id: null,
          tags: ['test']
        }
      ],
      pagination: { totalRecords: 1, pageSize: 10, currentPage: 1 },
      error: null,
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      clearFilters: jest.fn(),
      hasFilters: false,
      isInitialized: true
    });

    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Test Submission')).toBeInTheDocument();
  });

  it('renders empty state when no submissions', () => {
    const {
      useSubmissionsManager
    } = require('../../../lib/state/useSubmissionsManager');
    useSubmissionsManager.mockReturnValue({
      loading: false,
      submissions: [],
      pagination: { totalRecords: 0, pageSize: 10, currentPage: 1 },
      error: null,
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      clearFilters: jest.fn(),
      hasFilters: false,
      isInitialized: true
    });

    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('No submissions found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const {
      useSubmissionsManager
    } = require('../../../lib/state/useSubmissionsManager');
    useSubmissionsManager.mockReturnValue({
      loading: true,
      submissions: [],
      pagination: null,
      error: null,
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      clearFilters: jest.fn(),
      hasFilters: false,
      isInitialized: false
    });

    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const {
      useSubmissionsManager
    } = require('../../../lib/state/useSubmissionsManager');
    useSubmissionsManager.mockReturnValue({
      loading: false,
      submissions: [],
      pagination: null,
      error: 'Failed to load submissions',
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      clearFilters: jest.fn(),
      hasFilters: false,
      isInitialized: true
    });

    render(
      <Provider>
        <SubmissionsList {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Failed to load submissions')).toBeInTheDocument();
  });
});
