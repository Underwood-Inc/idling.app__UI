const { Client } = require('pg');

const pgclient = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

pgclient.connect();

pgclient.query('SELECT NOW()', (err: any, res: any) => {
  if (err) throw err;
  console.info('===res:', res);
  pgclient.end();
});
