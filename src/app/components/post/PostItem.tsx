import Link from 'next/link';
import { Post } from 'src/lib/schemas/post.schemas';
import './PostItem.css';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  return (
    <li className="post-item">
      <div className="post-item__content">
        <h2 className="post-item__title">
          {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
          <Link href={`/t/${post.subthread}/comments/${post.id}`}>
            {post.title}
          </Link>
        </h2>
        <p className="post-item__meta">
          Posted by u/{post.authorId} in r/{post.subthread} •&nbsp;
          {new Date(post.createdAt).toLocaleString()}
        </p>
        <p className="post-item__description">{post.content}</p>
      </div>
    </li>
  );
}
