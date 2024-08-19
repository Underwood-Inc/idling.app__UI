import postgres from 'postgres';

const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  pass: process.env.POSTGRES_PASSWORD,
  port: process.env.PGPORT as unknown as number,
  ssl: process.env.IS_CI ? 'prefer' : 'allow'
});

export default sql;
