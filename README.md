---
title: 'Idling.app - Social Gaming Platform'
description: 'Main project overview, setup instructions, and quick start guide'
sidebar_position: 1
---

## Code Analysis

![React](https://img.shields.io/badge/React-19.0.0--alpha-61DAFB?style=flat&logo=react&logoColor=white)
[![Documentation Coverage](https://img.shields.io/badge/Documentation%20Coverage-3.1%25-red?style=flat&logo=gitbook&logoColor=white)](https://underwood-inc.github.io/idling.app__UI/)
[![📊 CSV Report](https://img.shields.io/badge/📊%20CSV-Download-blue?style=flat&logo=microsoftexcel&logoColor=white)](https://underwood-inc.github.io/idling.app__UI/coverage-artifacts/latest-coverage-report.csv) | [![📋 HTML Report](https://img.shields.io/badge/📋%20HTML-Download-green?style=flat&logo=html5&logoColor=white)](https://underwood-inc.github.io/idling.app__UI/coverage-artifacts/latest-coverage-report.html) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=bugs)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI)

## GitHub Workflows (CI/CD)

This repository contains three GitHub Actions workflows: Version Control, Tests, and Deploy. Each workflow serves a specific purpose in our development and deployment process.

### 1. Tests Workflow

**File:** `.github/workflows/tests.yml`

This workflow runs various tests to ensure code quality and functionality.

**Triggers:**

- Push to `main` or `master` branches
- Pull request events (opened, synchronized, or reopened)

**Key Features:**

- Sets up a PostgreSQL service container
- Runs database migrations
- Executes Playwright (E2E) and Jest (Unit/Integration) tests in parallel shards
- **Playwright tests are optional** - they provide feedback but don't block the workflow
- Combines test reports and coverage
- Performs SonarCloud analysis
- Uploads test reports as artifacts

**Process:**

1. Sets up PostgreSQL service
2. Checks out the repository
3. Sets up Node.js with yarn caching
4. Runs database migrations
5. Installs dependencies and Playwright browsers
6. Runs Playwright tests in 3 parallel shards (**optional - won't fail workflow**)
7. Runs Jest tests in 3 parallel shards (**required**)
8. Combines test reports and coverage
9. Performs SonarCloud scan
10. Uploads test reports as artifacts

#### Automated Test Reporting

When running tests through GitHub Actions (on PRs or pushes to main/master), the workflow automatically generates separate test report comments:

- **Unit Test Results**: Shows combined Jest test outcomes from all shards

  - Pass/Fail/Skip counts
  - Test duration
  - Detailed failure messages in collapsible sections

- **E2E Test Results**: Shows combined Playwright test outcomes from all shards (**optional**)
  - Pass/Fail/Skip counts
  - Test duration
  - Detailed failure messages in collapsible sections
  - **Note**: E2E test failures won't prevent PR merging

Comments are recreated on each test run to maintain visibility in the PR activity feed.

#### Test Artifacts

The following test artifacts are preserved:

- Playwright reports (per shard and combined, 30 days retention) - **optional**
- Playwright failure traces (per shard, 7 days retention) - **optional**
- Jest coverage reports (per shard and combined, 30 days retention) - **required**

To access these artifacts:

1. Go to the GitHub Actions run
2. Scroll to the bottom
3. Look for the "Artifacts" section
4. Combined reports provide the full test overview

For more detailed information about our CI testing pipeline, please refer to [CI_TESTS.README.md](./CI_TESTS.README.md).

### 2. Deploy Workflow

**File:** `.github/workflows/deploy.yml`

This workflow handles the deployment of the application to a server.

**Triggers:**

- Push to the `master` branch

**Key Features:**

- Uses SSH to connect to the deployment server
- Updates the repository on the server
- Builds and restarts the application

**Process:**

1. Connects to the server via SSH
2. Navigates to the project directory
3. Resets the repository to a clean state
4. Pulls the latest changes from the master branch
5. Installs dependencies
6. Builds the application
7. Restarts the application using PM2

These workflows work together to ensure that code changes are properly versioned, thoroughly tested, and securely deployed to the production environment.

---

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

This project currently does not use any CSS assistance (i.e. pre-processors, tailwind, etc.) so, true BEM style CSS is somewhat challenging. When it comes to props that propagate into a `className` value that control visual elements such as width or color (i.e. width = 'md'), do not use BEM modifier notation (i.e. `--modifier`). Instead, create a separate class (i.e. `.md`) and style it accordingly. This is to allow for cleaner CSS due to the absence of many utilities CSS pre-processors generally provide.

## Getting Started

If you end up trying both methods you are likely to encounter issues. Common troubleshooting:

**I can't connect to the postgresql server**

If you are using the docker development experience, ensure you do not have a postgres server actively running already causing conflicts.

```bash
 sudo service postgresql stop
```

Similarly, if you are **not** using the docker development experience, ensure you **do** have a locally running postgres server.

**relation issue with tables**

If you are running into missing tables errors, you are likely experiencing user error. Drop your tables that have the same names as the ones used in this project and run the 000-init.sql scripts to properly initialize your local database.

**Error: EACCES: permission denied, unlink '\*\*/idling.app/\__UI/.next/server/_\*\*.js'**

NextJS build files are conflicting. Delete the `.next` directory.

### With Docker

⚠️ When using docker and running playwright tests, the postgres data consumed by playwright will use the same data you have populated manually as well as any data pre-populated via migration scripts.

Install docker on ubuntu: https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository

- for step 2: install latest

If permission issues come up, add docker group to your user then restart machines:

```bash
sudo usermod -aG docker $USER
```

With docker installed:

```bash
yarn dev:docker
# enter 1
```

To shutdown docker containers:

```bash
yarn dev:docker
# enter 2
```

To wipe the postgres database and start fresh:

```bash
yarn dev:docker
# enter 3
```

To seed the postgres database:

```bash
# attach to the nextjs container
docker exec -it nextjs sh
# run the seed script
yarn dev:seed
```

### Without Docker

Ensure you have postgres setup, a `.env.local` file in the root of the project directory, and have node packages installed before beginning.

This project uses `yarn` and `npx` so, package-lock.json has been added to the `.gitignore` list.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

To seed the postgres database (make sure it is up and running):

```bash
# run the seed script
yarn dev:seed
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation Development
