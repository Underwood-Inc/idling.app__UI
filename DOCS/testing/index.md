---
layout: default
title: Testing
nav_order: 7
has_children: true
---

# Testing

Comprehensive testing documentation for our application including unit tests, integration tests, and end-to-end testing.

## Testing Strategy

Our testing approach includes multiple layers:

### Unit Tests

- **Framework**: Jest
- **Coverage**: Component logic, utility functions, API endpoints
- **Location**: `__tests__` directories alongside source files
- **Execution**: Parallel shards for faster CI runs

### Integration Tests

- **Framework**: Jest with testing utilities
- **Coverage**: Component interactions, API integrations
- **Focus**: Data flow between components and services

### End-to-End Tests

- **Framework**: Playwright
- **Coverage**: Critical user journeys, browser compatibility
- **Browsers**: Chromium, Firefox, WebKit
- **Environment**: Full application stack with test database

## Available Guides

### [Continuous Integration Tests](ci-tests.html)

Detailed documentation of our CI testing pipeline, job dependencies, and troubleshooting guide.

## Quick Reference

### Running Tests Locally

```bash
# Unit and integration tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test File Patterns

- Unit tests: `*.test.ts`, `*.test.tsx`
- E2E tests: `*.spec.ts` in `tests/` directory
- Test utilities: `__tests__/utils/`

### Writing Tests

- Follow the AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Mock external dependencies
- Test error conditions
- Maintain test independence

## CI Pipeline

Our automated testing runs on every pull request:

- **Jest Tests**: 3 parallel shards for speed
- **Playwright Tests**: Sequential for reliability
- **Coverage Reports**: Combined and analyzed
- **Quality Gates**: SonarCloud integration

## Related Documentation

- [Development Testing](../development/testing.html)
- [CI/CD Pipeline](../deployment/ci-cd.html)
- [Development Setup](../development/index.html)
