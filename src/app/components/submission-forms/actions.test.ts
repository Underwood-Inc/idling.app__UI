import '@testing-library/jest-dom';
import { revalidatePath } from 'next/cache';
import { auth } from '../../../lib/auth';
import sql from '../../../lib/db';
import {
  createSubmissionAction,
  deleteSubmissionAction,
  validateCreateSubmissionFormAction
} from './actions';

// Mock dependencies
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn()
}));

jest.mock('../../../lib/db', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

// Add this at the top of the file, after imports
const originalConsoleError = console.error;
let consoleErrorSpy: jest.SpyInstance;

describe('Submission Form Actions', () => {
  /**
   * The functions we're testing might produce console.error messages.
   * Since we want to test all possible scenarios (100% coverage),
   * we need to prevent these error messages from appearing in our test output.
   * This helps avoid confusion when running the tests.
   */
  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    console.error = originalConsoleError;
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('validateCreateSubmissionFormAction', () => {
    it('should return an error for invalid input', async () => {
      const formData = new FormData();
      formData.append('submission_name', '');

      const result = await validateCreateSubmissionFormAction({}, formData);

      expect(result.error).toBeDefined();
    });

    it('should return a success message for valid input', async () => {
      (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } });

      const formData = new FormData();
      formData.append('submission_name', 'Valid Submission');

      const result = await validateCreateSubmissionFormAction({}, formData);

      expect(result.message).toBe('');
    });

    it('should return an error for missing session', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('submission_name', 'Valid Submission');

      const result = await validateCreateSubmissionFormAction({}, formData);

      expect(result.error).toBe('Session error. Please login again.');
    });

    it('returns an error when session or user name is missing', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('submission_name', 'Test Submission');
      formData.append('tags', 'tag1,tag2');

      const result = await validateCreateSubmissionFormAction({}, formData);

      expect(result.error).toBe('Session error. Please login again.');
    });

    it('should handle form data with tags', async () => {
      (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } });

      const formData = new FormData();
      formData.append('submission_name', 'Valid Submission');
      formData.append('tags', 'tag1');
      formData.append('tags', 'tag2');

      const result = await validateCreateSubmissionFormAction({}, formData);

      expect(result.message).toBe(undefined);
    });
  });

  describe('createSubmissionAction', () => {
    it('should create a submission successfully', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', providerAccountId: '123' }
      });
      (sql as unknown as jest.Mock).mockResolvedValue({});

      const formData = new FormData();
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(1);
      expect(result.message).toContain('Added post');
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('should return an error for invalid input', async () => {
      const formData = new FormData();
      formData.append('submission_name', '');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBeDefined();
    });

    it('should return an error for missing session', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Session error. Please login again.');
    });

    it('should return an error when SQL insert fails', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', providerAccountId: '123' }
      });
      (sql as unknown as jest.Mock).mockRejectedValue(new Error('SQL error'));

      const formData = new FormData();
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Failed to create post.');
    });

    it('should extract tags from submission name', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', providerAccountId: '123' }
      });
      const mockSql = jest.fn().mockResolvedValue({});
      (sql as unknown as jest.Mock).mockImplementation(mockSql);

      const formData = new FormData();
      formData.append('submission_name', 'New Submission #tag1 #tag2');

      await createSubmissionAction({ status: 0 }, formData);

      expect(mockSql).toHaveBeenCalledTimes(1);
      const sqlArgs = mockSql.mock.calls[0];
      expect(sqlArgs[0][0]).toContain('insert into submissions');
      expect(sqlArgs[1]).toBe('New Submission #tag1 #tag2');
      expect(sqlArgs[2]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO date format
      expect(sqlArgs[3]).toBe('Test User');
      expect(sqlArgs[4]).toBe('123');
      expect(sqlArgs[5]).toEqual(['#tag1', '#tag2']);
    });

    it('should handle submission without tags', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', providerAccountId: '123' }
      });
      const mockSql = jest.fn().mockResolvedValue({ rowCount: 1 });
      (sql as unknown as jest.Mock).mockImplementation(mockSql);

      const formData = new FormData();
      formData.append('submission_name', 'New Submission without tags');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(1);
      expect(result.message).toContain('Added post');

      // Split assertions for mockSql arguments
      expect(mockSql).toHaveBeenCalledTimes(1);
      const sqlArgs = mockSql.mock.calls[0];
      expect(sqlArgs[0][0]).toContain('insert into submissions');
      expect(sqlArgs[1]).toBe('New Submission without tags');
      expect(sqlArgs[2]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO date format
      expect(sqlArgs[3]).toBe('Test User');
      expect(sqlArgs[4]).toBe('123');
      expect(sqlArgs[5]).toEqual([]);

      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('should return an error when session or user information is incomplete', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User' } // Missing providerAccountId
      });

      const formData = new FormData();
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Authentication error.');
    });
  });

  describe('deleteSubmissionAction', () => {
    it('should delete a submission successfully', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { providerAccountId: '123' }
      });
      (sql as unknown as jest.Mock).mockResolvedValue({});

      const formData = new FormData();
      formData.append('submission_id', '1');
      formData.append('submission_name', 'Test Submission');

      const result = await deleteSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(1);
      expect(result.message).toContain('Deleted post');
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('should return an error for invalid input', async () => {
      const formData = new FormData();
      formData.append('submission_id', 'invalid');

      const result = await deleteSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBeDefined();
    });

    it('should return an error when SQL delete fails', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { providerAccountId: '123' }
      });
      (sql as unknown as jest.Mock).mockRejectedValue(new Error('SQL error'));

      const formData = new FormData();
      formData.append('submission_id', '1');
      formData.append('submission_name', 'Test Submission');

      const result = await deleteSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Failed to delete post.');
    });

    it('should return an error for missing session', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('submission_id', '1');
      formData.append('submission_name', 'Test Submission');

      const result = await deleteSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBeDefined();
    });

    it('should return an error when session is present but providerAccountId is missing', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User' } // Missing providerAccountId
      });

      const formData = new FormData();
      formData.append('submission_id', '1');
      formData.append('submission_name', 'Test Submission');

      const result = await deleteSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Authentication error.');
    });

    it('should return an error when parseDeleteSubmission fails', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { providerAccountId: '123' }
      });

      const formData = new FormData();
      // Omit submission_id to cause parseDeleteSubmission to fail
      formData.append('submission_name', 'Test Submission');

      const result = await deleteSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('submission_id');
    });
  });
});
