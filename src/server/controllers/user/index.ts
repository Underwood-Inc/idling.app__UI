import { IUser, IUserFilters } from "../../../interfaces/user.interface";
import { AuthUserDTO, CreateUserDTO, UpdateUserDTO } from "../../dto/user.dto";
import UserService from "../../services/user.service";
import userMapper from "./user.mapper";

const service = new UserService();

class UserController {
  async authenticate(authPayload: AuthUserDTO): Promise<IUser | false> {
    const user = await service.authenticate(authPayload);

    if (user) {
      return userMapper.toUser(user);
    }

    return false;
  }

  async create(payload: CreateUserDTO): Promise<IUser> {
    return userMapper.toUser(await service.create(payload));
  }

  async update(id: number, payload: UpdateUserDTO): Promise<IUser> {
    return userMapper.toUser(await service.update(id, payload));
  }

  async getById(id: number): Promise<IUser> {
    return userMapper.toUser(await service.getById(id));
  }

  async getByUserName(userName: string): Promise<IUser> {
    return userMapper.toUser(await service.getByUserName(userName));
  }

  async deleteById(id: number): Promise<boolean> {
    const isDeleted = await service.deleteById(id);

    return isDeleted;
  }

  async getAll(filters: IUserFilters): Promise<IUser[]> {
    return (await service.getAll(filters)).map(userMapper.toUser);
  }
}

export default UserController;
