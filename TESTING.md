---
title: 'Testing Strategy'
description: 'Testing guidelines, frameworks, and quality assurance processes'
sidebar_position: 4
---

# 🧪 Testing Guide

Welcome to the comprehensive testing guide for this project! This document covers all testing frameworks, patterns, and best practices.

## 📋 Table of Contents

- [🎯 Testing Overview](#-testing-overview)
- [🃏 Jest (Unit & Integration Tests)](#-jest-unit--integration-tests)
- [🎭 Playwright (E2E Tests)](#-playwright-e2e-tests)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#-configuration)
- [🛠️ Development Workflow](#️-development-workflow)
- [🔧 Debugging](#-debugging)
- [📊 Coverage](#-coverage)
- [🏗️ Best Practices](#️-best-practices)
- [❓ Troubleshooting](#-troubleshooting)

## 🎯 Testing Overview

This project uses **two completely separate testing frameworks**:

### Jest (Unit & Integration Tests)

- **Purpose**: Test individual components, functions, and modules in isolation
- **File Pattern**: `src/**/*.test.{ts,tsx,js,jsx}`
- **Framework**: Jest + React Testing Library
- **Runs**: In Node.js environment with jsdom
- **Focus**: Logic, component behavior, API functions

### Playwright (End-to-End Tests)

- **Purpose**: Test complete user workflows in real browsers
- **File Pattern**: `e2e/**/*.spec.ts`
- **Framework**: Playwright
- **Runs**: In real browsers (Chromium, Firefox, WebKit)
- **Focus**: User interactions, full application flows

> **⚠️ Important**: These frameworks are completely independent and should never be mixed or imported into each other!

## 🃏 Jest (Unit & Integration Tests)

### Quick Commands

```bash
# Run all Jest tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run specific test file
yarn test Button.test.tsx

# Run tests matching pattern
yarn test --testNamePattern="should render"
```

### File Structure

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx          # ✅ Jest test
│   └── Form/
│       ├── Form.tsx
│       └── __tests__/
│           └── Form.test.tsx        # ✅ Jest test
├── lib/
│   ├── utils.ts
│   └── utils.test.ts                # ✅ Jest test
└── app/
    ├── page.tsx
    └── page.test.tsx                # ✅ Jest test
```

### Writing Jest Tests

#### Component Testing Example

```typescript
// src/components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Server Action Testing Example

```typescript
// src/app/api/actions.test.ts
import { getSubmissionsAction } from './actions';

// Mock database module
jest.mock('../../lib/db', () => ({
  __esModule: true,
  default: {
    unsafe: jest.fn().mockResolvedValue([])
  }
}));

describe('getSubmissionsAction', () => {
  it('should return submissions data', async () => {
    const result = await getSubmissionsAction({
      onlyMine: false,
      userId: '',
      filters: [],
      page: 1,
      pageSize: 10
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
  });
});
```

### Jest Configuration

Key configuration files:

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Global test setup (mocks, polyfills)
- `jest.env.js` - Environment variables for tests

## 🎭 Playwright (End-to-End Tests)

### Quick Commands

```bash
# Run all E2E tests
yarn e2e

# Run E2E tests in UI mode (interactive)
yarn e2e:ui

# Run E2E tests in headed mode (visible browser)
yarn e2e:headed

# Run specific test file
yarn e2e login.spec.ts

# Run tests in specific browser
yarn e2e --project=chromium
```

### File Structure

```
e2e/
├── auth/
│   ├── login.spec.ts               # ✅ Playwright test
│   └── signup.spec.ts              # ✅ Playwright test
├── submissions/
│   ├── create-submission.spec.ts   # ✅ Playwright test
│   └── view-submissions.spec.ts    # ✅ Playwright test
├── fixtures/
│   └── test-data.ts                # Test data helpers
└── utils/
    └── helpers.ts                  # E2E test utilities
```

### Writing Playwright Tests

#### Page Interaction Example

```typescript
// e2e/submissions/create-submission.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Create Submission', () => {
  test('should create a new submission', async ({ page }) => {
    // Navigate to the page
    await page.goto('/submissions/new');

    // Fill out the form
    await page.fill('[data-testid="submission-title"]', 'My Test Submission');
    await page.fill('[data-testid="submission-url"]', 'https://example.com');
    await page.selectOption('[data-testid="submission-category"]', 'tech');

    // Submit the form
    await page.click('[data-testid="submit-button"]');

    // Verify the result
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page).toHaveURL(/\/submissions\/\d+/);
  });
});
```

#### Authentication Example

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    // Mock authentication if needed
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ user: { id: '1', name: 'Test User' } })
      });
    });

    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

### Playwright Configuration

Key configuration files:

- `playwright.config.ts` - Main Playwright configuration
- Separate test directories and output folders
- Browser-specific configurations

## 🚀 Quick Start

### Running All Tests

```bash
# Run Jest tests (unit/integration)
yarn test

# Run Playwright tests (E2E)
yarn e2e

# Run both test suites
yarn test && yarn e2e
```

### Development Workflow

1. **Write Jest tests first** for components and functions
2. **Run Jest tests** to verify logic works
3. **Write Playwright tests** for user workflows
4. **Run E2E tests** to verify full application behavior

## ⚙️ Configuration

### Jest Configuration Highlights

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/e2e/', // ✅ Ignore Playwright tests
    '\\.spec\\.(ts|tsx)$' // ✅ Ignore .spec files
  ],
  testMatch: [
    '<rootDir>/src/**/*.test.(ts|tsx|js|jsx)' // ✅ Only Jest tests
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  maxWorkers: 1, // ✅ Prevent database conflicts
  forceExit: true, // ✅ Prevent hanging
  detectOpenHandles: true // ✅ Debug async issues
};
```

### Playwright Configuration Highlights

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e', // ✅ Only E2E tests
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'yarn build && yarn start',
    url: 'http://127.0.0.1:3000'
  }
});
```

## 🛠️ Development Workflow

### VS Code Integration

The project includes VS Code configurations for enhanced testing:

#### Launch Configurations (`.vscode/launch.json`)

- **Debug Jest Tests**: Debug individual Jest test files
- **Debug Playwright Tests**: Debug E2E tests with breakpoints
- **Debug Next.js**: Debug the application server

#### Tasks (`.vscode/tasks.json`)

- **Run Jest Tests**: Execute Jest tests with various options
- **Run Playwright Tests**: Execute E2E tests in different modes
- **Combined Test Tasks**: Run both test suites

#### Settings (`.vscode/settings.json`)

- **Jest Integration**: Auto-discovery and inline test results
- **Playwright Integration**: Test explorer and trace viewing
- **File Associations**: Proper syntax highlighting for test files

### Recommended Extensions

The project suggests these VS Code extensions:

- **Jest**: Inline test results and debugging
- **Playwright Test for VSCode**: E2E test management
- **Test Explorer UI**: Unified test interface

## 🔧 Debugging

### Debugging Jest Tests

#### In VS Code

1. Set breakpoints in your test file
2. Use "Debug Jest Tests" launch configuration
3. Select specific test file or run all tests

#### Command Line

```bash
# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run single test with verbose output
yarn test --verbose Button.test.tsx
```

### Debugging Playwright Tests

#### In VS Code

1. Set breakpoints in your spec file
2. Use "Debug Playwright Tests" launch configuration
3. Browser will pause at breakpoints

#### Command Line

```bash
# Debug mode with browser DevTools
yarn e2e --debug

# Headed mode to see browser actions
yarn e2e --headed

# UI mode for interactive debugging
yarn e2e:ui
```

#### Playwright Traces

```bash
# Generate trace files
yarn e2e --trace on

# View traces
npx playwright show-trace test-results/trace.zip
```

## 📊 Coverage

### Jest Coverage

```bash
# Generate coverage report
yarn test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

Coverage configuration in `jest.config.js`:

```javascript
collectCoverageFrom: [
  'src/**/*.{js,jsx,ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/*.stories.tsx',
  '!src/**/*.spec.{ts,tsx}', // ✅ Exclude Playwright files
  '!e2e/**/*' // ✅ Exclude E2E directory
];
```

### Playwright Reports

```bash
# Generate HTML report
yarn e2e --reporter=html

# View report
npx playwright show-report
```

## 🏗️ Best Practices

### Jest Best Practices

1. **Test Structure**: Use `describe` blocks to group related tests
2. **Mocking**: Mock external dependencies and APIs
3. **Assertions**: Use specific matchers (`toHaveTextContent` vs `toBeTruthy`)
4. **Cleanup**: Clean up mocks between tests
5. **Database**: Mock database calls to prevent hanging

```typescript
// ✅ Good Jest test structure
describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { id: '1', name: 'John' };
      mockDb.findUser.mockResolvedValue(mockUser);

      // Act
      const result = await getUserById('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDb.findUser).toHaveBeenCalledWith('1');
    });
  });
});
```

### Playwright Best Practices

1. **Page Objects**: Create reusable page object models
2. **Selectors**: Use `data-testid` attributes for reliable element selection
3. **Waits**: Use explicit waits instead of timeouts
4. **Independence**: Each test should be independent and atomic
5. **Cleanup**: Clean up test data after each test

```typescript
// ✅ Good Playwright test structure
test.describe('Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup test data
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
  });

  test('should create submission successfully', async ({ page }) => {
    // Use page object methods
    await submissionPage.fillForm({
      title: 'Test Submission',
      url: 'https://example.com'
    });

    await submissionPage.submit();

    // Verify with explicit waits
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

### Framework Separation Rules

1. **Never import Playwright in Jest tests**
2. **Never import Jest utilities in Playwright tests**
3. **Keep test files in separate directories**
4. **Use different file extensions** (`.test.ts` vs `.spec.ts`)
5. **Separate configurations and setup files**

## ❓ Troubleshooting

### Common Jest Issues

#### Tests Hanging

```bash
# Check for open handles
yarn test --detectOpenHandles

# Force exit after completion
yarn test --forceExit

# Run with single worker
yarn test --maxWorkers=1
```

#### Module Resolution Issues

```bash
# Clear Jest cache
yarn test --clearCache

# Check module paths in jest.config.js
moduleNameMapping: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

#### Database Connection Issues

```typescript
// Mock database in individual test files
jest.mock('../../lib/db', () => ({
  __esModule: true,
  default: {
    unsafe: jest.fn().mockResolvedValue([])
  }
}));
```

### Common Playwright Issues

#### Browser Launch Failures

```bash
# Install browsers
npx playwright install

# Install system dependencies
npx playwright install-deps
```

#### Test Timeouts

```typescript
// Increase timeout in playwright.config.ts
export default defineConfig({
  timeout: 30000,
  expect: { timeout: 5000 }
});
```

#### Element Not Found

```typescript
// Use better selectors
await page.locator('[data-testid="submit-button"]').click();

// Wait for element
await page.waitForSelector('[data-testid="submit-button"]');

// Use explicit waits
await expect(page.locator('[data-testid="result"]')).toBeVisible();
```

### Performance Issues

#### Jest Performance

- Use `maxWorkers: 1` for database tests
- Mock heavy dependencies
- Use `--onlyChanged` for faster feedback

#### Playwright Performance

- Use `fullyParallel: true` for independent tests
- Optimize selectors and waits
- Use browser contexts for isolation

## 🎯 Summary

This project maintains **strict separation** between Jest and Playwright:

- **Jest**: Fast unit/integration tests for components and logic
- **Playwright**: Comprehensive E2E tests for user workflows
- **Independent**: Separate configurations, file patterns, and purposes
- **Complementary**: Together they provide complete test coverage

### Test Commands Quick Reference

```bash
# Jest (Unit/Integration)
yarn test                    # Run all Jest tests
yarn test:watch             # Watch mode
yarn test:coverage          # With coverage
yarn test Button.test.tsx   # Specific file

# Playwright (E2E)
yarn e2e                    # Run all E2E tests
yarn e2e:ui                 # Interactive mode
yarn e2e:headed             # Visible browser
yarn e2e login.spec.ts      # Specific file

# Development
yarn test && yarn e2e       # Run both suites
```

Happy testing! 🧪✨
