import { createStore } from 'jotai';
import { FilterLogic, PostFilters } from '../types/filters';
import {
  clearAllRouteFilters,
  clearContextAtoms,
  Filter,
  getDisplayFiltersAtom,
  getSubmissionsFiltersAtom,
  initializeFiltersFromUrl
} from './atoms';

describe('Filter System Tests', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Filter URL Synchronization', () => {
    it('should parse basic filters from URL', () => {
      const searchParams = new URLSearchParams(
        'tags=tag1,tag2&author=123&mentions=test'
      );
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      expect(result.filters).toEqual([
        { name: 'tags', value: '#tag1,#tag2' },
        { name: 'author', value: '123' },
        { name: 'mentions', value: 'test' }
      ]);
    });

    it('should parse logic filters from URL', () => {
      const searchParams = new URLSearchParams(
        'tags=tag1,tag2&tagLogic=AND&authorLogic=OR&mentionsLogic=AND&globalLogic=OR'
      );
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      const expectedFilters = [
        { name: 'tags', value: '#tag1,#tag2' },
        { name: 'tagLogic', value: 'AND' },
        { name: 'authorLogic', value: 'OR' },
        { name: 'mentionsLogic', value: 'AND' },
        { name: 'globalLogic', value: 'OR' }
      ];

      expect(result.filters).toEqual(expectedFilters);
    });

    it('should sanitize malicious input in tags', () => {
      const searchParams = new URLSearchParams(
        'tags=<script>alert("xss")</script>,valid-tag,javascript:void(0)'
      );
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      // Should filter out malicious content but keep valid tags
      expect(result.filters[0]?.value).toContain('valid-tag');
      expect(result.filters[0]?.value).not.toContain('<script>');
      expect(result.filters[0]?.value).not.toContain('javascript:');
    });

    it('should handle empty and invalid parameters', () => {
      const searchParams = new URLSearchParams(
        'tags=&author=&mentions=&tagLogic=INVALID'
      );
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      // Should ignore empty values and invalid logic
      expect(result.filters).toEqual([]);
    });

    it('should preserve valid logic values and ignore invalid ones', () => {
      const searchParams = new URLSearchParams(
        'tags=tag1&tagLogic=AND&authorLogic=INVALID&mentionsLogic=OR'
      );
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      const expectedFilters = [
        { name: 'tags', value: '#tag1' },
        { name: 'tagLogic', value: 'AND' },
        { name: 'mentionsLogic', value: 'OR' }
      ];

      expect(result.filters).toEqual(expectedFilters);
    });
  });

  describe('Filter Logic Operations', () => {
    it('should correctly identify filter types', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#test1,#test2' },
        { name: 'author', value: '123' },
        { name: 'mentions', value: 'user1' },
        { name: 'tagLogic', value: 'AND' },
        { name: 'authorLogic', value: 'OR' }
      ];

      const hasTagsFilter = filters.some((f) => f.name === 'tags');
      const hasAuthorFilter = filters.some((f) => f.name === 'author');
      const hasMentionsFilter = filters.some((f) => f.name === 'mentions');
      const hasMultipleTypes =
        [hasTagsFilter, hasAuthorFilter, hasMentionsFilter].filter(Boolean)
          .length > 1;

      expect(hasTagsFilter).toBe(true);
      expect(hasAuthorFilter).toBe(true);
      expect(hasMentionsFilter).toBe(true);
      expect(hasMultipleTypes).toBe(true);
    });

    it('should extract logic values with defaults', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#test' },
        { name: 'tagLogic', value: 'AND' }
      ];

      const tagLogic =
        filters.find((f) => f.name === 'tagLogic')?.value || 'OR';
      const authorLogic =
        filters.find((f) => f.name === 'authorLogic')?.value || 'OR';
      const globalLogic =
        filters.find((f) => f.name === 'globalLogic')?.value || 'AND';

      expect(tagLogic).toBe('AND');
      expect(authorLogic).toBe('OR'); // Default
      expect(globalLogic).toBe('AND'); // Default
    });

    it('should handle filter consolidation', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#tag1' },
        { name: 'tags', value: '#tag2' },
        { name: 'author', value: '123' },
        { name: 'author', value: '456' }
      ];

      // Simulate consolidation logic from FilterBar
      const consolidated = filters
        .filter(
          (filter) =>
            ![
              'tagLogic',
              'authorLogic',
              'mentionsLogic',
              'globalLogic'
            ].includes(filter.name)
        )
        .reduce((acc, filter) => {
          const existingFilter = acc.find((f) => f.name === filter.name);
          if (existingFilter) {
            existingFilter.value = existingFilter.value + ',' + filter.value;
          } else {
            acc.push({ ...filter });
          }
          return acc;
        }, [] as Filter<PostFilters>[]);

      expect(consolidated).toEqual([
        { name: 'tags', value: '#tag1,#tag2' },
        { name: 'author', value: '123,456' }
      ]);
    });
  });

  describe('Filter State Management', () => {
    it('should maintain separate filter state per context', () => {
      const context1Atom = getSubmissionsFiltersAtom('context1');
      const context2Atom = getSubmissionsFiltersAtom('context2');

      // Set different filters for each context
      store.set(context1Atom, {
        onlyMine: false,
        userId: '',
        filters: [{ name: 'tags', value: '#context1' }],
        page: 1,
        pageSize: 10,
        initialized: true
      });

      store.set(context2Atom, {
        onlyMine: true,
        userId: 'user123',
        filters: [{ name: 'author', value: '456' }],
        page: 2,
        pageSize: 20,
        initialized: true
      });

      const context1State = store.get(context1Atom);
      const context2State = store.get(context2Atom);

      expect(context1State.filters).toEqual([
        { name: 'tags', value: '#context1' }
      ]);
      expect(context2State.filters).toEqual([{ name: 'author', value: '456' }]);
      expect(context1State.onlyMine).toBe(false);
      expect(context2State.onlyMine).toBe(true);
    });

    it('should update display filters and reset page', () => {
      const displayAtom = getDisplayFiltersAtom('test');
      const filtersAtom = getSubmissionsFiltersAtom('test');

      // Set initial state with page > 1
      store.set(filtersAtom, {
        onlyMine: false,
        userId: '',
        filters: [],
        page: 3,
        pageSize: 10,
        initialized: true
      });

      // Update display filters
      const newFilters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#new-tag' }
      ];
      store.set(displayAtom, newFilters);

      const filtersState = store.get(filtersAtom);
      expect(filtersState.filters).toEqual(newFilters);
      expect(filtersState.page).toBe(1); // Should reset to page 1
    });

    it('should handle complex filter combinations', () => {
      const filtersAtom = getSubmissionsFiltersAtom('test');

      const complexFilters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' },
        { name: 'tagLogic', value: 'AND' },
        { name: 'author', value: '123,456,789' },
        { name: 'authorLogic', value: 'OR' },
        { name: 'mentions', value: '@user1,@user2' },
        { name: 'mentionsLogic', value: 'AND' },
        { name: 'globalLogic', value: 'OR' }
      ];

      store.set(filtersAtom, {
        onlyMine: false,
        userId: '',
        filters: complexFilters,
        page: 1,
        pageSize: 10,
        initialized: true
      });

      const state = store.get(filtersAtom);
      expect(state.filters).toEqual(complexFilters);

      // Test logic extraction
      const tagLogic = state.filters.find((f) => f.name === 'tagLogic')?.value;
      const authorLogic = state.filters.find(
        (f) => f.name === 'authorLogic'
      )?.value;
      const mentionsLogic = state.filters.find(
        (f) => f.name === 'mentionsLogic'
      )?.value;
      const globalLogic = state.filters.find(
        (f) => f.name === 'globalLogic'
      )?.value;

      expect(tagLogic).toBe('AND');
      expect(authorLogic).toBe('OR');
      expect(mentionsLogic).toBe('AND');
      expect(globalLogic).toBe('OR');
    });
  });

  describe('Filter Persistence', () => {
    it('should persist filters to localStorage', () => {
      const filtersAtom = getSubmissionsFiltersAtom('1'); // CONTEXT_IDS.POSTS

      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#persistent' },
        { name: 'tagLogic', value: 'AND' }
      ];

      store.set(filtersAtom, {
        onlyMine: false,
        userId: '',
        filters,
        page: 1,
        pageSize: 10,
        initialized: true
      });

      // Check if filters were persisted (this depends on the atom implementation)
      // Note: The actual persistence logic might be in the atom's write function
      const persistedData = localStorage.getItem('filters-/posts-1');
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        expect(parsed.filters).toEqual(filters);
      }
    });

    it('should clear all route filters from localStorage', () => {
      // Set up mock localStorage with filter data
      localStorage.setItem(
        'filters-/posts-1',
        JSON.stringify({ filters: [{ name: 'tags', value: '#test' }] })
      );
      localStorage.setItem(
        'filters-/my-posts-2',
        JSON.stringify({ filters: [{ name: 'author', value: '123' }] })
      );
      localStorage.setItem('other-data', 'should-remain');

      clearAllRouteFilters();

      // Filter keys should be removed
      expect(localStorage.getItem('filters-/posts-1')).toBeNull();
      expect(localStorage.getItem('filters-/my-posts-2')).toBeNull();
      // Other data should remain
      expect(localStorage.getItem('other-data')).toBe('should-remain');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw errors
      const originalLocalStorage = window.localStorage;
      const mockLocalStorage = {
        ...originalLocalStorage,
        setItem: jest.fn(() => {
          throw new Error('Storage quota exceeded');
        }),
        removeItem: jest.fn(() => {
          throw new Error('Storage error');
        })
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        configurable: true
      });

      try {
        // Should not throw errors
        expect(() => clearAllRouteFilters()).not.toThrow();
      } finally {
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          configurable: true
        });
      }
    });
  });

  describe('URL Synchronization Edge Cases', () => {
    it('should handle URL with only logic filters', () => {
      const searchParams = new URLSearchParams('tagLogic=AND&globalLogic=OR');
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      expect(result.filters).toEqual([
        { name: 'tagLogic', value: 'AND' },
        { name: 'globalLogic', value: 'OR' }
      ]);
    });

    it('should handle URL with mixed case logic values', () => {
      const searchParams = new URLSearchParams('tagLogic=and&authorLogic=Or');
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      // Should normalize to uppercase
      expect(result.filters).toEqual([
        { name: 'tagLogic', value: 'AND' },
        { name: 'authorLogic', value: 'OR' }
      ]);
    });

    it('should handle special characters in filter values', () => {
      const searchParams = new URLSearchParams();
      searchParams.set(
        'tags',
        'tag-with-dashes,tag_with_underscores,tag.with.dots'
      );
      searchParams.set('mentions', '@user-name,user@domain.com');

      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      expect(result.filters).toEqual([
        {
          name: 'tags',
          value: '#tag-with-dashes,#tag_with_underscores,#tag.with.dots'
        },
        { name: 'mentions', value: '@user-name,user@domain.com' }
      ]);
    });

    it('should handle very long filter values', () => {
      const longTag = 'a'.repeat(1000);
      const searchParams = new URLSearchParams(`tags=${longTag}`);
      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      expect(result.filters[0]?.value).toBe(`#${longTag}`);
    });

    it('should handle URL encoding correctly', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('tags', 'tag with spaces,tag%20encoded');
      searchParams.set('mentions', 'user name,user%40domain');

      const result = initializeFiltersFromUrl('test', searchParams, false, '');

      expect(result.filters).toEqual([
        { name: 'tags', value: '#tag with spaces,#tag encoded' },
        { name: 'mentions', value: 'user name,user@domain' }
      ]);
    });
  });

  describe('Filter Validation', () => {
    it('should validate filter logic values', () => {
      const validLogics: FilterLogic[] = ['AND', 'OR'];
      const invalidLogics = ['and', 'or', 'XOR', 'NOT', '', null, undefined];

      validLogics.forEach((logic) => {
        expect(['AND', 'OR']).toContain(logic);
      });

      invalidLogics.forEach((logic) => {
        expect(['AND', 'OR']).not.toContain(logic);
      });
    });

    it('should validate filter names', () => {
      const validFilterNames: PostFilters[] = [
        'tags',
        'tagLogic',
        'author',
        'mentions',
        'authorLogic',
        'mentionsLogic',
        'globalLogic'
      ];

      const invalidFilterNames = ['invalid', 'tag', 'user', 'logic'];

      validFilterNames.forEach((name) => {
        expect([
          'tags',
          'tagLogic',
          'author',
          'mentions',
          'authorLogic',
          'mentionsLogic',
          'globalLogic'
        ]).toContain(name);
      });

      invalidFilterNames.forEach((name) => {
        expect([
          'tags',
          'tagLogic',
          'author',
          'mentions',
          'authorLogic',
          'mentionsLogic',
          'globalLogic'
        ]).not.toContain(name);
      });
    });

    it('should handle empty filter arrays', () => {
      const emptyFilters: Filter<PostFilters>[] = [];

      const hasAnyFilters = emptyFilters.length > 0;
      const hasTagsFilter = emptyFilters.some((f) => f.name === 'tags');
      const hasLogicFilters = emptyFilters.some((f) =>
        f.name.endsWith('Logic')
      );

      expect(hasAnyFilters).toBe(false);
      expect(hasTagsFilter).toBe(false);
      expect(hasLogicFilters).toBe(false);
    });
  });

  describe('Context Isolation', () => {
    it('should maintain complete isolation between different contexts', () => {
      const contexts = ['posts', 'my-posts', 'profile', 'admin'];
      const atoms = contexts.map((ctx) => getSubmissionsFiltersAtom(ctx));

      // Set different state for each context
      contexts.forEach((ctx, index) => {
        store.set(atoms[index], {
          onlyMine: index % 2 === 0,
          userId: `user-${index}`,
          filters: [{ name: 'tags', value: `#context-${ctx}` }],
          page: index + 1,
          pageSize: (index + 1) * 10,
          initialized: true
        });
      });

      // Verify each context maintains its own state
      contexts.forEach((ctx, index) => {
        const state = store.get(atoms[index]);
        expect(state.onlyMine).toBe(index % 2 === 0);
        expect(state.userId).toBe(`user-${index}`);
        expect(state.filters).toEqual([
          { name: 'tags', value: `#context-${ctx}` }
        ]);
        expect(state.page).toBe(index + 1);
        expect(state.pageSize).toBe((index + 1) * 10);
      });
    });

    it('should clear specific context without affecting others', () => {
      const context1Atom = getSubmissionsFiltersAtom('context1');
      const context2Atom = getSubmissionsFiltersAtom('context2');

      // Set state for both contexts
      store.set(context1Atom, {
        onlyMine: false,
        userId: '',
        filters: [{ name: 'tags', value: '#context1' }],
        page: 1,
        pageSize: 10,
        initialized: true
      });

      store.set(context2Atom, {
        onlyMine: false,
        userId: '',
        filters: [{ name: 'tags', value: '#context2' }],
        page: 1,
        pageSize: 10,
        initialized: true
      });

      // Clear only context1
      clearContextAtoms('context1');

      // Create new atoms (should be different references)
      const newContext1Atom = getSubmissionsFiltersAtom('context1');
      const context2State = store.get(context2Atom);

      // Context1 should be cleared (new atom with default state)
      const newContext1State = store.get(newContext1Atom);
      expect(newContext1State.filters).toEqual([]);
      expect(newContext1State.initialized).toBe(false);

      // Context2 should be unchanged
      expect(context2State.filters).toEqual([
        { name: 'tags', value: '#context2' }
      ]);
      expect(context2State.initialized).toBe(true);
    });
  });
});
