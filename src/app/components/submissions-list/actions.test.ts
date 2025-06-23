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
});
