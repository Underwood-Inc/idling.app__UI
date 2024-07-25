"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createSubmission } from "./actions";

const initialState = {
  message: "",
  submission_datetime: '',
  submission_name: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" aria-disabled={pending}>
      Submit
    </button>
  )
}

export function AddSubmissionForm() {
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(createSubmission, initialState)
  const [state, formAction] = useFormState(createSubmission, initialState)

  console.log('state', state)
  return (
    <form action={formAction}>
      <label htmlFor="submission_name">Name</label>
      <input type="text" id="submission_name" name="submission_name" required />

      <SubmitButton />

      <p aria-live="polite" className="sr-only" role="status">
        {state?.message}
      </p>
    </form>
  )
}