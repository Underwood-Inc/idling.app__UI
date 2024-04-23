import { kebabCase } from 'lodash';
import { PostDal } from '../../db/dal/post.dal';
import { Filters } from '../../interfaces/filters.interface';
import { IPostInput, IPostOutput } from '../../interfaces/post.interface';

const dal = new PostDal();

export class PostService {
  async create(payload: IPostInput): Promise<IPostOutput> {
    let slug = kebabCase(payload.name);
    const slugExists = await dal.checkSlugExists(slug);

    payload.slug = slugExists
      ? `${slug}-${Math.floor(Math.random() * 1000)}`
      : slug;

    return dal.create(payload);
  }

  async update(id: number, payload: Partial<IPostInput>) {
    if (payload.name) {
      let slug = kebabCase(payload.name);
      const slugExists = await dal.checkSlugExists(slug);

      payload.slug = slugExists
        ? `${slug}-${Math.floor(Math.random() * 1000)}`
        : slug;
    }

    return dal.update(id, payload);
  }

  async getById(id: number): Promise<IPostOutput> {
    return dal.getById(id);
  }

  async deleteById(id: number): Promise<boolean> {
    return dal.deleteById(id);
  }

  async getAll(filters: Filters): Promise<IPostOutput[]> {
    return dal.getAll(filters);
  }
}
