import {
  IUser,
  IUserAttributes,
  IUserOutput,
} from "../../../interfaces/user.interface";

const userMapper = {
  toUser: (user: IUserOutput | IUserAttributes): IUser => {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  },
};

export default userMapper;
