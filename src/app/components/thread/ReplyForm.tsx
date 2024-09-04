'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createSubmissionAction } from '../submission-forms/actions';

interface ReplyFormProps {
  parentId: number;
}

export function ReplyForm({ parentId }: ReplyFormProps) {
  const [replyContent, setReplyContent] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('submission_name', replyContent);
    formData.append('thread_parent_id', parentId.toString());

    const result = await createSubmissionAction({ status: 0 }, formData);

    if (result.status === 1) {
      setReplyContent('');
      router.refresh();
    } else {
      alert(result.error || 'Failed to submit reply');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="reply-form">
      <textarea
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Write your reply..."
        required
      />
      <button type="submit">Submit Reply</button>
    </form>
  );
}
