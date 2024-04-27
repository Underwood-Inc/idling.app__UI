import { Optional } from 'sequelize';
import { TimeStamps } from './common.interface';
import { Filters } from './filters.interface';

export interface IUserAttributes extends TimeStamps {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  password: string;
  userName: string;
}

export interface IUser extends Omit<IUserAttributes, 'password'> {}
export interface IUserInput extends Optional<IUser, 'id'> {}
export interface IUserOutput extends Required<IUser> {}
export interface IUserFilters extends Filters {
  userName?: string;
}
