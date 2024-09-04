'use client';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { ADD_SUBMISSION_FORM_SELECTORS } from 'src/lib/test-selectors/components/add-submission-form.selectors';
import { useShouldUpdate } from '../../../../lib/state/ShouldUpdateContext';
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
  status: 0,
  message: '',
  error: '',
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
      data-testid={ADD_SUBMISSION_FORM_SELECTORS.SUBMIT_BUTTON}
    >
      Post
    </button>
  );
}

export function AddSubmissionForm({ isAuthorized }: { isAuthorized: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
  const { dispatch: dispatchShouldUpdate } = useShouldUpdate();
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
  const [errors, setErrors] = useState('');

  const isDisabled = !isAuthorized || !!errors;

  const submitButtonTitle = errors
    ? 'Resolve form errors.'
    : !isAuthorized
      ? 'Login to manage posts.'
      : undefined;

  useEffect(() => {
    dispatchShouldUpdate({
      type: 'SET_SHOULD_UPDATE',
      payload: !!state.status
    });

    if (state.status) {
      setNameLength(0);
      ref.current?.reset();
    }
  }, [state.status, state.message, dispatchShouldUpdate]);

  const handleFormValidateAction = async (formData: FormData) => {
    await validateFormAction(formData);
    setErrors(validateState.error || '');
  };

  const handleNameChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setNameLength(event.target.value.trim().length);

    const { error } = parseSubmission({
      submission_name: event.target.value,
      submission_datetime: new Date().toISOString()
    });

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
    setNameLength(event.target.value.trim().length);
    await handleFormValidateAction(formData);
  };

  const getNameLengthStatus = () => {
    const percentOfMax = (nameLength / 255) * 100;

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
      data-testid={ADD_SUBMISSION_FORM_SELECTORS.FORM}
    >
      <label htmlFor="submission_name" className="submission__name-label">
        <div className="row--sm-margin">
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
            data-testid={ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT}
          />
          <SubmitButton isDisabled={isDisabled} title={submitButtonTitle} />
        </div>
        <div className="row">
          <p
            className={`column ${getNameLengthStatus()}`}
            data-testid={ADD_SUBMISSION_FORM_SELECTORS.CHARACTER_COUNT}
          >
            {nameLength}/{SUBMISSION_NAME_MAX_LENGTH}
          </p>

          <p
            aria-live="polite"
            className={`column ${errors ? 'error' : 'info'}`}
            role="status"
            data-testid={ADD_SUBMISSION_FORM_SELECTORS.STATUS_MESSAGE}
          >
            {errors || state.message}
          </p>
        </div>
      </label>
    </form>
  );
}
