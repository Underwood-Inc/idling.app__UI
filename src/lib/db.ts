// import { Pool } from "pg";

// let conn;

// if (!conn) {
//   conn = new Pool({
//     user: process.env.PGSQL_USER,
//     password: process.env.PGSQL_PASSWORD,
//     host: process.env.PGSQL_HOST,
//     // @ts-expect-error
//     port: process.env.PGSQL_PORT,
//     database: process.env.PGSQL_DATABASE,
//   })
// }

// export default conn;

import postgres from 'postgres';

const sql = postgres({
  host: process.env.PGSQL_HOST,
  user: process.env.PGSQL_USER,
  port: process.env.PGPORT as unknown as number,
})

export default sql;