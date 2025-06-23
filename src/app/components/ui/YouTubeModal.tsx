'use client';

import React from 'react';
import { YouTubeEmbed } from './YouTubeEmbed';
import './YouTubeModal.css';

interface YouTubeModalProps {
  url: string;
  title?: string;
  onClose?: () => void;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  url,
  title,
  onClose
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  return (
    <div
      className="youtube-modal"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="youtube-modal__content">
        <div className="youtube-modal__header">
          <h3 className="youtube-modal__title">{title || 'YouTube Video'}</h3>
          <button
            className="youtube-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              width="24"
              height="24"
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
        <div className="youtube-modal__video">
          <YouTubeEmbed
            url={url}
            width="F"
            className="youtube-modal__embed"
            title={title || 'YouTube video'}
          />
        </div>
      </div>
    </div>
  );
};
