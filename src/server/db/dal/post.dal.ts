/* eslint-disable no-return-await */
/* eslint-disable class-methods-use-this */
import { isEmpty } from "lodash";
import { Model, Op, WhereOptions } from "sequelize";
import { Filters } from "../../interfaces/filters.interface";
import { IPostInput, IPostOutput } from "../../interfaces/post.interface";
import Post from "../models/post.model";

export class PostDal {
  private getAllOptions = <
    T extends Model & { deletedAt?: Date },
    F extends Filters
  >(
    filters?: F
  ): WhereOptions<T> => {
    if (filters?.isDeleted) {
      return {
        deletedAt: { [Op.not]: undefined },
      };
    }

    return {};
  };

  async create(payload: IPostInput): Promise<IPostOutput> {
    return await Post.create(payload);
  }

  async update(id: number, payload: Partial<IPostInput>): Promise<IPostOutput> {
    const post = await Post.findByPk(id);

    if (!post) {
      throw new Error("not found");
    }

    return await (payload as Post).update(payload);
  }

  async getById(id: number): Promise<IPostOutput> {
    const post = await Post.findByPk(id);

    if (!post) {
      throw new Error("not found");
    }

    return post;
  }

  async deleteById(id: number): Promise<boolean> {
    const deletedPostCount = await Post.destroy({
      where: { id },
    });

    return !!deletedPostCount;
  }

  async getAll(filters?: Filters): Promise<IPostOutput[]> {
    return Post.findAll({
      where: {
        ...this.getAllOptions(filters),
      },
      ...((filters?.isDeleted || filters?.includeDeleted) && {
        paranoid: true,
      }),
    });
  }

  async checkSlugExists(slug: string): Promise<boolean> {
    const postWithSlug = await Post.findOne({
      where: {
        slug,
      },
    });

    return !isEmpty(postWithSlug);
  }
}
