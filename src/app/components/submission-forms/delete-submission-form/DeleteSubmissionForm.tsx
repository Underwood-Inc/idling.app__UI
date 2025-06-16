'use client';
import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { deleteSubmissionAction } from '../actions';
import './DeleteSubmissionForm.css';

const initialState = {
  status: 0,
  message: ''
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
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const [state, formAction] = useFormState(
    deleteSubmissionAction,
    initialState
  );

  useEffect(() => {
    setShouldUpdate(!!state.status);

    if (state.status) {
      ref.current?.reset();
    }
  }, [state.status, state.message, setShouldUpdate]);

  return (
    <form ref={ref} action={formAction}>
      <input type="hidden" name="submission_id" value={id} />
      <input type="hidden" name="submission_name" value={name} />
      <DeleteButton isAuthorized={isAuthorized} />
      <p aria-live="polite" className="" role="status">
        {state?.message || (state as any)?.error}
      </p>
    </form>
  );
}
