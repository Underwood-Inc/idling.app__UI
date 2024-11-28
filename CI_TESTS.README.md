# Continuous Integration Tests Documentation

This document provides detailed information about our CI testing pipeline implemented in GitHub Actions.

## Overview

Our testing pipeline consists of five main jobs that run in parallel where possible:
1. Setup Environment
2. Playwright Tests (E2E)
3. Jest Tests (Unit/Integration) - 3 parallel shards
4. Combine Coverage Reports
5. SonarCloud Analysis

## Job Dependencies

![CI Tests Job Dependencies](./docs/assets/ci-tests-job-deps.png)

The diagram above shows how our CI jobs depend on each other:
- Both test jobs (Playwright and Jest) depend on the Setup job
- Jest tests run in parallel shards to optimize execution time
- Report combination jobs depend on their respective test jobs
- SonarCloud analysis runs only after all reports are combined

## Detailed Job Descriptions

### 1. Setup Environment
- **Purpose**: Prepares the environment for all subsequent jobs
- **Key Actions**:
  - Checks out code
  - Sets up Node.js with yarn caching
  - Installs dependencies
  - Caches dependencies for faster subsequent runs
- **Outputs**: Cached `node_modules` and Playwright browser binaries

### 2. Playwright Tests (E2E)
- **Purpose**: Runs end-to-end tests using Playwright
- **Dependencies**: Setup job
- **Environment**:
  - PostgreSQL service container
  - Node.js runtime
- **Key Actions**:
  - Sets up test database
  - Runs migrations
  - Executes E2E tests across multiple browsers
  - Generates test reports
- **Artifacts**:
  - Test results in `playwright-report/`
  - Test traces (on failure) in `test-results/`

> **Note on Test Sharding**: Unlike Jest tests, Playwright tests are not sharded. This is intentional due to the complexity of managing browser-specific dependencies in CI environments. Sharding Playwright tests can lead to inconsistent behavior and failures, particularly with browsers like WebKit that require specific system libraries. Running tests sequentially ensures more reliable cross-browser testing.

### 3. Jest Tests
- **Purpose**: Runs unit and integration tests
- **Dependencies**: Setup job
- **Parallelization**: 3 shards running concurrently
- **Key Actions**:
  - Executes Jest test suite in parallel
  - Generates coverage reports per shard
  - Reports results to PR
- **Artifacts**:
  - Coverage reports in `coverage/` (per shard)
  - Test results in `jest-results-[shard].json`

### 4. Combine Coverage Reports
- **Purpose**: Merges coverage from Jest shards
- **Dependencies**: Jest Tests
- **Key Actions**:
  - Downloads all shard coverage reports
  - Merges using NYC
  - Generates combined coverage report

### 5. SonarCloud Analysis
- **Purpose**: Code quality and security analysis
- **Dependencies**: Playwright Tests and Coverage Reports
- **Key Actions**:
  - Analyzes code quality
  - Processes test coverage
  - Reports results to SonarCloud dashboard

## Test Results and Reporting

### Automated PR Comments
The CI pipeline automatically generates test result comments on pull requests:

- "🎭 E2E Test Results" comment for Playwright tests
  - Shows results from all browser tests
  - Includes pass/fail/skip counts
  - Lists any test failures with details

- "🃏 Unit Test Results" comment for Jest tests
  - Shows combined results from all shards
  - Includes pass/fail/skip counts
  - Lists any test failures with details

### Test Results Location
Test results are stored as artifacts:
- Playwright: 
  - `playwright-report/`
  - `test-results/` (for traces on failure)
- Jest: 
  - Per shard: `jest-coverage-[1-3]/`
  - Combined: `combined-coverage/`

### Viewing Results
1. **In Pull Requests**:
   - Look for the most recent test result comments
   - Each test type has its own separate comment
   - Failed tests include expandable details

2. **In GitHub Actions**:
   - Navigate to the workflow run
   - Check the "Artifacts" section for detailed reports
   - Combined reports provide the full test overview

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Check PostgreSQL service configuration
   - Verify database credentials in secrets

2. **Test Timeouts**
   - Review test logs for slow operations
   - Check for resource constraints
   - Consider adjusting shard count if tests are too slow

3. **Cache Misses**
   - Verify yarn.lock hasn't changed
   - Check cache key construction
   - Ensure all cache paths are correct

### Debug Steps

1. **For Playwright Issues**:
   - Check individual shard results
   - Review test traces in artifacts
   - Verify database migrations
   - Check combined report for full overview

2. **For Jest Issues**:
   - Review individual shard outputs
   - Check coverage reports
   - Verify test environment
   - Check combined coverage report

## Best Practices

1. **Writing Tests**:
   - Keep E2E tests focused on critical paths
   - Maintain unit test coverage
   - Use appropriate test selectors
   - Consider test distribution across shards

2. **Pipeline Maintenance**:
   - Regularly update action versions
   - Monitor test execution times
   - Review and clean up artifacts
   - Adjust shard count based on test volume

## Contributing

When modifying the CI pipeline:
1. Test changes in a feature branch
2. Review workflow run times
3. Verify all artifacts are generated
4. Update this documentation
5. Consider impact on test sharding

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [SonarCloud Documentation](https://sonarcloud.io/documentation)