'use client';

import { useSession } from 'next-auth/react';
import React, { useEffect } from 'react';
import { GiQuill } from 'react-icons/gi';
import { CONTEXT_IDS } from '../../../lib/context-ids';
import { useOverlay } from '../../../lib/context/OverlayContext';
import { SharedSubmissionForm } from '../submission-forms/shared-submission-form/SharedSubmissionForm';
import './FloatingAddPost.css';

interface FloatingAddPostProps {
  onPostCreated?: () => void;
  externalTrigger?: boolean;
  onTriggerHandled?: () => void;
}

const AddPostModalContent: React.FC<{ onClose?: () => void }> = ({
  onClose
}) => {
  return (
    <div className="floating-add-post__modal-content">
      <div className="floating-add-post__header">
        <h2 className="floating-add-post__title">✨ Share Something New</h2>
      </div>
      <SharedSubmissionForm
        mode="create"
        onSuccess={onClose}
        contextId={CONTEXT_IDS.POSTS.toString()}
      />
    </div>
  );
};

const FloatingAddPost: React.FC<FloatingAddPostProps> = ({
  onPostCreated,
  externalTrigger = false,
  onTriggerHandled
}) => {
  const { data: session } = useSession();
  const { openOverlay, closeOverlay } = useOverlay();
  const isAuthorized = !!session?.user;

  const modalId = 'floating-add-post-modal';

  // Handle external trigger
  useEffect(() => {
    if (externalTrigger && isAuthorized) {
      handleOpenModal();
      onTriggerHandled?.();
    }
  }, [externalTrigger, isAuthorized, onTriggerHandled]);

  const handleOpenModal = () => {
    if (isAuthorized) {
      openOverlay({
        id: modalId,
        type: 'modal',
        component: AddPostModalContent,
        props: {
          onClose: () => {
            closeOverlay(modalId);
            onPostCreated?.();
          }
        }
      });
    }
  };

  // Don't render if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <button
      className="floating-add-post__button"
      onClick={handleOpenModal}
      aria-label="Create new post"
      title="Create new post"
    >
      <GiQuill className="floating-add-post__icon" />
    </button>
  );
};

export default FloatingAddPost;
