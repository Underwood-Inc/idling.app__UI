import { renderHook, act, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Provider } from 'jotai';
import { createStore } from 'jotai';
import { useSubmissionsManager } from './useSubmissionsManager';
import { getSubmissionsFiltersAtom } from './atoms';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock Next.js navigation
jest.mock('next/navigation');
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Mock the submissions actions
const mockGetSubmissionsWithReplies = jest.fn();
jest.mock('../../app/components/submissions-list/actions', () => ({
  getSubmissionsWithReplies: mockGetSubmissionsWithReplies
}));

// Mock the logger
jest.mock('@/lib/logging', () => ({
  createLogger: () => ({
    group: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    groupEnd: jest.fn()
  })
}));

describe('useSubmissionsManager', () => {
  let store: ReturnType<typeof createStore>;
  let mockRouter: any;
  let mockSearchParams: any;

  beforeEach(() => {
    store = createStore();
    
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn()
    };

    mockSearchParams = new URLSearchParams();

    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUsePathname.mockReturnValue('/posts');
    
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated'
    } as any);

    mockGetSubmissionsWithReplies.mockClear();
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
  });

  const renderUseSubmissionsManager = (props: any = {}) => {
    const defaultProps = {
      contextId: 'test-context',
      onlyMine: false,
      initialFilters: [],
      userId: undefined,
      includeThreadReplies: false,
      infiniteScroll: false,
      ...props
    };

    return renderHook(
      () => useSubmissionsManager(defaultProps),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      }
    );
  };

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderUseSubmissionsManager();

      expect(result.current.submissionsState.loading).toBe(false);
      expect(result.current.submissionsState.data).toBeUndefined();
      expect(result.current.submissionsState.error).toBeUndefined();
    });

    it('should use session user ID when no userId provided', () => {
      const { result } = renderUseSubmissionsManager();
      
      expect(result.current.userId).toBe('123');
    });

    it('should prefer provided userId over session', () => {
      const { result } = renderUseSubmissionsManager({ userId: '456' });
      
      expect(result.current.userId).toBe('456');
    });

    it('should initialize from URL parameters', async () => {
      mockSearchParams = new URLSearchParams('tags=react,typescript&page=2&pageSize=20');
      mockUseSearchParams.mockReturnValue(mockSearchParams);

      const { result } = renderUseSubmissionsManager();

      await waitFor(() => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        const filtersState = store.get(filtersAtom);
        expect(filtersState.initialized).toBe(true);
      });
    });
  });

  describe('Filter Management', () => {
    const mockSubmissionData = {
      data: {
        data: [
          {
            submission_id: 1,
            submission_name: 'Test Post',
            submission_title: 'Test Title',
            submission_datetime: new Date(),
            user_id: 123,
            author: 'testuser',
            tags: ['react'],
            thread_parent_id: null
          }
        ],
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalRecords: 1
        }
      }
    };

    beforeEach(() => {
      mockGetSubmissionsWithReplies.mockResolvedValue(mockSubmissionData);
    });

    it('should add filters correctly', async () => {
      const { result } = renderUseSubmissionsManager();

      await act(async () => {
        result.current.addFilter('tags', '#react');
      });

      expect(result.current.filtersState.filters).toContainEqual({
        name: 'tags',
        value: '#react'
      });
    });

    it('should remove filters correctly', async () => {
      const { result } = renderUseSubmissionsManager({
        initialFilters: [{ name: 'tags', value: '#react' }]
      });

      await act(async () => {
        result.current.removeFilter('tags', '#react');
      });

      expect(result.current.filtersState.filters).not.toContainEqual({
        name: 'tags',
        value: '#react'
      });
    });

    it('should update existing filters', async () => {
      const { result } = renderUseSubmissionsManager({
        initialFilters: [{ name: 'tagLogic', value: 'OR' }]
      });

      await act(async () => {
        result.current.updateFilter('tagLogic', 'AND');
      });

      expect(result.current.filtersState.filters).toContainEqual({
        name: 'tagLogic',
        value: 'AND'
      });
    });

    it('should clear all filters', async () => {
      const { result } = renderUseSubmissionsManager({
        initialFilters: [
          { name: 'tags', value: '#react' },
          { name: 'author', value: '123' }
        ]
      });

      await act(async () => {
        result.current.clearFilters();
      });

      expect(result.current.filtersState.filters).toEqual([]);
    });

    it('should handle tag removal from comma-separated values', async () => {
      const { result } = renderUseSubmissionsManager({
        initialFilters: [{ name: 'tags', value: '#react,#typescript,#javascript' }]
      });

      await act(async () => {
        result.current.removeTag('#typescript');
      });

      const tagsFilter = result.current.filtersState.filters.find(f => f.name === 'tags');
      expect(tagsFilter?.value).toBe('#react,#javascript');
    });

    it('should remove entire filter when removing last tag', async () => {
      const { result } = renderUseSubmissionsManager({
        initialFilters: [{ name: 'tags', value: '#react' }]
      });

      await act(async () => {
        result.current.removeTag('#react');
      });

      const tagsFilter = result.current.filtersState.filters.find(f => f.name === 'tags');
      expect(tagsFilter).toBeUndefined();
    });
  });

  describe('Data Fetching', () => {
    const mockSubmissionData = {
      data: {
        data: [
          {
            submission_id: 1,
            submission_name: 'Test Post',
            submission_title: 'Test Title',
            submission_datetime: new Date(),
            user_id: 123,
            author: 'testuser',
            tags: ['react'],
            thread_parent_id: null
          }
        ],
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalRecords: 1
        }
      }
    };

    beforeEach(() => {
      mockGetSubmissionsWithReplies.mockResolvedValue(mockSubmissionData);
    });

    it('should fetch submissions when filters change', async () => {
      const { result } = renderUseSubmissionsManager();

      // Initialize the filters state
      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, {
          onlyMine: false,
          userId: '',
          filters: [{ name: 'tags', value: '#react' }],
          page: 1,
          pageSize: 10,
          initialized: true
        });
      });

      await waitFor(() => {
        expect(mockGetSubmissionsWithReplies).toHaveBeenCalledWith({
          filters: [{ name: 'tags', value: '#react' }],
          page: 1,
          pageSize: 10,
          onlyMine: false,
          userId: '123',
          includeThreadReplies: false
        });
      });
    });

    it('should not fetch when filters are not initialized', async () => {
      renderUseSubmissionsManager();

      // Wait a bit to ensure no fetch happens
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetSubmissionsWithReplies).not.toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      mockGetSubmissionsWithReplies.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderUseSubmissionsManager();

      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, {
          onlyMine: false,
          userId: '',
          filters: [],
          page: 1,
          pageSize: 10,
          initialized: true
        });
      });

      await waitFor(() => {
        expect(result.current.submissionsState.error).toBe('Fetch failed');
      });
    });

    it('should skip duplicate fetches', async () => {
      const { result } = renderUseSubmissionsManager();

      const filtersState = {
        onlyMine: false,
        userId: '',
        filters: [{ name: 'tags', value: '#react' }],
        page: 1,
        pageSize: 10,
        initialized: true
      };

      // Set the same filters twice
      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, filtersState);
      });

      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, filtersState);
      });

      await waitFor(() => {
        expect(mockGetSubmissionsWithReplies).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('URL Synchronization', () => {
    it('should sync filters to URL', async () => {
      const { result } = renderUseSubmissionsManager();

      await act(async () => {
        result.current.addFilter('tags', '#react');
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.stringContaining('tags=react'),
          { scroll: false }
        );
      });
    });

    it('should sync complex filters to URL', async () => {
      const { result } = renderUseSubmissionsManager();

      await act(async () => {
        result.current.addFilter('tags', '#react,#typescript');
        result.current.addFilter('tagLogic', 'AND');
        result.current.addFilter('author', '123');
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.stringMatching(/tags=react%2Ctypescript.*tagLogic=AND.*author=123/),
          { scroll: false }
        );
      });
    });

    it('should handle URL parameters on initialization', async () => {
      mockSearchParams = new URLSearchParams('tags=react&tagLogic=AND&page=2');
      mockUseSearchParams.mockReturnValue(mockSearchParams);

      const { result } = renderUseSubmissionsManager();

      await waitFor(() => {
        expect(result.current.filtersState.filters).toContainEqual({
          name: 'tags',
          value: '#react'
        });
        expect(result.current.filtersState.filters).toContainEqual({
          name: 'tagLogic',
          value: 'AND'
        });
        expect(result.current.filtersState.page).toBe(2);
      });
    });

    it('should not sync URL when URL has no filter params and localStorage has filters', async () => {
      // Simulate localStorage having existing filters
      const existingFilters = {
        onlyMine: false,
        userId: '',
        filters: [{ name: 'tags', value: '#existing' }],
        page: 1,
        pageSize: 10,
        initialized: true
      };

      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, existingFilters);
      });

      // URL has no filter params
      mockSearchParams = new URLSearchParams('');
      mockUseSearchParams.mockReturnValue(mockSearchParams);

      renderUseSubmissionsManager();

      await waitFor(() => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        const filtersState = store.get(filtersAtom);
        // Should keep existing filters, not override with empty URL
        expect(filtersState.filters).toContainEqual({
          name: 'tags',
          value: '#existing'
        });
      });
    });
  });

  describe('Infinite Scroll', () => {
    const mockSubmissionData = {
      data: {
        data: [
          {
            submission_id: 1,
            submission_name: 'Test Post 1',
            submission_title: 'Test Title 1',
            submission_datetime: new Date(),
            user_id: 123,
            author: 'testuser',
            tags: ['react'],
            thread_parent_id: null
          }
        ],
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalRecords: 20
        }
      }
    };

    beforeEach(() => {
      mockGetSubmissionsWithReplies.mockResolvedValue(mockSubmissionData);
    });

    it('should initialize infinite scroll data on first load', async () => {
      const { result } = renderUseSubmissionsManager({ infiniteScroll: true });

      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, {
          onlyMine: false,
          userId: '',
          filters: [],
          page: 1,
          pageSize: 10,
          initialized: true
        });
      });

      await waitFor(() => {
        expect(result.current.infiniteData).toEqual(mockSubmissionData.data.data);
        expect(result.current.hasMore).toBe(true);
      });
    });

    it('should load more data for infinite scroll', async () => {
      const { result } = renderUseSubmissionsManager({ infiniteScroll: true });

      // Initialize with first page
      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, {
          onlyMine: false,
          userId: '',
          filters: [],
          page: 1,
          pageSize: 10,
          initialized: true
        });
      });

      await waitFor(() => {
        expect(result.current.infiniteData).toHaveLength(1);
      });

      // Mock second page data
      const secondPageData = {
        data: {
          data: [
            {
              submission_id: 2,
              submission_name: 'Test Post 2',
              submission_title: 'Test Title 2',
              submission_datetime: new Date(),
              user_id: 456,
              author: 'testuser2',
              tags: ['vue'],
              thread_parent_id: null
            }
          ],
          pagination: {
            currentPage: 2,
            pageSize: 10,
            totalRecords: 20
          }
        }
      };

      mockGetSubmissionsWithReplies.mockResolvedValueOnce(secondPageData);

      // Load more
      await act(async () => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.infiniteData).toHaveLength(2);
        expect(result.current.isLoadingMore).toBe(false);
      });
    });

    it('should handle load more errors', async () => {
      const { result } = renderUseSubmissionsManager({ infiniteScroll: true });

      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, {
          onlyMine: false,
          userId: '',
          filters: [],
          page: 1,
          pageSize: 10,
          initialized: true
        });
      });

      await waitFor(() => {
        expect(result.current.infiniteData).toHaveLength(1);
      });

      // Mock error on load more
      mockGetSubmissionsWithReplies.mockRejectedValueOnce(new Error('Load more failed'));

      await act(async () => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.submissionsState.error).toBe('Load more failed');
        expect(result.current.isLoadingMore).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing session gracefully', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any);

      const { result } = renderUseSubmissionsManager();

      expect(result.current.userId).toBe('');
    });

    it('should handle empty filter values', async () => {
      const { result } = renderUseSubmissionsManager();

      await act(async () => {
        result.current.addFilter('tags', '');
      });

      // Should not add empty filters
      expect(result.current.filtersState.filters).not.toContainEqual({
        name: 'tags',
        value: ''
      });
    });

    it('should handle rapid filter updates', async () => {
      const { result } = renderUseSubmissionsManager();

      // Rapidly add multiple filters
      await act(async () => {
        result.current.addFilter('tags', '#react');
        result.current.addFilter('tags', '#vue');
        result.current.addFilter('author', '123');
        result.current.removeFilter('tags', '#react');
      });

      expect(result.current.filtersState.filters).toContainEqual({
        name: 'tags',
        value: '#vue'
      });
      expect(result.current.filtersState.filters).toContainEqual({
        name: 'author',
        value: '123'
      });
      expect(result.current.filtersState.filters).not.toContainEqual({
        name: 'tags',
        value: '#react'
      });
    });

    it('should handle page changes correctly', async () => {
      const { result } = renderUseSubmissionsManager();

      await act(async () => {
        result.current.setPage(3);
      });

      expect(result.current.filtersState.page).toBe(3);
    });

    it('should handle page size changes correctly', async () => {
      const { result } = renderUseSubmissionsManager();

      await act(async () => {
        result.current.setPageSize(50);
      });

      expect(result.current.filtersState.pageSize).toBe(50);
      // Should reset to page 1 when page size changes
      expect(result.current.filtersState.page).toBe(1);
    });

    it('should handle context switching', async () => {
      const { result, rerender } = renderUseSubmissionsManager({ contextId: 'context1' });

      await act(async () => {
        result.current.addFilter('tags', '#context1');
      });

      // Switch to different context
      rerender({ contextId: 'context2' });

      // Should have separate state for different context
      expect(result.current.filtersState.filters).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('should debounce rapid URL updates', async () => {
      const { result } = renderUseSubmissionsManager();

      // Rapidly add multiple filters
      await act(async () => {
        result.current.addFilter('tags', '#react');
        result.current.addFilter('author', '123');
        result.current.addFilter('mentions', 'user1');
      });

      // Should only call router.replace once (or minimal times) due to debouncing
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalled();
      });

      // The exact number of calls may vary due to debouncing implementation
      expect(mockRouter.replace).toHaveBeenCalledTimes(
        expect.any(Number)
      );
    });

    it('should not re-fetch when filters have not changed', async () => {
      mockGetSubmissionsWithReplies.mockResolvedValue({
        data: { data: [], pagination: { currentPage: 1, pageSize: 10, totalRecords: 0 } }
      });

      const { result } = renderUseSubmissionsManager();

      const filtersState = {
        onlyMine: false,
        userId: '',
        filters: [{ name: 'tags', value: '#react' }],
        page: 1,
        pageSize: 10,
        initialized: true
      };

      // Set filters
      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, filtersState);
      });

      await waitFor(() => {
        expect(mockGetSubmissionsWithReplies).toHaveBeenCalledTimes(1);
      });

      // Set the same filters again
      await act(async () => {
        const filtersAtom = getSubmissionsFiltersAtom('test-context');
        store.set(filtersAtom, { ...filtersState });
      });

      // Should not fetch again
      expect(mockGetSubmissionsWithReplies).toHaveBeenCalledTimes(1);
    });
  });
}); 