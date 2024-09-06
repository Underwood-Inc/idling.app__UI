import { Comment } from 'src/lib/schemas/comment.schemas';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  return (
    <ul className="space-y-4 mt-8">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ul>
  );
}
