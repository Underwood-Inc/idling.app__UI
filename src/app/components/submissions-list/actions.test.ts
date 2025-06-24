import { PageSize } from 'src/lib/state/atoms';
import sql from '../../../lib/db';
import { getSubmissionsAction } from './actions';

// Mock the sql module
jest.mock('../../../lib/db', () => ({
  __esModule: true,
  default: {
    unsafe: jest.fn()
  }
}));

describe('getSubmissionsAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated submissions for onlyMine=true', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ total: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      onlyMine: true,
      userId: '123',
      filters: [],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toEqual(mockSubmissions);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should return paginated submissions for onlyMine=false', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ total: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toEqual(mockSubmissions);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should handle tag filters', async () => {
    const mockSubmissions = [
      { id: 1, title: 'Test Submission', tags: ['#test'] }
    ];
    const mockCount = [{ total: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [{ name: 'tags', value: 'test' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toEqual(mockSubmissions);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should handle page < 1', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ total: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [],
      page: 0,
      pageSize: PageSize.TEN
    });

    expect(result.data?.pagination.currentPage).toBe(1);
    expect(result.error).toBeUndefined();
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
  });

  it('should handle multiple tag filters', async () => {
    const mockSubmissions = [
      { id: 1, title: 'Test Submission', tags: ['#test', '#multiple'] }
    ];
    const mockCount = [{ total: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      onlyMine: true,
      userId: '123',
      filters: [{ name: 'tags', value: 'test,multiple' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toEqual(mockSubmissions);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should handle empty tag filters', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ total: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [{ name: 'tags', value: '' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.data?.data).toEqual(mockSubmissions);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should handle default values', async () => {
    const mockSubmissions = [
      {
        submission_id: 1,
        submission_name: 'test-submission',
        submission_title: 'Test Submission',
        submission_datetime: new Date(),
        user_id: 123,
        author: 'Test Author',
        tags: [],
        thread_parent_id: null
      }
    ];
    const mockCount = [{ total: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
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
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ total: 1 }];

    beforeEach(() => {
      (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
        if (query.includes('COUNT')) return Promise.resolve(mockCount);
        return Promise.resolve(mockSubmissions);
      });
    });

    it('should handle tag filters with AND logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react,typescript' },
          { name: 'tagLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('= ANY(s.tags) AND'),
        expect.arrayContaining(['react', 'typescript'])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should handle tag filters with OR logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react,vue' },
          { name: 'tagLogic', value: 'OR' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('s.tags && ARRAY'),
        expect.arrayContaining(['react', 'vue'])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should handle author filters with OR logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'author', value: '123,456' },
          { name: 'authorLogic', value: 'OR' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('s.user_id IN'),
        expect.arrayContaining([123, 456])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should handle mentions filters with AND logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'mentions', value: 'user1,user2' },
          { name: 'mentionsLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE') && expect.stringContaining('AND'),
        expect.arrayContaining(['%user1%', '%user1%', '%user2%', '%user2%'])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should handle mentions filters with OR logic', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'mentions', value: 'user1,user2' },
          { name: 'mentionsLogic', value: 'OR' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE') && expect.stringContaining('OR'),
        expect.arrayContaining(['%user1%', '%user1%', '%user2%', '%user2%'])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
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

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('AND'),
        expect.arrayContaining(['react', 123])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
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

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('OR'),
        expect.arrayContaining(['react', 123])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should handle complex filter combinations', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react,typescript' },
          { name: 'tagLogic', value: 'AND' },
          { name: 'author', value: '123,456' },
          { name: 'authorLogic', value: 'OR' },
          { name: 'mentions', value: 'user1' },
          { name: 'mentionsLogic', value: 'OR' },
          { name: 'globalLogic', value: 'AND' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
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
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should handle hash prefix removal from tags', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [{ name: 'tags', value: '#react,#typescript' }],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('s.tags && ARRAY'),
        expect.arrayContaining(['react', 'typescript'])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should ignore empty filter values', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: '' },
          { name: 'author', value: '  ' },
          { name: 'mentions', value: 'user1' }
        ],
        page: 1,
        pageSize: 10
      });

      // Should only process mentions filter
      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%user1%', '%user1%'])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should handle whitespace-only and comma-only filter values', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: '  ,  ,react,  ' },
          { name: 'author', value: '  123  ,  ,  456  ' }
        ],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['react', 123, 456])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should handle special characters in filter values', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [
          { name: 'tags', value: 'react-hooks,@types/node' },
          { name: 'mentions', value: "user's name,user@domain.com" }
        ],
        page: 1,
        pageSize: 10
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          'react-hooks',
          '@types/node',
          "%user's name%",
          "%user's name%",
          '%user@domain.com%',
          '%user@domain.com%'
        ])
      );
      expect(result.data?.data).toEqual(mockSubmissions);
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

      // Should not include thread_parent_id IS NULL when includeThreadReplies is true
      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.not.stringContaining('thread_parent_id IS NULL'),
        expect.any(Array)
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });

    it('should exclude thread replies by default', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 10,
        includeThreadReplies: false
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('thread_parent_id IS NULL'),
        expect.any(Array)
      );
      expect(result.data?.data).toEqual(mockSubmissions);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (sql.unsafe as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 10
      });

      expect(result.error).toBe('Database connection failed');
      expect(result.data).toBeUndefined();
    });

    it('should handle count query errors', async () => {
      (sql.unsafe as jest.Mock)
        .mockResolvedValueOnce([{ id: 1 }]) // Main query succeeds
        .mockRejectedValueOnce(new Error('Count query failed')); // Count query fails

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 10
      });

      expect(result.error).toBe('Count query failed');
      expect(result.data).toBeUndefined();
    });

    it('should handle invalid count response', async () => {
      (sql.unsafe as jest.Mock)
        .mockResolvedValueOnce([{ id: 1 }]) // Main query
        .mockResolvedValueOnce([]); // Empty count response

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 10
      });

      expect(result.data?.pagination.totalRecords).toBe(0);
      expect(result.data?.data).toEqual([{ id: 1 }]);
    });

    it('should handle invalid author IDs', async () => {
      const mockSubmissions = [{ id: 1, title: 'Test' }];
      const mockCount = [{ total: 1 }];

      (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
        if (query.includes('COUNT')) return Promise.resolve(mockCount);
        return Promise.resolve(mockSubmissions);
      });

      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [{ name: 'author', value: 'invalid,123,not-a-number' }],
        page: 1,
        pageSize: 10
      });

      // Should handle NaN values gracefully
      expect(result.data?.data).toEqual(mockSubmissions);
    });
  });

  describe('Pagination Edge Cases', () => {
    const mockSubmissions = [{ id: 1, title: 'Test' }];
    const mockCount = [{ total: 100 }];

    beforeEach(() => {
      (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
        if (query.includes('COUNT')) return Promise.resolve(mockCount);
        return Promise.resolve(mockSubmissions);
      });
    });

    it('should handle large page numbers', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1000,
        pageSize: 10
      });

      // Should calculate correct offset
      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('OFFSET'),
        expect.arrayContaining([9990, 10]) // (1000-1) * 10 = 9990
      );
      expect(result.data?.pagination.currentPage).toBe(1000);
    });

    it('should handle large page sizes', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 1000
      });

      expect(sql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([0, 1000])
      );
      expect(result.data?.pagination.pageSize).toBe(1000);
    });

    it('should handle zero page size', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 0
      });

      // Should use default page size
      expect(result.data?.pagination.pageSize).toBe(10);
    });

    it('should handle negative page numbers', async () => {
      const result = await getSubmissionsAction({
        onlyMine: false,
        userId: '',
        filters: [],
        page: -5,
        pageSize: 10
      });

      // Should clamp to page 1
      expect(result.data?.pagination.currentPage).toBe(1);
    });
  });
});
