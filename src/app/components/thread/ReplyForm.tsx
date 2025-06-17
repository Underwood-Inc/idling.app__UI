'use client';

import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { shouldUpdateAtom } from '../../../lib/state/atoms';
import { validateTagsInput } from '../../../lib/utils/string/tag-regex';
import { createSubmissionAction } from '../submission-forms/actions';
import { SmartInput } from '../ui/SmartInput';
import './ReplyForm.css';

interface ReplyFormProps {
  parentId: number;
  onSuccess?: () => void;
  replyToAuthor?: string; // Author name of the post being replied to
}

export function ReplyForm({
  parentId,
  onSuccess,
  replyToAuthor
}: ReplyFormProps) {
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const [formData, setFormData] = useState({
    title: '',
    content: replyToAuthor ? `@${replyToAuthor} ` : '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagErrors, setTagErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleInputChange = (
    field: 'title' | 'content' | 'tags',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (error) setError('');

    // Validate tags in real-time
    if (field === 'tags') {
      const validationErrors = validateTagsInput(value);
      setTagErrors(validationErrors);
    }
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

    if (tagErrors.length > 0) {
      setError('Please fix tag errors before submitting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submitFormData = new FormData();
      submitFormData.append('submission_title', formData.title.trim());
      submitFormData.append('submission_content', formData.content.trim());
      submitFormData.append('submission_tags', formData.tags.trim());
      submitFormData.append('thread_parent_id', parentId.toString());

      const result = await createSubmissionAction(
        { status: 0 },
        submitFormData
      );

      if (result.status === 1) {
        // Reset form
        setFormData({
          title: '',
          content: replyToAuthor ? `@${replyToAuthor} ` : '',
          tags: ''
        });
        setTagErrors([]);
        setShouldUpdate(true);

        // Call success callback to close form and refresh
        if (onSuccess) {
          onSuccess();
        }

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

  const isFormValid =
    formData.title.trim() && formData.content.trim() && tagErrors.length === 0;
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
        <SmartInput
          value={formData.title}
          onChange={(value) => handleInputChange('title', value)}
          placeholder="Enter a title for your reply... Use #hashtags and @mentions!"
          className={`reply-form__input ${titleCharsRemaining < 0 ? 'reply-form__input--error' : ''}`}
          disabled={isSubmitting}
          as="input"
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
        <SmartInput
          value={formData.content}
          onChange={(value) => handleInputChange('content', value)}
          placeholder="Write your reply... Use #hashtags and @mentions!"
          className={`reply-form__textarea ${contentCharsRemaining < 0 ? 'reply-form__textarea--error' : ''}`}
          disabled={isSubmitting}
          as="textarea"
          rows={4}
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

      <div className="reply-form__field">
        <label htmlFor={`reply-tags-${parentId}`} className="reply-form__label">
          Additional Tags
        </label>
        <SmartInput
          value={formData.tags}
          onChange={(value) => handleInputChange('tags', value)}
          placeholder="#tag1, #tag2, #tag3"
          className={`reply-form__input ${tagErrors.length > 0 ? 'reply-form__input--error' : ''}`}
          disabled={isSubmitting}
          enableUserMentions={false}
          as="input"
        />
        {tagErrors.length > 0 && (
          <div className="reply-form__tag-errors">
            {tagErrors.map((error, index) => (
              <p key={index} className="reply-form__error-text" role="alert">
                {error}
              </p>
            ))}
          </div>
        )}
        <div className="reply-form__help">
          <span className="reply-form__help-text">
            Tags must start with # and contain only letters, numbers, hyphens,
            and underscores. Use @mentions for users!
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
