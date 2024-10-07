import Link from 'next/link';
import { Post } from 'src/lib/schemas/post.schemas';
import VoteButtons from '../vote-buttons/VoteButtons';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  return (
    <li className="bg-white shadow rounded-md p-4 flex">
      <VoteButtons score={post.score} id={post.id} type="post" />
      <div className="ml-4">
        <h2 className="text-xl font-semibold">
          {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
          <Link href={`/t/${post.subthread}/comments/${post.id}`}>
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-gray-500">
          Posted by u/{post.authorId} in r/{post.subthread} •&nbsp;
          {new Date(post.createdAt).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {post.commentCount} comments
        </p>
      </div>
    </li>
  );
}
