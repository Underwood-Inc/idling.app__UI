## Code Analysis

![React](https://img.shields.io/badge/React-19.0.0--alpha-61DAFB?style=flat&logo=react&logoColor=white)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=bugs)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI)

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
- Executes Playwright and Jest tests
- Performs SonarCloud analysis
- Uploads test reports as artifacts

**Process:**

1. Sets up PostgreSQL service
2. Checks out the repository
3. Sets up Node.js
4. Runs database migrations
5. Installs dependencies and Playwright browsers
6. Runs Playwright tests
7. Runs Jest tests with coverage
8. Performs SonarCloud scan
9. Uploads Playwright report as an artifact

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
yarn dev:dock
# or
docker compose up
```

To wipe the postgres database and start fresh:

```bash
yarn dev:undock
# or
docker compose down
```

To seed the postgres database:

```bash
# attach to the nextjs container
docker exec -it nextjs sh
# run the seed script
yarn dev:seed
```

### Without Docker

Ensure you have postgres setup, a `.env.local` file in the root of the project directory, and have node pacakges installed before beginning.

This project uses `yarn` and `npx` so, package-lock.json has been added to the `.gitigore` list.

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Testing

All code that can be tested via jest tests should be. Playwright will expand what is testable when added.

Opt for existing selectors for static content testing such as `getBy**` and `queryAllBy**`. For dynamic content, adding a `data-testid` to the markup being tested and then using the appropriate `**byTestId` selector method(s). Refer to the following excerpt from the [React Testing Library documentation regarding test IDs](https://testing-library.com/docs/queries/bytestid/):

> In the spirit of [the guiding principles](https://testing-library.com/docs/guiding-principles), it is recommended to use this only after the other queries don't work for your use case. Using data-testid attributes do not resemble how your software is used and should be avoided if possible. That said, they are way better than querying based on DOM structure or styling css class names. Learn more about data-testids from the blog post "[Making your UI tests resilient to change](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change)"

The NPM package jest-chain has been added to allow chaining expect methods within jest .test test files (not in playwright .spec test files).

### Jest

You can run jest test with a few different scripts:

- `yarn test` is the default and will run test suites for changed files
- `yarn test:ci` will run all test suites and is what is run on CI systems

All test scripts will run against `**.test.tsx` files.

#### Unit

Unit tests for all utility functions must be written via jest.

#### Component & Integration via React testing library (RTL) w/jest assertions [***.test.tsx]

Individual component files (.tsx) within `components/` must have an accompanying `***.test.tsx` files. These tests should cover as many scenarios as possible for the standalone component.

Page component files must have an accompanying `***.test.tsx` files. These tests are **integration** tests which must test a combination of multiple components in relation to one another. Additionally, these tests should have some user event actions to simulate real-world user events and outcomes that can then have assertions made against (i.e. clicking a button changes it to be in a loading state).

If the `<FadeIn />` component is being used on the page being tested via Playwright, add a manual waittime of two seconds to ensure the fade-in animations are all completed. This is necessary because the animation gradually changes the opacity from 0 to 1 and playwright can analyze elements during animations. If the animation is not yet complete, a less than one opacity will result in darker than expected colors resulting in a failed contrast accessibility check.

Additionally, excluding elements from the checkA11y method must be done very sparingly as an excluded element will also exclude all of its descendants. In the use-case of the FadeIn component, it can wrap any valid react node to give it a fade in loading animation that starts on component mount. This means unintentional exclusion of a large portion of a page from the accessibility evalutaion pipeline.

### E2E via Playwright [***.spec.ts]

Playwright tests are where anything else that can't be tested in unit, component, or integration tests are tested. These are end-to-end (e2e) tests.

Playwright tests are scoped at the browser (including type) level. This project is configured to run all playwright tests (`***.spec.ts`) on major browser and mobile devices (chromium, firefox, webkit, mobile chrome, mobile safari, microsoft edge, & google chrome). Refer to the `playwright.config.ts` for more details.

Playwright tests are where accessibility analysis/assertions must be made via the utility method `checkA11y`.

To test a page that requires authentication, ensure you have the correct environment variables (refer to .env.local.example) and are using the testing utility method `testWithFakeAuth`.

> While e2e tests can cover _everything_, you must still write unit, component, & integration tests separately due to the highly variable nature of web browsers.

When it comes to accessibility testing, `@axe-core/playwright` has been added. This package is used to produce a utility method that accepts a page argument to analyze and will output any violations with the offending nodes defined.

You can run playwright test with a few different scripts:

- `yarn e2e` is the default script that should be used while writing e2e tests
- `yarn e2e:headless` is the script to run to run all playwright tests. This is the script used on CI systems

All test scripts will run against `**.spec.ts` files.

## Deployment

This project was created from the NextJS quickstart script (bootstrapped) however, it does not have TailwindCSS. Additionally, it uses basic CSS at the moment. This project is deployed manually to an ubuntu environment in the cloud.

This process involves:

- accessing the cloud instance to host the project
- ensuring the postgres back-end requirements are met
- setting up the project `.env.local` with environment variables for the host
- running `yarn && yarn build && yarn start`

Optionally, you may run the built project files with pm2 (if you have it) via `pm2 start "npm start" --name "idling.app"`. Refer to the pm2 documentation for auto-starting on environment startup.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### PostgreSQL

Create user
`CREATE ROLE myuser LOGIN PASSWORD 'mypass';`

Update user password
`ALTER USER myuser WITH PASSWORD 'thepassword';`

login
`psql -h localhost -d mydatabase -U myuser -p <port>`

create database
`CREATE DATABASE mydatabase WITH OWNER = myuser;`

list databases
`\l`

choose database
`\c database_name`

show tables in selected database
`\dt` or `SELECT * FROM pg_catalog.pg_tables;`

See more in this [postgres cheat sheet](https://learnsql.com/blog/postgresql-cheat-sheet/postgresql-cheat-sheet-a4.pdf)
