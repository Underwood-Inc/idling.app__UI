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
