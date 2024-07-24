This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

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

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


---
---

# IDEAS

## word replacer

- user provided text
- user selected text to replace
- user provided text that replaces configured replacement text
- save to local storage
- shareable (post-mvp)

## random card collector

### MVP

- system generates random cards using a basic RNG mechanism
- weighted RNG

### post-MVP

- xp gaining


### RNG

- basic

### localstorage

- store light game data

#### game data

-

#### profile data

####

### appearance of card

# postgres cmds

Create user
`CREATE ROLE myuser LOGIN PASSWORD 'mypass';`

Update user password
`ALTER USER myuser WITH PASSWORD 'thepassword';`

login
`psql -h localhost -d mydatabase -U myuser -p <port>`

create database
`CREATE DATABASE mydatabase WITH OWNER = myuser;`

create table
```sql
CREATE TABLE cars (
  brand VARCHAR(255),
  model VARCHAR(255),
  year INT
);

CREATE TABLE submissions (
  submission_id SERIAL NOT NULL PRIMARY KEY,
  submission_name VARCHAR(255),
  submission_datetime VARCHAR(255)
);
```

list databases
`\l`

choose database
`\c database_name`

show tables in selected database
`\dt` or `SELECT * FROM pg_catalog.pg_tables;`

