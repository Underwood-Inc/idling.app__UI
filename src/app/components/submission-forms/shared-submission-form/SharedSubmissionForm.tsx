'use client';

import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { validateTagsInput } from '../../../../lib/utils/string/tag-regex';
import { SmartInput } from '../../ui/SmartInput';
import { createSubmissionAction, editSubmissionAction } from '../actions';
import './SharedSubmissionForm.css';

interface SharedSubmissionFormProps {
  mode: 'create' | 'reply' | 'edit';
  parentId?: number;
  onSuccess?: () => void;
  replyToAuthor?: string;
  contextId?: string;
  className?: string;
  // Edit mode props
  submissionId?: number;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string;
}

export function SharedSubmissionForm({
  mode,
  parentId,
  onSuccess,
  replyToAuthor,
  contextId,
  className = '',
  submissionId,
  initialTitle = '',
  initialContent = '',
  initialTags = ''
}: SharedSubmissionFormProps) {
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagErrors, setTagErrors] = useState<string[]>([]);

  // Initialize form data based on mode
  useEffect(() => {
    if (mode === 'edit') {
      setFormData({
        title: initialTitle,
        content: initialContent,
        tags: initialTags
      });
    } else if (mode === 'reply' && replyToAuthor) {
      setFormData({
        title: '',
        content: `@${replyToAuthor} `,
        tags: ''
      });
    } else {
      setFormData({
        title: '',
        content: '',
        tags: ''
      });
    }
  }, [mode, initialTitle, initialContent, initialTags, replyToAuthor]);

  const isReply = mode === 'reply';
  const isEdit = mode === 'edit';
  const titleLabel = isReply
    ? 'Reply Title'
    : isEdit
      ? 'Edit Title'
      : 'Post Title';
  const contentLabel = isReply
    ? 'Reply Content'
    : isEdit
      ? 'Edit Content'
      : 'Post Content';
  const submitText = isReply
    ? 'Submit Reply'
    : isEdit
      ? 'Update Post'
      : 'Create Post';
  const submittingText = isReply
    ? 'Submitting Reply...'
    : isEdit
      ? 'Updating Post...'
      : 'Creating Post...';

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

    if (isReply && !parentId) {
      setError('Parent ID is required for replies');
      return;
    }

    if (isEdit && !submissionId) {
      setError('Submission ID is required for editing');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submitFormData = new FormData();
      submitFormData.append('submission_title', formData.title.trim());
      submitFormData.append('submission_content', formData.content.trim());
      submitFormData.append('submission_tags', formData.tags.trim());

      // Add parent ID for replies
      if (isReply && parentId) {
        submitFormData.append('thread_parent_id', parentId.toString());
      }

      // Add submission ID for edits
      if (isEdit && submissionId) {
        submitFormData.append('submission_id', submissionId.toString());
      }

      // Choose the correct action based on mode
      const action = isEdit ? editSubmissionAction : createSubmissionAction;
      const result = await action({ status: 0 }, submitFormData);

      if (result.status === 1) {
        // Reset form only for create/reply modes, not edit
        if (!isEdit) {
          setFormData({
            title: '',
            content:
              mode === 'reply' && replyToAuthor ? `@${replyToAuthor} ` : '',
            tags: ''
          });
        }
        setTagErrors([]);
        setShouldUpdate(true);

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        router.refresh();
      } else {
        const errorMessage =
          result.error ||
          `Failed to ${isReply ? 'submit reply' : isEdit ? 'update post' : 'create post'}`;
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Submission error:', err);
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
    <form
      onSubmit={handleSubmit}
      className={`shared-submission-form ${className}`}
    >
      {/* Title Field */}
      <div className="shared-submission-form__field">
        <label className="shared-submission-form__label">{titleLabel} *</label>
        <SmartInput
          value={formData.title}
          onChange={(value) => handleInputChange('title', value)}
          placeholder={`Enter a ${isReply ? 'reply' : isEdit ? 'post' : 'post'} title... Use #hashtags and @mentions!`}
          className={`shared-submission-form__input ${
            titleCharsRemaining < 0
              ? 'shared-submission-form__input--error'
              : ''
          }`}
          disabled={isSubmitting}
          as="input"
          enableHashtags={true}
          enableUserMentions={true}
        />
        <div className="shared-submission-form__char-count">
          <span
            className={
              titleCharsRemaining < 0
                ? 'shared-submission-form__char-count--error'
                : ''
            }
          >
            {titleCharsRemaining} characters remaining
          </span>
        </div>
      </div>

      {/* Content Field */}
      <div className="shared-submission-form__field">
        <label className="shared-submission-form__label">
          {contentLabel} *
        </label>
        <SmartInput
          value={formData.content}
          onChange={(value) => handleInputChange('content', value)}
          placeholder={`Write your ${isReply ? 'reply' : isEdit ? 'post' : 'post'} content... Use #hashtags and @mentions!`}
          className={`shared-submission-form__textarea ${
            contentCharsRemaining < 0
              ? 'shared-submission-form__textarea--error'
              : ''
          }`}
          disabled={isSubmitting}
          as="textarea"
          rows={4}
          enableHashtags={true}
          enableUserMentions={true}
        />
        <div className="shared-submission-form__char-count">
          <span
            className={
              contentCharsRemaining < 0
                ? 'shared-submission-form__char-count--error'
                : ''
            }
          >
            {contentCharsRemaining} characters remaining
          </span>
        </div>
      </div>

      {/* Tags Field */}
      <div className="shared-submission-form__field">
        <label className="shared-submission-form__label">Additional Tags</label>
        <SmartInput
          value={formData.tags}
          onChange={(value) => handleInputChange('tags', value)}
          placeholder="#tag1, #tag2, #tag3"
          className={`shared-submission-form__input ${
            tagErrors.length > 0 ? 'shared-submission-form__input--error' : ''
          }`}
          disabled={isSubmitting}
          enableHashtags={true}
          enableUserMentions={false}
          as="input"
        />
        {tagErrors.length > 0 && (
          <div className="shared-submission-form__tag-errors">
            {tagErrors.map((error, index) => (
              <p
                key={index}
                className="shared-submission-form__error-text"
                role="alert"
              >
                {error}
              </p>
            ))}
          </div>
        )}
        <div className="shared-submission-form__help">
          <span className="shared-submission-form__help-text">
            Tags must start with # and contain only letters, numbers, hyphens,
            and underscores. Tags from your title and content will be
            automatically detected.
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="shared-submission-form__error" role="alert">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="shared-submission-form__actions">
        <button
          type="submit"
          disabled={
            !isFormValid ||
            isSubmitting ||
            titleCharsRemaining < 0 ||
            contentCharsRemaining < 0
          }
          className="shared-submission-form__submit"
        >
          {isSubmitting ? submittingText : submitText}
        </button>
      </div>
    </form>
  );
}
