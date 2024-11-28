# Continuous Integration Tests Documentation

This document provides detailed information about our CI testing pipeline implemented in GitHub Actions.

## Overview

Our testing pipeline consists of six main jobs that run in parallel where possible:
1. Setup Environment
2. Playwright Tests (E2E) - 3 parallel shards
3. Jest Tests (Unit/Integration) - 3 parallel shards
4. Combine Playwright Reports
5. Combine Coverage Reports
6. SonarCloud Analysis

## Job Dependencies

![CI Tests Job Dependencies](./docs/assets/ci-tests-job-deps.png)

The diagram above shows how our CI jobs depend on each other:
- Both test jobs (Playwright and Jest) depend on the Setup job
- Test jobs run in parallel shards to optimize execution time
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
- **Parallelization**: 3 shards running concurrently
- **Environment**:
  - PostgreSQL service container
  - Node.js runtime
- **Key Actions**:
  - Sets up test database
  - Runs migrations
  - Executes E2E tests in parallel shards
  - Generates test reports per shard
- **Artifacts**:
  - Test results in `playwright-report/` (per shard)
  - Test traces (on failure) in `test-results/` (per shard)

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

### 4. Combine Playwright Reports
- **Purpose**: Merges reports from Playwright shards
- **Dependencies**: Playwright Tests
- **Key Actions**:
  - Downloads all shard reports
  - Merges HTML and JSON reports
  - Uploads combined report

### 5. Combine Coverage Reports
- **Purpose**: Merges coverage from Jest shards
- **Dependencies**: Jest Tests
- **Key Actions**:
  - Downloads all shard coverage reports
  - Merges using NYC
  - Generates combined coverage report

### 6. SonarCloud Analysis
- **Purpose**: Code quality and security analysis
- **Dependencies**: Both report combination jobs must complete
- **Key Actions**:
  - Analyzes code quality
  - Processes combined test coverage
  - Reports results to SonarCloud dashboard

## Environment Variables

The pipeline uses several environment variables and secrets:
- **Authentication**: `NEXTAUTH_SECRET`, `AUTHJS_*` tokens
- **Database**: `POSTGRES_*` configuration
- **CI/CD**: `GITHUB_TOKEN`, `SONAR_TOKEN`

## Test Results and Reporting

### Automated PR Comments
The CI pipeline automatically generates test result comments on pull requests:

- "🎭 E2E Test Results" comment for Playwright tests
  - Shows combined results from all shards
  - Includes pass/fail/skip counts
  - Lists any test failures with details

- "🃏 Unit Test Results" comment for Jest tests
  - Shows combined results from all shards
  - Includes pass/fail/skip counts
  - Lists any test failures with details

### Test Results Location
Test results are stored as artifacts:
- Playwright: 
  - Per shard: `playwright-results-[1-3]/`
  - Combined: `playwright-merged-results/`
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