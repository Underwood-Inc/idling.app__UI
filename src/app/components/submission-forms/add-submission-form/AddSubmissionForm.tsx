'use client';
import { useAtom } from 'jotai';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { ADD_SUBMISSION_FORM_SELECTORS } from '../../../../lib/test-selectors/components/add-submission-form.selectors';
import {
  createSubmissionAction,
  validateCreateSubmissionFormAction
} from '../actions';
import { parseSubmission, parseZodErrors } from '../schema';
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

export function AddSubmissionForm({ isAuthorized }: { isAuthorized: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(createSubmissionAction, initialState)
  const [state, formAction] = useFormState(
    createSubmissionAction,
    initialState
  );
  const [validateState, validateFormAction] = useFormState(
    validateCreateSubmissionFormAction,
    initialState
  );
  const [titleLength, setTitleLength] = useState(0);
  const [nameLength, setNameLength] = useState(0);
  const [errors, setErrors] = useState('');

  const isDisabled = !isAuthorized || !!errors;

  const submitButtonTitle = errors
    ? 'Resolve form errors.'
    : !isAuthorized
      ? 'Login to manage posts.'
      : undefined;

  useEffect(() => {
    setShouldUpdate(!!state.status);

    if (state.status) {
      setTitleLength(0);
      setNameLength(0);
      ref.current?.reset();
    }
  }, [state.status, state.message, setShouldUpdate]);

  const handleFormValidateAction = async (formData: FormData) => {
    await validateFormAction(formData);
    setErrors(validateState.error || '');
  };

  const handleTitleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setTitleLength(event.target.value.trim().length);

    const { error } = parseSubmission({
      submission_title: event.target.value,
      submission_datetime: new Date()
    });

    if (error) {
      setErrors(parseZodErrors(error));
    } else {
      setErrors('');
    }
  };

  const handleNameChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setNameLength(event.target.value.trim().length);
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
          <span>Title</span>
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

      {/* Tags Field */}
      <label htmlFor="submission_tags" className="submission__tags-label">
        <div className="row--sm-margin">
          <span>Tags</span>
          <input
            type="text"
            id="submission_tags"
            name="submission_tags"
            className="submission__tags-input"
            disabled={!isAuthorized}
            title={!isAuthorized ? 'Login to manage posts.' : undefined}
            placeholder="tag1, tag2, tag3"
            data-testid="add-submission-tags-input"
          />
        </div>
      </label>

      {/* Hidden submission_name field for backward compatibility */}
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
