"use client";

import { useFormState, useFormStatus } from "react-dom";
import { deleteSubmission } from "../actions";

const initialState = {
  message: "",
  submission_datetime: "",
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
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(deleteSubmission, initialState)
  const [state, formAction] = useFormState(deleteSubmission, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="submission_id" value={id} />
      <input type="hidden" name="submission_name" value={name} />
      <DeleteButton />
      <p aria-live="polite" className="sr-only" role="status">
        {state?.message}
      </p>
    </form>
  );
}
