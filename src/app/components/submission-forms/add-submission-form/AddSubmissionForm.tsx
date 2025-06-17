'use client';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { ADD_SUBMISSION_FORM_SELECTORS } from '../../../../lib/test-selectors/components/add-submission-form.selectors';
import { validateTagsInput } from '../../../../lib/utils/string/tag-regex';
import {
  createSubmissionAction,
  validateCreateSubmissionFormAction
} from '../actions';
import './AddSubmissionForm.css';

const initialState = {
  status: 0,
  message: '',
  error: '',
  submission_datetime: '',
  submission_name: '',
  submission_title: ''
};

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
      data-testid={ADD_SUBMISSION_FORM_SELECTORS.SUBMIT_BUTTON}
    >
      Submit
    </button>
  );
}

export function AddSubmissionForm({
  onSuccess,
  contextId
}: { onSuccess?: () => void; contextId?: string } = {}) {
  const ref = useRef<HTMLFormElement>(null);
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const { data: session } = useSession();
  const isAuthorized = !!session?.user;

  const [state, formAction] = useFormState(
    createSubmissionAction,
    initialState
  );
  const [validateState, handleFormValidateAction] = useFormState(
    validateCreateSubmissionFormAction,
    initialState
  );

  const [titleLength, setTitleLength] = useState(0);
  const [contentLength, setContentLength] = useState(0);
  const [errors, setErrors] = useState('');
  const [tagErrors, setTagErrors] = useState<string[]>([]);

  const isDisabled = !isAuthorized || !!errors || tagErrors.length > 0;

  const submitButtonTitle = errors
    ? 'Resolve form errors.'
    : tagErrors.length > 0
      ? 'Fix tag errors.'
      : !isAuthorized
        ? 'Login to create posts.'
        : undefined;

  // Update should trigger when state changes
  useEffect(() => {
    if (state.status) {
      setShouldUpdate(!!state.status);
      onSuccess?.();
    }
  }, [state.status, state.message, setShouldUpdate, onSuccess]);

  useEffect(() => {
    if (validateState.error) {
      setErrors(validateState.error);
    } else {
      setErrors('');
    }
  }, [validateState]);

  const handleTitleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setTitleLength(event.target.value.trim().length);
  };

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContentLength(event.target.value.trim().length);
  };

  const handleTagsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const tagsValue = event.target.value;
    const validationErrors = validateTagsInput(tagsValue);
    setTagErrors(validationErrors);
  };

  const handleTitleBlur = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('submission_title', event.target.value);
    setTitleLength(event.target.value.trim().length);
    await handleFormValidateAction(formData);
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
      data-testid={ADD_SUBMISSION_FORM_SELECTORS.FORM}
    >
      {/* Title Field */}
      <label htmlFor="submission_title" className="submission__title-label">
        <div className="row--sm-margin">
          <span>Title *</span>
          <input
            type="text"
            id="submission_title"
            name="submission_title"
            className="submission__title-input"
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            disabled={!isAuthorized}
            title={!isAuthorized ? 'Login to manage posts.' : undefined}
            required
            maxLength={255}
            placeholder="Enter a title for your post..."
            data-testid="add-submission-title-input"
          />
        </div>
        <div className="row">
          <p
            className={`column ${getTitleLengthStatus()}`}
            data-testid="add-submission-title-character-count"
          >
            {titleLength}/255
          </p>
        </div>
      </label>

      {/* Content/Description Field */}
      <label htmlFor="submission_content" className="submission__content-label">
        <div className="row--sm-margin">
          <span>Content</span>
          <textarea
            id="submission_content"
            name="submission_content"
            className="submission__content-input"
            onChange={handleContentChange}
            disabled={!isAuthorized}
            title={!isAuthorized ? 'Login to manage posts.' : undefined}
            maxLength={1000}
            rows={4}
            placeholder="Write your post content... (tags like #hashtag will be automatically detected)"
            data-testid="add-submission-content-input"
          />
        </div>
        <div className="row">
          <p
            className={`column ${getContentLengthStatus()}`}
            data-testid="add-submission-content-character-count"
          >
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
            onChange={handleTagsChange}
            disabled={!isAuthorized}
            title={!isAuthorized ? 'Login to manage posts.' : undefined}
            placeholder="#tag1, #tag2, #tag3"
            data-testid="add-submission-tags-input"
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
        value=""
      />

      <div className="row--sm-margin">
        <SubmitButton isDisabled={isDisabled} title={submitButtonTitle} />
      </div>

      <div className="row">
        <p
          aria-live="polite"
          className={`column ${errors ? 'error' : 'info'}`}
          role="status"
          data-testid={ADD_SUBMISSION_FORM_SELECTORS.STATUS_MESSAGE}
        >
          {errors || state.message}
        </p>
      </div>
    </form>
  );
}
