import postgres from 'postgres';

const sql = postgres({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  database: process.env.POSTGRES_DB,
  pass: process.env.PGPASSWORD,
  port: process.env.PGPORT as unknown as number,
  ssl: process.env.IS_CI ? 'prefer' : 'allow'
});

export default sql;
