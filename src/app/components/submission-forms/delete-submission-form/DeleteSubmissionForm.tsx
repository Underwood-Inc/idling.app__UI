'use client';
import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useShouldUpdate } from '../../../../lib/state/ShouldUpdateContext';
import { deleteSubmissionAction } from '../actions';
import './DeleteSubmissionForm.css';

const initialState = {
  status: 0,
  message: '',
  submission_name: ''
};

function DeleteButton({ isAuthorized }: { isAuthorized: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || !isAuthorized;
  const title = isDisabled ? 'Login to manage posts.' : undefined;

  return (
    <button
      type="submit"
      aria-disabled={isDisabled}
      disabled={isDisabled}
      className="submission__delete-btn"
      title={title}
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
  const { dispatch: dispatchShouldUpdate } = useShouldUpdate();
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(deleteSubmissionAction, initialState)
  const [state, formAction] = useFormState(
    deleteSubmissionAction,
    initialState
  );

  useEffect(() => {
    dispatchShouldUpdate({
      type: 'SET_SHOULD_UPDATE',
      payload: !!state.status
    });

    if (state.status) {
      ref.current?.reset();
    }
  }, [state.status, state.message, dispatchShouldUpdate]);

  const handleFormAction = async (formData: FormData) => {
    await formAction(formData);
    ref.current?.reset();
  };

  return (
    <form ref={ref} action={handleFormAction}>
      <input type="hidden" name="submission_id" value={id} />
      <input type="hidden" name="submission_name" value={name} />
      <DeleteButton isAuthorized={isAuthorized} />
      <p aria-live="polite" className="" role="status">
        {state?.message}
      </p>
    </form>
  );
}
