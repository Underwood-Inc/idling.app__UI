import { Comment } from 'src/lib/schemas/comment.schemas';
import VoteButtons from '../vote-buttons/VoteButtons';

interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
  return (
    <li className="bg-white shadow rounded-md p-4">
      <div className="flex">
        <VoteButtons score={comment.score} id={comment.id} type="comment" />
        <div className="ml-4">
          <p className="text-sm text-gray-500">
            Posted by u/{comment.authorId} •&nbsp;
            {new Date(comment.createdAt).toLocaleString()}
          </p>
          <p className="mt-2">{comment.content}</p>
        </div>
      </div>
    </li>
  );
}
