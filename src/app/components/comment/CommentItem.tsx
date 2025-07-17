import { Comment } from '@lib/types';
import { TimestampWithTooltip } from '../ui/TimestampWithTooltip';
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
          <TimestampWithTooltip date={comment.createdAt} />
        </p>
        <p className="comment-item__text">{comment.content}</p>
      </div>
    </li>
  );
}
