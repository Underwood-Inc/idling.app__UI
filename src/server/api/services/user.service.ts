import { UserDal } from '../../db/dal/user.dal';
import {
  IUserFilters,
  IUserInput,
  IUserOutput,
} from '../../interfaces/user.interface';
import { AuthUserDTO } from '../dto/user.dto';

const dal = new UserDal();

export class UserService {
  async authenticate(payload: AuthUserDTO): Promise<IUserOutput | false> {
    return dal.authenticate(payload);
  }

  async create(payload: IUserInput): Promise<IUserOutput> {
    return dal.create(payload);
  }

  async update(id: number, payload: Partial<IUserInput>) {
    return dal.update(id, payload);
  }

  async getById(id: number): Promise<IUserOutput> {
    return dal.getById(id);
  }

  async getByUserName(userName: string): Promise<IUserOutput> {
    return dal.getByUserName(userName);
  }

  async deleteById(id: number): Promise<boolean> {
    return dal.deleteById(id);
  }

  async getAll(filters: IUserFilters): Promise<IUserOutput[]> {
    return dal.getAll(filters);
  }
}
