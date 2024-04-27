import {
  IUserFilters,
  IUserInput,
  IUserOutput,
} from "../../interfaces/user.interface";
import UserDal from "../dal/user.dal";
import { AuthUserDTO } from "../dto/user.dto";

class UserService {
  async authenticate(payload: AuthUserDTO): Promise<IUserOutput | false> {
    return UserDal.authenticate(payload);
  }

  async create(payload: IUserInput): Promise<IUserOutput> {
    return UserDal.create(payload);
  }

  async update(id: number, payload: Partial<IUserInput>): Promise<IUserOutput> {
    return UserDal.update(id, payload);
  }

  async getById(id: number): Promise<IUserOutput> {
    return UserDal.getById(id);
  }

  async getByUserName(userName: string): Promise<IUserOutput> {
    return UserDal.getByUserName(userName);
  }

  async deleteById(id: number): Promise<boolean> {
    return UserDal.deleteById(id);
  }

  async getAll(filters: IUserFilters): Promise<IUserOutput[]> {
    return UserDal.getAll(filters);
  }
}

export default UserService;
