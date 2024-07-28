'use client';
import { ChangeEvent, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  createSubmissionAction,
  validateCreateSubmissionFormAction
} from '../actions';
import {
  parseSubmission,
  parseZodErrors,
  SUBMISSION_NAME_MAX_LENGTH
} from '../schema';
import './AddSubmissionForm.css';

const initialState = {
  message: '',
  submission_datetime: '',
  submission_name: ''
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
    >
      Post
    </button>
  );
}

export function AddSubmissionForm({ isAuthorized }: { isAuthorized: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
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
  const [nameLength, setNameLength] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [errors, setErrors] = useState('');

  const submitButtonTitle = errors
    ? 'Resolve form errors.'
    : !isAuthorized
      ? 'Login to manage posts.'
      : undefined;

  const handleFormSubmitAction = async (formData: FormData) => {
    await formAction(formData);
    setNameLength(0);
    ref.current?.reset();
    setErrors('');
  };

  const handleFormValidateAction = async (formData: FormData) => {
    await validateFormAction(formData);
    setIsDisabled(!!validateState.message);
    setErrors(validateState.message);
  };

  const handleNameChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setNameLength(event.target.value.length);

    const { error } = parseSubmission({
      submission_name: event.target.value,
      submission_datetime: new Date().toISOString()
    });

    setIsDisabled(!!error);

    if (error) {
      setErrors(parseZodErrors(error));
    } else {
      setErrors('');
    }
  };

  const handleNameBlur = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('submission_name', event.target.value);
    setNameLength(event.target.value.length);
    await handleFormValidateAction(formData);
  };

  return (
    <form
      ref={ref}
      action={handleFormSubmitAction}
      className="submission__form"
    >
      <label htmlFor="submission_name" className="submission_name-label">
        <input
          type="text"
          id="submission_name"
          name="submission_name"
          className="submission__name-input"
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          disabled={!isAuthorized}
          title={!isAuthorized ? 'Login to manage posts.' : undefined}
          required
        />
        <SubmitButton isDisabled={isDisabled} title={submitButtonTitle} />
      </label>

      <p>
        {nameLength}/{SUBMISSION_NAME_MAX_LENGTH}
      </p>

      <p aria-live="polite" className="sr-only" role="status">
        {errors}
      </p>
    </form>
  );
}
