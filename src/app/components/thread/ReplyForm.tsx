'use client';

import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { shouldUpdateAtom } from '../../../lib/state/atoms';
import { createSubmissionAction } from '../submission-forms/actions';
import './ReplyForm.css';

interface ReplyFormProps {
  parentId: number;
}

export function ReplyForm({ parentId }: ReplyFormProps) {
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (field: 'title' | 'content', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    if (formData.title.length > 255) {
      setError('Title must be 255 characters or less');
      return;
    }

    if (formData.content.length > 1000) {
      setError('Content must be 1000 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submitFormData = new FormData();
      submitFormData.append('submission_title', formData.title.trim());
      submitFormData.append('submission_name', formData.content.trim());
      submitFormData.append('thread_parent_id', parentId.toString());

      const result = await createSubmissionAction(
        { status: 0 },
        submitFormData
      );

      if (result.status === 1) {
        // Reset form
        setFormData({ title: '', content: '' });
        setShouldUpdate(true);
        router.refresh();
      } else {
        setError(result.error || 'Failed to submit reply');
      }
    } catch (err) {
      console.error('Reply submission error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.content.trim();
  const titleCharsRemaining = 255 - formData.title.length;
  const contentCharsRemaining = 1000 - formData.content.length;

  return (
    <form onSubmit={handleSubmit} className="reply-form">
      <div className="reply-form__field">
        <label
          htmlFor={`reply-title-${parentId}`}
          className="reply-form__label"
        >
          Reply Title *
        </label>
        <input
          type="text"
          id={`reply-title-${parentId}`}
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter a title for your reply..."
          maxLength={255}
          disabled={isSubmitting}
          className={`reply-form__input ${titleCharsRemaining < 0 ? 'reply-form__input--error' : ''}`}
          required
        />
        <div className="reply-form__char-count">
          <span
            className={
              titleCharsRemaining < 0 ? 'reply-form__char-count--error' : ''
            }
          >
            {titleCharsRemaining} characters remaining
          </span>
        </div>
      </div>

      <div className="reply-form__field">
        <label
          htmlFor={`reply-content-${parentId}`}
          className="reply-form__label"
        >
          Reply Content *
        </label>
        <textarea
          id={`reply-content-${parentId}`}
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="Write your reply..."
          maxLength={1000}
          disabled={isSubmitting}
          className={`reply-form__textarea ${contentCharsRemaining < 0 ? 'reply-form__textarea--error' : ''}`}
          rows={4}
          required
        />
        <div className="reply-form__char-count">
          <span
            className={
              contentCharsRemaining < 0 ? 'reply-form__char-count--error' : ''
            }
          >
            {contentCharsRemaining} characters remaining
          </span>
        </div>
      </div>

      {error && (
        <div className="reply-form__error" role="alert">
          {error}
        </div>
      )}

      <div className="reply-form__actions">
        <button
          type="submit"
          disabled={
            !isFormValid ||
            isSubmitting ||
            titleCharsRemaining < 0 ||
            contentCharsRemaining < 0
          }
          className="reply-form__submit"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Reply'}
        </button>
      </div>
    </form>
  );
}
