import { PageSize } from 'src/lib/state/PaginationContext';
import sql from '../../../lib/db';
import { getSubmissions, getSubmissionsAction } from './actions';

// Mock the sql module
jest.mock('../../../lib/db', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('getSubmissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated submissions for onlyMine=true', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ count: 1 }];

    (sql as unknown as jest.Mock).mockImplementation((strings, ...values) => {
      if (strings[0].includes('COUNT')) return Promise.resolve(mockCount);
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

    (sql as unknown as jest.Mock).mockImplementation((strings, ...values) => {
      if (strings[0].includes('COUNT')) return Promise.resolve(mockCount);
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

    (sql as unknown as jest.Mock).mockImplementation((strings, ...values) => {
      if (strings[0].includes('COUNT')) return Promise.resolve(mockCount);
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

    (sql as unknown as jest.Mock).mockImplementation((strings, ...values) => {
      if (strings[0].includes('COUNT')) return Promise.resolve(mockCount);
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

    (sql as unknown as jest.Mock).mockImplementation((strings, ...values) => {
      if (strings[0].includes('COUNT')) return Promise.resolve(mockCount);
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

    (sql as unknown as jest.Mock).mockImplementation((strings, ...values) => {
      if (strings[0].includes('COUNT')) return Promise.resolve(mockCount);
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
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ count: 1 }];

    (sql as unknown as jest.Mock).mockImplementation((strings, ...values) => {
      if (strings[0].includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      currentPage: 1,
      pageSize: PageSize.TEN,
      onlyMine: false,
      providerAccountId: '',
      filters: []
    });

    expect(result.data?.result).toEqual(mockSubmissions);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBe('');
    expect(result.message).toBe('');
  });

  it('should handle default values', async () => {
    const mockSubmissions = [{ id: 1, title: 'Test Submission' }];
    const mockCount = [{ count: 1 }];

    (sql as unknown as jest.Mock).mockImplementation((strings, ...values) => {
      if (strings[0].includes('COUNT')) return Promise.resolve(mockCount);
      return Promise.resolve(mockSubmissions);
    });

    const result = await getSubmissionsAction({
      // @ts-expect-error branch test coverage
      currentPage: undefined,
      // @ts-expect-error branch test coverage
      pageSize: undefined,
      onlyMine: false,
      providerAccountId: '',
      filters: []
    });

    expect(result.data?.pagination.currentPage).toBe(1);
    expect(result.data?.pagination.pageSize).toBe(PageSize.TEN);
    expect(result.data?.result).toEqual(mockSubmissions);
    expect(result.data?.pagination.totalRecords).toBe(1);
    expect(result.error).toBe('');
    expect(result.message).toBe('');
  });
});
