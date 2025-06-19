'use client';

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
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  // Convert tags array to comma-separated string with # prefix
  const formattedTags = submission.tags
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(', ');

  return (
    <div className="edit-submission-form">
      <SharedSubmissionForm
        mode="edit"
        submissionId={submission.submission_id}
        initialTitle={submission.submission_title}
        initialContent={submission.submission_name || ''}
        initialTags={formattedTags}
        onSuccess={onSuccess}
        className="edit-submission-form__shared-form"
      />
      {onCancel && (
        <div className="edit-submission-form__actions">
          <button
            type="button"
            onClick={onCancel}
            className="edit-submission-form__cancel"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
