'use client';

import { useOverlay } from '@lib/context/OverlayContext';
import React from 'react';
import { EditSubmissionForm } from '../submission-forms/edit-submission-form/EditSubmissionForm';
import { SharedSubmissionForm } from '../submission-forms/shared-submission-form/SharedSubmissionForm';
import './PostModal.css';

interface PostModalProps {
  mode: 'create' | 'view' | 'edit';
  postId?: string;
  title?: string;
  content?: React.ReactNode;
  onClose?: () => void;
  // Edit mode props
  submission?: {
    submission_id: number;
    submission_title: string;
    submission_name: string;
    tags: string[];
  };
}

export const PostModal: React.FC<PostModalProps> = ({
  mode,
  postId,
  title,
  content,
  onClose,
  submission
}) => {
  const { closeOverlay } = useOverlay();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Close via overlay system if no custom close handler
      closeOverlay(`post-modal-${postId || mode}`);
    }
  };

  const getModalTitle = () => {
    if (title) return title;

    switch (mode) {
      case 'create':
        return 'Create New Post';
      case 'edit':
        return 'Edit Post';
      case 'view':
        return 'View Post';
      default:
        return 'Post';
    }
  };

  const renderContent = () => {
    if (content) {
      return content;
    }

    switch (mode) {
      case 'create':
        return <SharedSubmissionForm mode="create" onSuccess={handleClose} />;
      case 'edit':
        if (!submission) {
          return <div>Error: No submission data provided for edit mode</div>;
        }
        return (
          <EditSubmissionForm
            submission={submission}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        );
      case 'view':
        // TODO: Implement post view
        return <div>Post view coming soon...</div>;
      default:
        return <div>Unknown mode</div>;
    }
  };

  return (
    <div className="post-modal">
      <div className="post-modal__header">
        <h2 className="post-modal__title">{getModalTitle()}</h2>
        <button
          className="post-modal__close"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="post-modal__content">{renderContent()}</div>
    </div>
  );
};
