"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createSubmission } from "./actions";

const initialState = {
  message: ""
}

function SubmitButton() {
  const {pending} = useFormStatus()

  return (
    <button type="submit" aria-disabled={pending}>
      Add
    </button>
  )
}

export function AddSubmissionForm() {
  const [state, formAction] = useActionState(createSubmission, initialState)

  console.log('state', state)
  return (
    <form action={formAction}>
      <label htmlFor="submission">Name</label>
      <input type="text" id="submission_name" required />
      <SubmitButton />
      <p aria-live="polite" className="sr-only" role="status">
        {state?.message}
      </p>
    </form>
  )
}