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

const style = { marginRight: "1rem", padding: ".2rem" };

function SubmitButton({ isAuthorized }: { isAuthorized: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isAuthorized;

  return (
    <button
      type="submit"
      aria-disabled={isDisabled}
      disabled={isDisabled}
      style={style}
      title={isDisabled ? "Login to manage posts." : undefined}
    >
      Post
    </button>
  );
}

export function AddSubmissionForm({ isAuthorized }: { isAuthorized: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
  // TODO: https://github.com/vercel/next.js/issues/65673#issuecomment-2112746191
  // const [state, formAction] = useActionState(createSubmission, initialState)
  const [state, formAction] = useFormState(createSubmission, initialState);
  const [nameLength, setNameLength] = useState(0);

  const handleFormAction = async (formData: FormData) => {
    await formAction(formData);
    setNameLength(0);
    ref.current?.reset();
  };

  return (
    <form ref={ref} action={handleFormAction}>
      <SubmitButton isAuthorized={!isAuthorized} />

      <label htmlFor="submission_name">
        <input
          type="text"
          id="submission_name"
          name="submission_name"
          onChange={(e) => setNameLength(e.target.value.length)}
          style={style}
          disabled={!isAuthorized}
          title={!isAuthorized ? "Login to manage posts." : undefined}
          required
        />
        <span>
          {nameLength}/{SUBMISSION_NAME_MAX_LENGTH}
        </span>
      </label>

      <p aria-live="polite" className="sr-only" role="status">
        {state?.message}
      </p>
    </form>
  );
}
