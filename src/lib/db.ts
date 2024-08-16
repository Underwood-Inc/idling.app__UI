import postgres from 'postgres';

const sql = postgres({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  port: process.env.PGPORT as unknown as number,
  ssl: process.env.IS_TEST ? 'prefer' : 'allow'
});

export default sql;
