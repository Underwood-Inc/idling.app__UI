"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { deleteSubmission } from "../actions";

const initialState = {
  message: "",
  submission_name: "",
};

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="submission__delete-btn"
    >
      Delete
    </button>
  );
}

export function DeleteSubmissionForm({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(deleteSubmission, initialState)
  const [state, formAction] = useFormState(deleteSubmission, initialState);

  const handleFormAction = async (formData: FormData) => {
    await formAction(formData);
    ref.current?.reset();
  };

  return (
    <form ref={ref} action={handleFormAction}>
      <input type="hidden" name="submission_id" value={id} />
      <input type="hidden" name="submission_name" value={name} />
      <DeleteButton />
      <p aria-live="polite" className="sr-only" role="status">
        {state?.message}
      </p>
    </form>
  );
}
