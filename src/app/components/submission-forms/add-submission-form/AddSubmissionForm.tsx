'use client';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { ADD_SUBMISSION_FORM_SELECTORS } from '../../../../lib/test-selectors/components/add-submission-form.selectors';
import { getEffectiveCharacterCount } from '../../../../lib/utils/string';
import { validateTagsInput } from '../../../../lib/utils/string/tag-regex';
import { SmartInput } from '../../ui/SmartInput';
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

  const [titleValue, setTitleValue] = useState('');
  const [contentValue, setContentValue] = useState('');
  const [tagsValue, setTagsValue] = useState('');
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
    if (state.status === 1) {
      // Only trigger update on successful submission
      setShouldUpdate(true);
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

  const handleTitleChange = async (value: string) => {
    setTitleValue(value);
    setTitleLength(getEffectiveCharacterCount(value.trim()));

    // Validate title on change instead of blur
    if (value.trim().length > 0) {
      const formData = new FormData();
      formData.append('submission_title', value);
      await handleFormValidateAction(formData);
    }
  };

  const handleContentChange = (value: string) => {
    setContentValue(value);
    setContentLength(getEffectiveCharacterCount(value.trim()));
  };

  const handleTagsChange = (value: string) => {
    setTagsValue(value);
    const validationErrors = validateTagsInput(value);
    setTagErrors(validationErrors);
  };

  const handleTitleBlur = async () => {
    const formData = new FormData();
    formData.append('submission_title', titleValue);
    setTitleLength(getEffectiveCharacterCount(titleValue.trim()));
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
          <SmartInput
            value={titleValue}
            onChange={handleTitleChange}
            disabled={!isAuthorized}
            placeholder="Enter a title for your post... Use #hashtags and @mentions!"
            className="submission__title-input"
            as="input"
            enableHashtags={true}
            enableUserMentions={true}
          />
          <input type="hidden" name="submission_title" value={titleValue} />
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
          <SmartInput
            value={contentValue}
            onChange={handleContentChange}
            disabled={!isAuthorized}
            placeholder="Write your post content... Use #hashtags and @mentions!"
            className="submission__content-input"
            as="textarea"
            rows={4}
            enableHashtags={true}
            enableUserMentions={true}
          />
          <input type="hidden" name="submission_content" value={contentValue} />
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
          <SmartInput
            value={tagsValue}
            onChange={handleTagsChange}
            disabled={!isAuthorized}
            placeholder="#tag1, #tag2, #tag3"
            className="submission__tags-input"
            as="input"
            enableHashtags={true}
            enableUserMentions={false}
          />
          <input type="hidden" name="submission_tags" value={tagsValue} />
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
