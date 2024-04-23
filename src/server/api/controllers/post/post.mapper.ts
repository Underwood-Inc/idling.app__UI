import { IPostOutput, Post } from '../../../interfaces/post.interface';

export const postMapper = {
  toPost: (post: IPostOutput): Post => {
    return {
      id: post.id,
      name: post.name,
      slug: post.slug,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      deletedAt: post.deletedAt,
    };
  },
};
