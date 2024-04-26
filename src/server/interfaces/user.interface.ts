import { Optional } from "sequelize";
import { TimeStamps } from "./common.interface";
import { Filters } from "./filters.interface";

export interface IUserAttributes extends TimeStamps {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  password: string;
  userName: string;
}

export type IUser = Omit<IUserAttributes, "password">;
export type IUserInput = Optional<IUser, "id">;
export type IUserOutput = Required<IUser>;
export interface IUserFilters extends Filters {
  userName?: string;
}
