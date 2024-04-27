import { Model, Op, WhereOptions } from "sequelize";
import {
  IUserFilters,
  IUserInput,
  IUserOutput,
} from "../../interfaces/user.interface";
import { AuthUserDTO } from "../dto/user.dto";
import { User, isValidPassword } from "../models/user";

const UserDal = {
  getAllOptions: <
    T extends Model & { deletedAt?: Date },
    F extends IUserFilters
  >(
    filters?: F
  ): WhereOptions<T> => {
    if (filters && filters.isDeleted) {
      return {
        deletedAt: { [Op.not]: undefined },
      };
    }

    return {};
  },

  authenticate: async ({
    password,
    userName,
  }: AuthUserDTO): Promise<IUserOutput | false> => {
    return new Promise((resolve, reject) => {
      try {
        return User.findOne({
          where: {
            ...UserDal.getAllOptions({ userName }),
          },
        }).then(async (_user) => {
          if (!_user) {
            resolve(false);
          } else if (
            !_user.dataValues.password ||
            !(await isValidPassword(password, _user.dataValues.password))
          ) {
            resolve(false);
          } else {
            // @ts-expect-error type mismatch
            resolve(_user);
          }
        });
      } catch (error) {
        const response = {
          status: 500,
          data: {},
          error: {
            message: "user match failed",
          },
        };
        return reject(response);
      }
    });
  },

  create: async (payload: IUserInput): Promise<IUserOutput> => {
    // @ts-expect-error type mismatch
    return await User.create(payload);
  },

  update: async (
    id: number,
    payload: Partial<IUserInput>
  ): Promise<IUserOutput> => {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error("not found");
    }
    // @ts-expect-error type mismatch
    return await user.setAttributes(payload);
  },

  getById: async (id: number): Promise<IUserOutput> => {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error("not found");
    }
    // @ts-expect-error type mismatch
    return user;
  },

  getByUserName: async (userName: string): Promise<IUserOutput> => {
    const user = await User.findOne({
      where: {
        userName,
      },
    });

    if (!user) {
      throw new Error("not found");
    }
    // @ts-expect-error type mismatch
    return user;
  },

  deleteById: async (id: number): Promise<boolean> => {
    const deletedPostCount = await User.destroy({
      where: { id },
    });

    return !!deletedPostCount;
  },

  getAll: async (filters?: IUserFilters): Promise<IUserOutput[]> => {
    // @ts-expect-error type mismatch
    return User.findAll({
      where: {
        // ...UserDal.getAllOptions(filters),
        ...filters,
      },
      ...(((filters && filters.isDeleted) ||
        (filters && filters.includeDeleted)) && {
        paranoid: true,
      }),
    });
  },
};

export default UserDal;
