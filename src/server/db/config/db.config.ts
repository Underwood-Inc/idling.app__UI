import diff from "microdiff";
import { Dialect, Model, Sequelize } from "sequelize";
import { SequelizeHooks } from "sequelize/types/hooks";
import localCache from "../../lib/local-cache";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

const isTest = process.env.NODE_ENV === "test";
const dbName = isTest
  ? (process.env.TEST_DB_NAME as string)
  : (process.env.DB_NAME as string);
const dbUser = process.env.DB_USER as string;
const dbHost = process.env.DB_HOST;
const dbDriver = process.env.DB_DRIVER as Dialect;
const dbPassword = process.env.DB_PASSWORD;

console.log("dbName", dbName);

const hooks: Partial<SequelizeHooks<Model<any, any>, any, any>> = {
  afterUpdate: (instance: Model<any, any>) => {
    const cacheKey = `${instance.constructor.name.toLowerCase()}s`;

    const currentData = instance.get({ plain: true });

    if (!localCache.hasKey(cacheKey)) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listingData = localCache.get<any>(cacheKey) as any[];
    const itemIndex = listingData.findIndex(
      (it) => it.id === instance.getDataValue("id")
    );
    // eslint-disable-next-line no-bitwise
    const oldItemData = ~itemIndex ? listingData[itemIndex] : {};

    const instanceDiff = diff(oldItemData, currentData);

    if (instanceDiff.length > 0) {
      listingData[itemIndex] = currentData;
      localCache.set(cacheKey, listingData);
    }
  },
  afterCreate: (instance: Model<any, any>) => {
    const cacheKey = `${instance.constructor.name.toLowerCase()}s`;
    const currentData = instance.get({ plain: true });

    if (!localCache.hasKey(cacheKey)) {
      return;
    }

    const listingData = localCache.get<any>(cacheKey) as any[];
    listingData.push(currentData);

    localCache.set(cacheKey, listingData);
  },
};
console.log(dbName, "dbName");
const sequelizeConnection = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDriver,
  logging: true,
  define: { hooks },
});

export default sequelizeConnection;
