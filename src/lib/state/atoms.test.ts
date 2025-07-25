import { createStore } from 'jotai';
import {
  clearAllRouteFilters,
  clearContextAtoms,
  createCombinedFiltersAtom,
  getSubmissionsStateAtom,
  initializeFiltersFromUrl,
  initializePaginationFromUrl,
  PageSize,
  PaginationAction,
  paginationActionAtom,
  paginationStateAtom,
  ShouldUpdateAction,
  shouldUpdateActionAtom,
  shouldUpdateAtom
} from './atoms';

describe('Jotai Atoms', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Pagination Atoms', () => {
    it('should initialize with default state', () => {
      const state = store.get(paginationStateAtom);
      expect(state).toEqual({
        default: {
          id: 'default',
          currentPage: 1,
          totalPages: 1,
          pageSize: PageSize.TEN
        }
      });
    });

    it('should handle SET_CURRENT_PAGE action', () => {
      const action: PaginationAction = {
        type: 'SET_CURRENT_PAGE',
        payload: { id: 'test', currentPage: 3 }
      };

      store.set(paginationActionAtom, action);
      const state = store.get(paginationStateAtom);

      expect(state.test?.currentPage).toBe(3);
      expect(state.test?.id).toBe('test');
    });

    it('should handle SET_TOTAL_PAGES action', () => {
      const action: PaginationAction = {
        type: 'SET_TOTAL_PAGES',
        payload: { id: 'test', totalPages: 10 }
      };

      store.set(paginationActionAtom, action);
      const state = store.get(paginationStateAtom);

      expect(state.test?.totalPages).toBe(10);
    });

    it('should handle SET_PAGE_SIZE action', () => {
      const action: PaginationAction = {
        type: 'SET_PAGE_SIZE',
        payload: { id: 'test', pageSize: PageSize.FIFTY }
      };

      store.set(paginationActionAtom, action);
      const state = store.get(paginationStateAtom);

      expect(state.test?.pageSize).toBe(PageSize.FIFTY);
    });

    it('should enforce minimum page values', () => {
      const action: PaginationAction = {
        type: 'SET_CURRENT_PAGE',
        payload: { id: 'test', currentPage: -5 }
      };

      store.set(paginationActionAtom, action);
      const state = store.get(paginationStateAtom);

      expect(state.test?.currentPage).toBe(1); // Should be clamped to 1
    });

    it('should reset to initial state', () => {
      // First modify state
      store.set(paginationActionAtom, {
        type: 'SET_CURRENT_PAGE',
        payload: { id: 'test', currentPage: 5 }
      });

      // Then reset
      store.set(paginationActionAtom, { type: 'RESET_STATE' });
      const state = store.get(paginationStateAtom);

      expect(state).toEqual({
        default: {
          id: 'default',
          currentPage: 1,
          totalPages: 1,
          pageSize: PageSize.TEN
        }
      });
    });
  });

  describe('ShouldUpdate Atoms', () => {
    it('should initialize with false', () => {
      const state = store.get(shouldUpdateAtom);
      expect(state).toBe(false);
    });

    it('should handle SET_SHOULD_UPDATE action', () => {
      const action: ShouldUpdateAction = {
        type: 'SET_SHOULD_UPDATE',
        payload: true
      };

      store.set(shouldUpdateActionAtom, action);
      const state = store.get(shouldUpdateAtom);

      expect(state).toBe(true);
    });
  });

  describe('Submissions Atoms', () => {
    it('should create unique atoms per context', () => {
      const atom1 = getSubmissionsStateAtom('context1');
      const atom2 = getSubmissionsStateAtom('context2');
      const atom3 = getSubmissionsStateAtom('context1'); // Same context

      expect(atom1).not.toBe(atom2); // Different contexts = different atoms
      expect(atom1).toBe(atom3); // Same context = same atom
    });

    it('should initialize submissions state correctly', () => {
      const atom = getSubmissionsStateAtom('test');
      const state = store.get(atom);

      expect(state).toEqual({
        loading: false,
        data: undefined,
        error: undefined
      });
    });

    it('should initialize combined filters state correctly', () => {
      const atom = createCombinedFiltersAtom('test');
      const state = store.get(atom);

      expect(state).toEqual({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 10,
        includeThreadReplies: false,
        initialized: true
      });
    });

    // DEPRECATED: Test removed - getDisplayFiltersAtom and getSubmissionsFiltersAtom replaced with URL-first approach
    /*
    it('should handle display filters updates', () => {
      const atom = getDisplayFiltersAtom('test');
      const newFilters = [{ name: 'tags', value: 'test-tag' }];

      store.set(atom, newFilters);
      const displayFilters = store.get(atom);

      expect(displayFilters).toEqual(newFilters);

      // Should also update the underlying filters atom and reset page
      const filtersAtom = getSubmissionsFiltersAtom('test');
      const filtersState = store.get(filtersAtom);
      expect(filtersState.filters).toEqual(newFilters);
      expect(filtersState.page).toBe(1); // Should reset to page 1
    });
    */
  });

  describe('Utility Functions', () => {
    it('should initialize pagination from URL correctly', () => {
      const searchParams = new URLSearchParams('page=3&pageSize=20');
      const result = initializePaginationFromUrl('test', searchParams);

      expect(result).toEqual({
        test: {
          id: 'test',
          currentPage: 3,
          totalPages: 1,
          pageSize: 20
        }
      });
    });

    it('should handle invalid URL parameters gracefully', () => {
      const searchParams = new URLSearchParams('page=-5&pageSize=invalid');
      const result = initializePaginationFromUrl('test', searchParams);

      expect(result.test?.currentPage).toBe(1); // Should clamp to minimum
      expect(result.test?.pageSize).toBe(PageSize.TEN); // Should fallback to default
    });

    it('should initialize filters from URL with sanitization', () => {
      const searchParams = new URLSearchParams(
        'page=2&tags=test-tag,another-tag&pageSize=50'
      );
      const result = initializeFiltersFromUrl(
        'test',
        searchParams,
        true,
        'user123'
      );

      expect(result).toEqual({
        onlyMine: true,
        userId: 'user123',
        filters: [
          { name: 'tags', value: '#test-tag' },
          { name: 'tags', value: '#another-tag' }
        ],
        page: 2,
        pageSize: 50,
        initialized: true
      });
    });

    it('should sanitize malicious tags', () => {
      const searchParams = new URLSearchParams(
        'tags=<script>alert("xss")</script>,valid-tag'
      );
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      // Should filter out invalid characters and keep only valid tags
      expect(result.filters[0]?.value).not.toContain('<script>');
      expect(result.filters[0]?.value).toContain('valid-tag');
    });

    it('should clear context atoms', () => {
      // Create state atom (filters are now URL-first, so only state needs clearing)
      const stateAtom = getSubmissionsStateAtom('test');

      // Verify it exists
      expect(stateAtom).toBeDefined();

      // Clear it
      clearContextAtoms('test');

      // New call should create new atom (different reference)
      const newStateAtom = getSubmissionsStateAtom('test');

      // Should be different reference after clearing
      expect(newStateAtom).not.toBe(stateAtom);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain state isolation between contexts', () => {
      const postsState = getSubmissionsStateAtom('posts');
      const myPostsState = getSubmissionsStateAtom('my-posts');

      // Update one context
      store.set(postsState, {
        loading: true,
        data: undefined,
        error: undefined
      });

      // Other context should remain unchanged
      const myPostsValue = store.get(myPostsState);
      expect(myPostsValue.loading).toBe(false);
    });

    it('should handle complex pagination scenarios', () => {
      // Set up initial state
      store.set(paginationActionAtom, {
        type: 'SET_CURRENT_PAGE',
        payload: { id: 'posts', currentPage: 5 }
      });

      store.set(paginationActionAtom, {
        type: 'SET_TOTAL_PAGES',
        payload: { id: 'posts', totalPages: 10 }
      });

      const state = store.get(paginationStateAtom);
      expect(state.posts?.currentPage).toBe(5);
      expect(state.posts?.totalPages).toBe(10);

      // Change page size should reset to page 1
      store.set(paginationActionAtom, {
        type: 'SET_PAGE_SIZE',
        payload: { id: 'posts', pageSize: PageSize.FIFTY }
      });

      // Page should remain the same (this matches original context behavior)
      const updatedState = store.get(paginationStateAtom);
      expect(updatedState.posts?.currentPage).toBe(5); // Unchanged
      expect(updatedState.posts?.pageSize).toBe(PageSize.FIFTY);
    });

    it('should create route-scoped persistent filters', () => {
      // Test with URL-first combined filters atoms
      const postsFiltersAtom1 = createCombinedFiltersAtom('1'); // CONTEXT_IDS.POSTS
      const postsFiltersAtom2 = createCombinedFiltersAtom('1'); // Same context
      const myPostsFiltersAtom = createCombinedFiltersAtom('2'); // CONTEXT_IDS.MY_POSTS

      // createCombinedFiltersAtom creates new atoms each time (no registry)
      expect(postsFiltersAtom1).not.toBe(postsFiltersAtom2);
      expect(postsFiltersAtom1).not.toBe(myPostsFiltersAtom);

      // But they should have the same structure and behavior
      expect(typeof postsFiltersAtom1.read).toBe('function');
      expect(typeof postsFiltersAtom2.read).toBe('function');

      // Since atoms are URL-first, we can't set them directly
      // Just verify they're created and have proper structure
      const postsState = store.get(postsFiltersAtom1) as any;
      const myPostsState = store.get(myPostsFiltersAtom) as any;

      // Both should have the expected structure with filters arrays
      expect(postsState).toHaveProperty('filters');
      expect(postsState).toHaveProperty('initialized');
      expect(myPostsState).toHaveProperty('filters');
      expect(myPostsState).toHaveProperty('initialized');

      // Both should be arrays (empty by default since no URL params)
      expect(Array.isArray(postsState.filters)).toBe(true);
      expect(Array.isArray(myPostsState.filters)).toBe(true);
    });

    it('should clear all route filters', () => {
      // clearAllRouteFilters is now a no-op since filters are URL-first
      // Just verify the function exists and can be called without errors
      expect(() => {
        clearAllRouteFilters();
      }).not.toThrow();

      // Function should complete successfully (no localStorage operations needed)
      expect(clearAllRouteFilters).toBeDefined();
    });
  });
});
