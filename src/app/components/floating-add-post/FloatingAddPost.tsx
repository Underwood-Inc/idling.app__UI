'use client';

import { useSession } from 'next-auth/react';
import React, { useState } from 'react';
import { GiQuill } from 'react-icons/gi';
import { CONTEXT_IDS } from '../../../lib/context-ids';
import { AddSubmissionForm } from '../submission-forms/add-submission-form/AddSubmissionForm';
import './FloatingAddPost.css';

interface FloatingAddPostProps {
  onPostCreated?: () => void;
}

const FloatingAddPost: React.FC<FloatingAddPostProps> = ({ onPostCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();
  const isAuthorized = !!session?.user;

  const handleClick = () => {
    if (isAuthorized) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onPostCreated?.();
  };

  // Don't render if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <button
        className="floating-add-post__button"
        onClick={handleClick}
        aria-label="Create new post"
        title="Create new post"
      >
        <GiQuill className="floating-add-post__icon" />
      </button>

      {isModalOpen && (
        <div className="floating-add-post__modal" onClick={handleCloseModal}>
          <div
            className="floating-add-post__content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="floating-add-post__header">
              <h2 className="floating-add-post__title">
                ✨ Share Something New
              </h2>
              <button
                className="floating-add-post__close"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <AddSubmissionForm
              onSuccess={handleCloseModal}
              contextId={CONTEXT_IDS.POSTS.toString()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAddPost;
