'use client';

import { useState } from 'react';
import './CollapsibleReplyForm.css';
import { ReplyForm } from './ReplyForm';

interface CollapsibleReplyFormProps {
  parentId: number;
  onSuccess: () => void;
  replyToAuthor: string;
}

export default function CollapsibleReplyForm({
  parentId,
  onSuccess,
  replyToAuthor
}: CollapsibleReplyFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="collapsible-reply-form">
      <button
        className="collapsible-reply-form__toggle"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="reply-form-content"
      >
        <span className="collapsible-reply-form__toggle-text">ADD A REPLY</span>
        <svg
          className={`collapsible-reply-form__chevron ${
            isExpanded
              ? 'collapsible-reply-form__chevron--up'
              : 'collapsible-reply-form__chevron--down'
          }`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        id="reply-form-content"
        className={`collapsible-reply-form__content ${
          isExpanded
            ? 'collapsible-reply-form__content--expanded'
            : 'collapsible-reply-form__content--collapsed'
        }`}
      >
        <div className="collapsible-reply-form__form">
          <ReplyForm
            parentId={parentId}
            onSuccess={() => {
              onSuccess();
              // Optionally collapse after successful submission
              setIsExpanded(false);
            }}
            replyToAuthor={replyToAuthor}
          />
        </div>
      </div>
    </div>
  );
}
