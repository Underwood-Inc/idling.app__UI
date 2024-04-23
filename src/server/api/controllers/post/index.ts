import { Filters } from '../../../interfaces/filters.interface';
import { Post } from '../../../interfaces/post.interface';
import { CreatePostDTO, UpdatePostDTO } from '../../dto/post.dto';
import { PostService } from '../../services/post.service';
import { postMapper } from './post.mapper';

const service = new PostService();

export class PostController {
  async create(payload: CreatePostDTO): Promise<Post> {
    return postMapper.toPost(await service.create(payload));
  }

  async update(id: number, payload: UpdatePostDTO): Promise<Post> {
    return postMapper.toPost(await service.update(id, payload));
  }

  async getById(id: number): Promise<Post> {
    return postMapper.toPost(await service.getById(id));
  }

  async deleteById(id: number): Promise<Boolean> {
    const isDeleted = await service.deleteById(id);

    return isDeleted;
  }

  async getAll(filters: Filters): Promise<Post[]> {
    return (await service.getAll(filters)).map(postMapper.toPost);
  }
}
