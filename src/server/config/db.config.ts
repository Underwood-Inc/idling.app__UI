import "dotenv/config";
import { Dialect, Sequelize } from "sequelize";

const isTest = process.env.NODE_ENV === "test";
const dbName = isTest
  ? (process.env.TEST_DB_NAME as string)
  : (process.env.DB_NAME as string);
const dbUser = process.env.DB_USER as string;
const dbHost = process.env.DB_HOST;
const dbDriver = process.env.DB_DRIVER as Dialect;
const dbPassword = process.env.DB_PASSWORD;
console.log("dbDriver", dbDriver);

const sequelizeConnection = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDriver,
  logging: false,
});

export default sequelizeConnection;
