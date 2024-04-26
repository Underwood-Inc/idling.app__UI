/* eslint-disable no-param-reassign */
import bcrypt from "bcrypt";
import { DataTypes, Model } from "sequelize";
import { IUserAttributes, IUserInput } from "../../interfaces/user.interface";
import sequelizeConnection from "../config/db.config";

class User
  extends Model<IUserAttributes, IUserInput>
  implements IUserAttributes
{
  id!: number;

  lastName!: string;

  userName!: string;

  firstName!: string;

  password!: string;

  email!: string;

  // timestamps!
  readonly createdAt!: Date;

  readonly updatedAt!: Date;

  readonly deletedAt!: Date;

  // https://www.slingacademy.com/article/how-to-use-bcrypt-with-sequelize-models/
  async isValidPassword(password: string): boolean {
    // eslint-disable-next-line no-return-await
    return await bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    sequelize: sequelizeConnection,
    paranoid: true,
    hooks: {
      beforeCreate: async (user, options) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10, "a");
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10, "a");
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
