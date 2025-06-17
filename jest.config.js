const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './'
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  testPathIgnorePatterns: [
    '<rootDir>/e2e',
    '<rootDir>/custom-eslint-rules',
    '\\.spec\\.ts$'
  ],
  setupFilesAfterEnv: ['jest-chain', '<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.ts',
    '^@dicebear/(.*)$': '<rootDir>/__mocks__/@dicebear/$1',
    '^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.ts'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@dicebear|@babel/runtime|next-auth)/)'
  ],
  testEnvironment: 'jest-environment-jsdom'
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
