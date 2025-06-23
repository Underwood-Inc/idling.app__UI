'use client';

import { Submission } from '../schema';
import { SharedSubmissionForm } from '../shared-submission-form/SharedSubmissionForm';

interface SubmissionData {
  submission_id: number;
  submission_title: string;
  submission_name: string;
  tags: string[];
}

export function EditSubmissionForm({
  submission,
  onSuccess,
  onCancel
}: {
  submission: SubmissionData;
  onSuccess?: (updatedSubmissionData?: Submission) => void;
  onCancel?: () => void;
}) {
  // Convert tags array to comma-separated string with # prefix
  const formattedTags = submission.tags
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(', ');

  const handleSuccess = (result?: {
    status: number;
    message?: string;
    error?: string;
    submission?: Submission;
  }) => {
    // Pass any updated submission data to the callback
    onSuccess?.(result?.submission);
  };

  return (
    <div className="edit-submission-form">
      <SharedSubmissionForm
        mode="edit"
        submissionId={submission.submission_id}
        initialTitle={submission.submission_title}
        initialContent={submission.submission_name || ''}
        initialTags={formattedTags}
        onSuccess={handleSuccess}
        className="edit-submission-form__shared-form"
      />
    </div>
  );
}
