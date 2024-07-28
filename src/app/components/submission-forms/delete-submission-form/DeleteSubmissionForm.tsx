'use client';
import { useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { deleteSubmissionAction } from '../actions';
import './DeleteSubmissionForm.css';

const initialState = {
  message: '',
  submission_name: ''
};

function DeleteButton({ isAuthorized }: { isAuthorized: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isAuthorized;

  return (
    <button
      type="submit"
      aria-disabled={isDisabled}
      disabled={isDisabled}
      className="submission__delete-btn"
      title={isDisabled ? 'Login to manage posts.' : undefined}
    >
      Delete
    </button>
  );
}

export function DeleteSubmissionForm({
  id,
  name,
  isAuthorized
}: {
  id: number;
  name: string;
  isAuthorized: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(deleteSubmissionAction, initialState)
  const [state, formAction] = useFormState(
    deleteSubmissionAction,
    initialState
  );

  const handleFormAction = async (formData: FormData) => {
    await formAction(formData);
    ref.current?.reset();
  };

  return (
    <form ref={ref} action={handleFormAction}>
      <input type="hidden" name="submission_id" value={id} />
      <input type="hidden" name="submission_name" value={name} />
      <DeleteButton isAuthorized={!isAuthorized} />
      <p aria-live="polite" className="sr-only" role="status">
        {state?.message}
      </p>
    </form>
  );
}
