import postgres from 'postgres';

const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  pass: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT as unknown as number,
  ssl: 'prefer',
  onnotice: () => {},
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false // Disable prepared statements to reduce connection usage
});

export default sql;
