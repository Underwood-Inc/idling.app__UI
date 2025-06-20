import { PageSize } from 'src/lib/state/atoms';
import sql from '../../../lib/db';
import { getSubmissions, getSubmissionsAction } from './actions';

// Mock the sql module
jest.mock('../../../lib/db', () => ({
  __esModule: true,
  default: {
    unsafe: jest.fn()
  }
}));

describe('getSubmissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated submissions for onlyMine=true', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ count: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissions({
      onlyMine: true,
      providerAccountId: '123',
      filters: [],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.result).toEqual(mockSubmissions);
    expect(result.pagination.totalRecords).toBe(1);
  });

  it('should return paginated submissions for onlyMine=false', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ count: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissions({
      onlyMine: false,
      providerAccountId: '',
      filters: [],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.result).toEqual(mockSubmissions);
    expect(result.pagination.totalRecords).toBe(1);
  });

  it('should handle tag filters', async () => {
    const mockSubmissions = [
      { id: 1, title: 'Test Submission', tags: ['#test'] }
    ];
    const mockCount = [{ count: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissions({
      onlyMine: false,
      providerAccountId: '',
      filters: [{ name: 'tags', value: 'test' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.result).toEqual(mockSubmissions);
    expect(result.pagination.totalRecords).toBe(1);
  });

  it('should handle page < 1', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ count: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissions({
      onlyMine: false,
      providerAccountId: '',
      filters: [],
      page: 0,
      pageSize: PageSize.TEN
    });

    expect(result.pagination.currentPage).toBe(1);
  });

  it('should return empty result when onlyMine is true but providerAccountId is falsy', async () => {
    const result = await getSubmissions({
      onlyMine: true,
      providerAccountId: '',
      filters: [],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.result).toEqual([]);
    expect(result.pagination.totalRecords).toBe(0);
    expect(result.pagination.currentPage).toBe(1);
    expect(result.pagination.pageSize).toBe(PageSize.TEN);
    expect(result.pagination.totalPages).toBe(0);
  });

  it('should handle multiple tag filters', async () => {
    const mockSubmissions = [
      { id: 1, title: 'Test Submission', tags: ['#test', '#multiple'] }
    ];
    const mockCount = [{ count: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissions({
      onlyMine: true,
      providerAccountId: '123',
      filters: [{ name: 'tags', value: 'test,multiple' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.result).toEqual(mockSubmissions);
    expect(result.pagination.totalRecords).toBe(1);
  });

  it('should handle empty tag filters', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ count: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissions({
      onlyMine: false,
      providerAccountId: '',
      filters: [{ name: 'tags', value: '' }],
      page: 1,
      pageSize: PageSize.TEN
    });

    expect(result.result).toEqual(mockSubmissions);
    expect(result.pagination.totalRecords).toBe(1);
  });
});

describe('getSubmissionsAction', () => {
  it('should return paginated submissions', async () => {
    const mockSubmissions = [
      {
        submission_id: 1,
        submission_name: 'test-submission',
        submission_title: 'Test Submission',
        submission_datetime: new Date(),
        user_id: 123,
        author: 'Test Author',
        author_provider_account_id: 'test-provider-123',
        tags: [],
        thread_parent_id: null
      }
    ];
    const mockCount = [{ count: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      page: 1,
      pageSize: PageSize.TEN,
      onlyMine: false,
      providerAccountId: '123',
      filters: []
    });

    expect(result.data?.data).toHaveLength(1);
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
        author_provider_account_id: 'test-provider-123',
        tags: [],
        thread_parent_id: null
      }
    ];
    const mockCount = [{ count: 1 }];

    (sql.unsafe as jest.Mock).mockImplementation((query, params) => {
      if (query.includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      page: undefined,
      pageSize: undefined,
      onlyMine: false,
      providerAccountId: '123',
      filters: []
    });

    expect(result.data?.pagination.currentPage).toBe(1);
    expect(result.data?.pagination.pageSize).toBe(10);
    expect(result.data?.data).toHaveLength(1);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });
});
