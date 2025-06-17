import postgres from 'postgres';

// Debug: Log the exact values being passed to postgres
// eslint-disable-next-line no-console
console.log('🔍 DB Debug: Values being passed to postgres():');
// eslint-disable-next-line no-console
console.log('host:', process.env.POSTGRES_HOST);
// eslint-disable-next-line no-console
console.log('user:', process.env.POSTGRES_USER);
// eslint-disable-next-line no-console
console.log('database:', process.env.POSTGRES_DB);
// eslint-disable-next-line no-console
console.log('port:', process.env.POSTGRES_PORT);
// eslint-disable-next-line no-console
console.log('password:', process.env.POSTGRES_PASSWORD ? '[SET]' : '[NOT SET]');

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
