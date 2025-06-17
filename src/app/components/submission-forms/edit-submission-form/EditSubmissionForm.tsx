'use client';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
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
  const [nameLength, setNameLength] = useState(
    submission.submission_name.length
  );
  const [errors, setErrors] = useState('');

  const isDisabled = !isAuthorized || !!errors;

  const submitButtonTitle = errors
    ? 'Resolve form errors.'
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

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setNameLength(event.target.value.trim().length);
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
          <span>Title</span>
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
          />
        </div>
        <div className="row">
          <p className={`column ${getTitleLengthStatus()}`}>
            {titleLength}/255
          </p>
        </div>
      </label>

      {/* Tags Field */}
      <label htmlFor="submission_tags" className="submission__tags-label">
        <div className="row--sm-margin">
          <span>Tags</span>
          <input
            type="text"
            id="submission_tags"
            name="submission_tags"
            className="submission__tags-input"
            defaultValue={submission.tags.join(', ')}
            disabled={!isAuthorized}
            title={!isAuthorized ? 'Login to manage posts.' : undefined}
            placeholder="tag1, tag2, tag3"
          />
        </div>
      </label>

      {/* Hidden submission_name field for backward compatibility */}
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
