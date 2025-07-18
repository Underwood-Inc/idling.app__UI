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

      const result = await validateCreateSubmissionFormAction(
        { status: 0 },
        formData
      );

      expect(result.error).toBeDefined();
    });

    it('should return a success message for valid input', async () => {
      (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } });

      const formData = new FormData();
      formData.append('submission_title', 'Valid Title');
      formData.append('submission_name', 'Valid Submission');

      const result = await validateCreateSubmissionFormAction(
        { status: 0 },
        formData
      );

      expect(result.status).toBe(0);
      expect(result.message).toBe('');
    });

    it('should return an error for missing session', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('submission_title', 'Valid Title');
      formData.append('submission_name', 'Valid Submission');

      const result = await validateCreateSubmissionFormAction(
        { status: 0 },
        formData
      );

      expect(result.error).toBe('Session error. Please login again.');
    });

    it('returns an error when session or user name is missing', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('submission_title', 'Test Title');
      formData.append('submission_name', 'Test Submission');
      formData.append('submission_tags', 'tag1,tag2');

      const result = await validateCreateSubmissionFormAction(
        { status: 0 },
        formData
      );

      expect(result.error).toBe('Session error. Please login again.');
    });

    it('should handle form data with tags', async () => {
      (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } });

      const formData = new FormData();
      formData.append('submission_title', 'Valid Title');
      formData.append('submission_content', 'Valid Submission Content');
      formData.append('submission_tags', '#tag1,#tag2');

      const result = await validateCreateSubmissionFormAction(
        { status: 0 },
        formData
      );

      expect(result.status).toBe(0);
      expect(result.message).toBe('');
    });
  });

  describe('createSubmissionAction', () => {
    it('should create a submission successfully', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', id: '123' }
      });
      // Mock the user lookup first, then successful insert
      const mockSql = jest
        .fn()
        .mockResolvedValueOnce([{ id: 123, name: 'Test User' }]) // User lookup
        .mockResolvedValueOnce({ rowCount: 1 }); // Insert submission
      (sql as unknown as jest.Mock).mockImplementation(mockSql);

      const formData = new FormData();
      formData.append('submission_title', 'New Title');
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(1);
      expect(result.message).toContain('Added post');
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('should return an error for invalid input', async () => {
      const formData = new FormData();
      formData.append('submission_title', ''); // Empty title should fail validation
      formData.append('submission_name', '');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBeDefined();
    });

    it('should return an error for missing session', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('submission_title', 'New Title');
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Session error. Please login again.');
    });

    it('should return an error when SQL insert fails', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', id: '123' }
      });
      (sql as unknown as jest.Mock).mockRejectedValue(new Error('SQL error'));

      const formData = new FormData();
      formData.append('submission_title', 'New Title');
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Failed to create post.');
    });

    it('should extract tags from submission title', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', id: '123' }
      });
      // Mock the user lookup query first
      const mockSql = jest
        .fn()
        .mockResolvedValueOnce([{ id: 123, name: 'Test User' }]) // User lookup
        .mockResolvedValueOnce({ rowCount: 1 }); // Insert submission
      (sql as unknown as jest.Mock).mockImplementation(mockSql);

      const formData = new FormData();
      formData.append('submission_title', 'New Title #tag1 #tag2');
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(mockSql).toHaveBeenCalledTimes(2);
      // Check the second call (insert submission) contains the insert query (case insensitive)
      const insertCall = mockSql.mock.calls[1];
      expect(insertCall[0][0].toLowerCase()).toContain(
        'insert into submissions'
      );
      // Check that tags were extracted from title - they should be in the SQL parameters array
      const allParams = insertCall.slice(1); // Skip the query string
      const tagsParam = allParams.find(
        (param: any) => Array.isArray(param) && param.length === 2
      );
      expect(tagsParam).toEqual(['tag1', 'tag2']); // tags are normalized without # prefix
    });

    it('should handle submission without tags', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', id: '123' }
      });
      // Mock the user lookup query first, then successful insert
      const mockSql = jest
        .fn()
        .mockResolvedValueOnce([{ id: 123, name: 'Test User' }]) // User lookup
        .mockResolvedValueOnce({ rowCount: 1 }); // Insert submission
      (sql as unknown as jest.Mock).mockImplementation(mockSql);

      const formData = new FormData();
      formData.append('submission_title', 'New Title without tags');
      formData.append('submission_name', 'New Submission without tags');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(1);
      expect(result.message).toContain('Added post');

      // Split assertions for mockSql arguments
      expect(mockSql).toHaveBeenCalledTimes(2);
      const insertCall = mockSql.mock.calls[1];
      expect(insertCall[0][0].toLowerCase()).toContain(
        'insert into submissions'
      );
      // Check for empty tags array in the parameters
      const allParams = insertCall.slice(1);
      const tagsParam = allParams.find((param: any) => Array.isArray(param));
      expect(tagsParam).toEqual([]); // tags should be empty array

      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('should return an error when session or user information is incomplete', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User' } // Missing id
      });

      const formData = new FormData();
      formData.append('submission_title', 'New Title');
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Authentication error.');
    });

    it('should return an error when session is present but id is missing', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User' } // Missing id
      });

      const formData = new FormData();
      formData.append('submission_title', 'New Title');
      formData.append('submission_name', 'New Submission');

      const result = await createSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(-1);
      expect(result.error).toBe('Authentication error.');
    });
  });

  describe('deleteSubmissionAction', () => {
    it('should delete a submission successfully', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: '123' }
      });

      // Mock the SQL calls for delete action
      (sql as unknown as jest.Mock)
        .mockResolvedValueOnce([{ reply_count: 0 }]) // Reply check query
        .mockResolvedValueOnce([
          { submission_id: 1, submission_title: 'Test Submission' }
        ]) // Submission check query
        .mockResolvedValueOnce({}); // Delete query

      const formData = new FormData();
      formData.append('submission_id', '1');
      formData.append('submission_name', 'Test Submission');

      const result = await deleteSubmissionAction({ status: 0 }, formData);

      expect(result.status).toBe(1);
      expect(result.message).toContain('Deleted post');
      // expect(revalidatePath).toHaveBeenCalledWith('/');
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
        user: { id: '123' }
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

    it('should return an error when session is present but id is missing', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { name: 'Test User' } // Missing id
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
        user: { id: '123' }
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
