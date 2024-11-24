/* eslint-disable no-import-assign */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import path from 'path';
import { createInterface } from 'readline';

// Add setImmediate mock
global.setImmediate = Object.assign(
  jest.fn((callback: (...args: any[]) => void) => {
    callback();
    // eslint-disable-next-line no-undef
    return {} as NodeJS.Immediate;
  }),
  { __promisify__: jest.fn(() => Promise.resolve()) }
) as unknown as typeof setImmediate;

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockImplementation((path: unknown) => {
    if (typeof path === 'string') {
      if (path.includes('migrations')) {
        // This will allow us to override the implementation for specific tests
        const mockFn = jest.fn().mockImplementation(() => Promise.resolve());
        const implementation = mockFn.getMockImplementation();
        return implementation ? implementation(path) : Promise.resolve();
      }
    }
    return Promise.reject(
      new Error(`Mock: Cannot create directory ${String(path)}`)
    );
  })
}));

jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn((query: string, callback: (answer: string) => void) => {
      callback('Add Users Table');
      return Promise.resolve();
    }),
    close: jest.fn()
  }))
}));
const mockSql = jest.fn(() => Promise.resolve([])) as Mock & {
  begin: Mock;
  unsafe: Mock;
};
mockSql.begin = jest.fn().mockImplementation(async (callback: any) => {
  await callback(mockSql);
  return Promise.resolve();
});
mockSql.unsafe = jest.fn();

jest.mock('../src/lib/db', () => {
  return {
    __esModule: true,
    default: mockSql
  };
});

// Import the functions to test
import { ensureMigrationsDir, fileUtils } from './migrations';

const fileUtilsSpy = jest.spyOn(fileUtils, 'exists');

describe('Database Migrations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(path, 'join').mockReturnValue('/test/migrations');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ensureMigrationsDir', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('creates migrations directory if it does not exist', async () => {
      jest.spyOn(fileUtils, 'exists').mockReturnValue(false);

      await ensureMigrationsDir();

      expect(fileUtilsSpy).toHaveBeenCalled();
      expect(fileUtilsSpy.mock.calls[0][0]).toContain('/migrations');
    });

    it('does not create directory if it already exists', async () => {
      jest.spyOn(fileUtils, 'exists').mockReturnValue(true);

      await ensureMigrationsDir();

      expect(fileUtilsSpy).toHaveBeenCalled();
      expect(fileUtilsSpy.mock.calls[0][0]).toContain('/migrations');
    });
    it('handles EEXIST error gracefully', async () => {
      const error = new Error('File exists') as Error & { code: string };
      error.code = 'EEXIST';
      const mkdirMock = jest.spyOn(require('fs/promises'), 'mkdir');
      mkdirMock.mockRejectedValueOnce(error);

      await expect(ensureMigrationsDir()).resolves.not.toThrow();
    });
  });

  describe('getNextMigrationNumber', () => {
    let mockFs: typeof import('fs');

    beforeEach(() => {
      jest.clearAllMocks();
      // Reset the module registry before each test
      jest.resetModules();
      // Create fresh mocks
      mockFs = {
        readdirSync: jest.fn(),
        existsSync: jest.fn(),
        writeFileSync: jest.fn(),
        readFileSync: jest.fn()
      } as unknown as typeof import('fs');
      // Mock the fs module
      jest.mock('fs', () => mockFs);
    });

    it('returns next number based on existing migrations', async () => {
      (mockFs.readdirSync as Mock).mockReturnValue(['0000-first.sql']);

      // Re-import the module to get fresh instance with new mocks
      const { getNextMigrationNumber } = require('./migrations');
      const result = await getNextMigrationNumber();
      expect(result).toBe('0001');
    });

    it('handles non-sequential numbers', async () => {
      (mockFs.readdirSync as Mock).mockReturnValue([
        '0000-first.sql',
        '0002-third.sql'
      ]);

      // Re-import the module to get fresh instance with new mocks
      const { getNextMigrationNumber } = require('./migrations');
      const result = await getNextMigrationNumber();
      expect(result).toBe('0003');
    });
  });

  describe('createNewMigration', () => {
    let mockFs: typeof import('fs');
    let mockReadline: typeof import('readline');

    beforeEach(() => {
      jest.clearAllMocks();
      // Reset the module registry before each test
      jest.resetModules();
      // Create fresh mocks
      mockFs = {
        readdirSync: jest.fn(),
        existsSync: jest.fn().mockReturnValue(true),
        writeFileSync: jest.fn(),
        readFileSync: jest.fn()
      } as unknown as typeof import('fs');
      mockReadline = {
        createInterface: jest.fn()
      } as unknown as typeof import('readline');
      // Mock the fs and readline modules
      jest.mock('fs', () => mockFs);
      jest.mock('readline', () => mockReadline);
    });

    it('creates a new migration file with correct naming', async () => {
      const consoleSpy = jest
        .spyOn(console, 'info')
        .mockImplementation(() => {});
      (mockFs.readdirSync as Mock).mockReturnValue([]);
      (mockFs.existsSync as Mock).mockReturnValue(true); // Directory exists

      // Get the mock readline interface's close method directly from the mock
      const mockClose = jest.fn();
      (mockReadline.createInterface as jest.Mock).mockReturnValue({
        question: jest.fn(
          (query: string, callback: (answer: string) => void) => {
            callback('Add Users Table');
            return Promise.resolve();
          }
        ),
        close: mockClose
      });

      // Re-import the module to get fresh instance with new mocks
      const { createNewMigration } = require('./migrations');
      await createNewMigration();
      // jest.spyOn(path, 'join').mockReturnValue('/test/migrations');

      // Verify file creation
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/migrations',
        '-- Migration: Add Users Table\n\n'
      );

      // Verify console output without colors
      const calls = consoleSpy.mock.calls;
      expect(calls[1]).toEqual([
        '✓',
        'Created new migration: 0000-add-users-table.sql'
      ]);

      expect(mockClose).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('runMigration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('skips already executed migrations', async () => {
      // Mock the initial check for existing migration
      // @ts-expect-error Mocking a void return type
      mockSql.mockResolvedValueOnce([]);
      mockSql.begin.mockImplementation(async (callback: any) => {
        await callback(mockSql);
        return Promise.resolve();
      });

      const { runMigration } = require('./migrations');
      await runMigration('/path/to/migration.sql', 'migration.sql');

      // Verify the migration check was performed
      expect(mockSql).toHaveBeenCalledTimes(3);

      // First call should create migrations table
      const [createTableCall] = mockSql.mock.calls[0] as [string];
      expect(createTableCall[0]).toContain(
        'CREATE TABLE IF NOT EXISTS migrations'
      );

      // Second call should check for existing migration
      const [selectQuery, filename] = mockSql.mock.calls[1] as [string, string];
      expect(selectQuery[0]).toContain(
        'SELECT * FROM migrations WHERE filename ='
      );
      expect(filename).toBe('migration.sql');

      // Verify transaction was started
      expect(mockSql.begin).toHaveBeenCalled();
    });

    describe('executes and records successful migrations', () => {
      let mockFs: typeof import('fs');

      beforeEach(() => {
        jest.clearAllMocks();
        // Reset the module registry before each test
        jest.resetModules();

        // Create fresh mocks
        mockFs = {
          readdirSync: jest.fn(),
          existsSync: jest.fn(),
          writeFileSync: jest.fn(),
          readFileSync: jest.fn()
        } as unknown as typeof import('fs');

        // Mock the fs module
        jest.mock('fs', () => mockFs);

        // Reset mockSql
        mockSql.mockReset();
        mockSql.begin = jest.fn().mockImplementation(async (callback: any) => {
          await callback(mockSql);
          return Promise.resolve();
        });
      });

      it('executes and records successful migrations', async () => {
        // Mock the initial check for existing migration
        mockSql
          // @ts-expect-error
          .mockResolvedValueOnce([]) // First call: create migrations table
          // @ts-expect-error
          .mockResolvedValueOnce([]) // Second call: check existing migration
          // @ts-expect-error
          .mockResolvedValueOnce([]); // Third call: record migration

        const { runMigration } = require('./migrations');
        await runMigration('/path/to/migration.sql', 'migration.sql');

        // Verify file was read
        expect(mockFs.readFileSync).toHaveBeenCalledWith(
          '/path/to/migration.sql',
          'utf8'
        );

        // Verify the migration check was performed
        const [createTableCall] = mockSql.mock.calls[0] as [string];
        expect(createTableCall[0]).toContain(
          'CREATE TABLE IF NOT EXISTS migrations'
        );

        // Verify the existing migration check
        const [selectQuery, filename] = mockSql.mock.calls[1] as [
          string,
          string
        ];
        expect(selectQuery[0]).toContain(
          'SELECT * FROM migrations WHERE filename ='
        );
        expect(filename).toBe('migration.sql');

        // Verify transaction was started
        expect(mockSql.begin).toHaveBeenCalled();

        // Verify migration was recorded
        const [insertQuery, insertFilename] = mockSql.mock.calls[2] as [
          string,
          string
        ];
        expect(insertQuery[0]).toContain('INSERT INTO migrations');
        expect(insertQuery[0]).toContain('success, error_message');
        expect(insertFilename).toBe('migration.sql');
      });
    });
  });

  describe('runAllMigrations', () => {
    let mockFs: typeof import('fs');

    beforeEach(() => {
      jest.clearAllMocks();
      // Reset the module registry before each test
      jest.resetModules();

      // Create fresh mocks
      mockFs = {
        readdirSync: jest.fn(),
        existsSync: jest.fn(),
        writeFileSync: jest.fn(),
        readFileSync: jest.fn()
      } as unknown as typeof import('fs');

      // Mock the fs module
      jest.mock('fs', () => mockFs);

      // Reset mockSql
      mockSql.mockReset();
      mockSql.begin = jest.fn().mockImplementation(async (callback: any) => {
        await callback(mockSql);
        return Promise.resolve();
      });
    });

    it('executes all migrations in order', async () => {
      // Override the global path.join mock for this test only
      (path.join as jest.Mock).mockImplementation((...args) =>
        args.join('/').replace('//', '/')
      );

      (mockFs.readdirSync as jest.Mock).mockReturnValue([
        '0000-first.sql',
        '0001-second.sql'
      ]);

      // Mock successful migration execution
      mockSql
        // @ts-expect-error
        .mockResolvedValueOnce([]) // migrations table check
        // @ts-expect-error
        .mockResolvedValueOnce([]) // first migration check
        // @ts-expect-error
        .mockResolvedValueOnce([]) // first migration execution
        // @ts-expect-error
        .mockResolvedValueOnce([]) // second migration check
        // @ts-expect-error
        .mockResolvedValueOnce([]); // second migration execution

      // Mock file content
      (mockFs.readFileSync as jest.Mock).mockReturnValue('-- Migration SQL');

      const { runAllMigrations } = require('./migrations');
      await runAllMigrations();

      // Verify migrations were executed in order
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('0000-first.sql'),
        'utf8'
      );
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('/0001-second.sql'),
        'utf8'
      );

      // Verify SQL execution order
      expect(mockSql).toHaveBeenCalledTimes(6);
      expect(mockSql.begin).toHaveBeenCalledTimes(2);
    });

    it('filters out non-migration files', async () => {
      // Mock path.join to return predictable paths
      jest
        .spyOn(path, 'join')
        .mockImplementation((...args) => args.join('/').replace('//', '/'));

      (mockFs.readdirSync as jest.Mock).mockReturnValue([
        '0000-first.sql',
        'README.md',
        '.DS_Store',
        '0001-second.sql'
      ]);

      // Mock file content
      (mockFs.readFileSync as jest.Mock).mockReturnValue('-- Migration SQL');

      // Mock SQL implementation similar to other tests
      mockSql.mockImplementation((strings, ...values) => {
        return Promise.resolve([]);
      });

      const { runAllMigrations } = require('./migrations');
      await runAllMigrations();

      // Verify only .sql files were processed
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('/0000-first.sql'),
        'utf8'
      );
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('/0001-second.sql'),
        'utf8'
      );
    });
  });

  describe('main', () => {
    it.skip('handles errors during migration execution', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = "Cannot read properties of undefined (reading 'filter')";

      (createInterface as Mock).mockReturnValue({
        question: jest.fn(
          (query: string, callback: (answer: string) => void) => {
            callback('1');
            return Promise.resolve();
          }
        ),
        close: jest.fn()
      });

      jest
        .spyOn(require('./migrations'), 'runAllMigrations')
        .mockRejectedValueOnce(error);

      const { main } = require('./migrations');
      await main(true);

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Migration error:',
        new Error(error)
      );
      consoleSpy.mockRestore();
    });

    it.skip('handles invalid option selection', async () => {
      const consoleSpy = jest
        .spyOn(console, 'info')
        .mockImplementation(() => {});

      // Mock readline to select invalid option
      (createInterface as Mock).mockReturnValue({
        question: jest.fn(
          (query: string, callback: (answer: string) => void) => {
            callback('3');
            return Promise.resolve();
          }
        ),
        close: jest.fn()
      });

      const { main } = require('./migrations');
      await main(true);

      expect(consoleSpy).toHaveBeenCalledWith('Invalid option');
      consoleSpy.mockRestore();
    });
  });
});
