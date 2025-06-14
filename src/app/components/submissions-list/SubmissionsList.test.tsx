import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import SubmissionsList from './SubmissionsList';

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => ({
    get: jest.fn()
  })
}));
const mockDispatchPagination = jest.fn();
jest.mock('../../../lib/state/PaginationContext', () => ({
  usePagination: () => ({
    state: { default: { currentPage: 1, pageSize: 10, totalPages: 1 } },
    dispatch: mockDispatchPagination
  }),
  PageSize: { TEN: 10 }
}));

jest.mock('../../../lib/auth', () => ({
  auth: jest.fn()
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  default: () => ({
    auth: jest.fn(),
    handlers: {
      GET: jest.fn(),
      POST: jest.fn()
    },
    signIn: jest.fn(),
    signOut: jest.fn()
  })
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' }))
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

// Mock the getSubmissionsAction
jest.mock('./actions', () => ({
  getSubmissionsAction: jest.fn()
}));

// Mock FiltersProvider
jest.mock('../../../lib/state/FiltersContext', () => ({
  useFilters: () => ({
    state: { default: { filters: [] } },
    dispatch: jest.fn()
  })
}));

// Mock PaginationProvider
jest.mock('../../../lib/state/PaginationContext', () => ({
  usePagination: () => ({
    state: { default: { currentPage: 1, pageSize: 10, totalPages: 1 } },
    dispatch: mockDispatchPagination
  }),
  PageSize: { TEN: 10 }
}));

// Mock ShouldUpdateProvider
jest.mock('../../../lib/state/ShouldUpdateContext', () => ({
  useShouldUpdate: () => ({
    state: false,
    dispatch: jest.fn()
  })
}));

// Mock Empty component
jest.mock('../empty/Empty', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-component">No posts to show</div>
}));

// Mock FadeIn component
jest.mock('../fade-in/FadeIn', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="fade-in">{children}</div>
  )
}));

// Mock Loader component
jest.mock('../loader/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loading...</div>
}));

// Mock Pagination component
jest.mock('../pagination/Pagination', () => ({
  __esModule: true,
  default: () => <div data-testid="pagination">Pagination</div>
}));

// Mock DeleteSubmissionForm component
jest.mock(
  '../submission-forms/delete-submission-form/DeleteSubmissionForm',
  () => ({
    DeleteSubmissionForm: () => <button>Delete</button>
  })
);

// Mock TagLink component
jest.mock('../tag-link/TagLink', () => ({
  TagLink: ({ value }: { value: string }) => <span>{value}</span>
}));

// Mock useEffect to run immediately
jest.spyOn(React, 'useEffect').mockImplementation((f) => f());

// Mock useState to allow manual state updates in tests
const mockSetState = jest.fn();
const mockUseState = jest.spyOn(React, 'useState');

const mockSubmissions = [
  {
    submission_id: '1',
    submission_name: 'Test Submission 1',
    author: 'Test Author 1',
    author_id: 'author1',
    submission_datetime: '2023-01-01T00:00:00Z'
  },
  {
    submission_id: '2',
    submission_name: 'Test Submission 2',
    author: 'Test Author 2',
    author_id: 'author2',
    submission_datetime: '2023-01-02T00:00:00Z'
  }
];

describe('SubmissionsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getSubmissionsAction } = require('./actions');
    getSubmissionsAction.mockResolvedValue({
      data: {
        result: mockSubmissions,
        pagination: {
          totalRecords: 2,
          currentPage: 1,
          pageSize: 10
        }
      }
    });

    // Mock the useState hook to return non-loading state and mockSubmissions
    // @ts-expect-error
    mockUseState.mockImplementation((initialState) => {
      if (typeof initialState === 'boolean') {
        return [false, mockSetState]; // loading state
      }
      return [
        {
          data: {
            result: mockSubmissions,
            pagination: {
              totalRecords: 2,
              currentPage: 1,
              pageSize: 10
            }
          }
        },
        mockSetState
      ]; // response state
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <SubmissionsList
        contextId="test"
        providerAccountId="testProvider"
        {...props}
      />
    );
  };

  it('renders submissions', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
      expect(screen.getByText('Test Submission 2')).toBeInTheDocument();
    });
  });

  it('renders empty state when no submissions', async () => {
    // @ts-expect-error
    mockUseState.mockImplementation((initialState) => {
      if (typeof initialState === 'boolean') {
        return [false, mockSetState]; // loading state
      }
      return [
        {
          data: {
            result: [],
            pagination: {
              totalRecords: 0,
              currentPage: 1,
              pageSize: 10
            }
          }
        },
        mockSetState
      ]; // response state
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('empty-component')).toBeInTheDocument();
    });
  });

  it('shows delete button for authorized submissions', async () => {
    renderComponent({ providerAccountId: 'author1' });

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(1);
    });
  });

  it('updates pagination when requested page is greater than total pages', async () => {
    // Mock the useState hook to return a response with fewer total records
    // @ts-expect-error
    mockUseState.mockImplementation((initialState) => {
      if (typeof initialState === 'boolean') {
        return [false, mockSetState]; // loading state
      }
      return [
        {
          data: {
            result: mockSubmissions.slice(0, 1), // Only one submission
            pagination: {
              totalRecords: 1,
              currentPage: 2, // Requested page is 2
              pageSize: 10
            }
          }
        },
        mockSetState
      ]; // response state
    });

    renderComponent();

    await waitFor(() => {
      expect(mockDispatchPagination).toHaveBeenCalledWith({
        type: 'SET_CURRENT_PAGE',
        payload: {
          id: 'test',
          currentPage: 1 // Should be set to the last available page (1 in this case)
        }
      });
    });
  });

  it('updates pagination when requested page is less than 1', async () => {
    // Mock the useState hook to return a response with a page number less than 1
    // @ts-expect-error
    mockUseState.mockImplementation((initialState) => {
      if (typeof initialState === 'boolean') {
        return [false, mockSetState]; // loading state
      }
      return [
        {
          data: {
            result: mockSubmissions,
            pagination: {
              totalRecords: 2,
              currentPage: 0, // Requested page is 0 (less than 1)
              pageSize: 10
            }
          }
        },
        mockSetState
      ]; // response state
    });

    renderComponent();

    await waitFor(() => {
      expect(mockDispatchPagination).toHaveBeenCalledWith({
        type: 'SET_CURRENT_PAGE',
        payload: {
          id: 'test',
          currentPage: 1 // Should be set to the first page (1)
        }
      });
    });
  });
});
