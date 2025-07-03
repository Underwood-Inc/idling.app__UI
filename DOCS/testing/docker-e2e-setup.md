---
layout: default
title: Docker E2E Testing Setup
parent: Testing
nav_order: 5
---

# Docker E2E Testing Setup 🎭

This document explains how to run Playwright E2E tests in the Docker environment.

## Quick Start

### Running E2E Tests in Docker

```bash
# Start the Docker services
yarn dev:docker:up

# Run E2E tests inside the container
docker-compose exec nextjs yarn e2e:docker

# Or run specific tests
docker-compose exec nextjs yarn e2e:docker --grep "login"
```

## What's Included

### Docker Configuration

The Docker setup now includes:

1. **Playwright Browser Dependencies**: All necessary system libraries for running Chromium, Firefox, and WebKit
2. **Browser Caching**: Browsers are cached in a Docker volume to avoid re-downloading
3. **Test Results Persistence**: Test results and reports are mounted to your host machine

### Key Files Updated

- `Dockerfile`: Added Playwright system dependencies and browser installation
- `docker-compose.dev.yml`: Added Playwright-specific volumes and environment variables
- `scripts/run-e2e-docker.sh`: Helper script for running tests in Docker
- `package.json`: Added `e2e:docker` script

## Environment Variables

The following environment variables are configured for E2E testing:

```yaml
# Playwright configuration
PLAYWRIGHT_BROWSERS_PATH: /app/.playwright # Browser cache location
DISPLAY: :99 # Virtual display for headless browsers
IS_DOCKERIZED: true # Flag to detect Docker environment

# Authentication tokens (optional - fallbacks provided)
AUTHJS_SESSION_TOKEN: ${AUTHJS_SESSION_TOKEN}
AUTHJS_CALLBACK_URL: ${AUTHJS_CALLBACK_URL}
AUTHJS_CSRF_TOKEN: ${AUTHJS_CSRF_TOKEN}
NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
```

## Authentication Setup

The E2E tests include smart authentication fallbacks:

- **Production-like**: When environment variables are set, tests use real authentication tokens
- **Fallback Mode**: When variables are missing, tests use mock tokens that match NextAuth format
- **Always Working**: Tests will run successfully regardless of authentication configuration

### Token Format Examples

Real authentication tokens follow these patterns:

```bash
# CSRF Token: hex%7Chex format (URL-encoded pipe separator)
AUTHJS_CSRF_TOKEN="034abcd24b49b50d2cc4e61ddbacf16880d9bedbaedfb5c56021f04038e42b1e%7C7bfd0b29fd9210570037a54b603ae9684e29437f7e5c6b385808bb8117322221"

# Callback URL: URL-encoded format
AUTHJS_CALLBACK_URL="http%3A%2F%2Flocalhost%3A3000%2F"

# Session Token: JWE (JSON Web Encryption) format
AUTHJS_SESSION_TOKEN="eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiQ19UMUhrSHBWWmVhTzNsTTRBZ0ltdUUxOHM2dWdRa0sxa051SU9ZajFlNm1vbDZiM05rYmxmWHFJbHZqR3RMSVBQYmJWdDJubjBndS1zX1U2d3pZeFEifQ..dHVgFTk3tIunOgIWvgmz4g.4Zt5rqyGyd6ZMuEqVyNuAmnDMXbSvitP5-Wsq-dsttrxgspyI-xz7tLewFwEDOXe1tPGif469ZmrDs2mD0SLyG_AQ-RGaX9aJYMXyap3Vx0F7DZOP2EWJ2epS8qXMp-OBGwKt4Mn6STHnjKlXVuIZCV-3MgVkwhC2WWMak8wP2eQhQf3ys-v5riTcF3kmfueQdDYc4tTNYS6tdM8Tu3Yl-fwKq2feRWxd9oyoR3MgSkfcp-Y8kjBtxnEjIgZBRN25xFb5m7RhIUPM3OvL-jSTFNJR-JtuKIulTEJUrW8OHVqCuJY2kYCDzE2AdeYneJwzu4MORRwxNnvmeZflIHrdt7LAEbT7ArH3YXBgkAXeoxVfBBSTvgzwZSOXmKnroFpy7pkBp3DamXCFYYgxTQxd1KHiln2Vr0AKgGB3votZWq5CXP6xduqUU_Jjx5vX3larnuVHqlVP4yTtemN_3_RRJKfUwk3Zcj8qyWE0FIdqAo.fWAe1NSzAaEIANV0NvwAmMHtLZM1SdVqzgiUBPpwgwI"
```

{: .note }
The `AUTHJS_SESSION_TOKEN` depends on the `NEXTAUTH_SECRET` for encryption/decryption. Both must be consistent between test token generation and server verification.

## Troubleshooting

### Browser Dependencies Missing

If you see errors about missing browser dependencies:

```bash
# Rebuild the Docker image
docker-compose build nextjs

# Or manually install in running container
docker-compose exec nextjs npx playwright install --with-deps
```

### Permission Issues

If you encounter permission issues with test results:

```bash
# Fix permissions on host
sudo chown -R $USER:$USER test-results/ playwright-report/
```

### Authentication Failures

If tests fail with authentication errors:

1. Check if you have the correct environment variables in `.env.local`
2. The fallback system should handle missing tokens gracefully
3. Check the console logs for specific authentication errors

Common authentication error patterns:

```bash
# JWE decryption errors
[auth][error] JWTSessionError: Invalid Compact JWE

# Token format errors
[auth][error] JWTSessionError: "exp" claim timestamp check failed

# Secret mismatch errors
[auth][error] no matching decryption secret
```

## Advanced Usage

### Running Specific Browser

```bash
# Run only Chromium tests
docker-compose exec nextjs yarn e2e:docker --project=chromium

# Run only Firefox tests
docker-compose exec nextjs yarn e2e:docker --project=firefox

# Run only WebKit tests
docker-compose exec nextjs yarn e2e:docker --project=webkit
```

### Debug Mode

```bash
# Run with debug output
docker-compose exec nextjs yarn e2e:docker --debug

# Run headed mode (requires X11 forwarding)
docker-compose exec nextjs yarn e2e:docker --headed

# Run with trace recording
docker-compose exec nextjs yarn e2e:docker --trace=on
```

### Test Reports

```bash
# Generate and view HTML report
docker-compose exec nextjs yarn e2e:reports

# Reports are available at: ./playwright-report/index.html
```

## Performance Tips

1. **Browser Caching**: Browsers are cached in Docker volumes, so they only download once
2. **Parallel Execution**: Tests run in parallel by default for faster execution
3. **Smart Retries**: Failed tests are automatically retried to handle flaky scenarios
4. **Sharding**: Tests are distributed across multiple shards in CI for faster execution

## Integration with CI/CD

The GitHub Actions workflow uses a hybrid approach:

- **Local Development**: Uses Docker for consistent environment
- **CI/CD**: Uses native GitHub Actions runner for performance
- **Authentication**: Same fallback system works in both environments
- **Dependencies**: Both environments install the same browser dependencies

### Environment Differences

| Aspect                   | Local Docker                         | GitHub Actions                       |
| ------------------------ | ------------------------------------ | ------------------------------------ |
| **Environment**          | Docker container                     | Native Ubuntu runner                 |
| **Browser Installation** | `npx playwright install --with-deps` | `npx playwright install --with-deps` |
| **Authentication**       | Environment variables + fallbacks    | Environment variables + fallbacks    |
| **Performance**          | Consistent isolation                 | Faster execution                     |
| **Debugging**            | Full Docker environment              | CI-optimized                         |

## Related Documentation

- [Testing Overview](index.html)
- [CI Tests](ci-tests.html)
- [Local Testing](test-local.html)
- [Development Setup](../development/index.html)

---

{: .fs-2 }
Last updated: {{ site.time | date: "%B %d, %Y" }}
