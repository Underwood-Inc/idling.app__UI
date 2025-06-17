'use client';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { validateTagsInput } from '../../../../lib/utils/string/tag-regex';
import { editSubmissionAction } from '../actions';
import { parseEditSubmission, parseZodErrors } from '../schema';
import './EditSubmissionForm.css';

const initialState = {
  status: 0,
  message: '',
  error: ''
};

interface SubmissionData {
  submission_id: number;
  submission_title: string;
  submission_name: string;
  tags: string[];
}

function SubmitButton({
  isDisabled,
  title
}: {
  isDisabled: boolean;
  title?: string;
}) {
  const { pending } = useFormStatus();
  const canSubmit = !pending && !isDisabled;

  return (
    <button
      type="submit"
      aria-disabled={!canSubmit}
      disabled={!canSubmit}
      title={title}
      className="submission__submit-button"
    >
      Update Post
    </button>
  );
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
  const ref = useRef<HTMLFormElement>(null);
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const { data: session } = useSession();
  const isAuthorized = !!session?.user;

  const [state, formAction] = useFormState(editSubmissionAction, initialState);
  const [titleLength, setTitleLength] = useState(
    submission.submission_title.length
  );
  const [contentLength, setContentLength] = useState(
    submission.submission_name.length
  );
  const [errors, setErrors] = useState('');
  const [tagErrors, setTagErrors] = useState<string[]>([]);

  const isDisabled = !isAuthorized || !!errors || tagErrors.length > 0;

  const submitButtonTitle = errors
    ? 'Resolve form errors.'
    : tagErrors.length > 0
      ? 'Fix tag errors.'
      : !isAuthorized
        ? 'Login to manage posts.'
        : undefined;

  useEffect(() => {
    if (state.status) {
      setShouldUpdate(!!state.status);
      // Call the success callback if provided
      onSuccess?.();
    }
  }, [state.status, state.message, setShouldUpdate, onSuccess]);

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setTitleLength(event.target.value.trim().length);

    const { error } = parseEditSubmission({
      submission_id: submission.submission_id,
      submission_title: event.target.value,
      submission_name: submission.submission_name
    });

    if (error) {
      setErrors(parseZodErrors(error));
    } else {
      setErrors('');
    }
  };

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContentLength(event.target.value.trim().length);
  };

  const handleTagsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const tagsValue = event.target.value;
    const validationErrors = validateTagsInput(tagsValue);
    setTagErrors(validationErrors);
  };

  const getTitleLengthStatus = () => {
    const percentOfMax = (titleLength / 255) * 100;

    if (percentOfMax >= 80 && percentOfMax < 100) {
      return 'warning';
    }

    if (percentOfMax >= 100) {
      return 'error';
    }

    return 'info';
  };

  const getContentLengthStatus = () => {
    const percentOfMax = (contentLength / 1000) * 100;

    if (percentOfMax >= 80 && percentOfMax < 100) {
      return 'warning';
    }

    if (percentOfMax >= 100) {
      return 'error';
    }

    return 'info';
  };

  return (
    <form
      ref={ref}
      action={formAction}
      className="submission__form"
      role="form"
    >
      {/* Hidden submission ID */}
      <input
        type="hidden"
        name="submission_id"
        value={submission.submission_id}
      />

      {/* Title Field */}
      <label htmlFor="submission_title" className="submission__title-label">
        <div className="row--sm-margin">
          <span>Title *</span>
          <input
            type="text"
            id="submission_title"
            name="submission_title"
            className="submission__title-input"
            defaultValue={submission.submission_title}
            onChange={handleTitleChange}
            disabled={!isAuthorized}
            title={!isAuthorized ? 'Login to manage posts.' : undefined}
            required
            maxLength={255}
          />
        </div>
        <div className="row">
          <p className={`column ${getTitleLengthStatus()}`}>
            {titleLength}/255
          </p>
        </div>
      </label>

      {/* Content Field */}
      <label htmlFor="submission_content" className="submission__content-label">
        <div className="row--sm-margin">
          <span>Content</span>
          <textarea
            id="submission_content"
            name="submission_content"
            className="submission__content-input"
            defaultValue={submission.submission_name}
            onChange={handleContentChange}
            disabled={!isAuthorized}
            title={!isAuthorized ? 'Login to manage posts.' : undefined}
            maxLength={1000}
            rows={4}
            placeholder="Write your post content... (tags like #hashtag will be automatically detected)"
          />
        </div>
        <div className="row">
          <p className={`column ${getContentLengthStatus()}`}>
            {contentLength}/1000
          </p>
        </div>
      </label>

      {/* Tags Field */}
      <label htmlFor="submission_tags" className="submission__tags-label">
        <div className="row--sm-margin">
          <span>Additional Tags</span>
          <input
            type="text"
            id="submission_tags"
            name="submission_tags"
            className="submission__tags-input"
            defaultValue={submission.tags
              .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
              .join(', ')}
            onChange={handleTagsChange}
            disabled={!isAuthorized}
            title={!isAuthorized ? 'Login to manage posts.' : undefined}
            placeholder="#tag1, #tag2, #tag3"
          />
        </div>
        {tagErrors.length > 0 && (
          <div className="submission__tag-errors">
            {tagErrors.map((error, index) => (
              <p key={index} className="error" role="alert">
                {error}
              </p>
            ))}
          </div>
        )}
        <div className="submission__tag-help">
          <p className="info">
            Tags must start with # and contain only letters, numbers, hyphens,
            and underscores. Tags from your title and content will be
            automatically detected.
          </p>
        </div>
      </label>

      {/* Hidden submission_name field - now populated from content */}
      <input
        type="hidden"
        id="submission_name"
        name="submission_name"
        defaultValue={submission.submission_name}
      />

      {/* Submit Button */}
      <div className="submission__form-actions">
        <SubmitButton isDisabled={isDisabled} title={submitButtonTitle} />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="submission__cancel-button"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Status Messages */}
      <div aria-live="polite" role="status">
        {state?.message && (
          <p className={state.status > 0 ? 'info' : 'error'}>{state.message}</p>
        )}
        {state?.error && <p className="error">{state.error}</p>}
        {errors && <p className="error">{errors}</p>}
      </div>
    </form>
  );
}
