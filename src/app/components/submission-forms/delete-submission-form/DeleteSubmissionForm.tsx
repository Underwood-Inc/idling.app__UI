'use client';
import { shouldUpdateAtom } from '@lib/state/atoms';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { InteractiveTooltip } from '../../tooltip/InteractiveTooltip';
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

  // Don't show button at all if user is not authorized
  if (!isAuthorized) {
    return null;
  }

  // Don't show button until permission is checked
  if (!deletePermission) {
    return null;
  }

  const canDelete = deletePermission.canDelete === true;
  const isDisabled = pending || !canDelete;

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

  // Show tooltip only for non-permission reasons (like replies existing)
  if (!canDelete && deletePermission.reason) {
    const tooltipContent = (
      <div
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          lineHeight: '1.4',
          color: 'white',
          textAlign: 'center',
          wordWrap: 'break-word'
        }}
      >
        {deletePermission.reason}
      </div>
    );

    return (
      <InteractiveTooltip
        content={tooltipContent}
        isInsideParagraph={true}
        delay={200}
      >
        {button}
      </InteractiveTooltip>
    );
  }

  return button;
}

export function DeleteSubmissionForm({
  id,
  name,
  isAuthorized,
  authorId,
  onDeleteSuccess
}: {
  id: number;
  name: string;
  isAuthorized: boolean;
  authorId?: string | undefined;
  onDeleteSuccess?: () => void;
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
      // Use optimistic callback if available, otherwise fallback to global update
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        setShouldUpdate(true);
      }
      ref.current?.reset();
    }
  }, [state.status, state.message, onDeleteSuccess, setShouldUpdate]);

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
