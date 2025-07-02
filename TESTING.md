# 🧪 Testing Guide

This guide covers all testing capabilities in the Idling App UI codebase, including unit tests, integration tests, and end-to-end (E2E) tests.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Test Types](#-test-types)
- [Running Tests](#-running-tests)
- [VS Code Integration](#-vs-code-integration)
- [Test Configuration](#-test-configuration)
- [Writing Tests](#-writing-tests)
- [Debugging Tests](#-debugging-tests)
- [CI/CD Integration](#-cicd-integration)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (>=20.x) - Check with `node --version`
2. **Yarn** - Check with `yarn --version`
3. **Dependencies installed** - Run `yarn install`

### Run All Tests

```bash
# Run Jest unit/integration tests
yarn test

# Run Playwright E2E tests (UI mode)
yarn e2e

# Run Playwright E2E tests (headless)
yarn e2e:headless
```

## 🎯 Test Types

### 1. Unit Tests (Jest)

- **Location**: `src/**/*.test.{ts,tsx}`
- **Purpose**: Test individual components and functions in isolation
- **Framework**: Jest + React Testing Library
- **Example**: `src/app/components/app-version/AppVersion.test.tsx`

### 2. Integration Tests (Jest)

- **Location**: `src/**/*.test.{ts,tsx}`
- **Purpose**: Test multiple components working together
- **Framework**: Jest + React Testing Library
- **Database**: Uses test database for API route testing

### 3. End-to-End Tests (Playwright)

- **Location**: `e2e/**/*.spec.ts`
- **Purpose**: Test complete user workflows in a real browser
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit

## 🏃 Running Tests

### Jest (Unit/Integration Tests)

```bash
# Run all tests once
yarn test

# Run tests with coverage report
yarn test:coverage

# Run tests in CI mode (no watch)
yarn test:ci

# Run tests and output to file
yarn test:to-file
```

### Playwright (E2E Tests)

```bash
# Run E2E tests with UI (interactive)
yarn e2e

# Run E2E tests headless (CI-friendly)
yarn e2e:headless

# Run E2E tests with browser visible
yarn e2e:headed

# Show test reports
yarn e2e:reports

# Generate new test code
yarn e2e:gen
```

### Combined Test Suites

```bash
# In VS Code: Use Command Palette (Ctrl/Cmd + Shift + P)
# Search for "Tasks: Run Task" and select:
# - "🎯 Run All Tests (Jest + Playwright)"
# - "📊 Run All Tests with Coverage"
```

## 🔧 VS Code Integration

### Available Tasks

Press `Ctrl/Cmd + Shift + P` → "Tasks: Run Task":

- **🧪 Run All Jest Tests** - Default test runner
- **🧪 Run Jest Tests with Coverage** - Includes coverage report
- **🧪 Run Jest Tests (CI Mode)** - No watch mode
- **🎭 Run Playwright E2E Tests (UI Mode)** - Interactive E2E testing
- **🎭 Run Playwright E2E Tests (Headless)** - Background E2E testing
- **🎭 Run Playwright E2E Tests (Headed)** - Visible browser E2E testing
- **📊 Show Playwright Test Reports** - View test results
- **🎯 Run All Tests (Jest + Playwright)** - Complete test suite
- **📊 Run All Tests with Coverage** - Complete suite with coverage

### Debug Configurations

Press `F5` or go to Run & Debug panel:

- **🧪 Debug Jest Tests** - Debug all Jest tests
- **🧪 Debug Specific Jest Test** - Debug currently open test file
- **🎭 Debug Playwright Tests** - Debug all Playwright tests
- **🎭 Debug Specific Playwright Test** - Debug currently open E2E test

### Test Explorer

- **Jest Extension**: Shows test tree in sidebar
- **Playwright Extension**: Integrated test runner
- **Test Results**: Inline in editor with pass/fail indicators

## ⚙️ Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
    // ... other mappings
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '\\.spec\\.(ts|tsx)$' // Ignore Playwright specs
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts'
  ]
};
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

## ✍️ Writing Tests

### Jest Test Example

```typescript
// src/components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Playwright Test Example

```typescript
// e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to posts page', async ({ page }) => {
    await page.goto('/');

    await page.click('a[href="/posts"]');
    await expect(page).toHaveURL('/posts');

    await expect(page.locator('h1')).toContainText('Posts');
  });
});
```

## 🐛 Debugging Tests

### Jest Debugging

1. **VS Code Debugger**: Use "🧪 Debug Jest Tests" launch configuration
2. **Browser DevTools**: Add `debugger;` statements in tests
3. **Console Logging**: Use `console.log()` for debugging output

```typescript
// Debug specific test
it('should debug this test', () => {
  debugger; // Breakpoint here
  const result = myFunction();
  console.log('Result:', result);
  expect(result).toBe(expected);
});
```

### Playwright Debugging

1. **Debug Mode**: Use `yarn e2e:headed` to see browser
2. **Playwright Inspector**: Use debug launch configuration
3. **Trace Viewer**: Check `test-results/` for traces

```typescript
// Debug Playwright test
test('debug this test', async ({ page }) => {
  await page.pause(); // Pauses test for debugging
  await page.goto('/');
  // ... rest of test
});
```

## 🚀 CI/CD Integration

### GitHub Actions

Tests run automatically on:

- **Pull Requests**: Both Jest and Playwright tests
- **Push to main/master**: Full test suite with coverage

### Test Sharding

The CI pipeline runs tests in parallel shards:

- **Jest**: 3 shards for faster execution
- **Playwright**: 3 shards across different browsers

### Artifacts

Test results are saved as GitHub Actions artifacts:

- **Jest Coverage**: 30 days retention
- **Playwright Reports**: 30 days retention
- **Playwright Traces**: 7 days retention (failures only)

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
```

#### 2. Jest tests timeout

```bash
# Increase timeout in jest.config.js
testTimeout: 30000  // 30 seconds
```

#### 3. Playwright browser not found

```bash
# Install browsers
yarn playwright install
```

#### 4. Database connection issues

```bash
# For Docker users
yarn dev:docker

# For local development
# Ensure PostgreSQL is running and .env.local is configured
```

#### 5. Port conflicts

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 yarn dev
```

### Environment Variables

Create `.env.local` for local testing:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/idling_app_test"

# Auth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Test environment
NODE_ENV="test"
```

### Performance Tips

1. **Jest**: Use `--maxWorkers=1` for debugging
2. **Playwright**: Use `--workers=1` for debugging
3. **Coverage**: Skip coverage during development for faster tests
4. **Watch Mode**: Use `yarn test --watch` for development

## 📊 Coverage Reports

### Jest Coverage

```bash
yarn test:coverage
```

Reports generated in:

- **Terminal**: Summary coverage
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`

### Playwright Coverage

Playwright focuses on E2E testing rather than code coverage, but provides:

- **Test Reports**: `playwright-report/index.html`
- **Trace Files**: `test-results/*/trace.zip`
- **Screenshots**: `test-results/*/test-failed-*.png`

## 🎯 Best Practices

### Jest Best Practices

1. **Test Structure**: Use `describe` blocks for grouping
2. **Naming**: Use descriptive test names
3. **Isolation**: Each test should be independent
4. **Mocking**: Mock external dependencies
5. **Assertions**: Use specific assertions

### Playwright Best Practices

1. **Page Objects**: Create reusable page objects
2. **Selectors**: Use data-testid attributes
3. **Waiting**: Use proper waiting strategies
4. **Cleanup**: Clean up test data
5. **Parallelization**: Design tests to run in parallel

---

## 🎉 Happy Testing!

This testing setup provides comprehensive coverage for your application. Use the VS Code integration for the best development experience, and refer to this guide when you need to understand the testing infrastructure.

For more specific questions, check the individual configuration files or reach out to the development team.
