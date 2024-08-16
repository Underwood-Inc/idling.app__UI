import postgres from 'postgres';

const sql = postgres({
  host: process.env.PGSQL_HOST,
  user: process.env.PGSQL_USER,
  port: process.env.PGPORT as unknown as number,
  ssl: 'allow'
});

export default sql;
