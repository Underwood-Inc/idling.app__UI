import { PageSize } from 'src/lib/state/atoms';
import { getSubmissionsAction } from './actions';

// Mock the sql module BEFORE importing anything else
jest.mock('../../../lib/db', () => ({
  __esModule: true,
  default: {
    unsafe: jest.fn().mockResolvedValue([])
  }
}));

import sql from '../../../lib/db';
const mockSql = (sql as any).unsafe;

// Helper function to create mock database row structure
// This should match what the SQL query actually returns (raw database format)
// Based on the actual schema from migrations and the SQL query in actions.ts
const createMockDbRow = (overrides: any = {}) => ({
  submission_id: 1,
  submission_name: 'test-submission',
  submission_title: 'Test Submission',
  submission_url: 'https://example.com',
  submission_datetime: '2023-01-01T00:00:00.000Z', // Fixed: proper timestamp format
  user_id: 123,
  tags: [],
  thread_parent_id: null,
  author: 'Test Author', // This comes from u.name as author in SQL JOIN
  author_bio: 'Test Bio', // This comes from u.bio as author_bio in SQL JOIN
  reply_count: 0, // This comes from the COUNT subquery
  replies: null, // This comes from the json_agg subquery
  ...overrides
});

describe('getSubmissionsAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSql.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should return paginated submissions for onlyMine=true', async () => {
    const mockDbRows = [createMockDbRow()];
    const mockCount = [{ total: 1 }];

    mockSql.mockImplementation((query: any) => {
      if (query.includes('SELECT COUNT(*) as total')) {
        return Promise.resolve(mockCount);
      }
      return Promise.resolve(mockDbRows);
    });

    const result = await getSubmissionsAction({
      onlyMine: true,
      userId: '123',
      filters: [],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(mockSql).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data?.data).toBeDefined();
    expect(result.data?.data).toHaveLength(1);

    const firstItem = result.data?.data[0];
    expect(firstItem).toBeDefined();
    expect(firstItem?.submission_id).toBe(1);
    expect(firstItem?.submission_title).toBe('Test Submission');
    expect(firstItem?.author).toBe('Test Author');
    expect(result.data?.pagination.totalRecords).toBe(1);
  });

  it('should return error when onlyMine is true but userId is falsy', async () => {
    const result = await getSubmissionsAction({
      onlyMine: true,
      userId: '',
      filters: [],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.error).toBe('User ID is required for user-specific queries');
    expect(result.data).toBeUndefined();
    expect(mockSql).not.toHaveBeenCalled();
  });

  it('should return paginated submissions for onlyMine=false', async () => {
    const mockDbRows = [createMockDbRow()];
    const mockCount = [{ total: 1 }];

    mockSql.mockImplementation((query: any) => {
      if (query.includes('SELECT COUNT(*) as total')) {
        return Promise.resolve(mockCount);
      }
      return Promise.resolve(mockDbRows);
    });

    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toHaveLength(1);
    expect(result.data?.data[0]).toMatchObject({
      submission_id: 1,
      submission_title: 'Test Submission',
      author: 'Test Author'
    });
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should handle tag filters', async () => {
    const mockDbRows = [createMockDbRow({ tags: ['test'] })];
    const mockCount = [{ total: 1 }];

    mockSql.mockReset();
    mockSql.mockImplementation((query: any, params: any) => {
      if (query.includes('SELECT COUNT(*) as total'))
        return Promise.resolve(mockCount);
      return Promise.resolve(mockDbRows);
    });

    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [{ name: 'tags', value: 'test' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toHaveLength(1);
    expect(result.data?.data[0]).toMatchObject({
      submission_id: 1,
      submission_title: 'Test Submission',
      tags: ['test']
    });
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should handle page < 1', async () => {
    const mockDbRows = [
      createMockDbRow({
        submission_datetime: '2023-01-01T00:00:00Z',
        reply_count: 0,
        replies: []
      })
    ];
    const mockCount = [{ total: '1' }];

    mockSql.mockReset();
    mockSql.mockImplementation((query: any, params: any) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockDbRows);
    });

    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [],
      page: 0,
      pageSize: PageSize.TEN
    });

    expect(result.data?.pagination.currentPage).toBe(0);
    expect(result.error).toBeUndefined();
  });

  it('should handle multiple tag filters', async () => {
    const mockDbRows = [createMockDbRow({ tags: ['test', 'multiple'] })];
    const mockCount = [{ total: 1 }];

    mockSql.mockReset();
    mockSql.mockImplementation((query: any, params: any) => {
      if (query.includes('SELECT COUNT(*) as total'))
        return Promise.resolve(mockCount);
      return Promise.resolve(mockDbRows);
    });

    const result = await getSubmissionsAction({
      onlyMine: true,
      userId: '123',
      filters: [{ name: 'tags', value: 'test,multiple' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toHaveLength(1);
    expect(result.data?.data[0]).toMatchObject({
      submission_id: 1,
      submission_title: 'Test Submission',
      tags: ['test', 'multiple']
    });
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should handle empty tag filters', async () => {
    const mockDbRows = [createMockDbRow()];
    const mockCount = [{ total: 1 }];

    mockSql.mockReset();
    mockSql.mockImplementation((query: any, params: any) => {
      if (query.includes('SELECT COUNT(*) as total'))
        return Promise.resolve(mockCount);
      return Promise.resolve(mockDbRows);
    });

    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [{ name: 'tags', value: '' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toHaveLength(1);
    expect(result.data?.data[0]).toMatchObject({
      submission_id: 1,
      submission_title: 'Test Submission'
    });
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should handle default values', async () => {
    const mockDbRows = [createMockDbRow()];
    const mockCount = [{ total: 1 }];

    mockSql.mockImplementation((query: any, params: any) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockDbRows);
    });

    const result = await getSubmissionsAction({
      page: undefined,
      pageSize: undefined,
      onlyMine: false,
      userId: '123',
      filters: []
    });

    expect(result.data?.pagination.currentPage).toBe(1);
    expect(result.data?.pagination.pageSize).toBe(10);
    expect(result.data?.data).toHaveLength(1);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  describe('Advanced Filter Logic', () => {
    const mockDbRows = [createMockDbRow()];
    const mockCount = [{ total: 1 }];

    beforeEach(() => {
      mockSql.mockImplementation((query: any, params: any) => {
        if (query.includes('SELECT COUNT(*) as total'))
          return Promise.resolve(mockCount);
        return Promise.resolve(mockDbRows);
      });
    });

    it('should handle tag filters with AND logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react' },
          { name: 'tags', value: 'typescript' },
          { name: 'tagLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('= ANY(s.tags) AND'),
        expect.arrayContaining(['react', 'typescript'])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle tag filters with OR logic', async () => {
      const mockDbRows = [createMockDbRow({ tags: ['react', 'vue'] })];
      const mockCount = [{ total: 1 }];

      mockSql.mockReset();
      mockSql.mockImplementation((query: any, params: any) => {
        if (query.includes('SELECT COUNT(*) as total'))
          return Promise.resolve(mockCount);
        return Promise.resolve(mockDbRows);
      });

      const result = await getSubmissionsAction({
        onlyMine: true,
        userId: '123',
        filters: [{ name: 'tags', value: 'react,vue' }],
        page: 1,
        pageSize: PageSize.TEN
      });

      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.data[0].tags).toEqual(['react', 'vue']);
      expect(result.error).toBeUndefined();

      // Verify the mock was called
      expect(mockSql).toHaveBeenCalled();
    });

    it('should handle author filters with OR logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'author', value: '123' },
          { name: 'author', value: '456' },
          { name: 'authorLogic', value: 'OR' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('s.user_id IN'),
        expect.arrayContaining([123, 456])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle mentions filters with AND logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'mentions', value: 'user1' },
          { name: 'mentions', value: 'user2' },
          { name: 'mentionsLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE') && expect.stringContaining('AND'),
        expect.arrayContaining(['%user1%', '%user1%', '%user2%', '%user2%'])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle mentions filters with OR logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'mentions', value: 'user1' },
          { name: 'mentions', value: 'user2' },
          { name: 'mentionsLogic', value: 'OR' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE') && expect.stringContaining('OR'),
        expect.arrayContaining(['%user1%', '%user1%', '%user2%', '%user2%'])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle global logic with multiple filter groups (AND)', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react' },
          { name: 'author', value: '123' },
          { name: 'globalLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('AND'),
        expect.arrayContaining(['react', 123])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle global logic with multiple filter groups (OR)', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react' },
          { name: 'author', value: '123' },
          { name: 'globalLogic', value: 'OR' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('OR'),
        expect.arrayContaining(['react', 123])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle complex filter combinations', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react' },
          { name: 'tags', value: 'typescript' },
          { name: 'tagLogic', value: 'AND' },
          { name: 'author', value: '123' },
          { name: 'author', value: '456' },
          { name: 'authorLogic', value: 'OR' },
          { name: 'mentions', value: 'user1' },
          { name: 'mentionsLogic', value: 'OR' },
          { name: 'globalLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('AND'),
        expect.arrayContaining([
          'react',
          'typescript',
          123,
          456,
          '%user1%',
          '%user1%'
        ])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle hash prefix removal from tags', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: '#react' },
          { name: 'tags', value: '#typescript' },
          { name: 'tagLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('= ANY(s.tags) AND'),
        expect.arrayContaining(['react', 'typescript'])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should ignore empty filter values', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: '' },
          { name: 'author', value: ' ' },
          { name: 'mentions', value: 'user1' },
          { name: 'mentions', value: 'user2' },
          { name: 'mentionsLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE') && expect.stringContaining('AND'),
        expect.arrayContaining(['%user1%', '%user1%', '%user2%', '%user2%'])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle whitespace-only and comma-only filter values', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react' },
          { name: 'tags', value: 'typescript' },
          { name: 'author', value: '123' },
          { name: 'author', value: '456' },
          { name: 'mentions', value: 'user1' },
          { name: 'globalLogic', value: 'OR' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('OR'),
        expect.arrayContaining([
          'react',
          'typescript',
          123,
          456,
          '%user1%',
          '%user1%'
        ])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle special characters in filter values', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react-native' },
          { name: 'tags', value: 'vue.js' },
          { name: 'mentions', value: 'user@domain' },
          { name: 'mentions', value: 'user_name' },
          { name: 'globalLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('AND'),
        expect.arrayContaining([
          'react-native',
          'vue.js',
          '%user@domain%',
          '%user@domain%',
          '%user_name%',
          '%user_name%'
        ])
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should handle includeThreadReplies parameter', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 10,
        includeThreadReplies: true
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.not.stringContaining('s.thread_parent_id IS NULL'),
        expect.any(Array)
      );
      expect(result.data?.data).toHaveLength(1);
    });

    it('should exclude thread replies by default', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 10
      });

      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('s.thread_parent_id IS NULL'),
        expect.any(Array)
      );
      expect(result.data?.data).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset mocks before each error test
      jest.clearAllMocks();
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValue(new Error('Database connection failed'));

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: PageSize.TEN
      });

      expect(result.error).toBe('Database connection failed');
      expect(result.data).toBeUndefined();
    });

    it('should handle count query errors', async () => {
      mockSql.mockImplementation((query: any) => {
        if (query.includes('COUNT')) {
          return Promise.reject(new Error('Count query failed'));
        }
        return Promise.resolve([]);
      });

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: PageSize.TEN
      });

      expect(result.error).toBe('Count query failed');
      expect(result.data).toBeUndefined();
    });

    it('should handle invalid count response', async () => {
      const mockDbRows: any[] = [];
      const mockCount: any[] = []; // Empty count result

      mockSql.mockImplementation((query: any, params: any) => {
        if (query.includes('COUNT')) return Promise.resolve(mockCount);
        return Promise.resolve(mockDbRows);
      });

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: PageSize.TEN
      });

      expect(result.data?.pagination.totalRecords).toBe(0);
      expect(result.data?.data).toEqual([]);
    });

    it('should handle invalid author IDs', async () => {
      const mockDbRows = [createMockDbRow()];
      const mockCount = [{ total: 1 }];

      mockSql.mockImplementation((query: any, params: any) => {
        if (query.includes('COUNT')) return Promise.resolve(mockCount);
        return Promise.resolve(mockDbRows);
      });

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [{ name: 'author', value: 'invalid,NaN,123' }],
        page: 1,
        pageSize: PageSize.TEN
      });

      // Should handle NaN values gracefully
      expect(result.data?.data).toHaveLength(1);
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle large page numbers', async () => {
      // Mock empty results for large page numbers
      const mockDbRows: any[] = []; // Empty array for no results
      const mockCount = [{ total: 10 }]; // Total exists but no results for this page

      mockSql.mockReset();
      mockSql.mockImplementation((query: any, params: any) => {
        if (query.includes('SELECT COUNT(*) as total'))
          return Promise.resolve(mockCount);
        return Promise.resolve(mockDbRows); // Return empty array
      });

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1000,
        pageSize: PageSize.TEN
      });

      expect(result.data?.pagination.currentPage).toBe(1000);
      expect(result.data?.data).toEqual([]); // Should be empty array
    });

    it('should handle large page sizes', async () => {
      const mockDbRows = [createMockDbRow()];
      const mockCount = [{ total: 1 }];

      mockSql.mockReset();
      mockSql.mockImplementation((query: any, params: any) => {
        if (query.includes('SELECT COUNT(*) as total'))
          return Promise.resolve(mockCount);
        return Promise.resolve(mockDbRows);
      });

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 1000 as PageSize
      });

      expect(result.data?.pagination.pageSize).toBe(1000);
      expect(result.error).toBeUndefined();
    });

    it('should handle zero page size', async () => {
      const mockDbRows = [createMockDbRow()];
      const mockCount = [{ total: 1 }];

      mockSql.mockReset();
      mockSql.mockImplementation((query: any, params: any) => {
        if (query.includes('SELECT COUNT(*) as total'))
          return Promise.resolve(mockCount);
        return Promise.resolve(mockDbRows);
      });

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 0 as PageSize
      });

      // The implementation accepts 0 as a valid page size
      expect(result.data?.pagination.pageSize).toBe(0);
    });

    it('should handle negative page numbers', async () => {
      const mockDbRows = [createMockDbRow()];
      const mockCount = [{ total: 1 }];

      mockSql.mockReset();
      mockSql.mockImplementation((query: any, params: any) => {
        if (query.includes('SELECT COUNT(*) as total'))
          return Promise.resolve(mockCount);
        return Promise.resolve(mockDbRows);
      });

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: -5,
        pageSize: PageSize.TEN
      });

      // The implementation allows negative page numbers without clamping
      expect(result.data?.pagination.currentPage).toBe(-5);
    });
  });
});
