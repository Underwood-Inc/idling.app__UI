import { Optional } from 'sequelize';
import { TimeStamps } from './common.interface';

export interface Post extends TimeStamps {
  id: number;
  name: string;
  slug: string;
}

export interface IPostInput extends Optional<Post, 'id' | 'slug'> {}
export interface IPostOutput extends Required<Post> {}
