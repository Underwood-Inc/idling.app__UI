'use client';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { InfoTooltip } from '../../tooltip/InfoTooltip';
import { canDeleteSubmission, deleteSubmissionAction } from '../actions';
import './DeleteSubmissionForm.css';

const initialState = {
  status: 0,
  message: ''
};

interface DeletePermission {
  canDelete: boolean;
  reason?: string;
  replyCount?: number;
}

function DeleteButton({
  isAuthorized,
  deletePermission
}: {
  isAuthorized: boolean;
  deletePermission: DeletePermission | null;
}) {
  const { pending } = useFormStatus();

  // Default to false until permission is explicitly checked
  const canDelete = isAuthorized && deletePermission?.canDelete === true;
  const isDisabled = pending || !canDelete;

  let tooltipText = '';
  if (!isAuthorized) {
    tooltipText = 'Login to manage posts.';
  } else if (
    deletePermission &&
    !deletePermission.canDelete &&
    deletePermission.reason
  ) {
    tooltipText = deletePermission.reason;
  }

  const button = (
    <button
      type="submit"
      aria-disabled={isDisabled}
      disabled={isDisabled}
      className="submission__delete-btn"
    >
      Delete
    </button>
  );

  // Wrap in tooltip if there's a reason the button is disabled
  if (tooltipText) {
    return <InfoTooltip content={tooltipText}>{button}</InfoTooltip>;
  }

  return button;
}

export function DeleteSubmissionForm({
  id,
  name,
  isAuthorized,
  authorId
}: {
  id: number;
  name: string;
  isAuthorized: boolean;
  authorId?: string | undefined;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const [deletePermission, setDeletePermission] =
    useState<DeletePermission | null>({ canDelete: false });
  const [state, formAction] = useFormState(
    deleteSubmissionAction,
    initialState
  );

  // Check delete permission when component mounts or dependencies change
  useEffect(() => {
    async function checkPermission() {
      if (isAuthorized && authorId) {
        try {
          const permission = await canDeleteSubmission(id, authorId);
          setDeletePermission(permission);
        } catch (error) {
          console.error('Error checking delete permission:', error);
          setDeletePermission({
            canDelete: false,
            reason: 'Unable to verify delete permissions.'
          });
        }
      } else {
        setDeletePermission({
          canDelete: false,
          reason: isAuthorized
            ? 'Unable to verify permissions.'
            : 'Login required to delete posts.'
        });
      }
    }

    checkPermission();
  }, [id, isAuthorized, authorId]);

  useEffect(() => {
    if (state.status === 1) {
      // Only trigger update on successful deletion
      setShouldUpdate(true);
      ref.current?.reset();
    }
  }, [state.status, state.message, setShouldUpdate]);

  return (
    <form ref={ref} action={formAction}>
      <input type="hidden" name="submission_id" value={id} />
      <input type="hidden" name="submission_name" value={name} />
      <DeleteButton
        isAuthorized={isAuthorized}
        deletePermission={deletePermission}
      />
      <p aria-live="polite" className="" role="status">
        {state?.message || (state as any)?.error}
      </p>
    </form>
  );
}
