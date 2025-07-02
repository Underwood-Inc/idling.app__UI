// Jest environment setup - runs before jest.setup.js
// This file sets up environment variables for Jest tests ONLY

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-for-jest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock any other environment variables that might cause issues
process.env.VERCEL_URL = undefined;
process.env.VERCEL_ENV = undefined; 