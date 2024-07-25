"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createSubmission } from "../actions";
import { SUBMISSION_NAME_MAX_LENGTH } from "../schema";

const initialState = {
  message: "",
  submission_datetime: "",
  submission_name: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending}>
      Submit
    </button>
  );
}

export function AddSubmissionForm() {
  const ref = useRef<HTMLFormElement>(null);
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(createSubmission, initialState)
  const [state, formAction] = useFormState(createSubmission, initialState);
  const [nameLength, setNameLength] = useState(0);

  const handleFormAction = async (formData: FormData) => {
    // console.log("formData", formData);
    await formAction(formData);
    ref.current?.reset();
  };

  return (
    <form ref={ref} action={handleFormAction}>
      <label htmlFor="submission_name">
        <span>Name:</span>
        <input
          type="text"
          id="submission_name"
          name="submission_name"
          onChange={(e) => setNameLength(e.target.value.length)}
          required
        />
        <span>
          {nameLength}/{SUBMISSION_NAME_MAX_LENGTH}
        </span>
      </label>

      <SubmitButton />

      <p aria-live="polite" className="sr-only" role="status">
        {state?.message}
      </p>
    </form>
  );
}
