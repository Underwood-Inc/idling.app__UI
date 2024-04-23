import { IUserOutput } from '../../interfaces/user.interface';

export type CreateUserDTO = Exclude<
  IUserOutput,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export type UpdateUserDTO = CreateUserDTO;

export type AuthUserDTO = Record<'userName' | 'password', string>;
