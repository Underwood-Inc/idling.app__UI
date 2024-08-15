This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

This project currently does not use any CSS assistance (i.e. pre-processors, tailwind, etc.) so, true BEM style CSS is somewhat challenging. When it comes to props that propagate into a `className` value that control visual elements such as width or color (i.e. width = 'md'), do not use BEM modifier notation (i.e. `--modifier`). Instead, create a separate class (i.e. `.md`) and style it accordingly. This is to allow for cleaner CSS due to the absence of many utilities CSS pre-processors generally provide.

## Getting Started

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Testing

All code that can be tested via jest tests should be. Playwright will expand what is testable when added.

Never select elements in a test by anything other than an accompanying test selector. This means that all elements that are being selected must have a `data-testid` attribute on them that is then used to query i.e. `screen.getByTestId('my-test-id')`.

The NPM package jest-chain has been added to allow chaining expect methods within jest .test test files (not in playwright .spec test files).

### Jest - when to write

Unit tests for all utility functions must be written via jest.

### React testing library (RTL) - when to write [***.test.tsx]

Individual component files (.tsx) within `components/` must have an accompanying `***.test.tsx` files. These tests should cover as many scenarios as possible for the component on it's own.

Page component files must have an accompanying `***.test.tsx` files. Thes tests are **integration** tests which must test a combination of multiple components in relation to one another. Additionally, these tests should have some user event actions to simulate real-world user events and outcomes that can then have assertions made against (i.e. clicking a button changes it to be in a loading state).

### Playwright - when to write [***.spec.ts]

Playwright tests are where anything else that can't be tested in unit, component, or integration tests are tested. These are end-to-end (e2e) tests. Playwright tests are scoped at the browser (including type) level. This project is configured to run all playwright tests (`***.spec.ts`) on major browser and mobile devices. Additionally, playwright tests are where accessibility analysis/assertions must be made via the utility method `checkA11y`.

> While e2e tests can cover _everything_, you must still write unit, component, & integration tests separately due to the highly variable nature of web browsers.

When it comes to accessibility testing, `@axe-core/playwright` has been added. This package is used to produce a utility method that accepts a page argument to analyze and will output any violations with the offending nodes defined.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

~~The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.~~

~~Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.~~

This project was created from the NextJS quickstart script (bootstrapped) however, it does not have TailwindCSS. Additionally, it uses basic CSS at the moment. This project is deployed manually to an ubuntu environment in the cloud.

This process involves:

- accessing the cloud instance to host the project
- ensuring the postgres back-end requirements are met
- setting up the project `.env.local` with environment variables for the host
- running `yarn && yarn build && yarn start`

Optionally, you may run the built project files with pm2 (if you have it) via `pm2 start "npm start" --name "idling.app"`. Refer to the pm2 documentation for auto-starting on environment startup.

---

---

## TODO

### migrations architecture

modifications to postgres (or anything else SQL-like) require migrations architecture support to be added to this repository. migrations allow for rapid spinup of dev environment databases while protecting against unsavory changes to associated databases systems.

### manual cache mechanism

certain things should be cached that are not able to be automatically (i.e. client generated content). as a first implementation, cache the header image and only replace/clear it if the logged in username (image seed) is different.

- cache header image in localstorage
  - it uses the logged in user as a seed so it changes less frequently
- cache other generated images in sessionstorage (i.e. coin faces)

### namespaced component expansion for <Card />

expand upon existing card component to contain elements such as:

- <Card.Header />
- <Card.Body />
- <Card.Footer />

provide a template that consumes these namespaced components to provide a default layout and then update all references to leverage the new components

### account linking | BLOCKS ACCOUNT OPTIONS

currently, nextauth logins are treated as separate identities. nextauth supports account linking so it may be a simple configuration update or a somewhat involved modification to the postgres adapter in use.

### account options

#### use merged identity | BLOCKED BY ACCOUNT LINKING

toggle option that controls the outward identify and subsequent UX to either use the idling.app platform as the poster or to use any account linked to the idling.app platform account.

### cypress

if possible, set up such that both live and stubbed API testing can be done

### import aliases

```ts
import { CustomSession } from '../../../auth.config';
import { auth } from '../../../lib/auth';

// into
import { CustomSession } from '@auth/auth.config';
import { auth } from '@auth/auth';
```

---

---

## IDEAS

### word replacer

- user provided text
- user selected text to replace
- user provided text that replaces configured replacement text
- save to local storage
- shareable (post-mvp)

### random coin collector

- "mint" new coins that the current user then acquires on a "draw" of coins
- coin faces vary in rarity and appearance
  - appearance variability limited to:
    - color/material
    - filter (i.e. shimmer)
    - edge (ruffle, flat, bumpy, etc.)
    - copy
      - minting date stamp
      - first and last initial of minter account name
        - John Snow -> JS
        - some_zinc -> SC
    - coin face
      - chance to render Avatar using minter account name as the Avatar generation seed

## postgres cmds

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
