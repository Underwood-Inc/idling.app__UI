import { Post } from 'src/lib/schemas/post.schemas';
import { InstantLink } from '../ui/InstantLink';
import './PostItem.css';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  return (
    <li className="post-item">
      <div className="post-item__content">
        <h2 className="post-item__title">
          <InstantLink href={`/t/${post.subthread}/comments/${post.id}`}>
            {post.title}
          </InstantLink>
        </h2>
        <p className="post-item__meta">
          Posted by {post.authorId} in {post.subthread} •&nbsp;
          {new Date(post.createdAt).toLocaleString()}
        </p>
        <p className="post-item__description">{post.content}</p>
      </div>
    </li>
  );
}
