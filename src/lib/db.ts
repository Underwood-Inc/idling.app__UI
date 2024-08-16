import postgres from 'postgres';

console.info(
  'postgres conf:',
  process.env.PGHOST,
  process.env.PGUSER,
  process.env.PGPORT,
  process.env.IS_TEST,
  process.env.PGPASSWORD
);

const sql = postgres({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  database: process.env.POSTGRES_DB,
  pass: process.env.PGPASSWORD,
  port: process.env.PGPORT as unknown as number,
  ssl: process.env.IS_TEST ? 'prefer' : 'allow'
});

export default sql;
