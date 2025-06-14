import { Comment } from 'src/lib/schemas/comment.schemas';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className="comment-list">
      <ul className="comment-list__items">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </ul>
    </div>
  );
}
