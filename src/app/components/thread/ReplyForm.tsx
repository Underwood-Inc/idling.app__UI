'use client';

import { SharedSubmissionForm } from '../submission-forms/shared-submission-form/SharedSubmissionForm';

interface ReplyFormProps {
  parentId: number;
  onSuccess?: (newReply?: any) => void;
  replyToAuthor?: string; // Author name of the post being replied to
}

export function ReplyForm({
  parentId,
  onSuccess,
  replyToAuthor
}: ReplyFormProps) {
  return (
    <SharedSubmissionForm
      mode="reply"
      parentId={parentId}
      onSuccess={onSuccess}
      replyToAuthor={replyToAuthor}
      className="reply-form"
    />
  );
}
