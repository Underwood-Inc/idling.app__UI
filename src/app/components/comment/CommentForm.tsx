'use client';
import { useState } from 'react';
import { createComment } from 'src/lib/actions/comment.actions';
import './CommentForm.css';

interface CommentFormProps {
  postId: string;
}

export default function CommentForm({ postId }: CommentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // @ts-ignore alpha feature incomplete
      await createComment({ content, postId });
      setContent('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <div className="comment-form__field">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          required
          className="comment-form__textarea"
        />
      </div>
      <button type="submit" className="comment-form__submit">
        Post Comment
      </button>
    </form>
  );
}
