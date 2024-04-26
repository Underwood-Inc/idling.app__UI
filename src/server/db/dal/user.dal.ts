/* eslint-disable class-methods-use-this */
/* eslint-disable no-return-await */
import { Model, Op, WhereOptions } from "sequelize";
import { AuthUserDTO } from "../../api/dto/user.dto";
import {
  IUserFilters,
  IUserInput,
  IUserOutput,
} from "../../interfaces/user.interface";
import User from "../models/user";

export class UserDal {
  private getAllOptions = <
    T extends Model & { deletedAt?: Date },
    F extends IUserFilters
  >(
    filters?: F
  ): WhereOptions<T> => {
    if (filters?.isDeleted) {
      return {
        deletedAt: { [Op.not]: undefined },
      };
    }

    return {};
  };

  async authenticate({
    password,
    userName,
  }: AuthUserDTO): Promise<IUserOutput | false> {
    return new Promise((resolve, reject) => {
      try {
        User.findOne({
          where: {
            ...this.getAllOptions({ userName }),
          },
        }).then(async (_user) => {
          if (!_user) {
            resolve(false);
          } else if (
            !_user.dataValues.password ||
            !(await _user.isValidPassword(password))
          ) {
            resolve(false);
          } else {
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
  }

  async create(payload: IUserInput): Promise<IUserOutput> {
    return await User.create(payload);
  }

  async update(id: number, payload: Partial<IUserInput>): Promise<IUserOutput> {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error("not found");
    }

    return await (payload as User).update(payload);
  }

  async getById(id: number): Promise<IUserOutput> {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error("not found");
    }

    return user;
  }

  async getByUserName(userName: string): Promise<IUserOutput> {
    const user = await User.findOne({
      where: {
        userName,
      },
    });

    if (!user) {
      throw new Error("not found");
    }

    return user;
  }

  async deleteById(id: number): Promise<boolean> {
    const deletedPostCount = await User.destroy({
      where: { id },
    });

    return !!deletedPostCount;
  }

  async getAll(filters?: IUserFilters): Promise<IUserOutput[]> {
    return User.findAll({
      where: {
        ...this.getAllOptions(filters),
      },
      ...((filters?.isDeleted || filters?.includeDeleted) && {
        paranoid: true,
      }),
    });
  }
}
