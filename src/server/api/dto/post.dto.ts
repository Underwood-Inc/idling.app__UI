import { Optional } from 'sequelize';
import { Post } from '../../interfaces/post.interface';

export type CreatePostDTO = Exclude<
  Post,
  'slug' | 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
> &
  Optional<Post, 'slug'>;

export type UpdatePostDTO = Optional<CreatePostDTO, 'name'>;
