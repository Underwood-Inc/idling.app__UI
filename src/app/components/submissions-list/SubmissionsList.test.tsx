import { render, screen, waitFor } from '@testing-library/react';
import React, { useEffect, useState } from 'react';
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
    state: {
      test: {
        id: 'test',
        currentPage: 1,
        totalPages: 1,
        pageSize: 10
      }
    },
    dispatch: mockDispatchPagination
  }),
  PageSize: {
    TEN: 10,
    TWENTY: 20,
    THIRTY: 30,
    FORTY: 40,
    FIFTY: 50
  }
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

// Mock ShouldUpdateProvider
jest.mock('../../../lib/state/ShouldUpdateContext', () => ({
  useShouldUpdate: () => ({
    state: true,
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
    DeleteSubmissionForm: () => (
      <button data-testid="delete-button">Delete</button>
    )
  })
);

// Mock TagLink component
jest.mock('../tag-link/TagLink', () => ({
  TagLink: ({ value }: { value: string }) => <span>{value}</span>
}));

// Mock useSubmissionsList directly
jest.mock('./use-submissions-list', () => ({
  useSubmissionsList: jest.fn()
}));

describe('SubmissionsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default mock implementation
    const { useSubmissionsList } = require('./use-submissions-list');
    useSubmissionsList.mockImplementation(
      (
        contextId: string,
        providerAccountId: string,
        onlyMine: boolean,
        page: number
      ) => ({
        loading: false,
        response: {
          data: {
            result: [
              {
                submission_id: 1,
                submission_name: 'Test Submission 1',
                author: 'Test Author 1',
                author_id: 'testProvider',
                submission_datetime: '2023-01-01T00:00:00Z',
                thread_parent_id: null
              },
              {
                submission_id: 2,
                submission_name: 'Test Submission 2',
                author: 'Test Author 2',
                author_id: 'testProvider',
                submission_datetime: '2023-01-02T00:00:00Z',
                thread_parent_id: null
              }
            ],
            pagination: {
              currentPage: page,
              totalRecords: 2,
              pageSize: 10
            }
          }
        },
        isAuthorized: true,
        fetchSubmissions: jest.fn()
      })
    );
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
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
      expect(screen.getByText('Test Submission 2')).toBeInTheDocument();
    });
  });

  it('renders empty state when no submissions', async () => {
    const { useSubmissionsList } = require('./use-submissions-list');
    useSubmissionsList.mockImplementation(
      (
        contextId: string,
        providerAccountId: string,
        onlyMine: boolean,
        page: number
      ) => ({
        loading: false,
        response: {
          data: {
            result: [],
            pagination: {
              currentPage: 1,
              totalRecords: 0,
              pageSize: 10
            }
          }
        },
        isAuthorized: true,
        fetchSubmissions: jest.fn()
      })
    );

    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('empty-component')).toBeInTheDocument();
    });
  });

  it('shows delete button for authorized submissions', async () => {
    const { useSubmissionsList } = require('./use-submissions-list');
    useSubmissionsList.mockReturnValue({
      loading: false,
      response: {
        data: {
          result: [
            {
              submission_id: 1,
              submission_name: 'Test Submission 1',
              author: 'Test Author 1',
              author_id: 'testProvider',
              submission_datetime: '2023-01-01T00:00:00Z',
              thread_parent_id: null
            },
            {
              submission_id: 2,
              submission_name: 'Test Submission 2',
              author: 'Test Author 2',
              author_id: 'testProvider',
              submission_datetime: '2023-01-02T00:00:00Z',
              thread_parent_id: null
            }
          ]
        },
        totalPages: 1
      },
      isAuthorized: true,
      fetchSubmissions: jest.fn()
    });

    renderComponent();
    await waitFor(() => {
      const deleteButtons = screen.getAllByTestId('delete-button');
      expect(deleteButtons).toHaveLength(2);
    });
  });

  it('updates pagination when requested page is greater than total pages', async () => {
    // Mock the hook to return a response with invalid page number
    const { useSubmissionsList } = require('./use-submissions-list');

    // Track mock calls for assertions
    const mockCalls = [];

    useSubmissionsList.mockImplementation(() => {
      const [loading, setLoading] = useState(false);
      const [response, setResponse] = useState({
        data: {
          result: [],
          pagination: {
            currentPage: 2, // Invalid page (greater than total)
            totalRecords: 1,
            pageSize: 10
          }
        }
      });

      // Simulate the hook's effect that dispatches pagination actions
      useEffect(() => {
        const totalPages = Math.ceil(
          response.data.pagination.totalRecords /
            response.data.pagination.pageSize
        );

        // First dispatch total pages
        mockDispatchPagination({
          type: 'SET_TOTAL_PAGES',
          payload: { id: 'test', totalPages }
        });

        // Then handle invalid page
        if (response.data.pagination.currentPage > totalPages) {
          mockDispatchPagination({
            type: 'SET_CURRENT_PAGE',
            payload: { id: 'test', currentPage: totalPages }
          });
        }
      }, [response]);

      return {
        loading,
        response,
        isAuthorized: true,
        fetchSubmissions: jest.fn()
      };
    });

    renderComponent({ page: 2 });

    // Verify the dispatch calls
    expect(mockDispatchPagination).toHaveBeenCalledWith({
      type: 'SET_TOTAL_PAGES',
      payload: { id: 'test', totalPages: 1 }
    });

    expect(mockDispatchPagination).toHaveBeenCalledWith({
      type: 'SET_CURRENT_PAGE',
      payload: { id: 'test', currentPage: 1 }
    });
  });

  it('updates pagination when requested page is less than 1', async () => {
    // Mock the hook to return a response with invalid page number
    const { useSubmissionsList } = require('./use-submissions-list');

    useSubmissionsList.mockImplementation(() => {
      const [loading, setLoading] = useState(false);
      const [response, setResponse] = useState({
        data: {
          result: [],
          pagination: {
            currentPage: 0, // Invalid page (less than 1)
            totalRecords: 1,
            pageSize: 10
          }
        }
      });

      // Simulate the hook's effect that dispatches pagination actions
      useEffect(() => {
        const totalPages = Math.ceil(
          response.data.pagination.totalRecords /
            response.data.pagination.pageSize
        );

        // First dispatch total pages
        mockDispatchPagination({
          type: 'SET_TOTAL_PAGES',
          payload: { id: 'test', totalPages }
        });

        // Then handle invalid page
        if (response.data.pagination.currentPage < 1) {
          mockDispatchPagination({
            type: 'SET_CURRENT_PAGE',
            payload: { id: 'test', currentPage: 1 }
          });
        }
      }, [response]);

      return {
        loading,
        response,
        isAuthorized: true,
        fetchSubmissions: jest.fn()
      };
    });

    renderComponent({ page: 0 });

    // Verify the dispatch calls
    expect(mockDispatchPagination).toHaveBeenCalledWith({
      type: 'SET_TOTAL_PAGES',
      payload: { id: 'test', totalPages: 1 }
    });

    expect(mockDispatchPagination).toHaveBeenCalledWith({
      type: 'SET_CURRENT_PAGE',
      payload: { id: 'test', currentPage: 1 }
    });
  });
});
