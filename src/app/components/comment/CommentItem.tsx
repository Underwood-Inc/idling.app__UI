import { Comment } from 'src/lib/schemas/comment.schemas';
import './CommentItem.css';

interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
  return (
    <li className="comment-item">
      <div className="comment-item__content">
        <p className="comment-item__meta">
          Posted by u/{comment.authorId} •{' '}
          {new Date(comment.createdAt).toLocaleString()}
        </p>
        <p className="comment-item__text">{comment.content}</p>
      </div>
    </li>
  );
}
