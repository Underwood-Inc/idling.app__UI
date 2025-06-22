'use client';

import { useAtom } from 'jotai';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { SmartInput } from '../../ui/SmartInput';
import { Submission } from '../schema';
import './SharedSubmissionForm.css';

// Import the new components and hooks
import { SmartInputWithPillOverlay } from './components/SmartInputWithPillOverlay';
import { useSubmissionForm } from './hooks/useSubmissionForm';

interface SharedSubmissionFormProps {
  mode: 'create' | 'reply' | 'edit';
  parentId?: number;
  onSuccess?: (result?: {
    status: number;
    message?: string;
    error?: string;
    submission?: Submission;
  }) => void;
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

  // Use the new submission form hook
  const {
    formData,
    isSubmitting,
    error,
    tagErrors,
    contentViewMode,
    setContentViewMode,
    handleInputChange,
    handleSubmit,
    isFormValid,
    titleCharsRemaining,
    contentCharsRemaining
  } = useSubmissionForm({
    mode,
    initialTitle,
    initialContent,
    initialTags,
    replyToAuthor,
    submissionId,
    parentId,
    onSuccess: (result) => {
      setShouldUpdate(true);
      if (onSuccess) {
        onSuccess(result);
      }
    }
  });

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

  return (
    <form
      onSubmit={handleSubmit}
      className={`shared-submission-form ${className}`}
    >
      {/* Title Field */}
      <div className="shared-submission-form__field">
        <label className="shared-submission-form__label">{titleLabel} *</label>
        <SmartInputWithPillOverlay
          value={formData.title}
          onChange={(value) => handleInputChange('title', value)}
          placeholder={`Enter a ${isReply ? 'reply' : isEdit ? 'post' : 'post'} title... Use #hashtags, @mentions, and paste URLs!`}
          className={`shared-submission-form__form-input ${
            titleCharsRemaining < 0
              ? 'shared-submission-form__input--error'
              : ''
          }`}
          disabled={isSubmitting}
          contextId={`${contextId || 'shared-form'}-title`}
          multiline={false}
          viewMode="preview"
          enableHashtags={true}
          enableUserMentions={true}
          enableEmojis={true}
          enableImagePaste={true}
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
        <div className="shared-submission-form__field-header">
          <label className="shared-submission-form__label">
            {contentLabel} *
          </label>
          <div className="shared-submission-form__view-toggle">
            <button
              type="button"
              className={`shared-submission-form__toggle-btn ${
                contentViewMode === 'preview'
                  ? 'shared-submission-form__toggle-btn--active'
                  : ''
              }`}
              onClick={() => setContentViewMode('preview')}
              disabled={isSubmitting}
            >
              PREVIEW
            </button>
            <button
              type="button"
              className={`shared-submission-form__toggle-btn ${
                contentViewMode === 'raw'
                  ? 'shared-submission-form__toggle-btn--active'
                  : ''
              }`}
              onClick={() => setContentViewMode('raw')}
              disabled={isSubmitting}
            >
              RAW
            </button>
          </div>
        </div>
        <SmartInputWithPillOverlay
          value={formData.content}
          onChange={(value) => handleInputChange('content', value)}
          placeholder={
            contentViewMode === 'preview'
              ? `Write your ${isReply ? 'reply' : isEdit ? 'post' : 'post'} content... Use #hashtags, @mentions, and paste URLs!`
              : `Write your ${isReply ? 'reply' : isEdit ? 'post' : 'post'} content... Raw text mode for easy editing of #hashtags, @mentions, and ![behavior](URLs)`
          }
          className={`shared-submission-form__form-input ${
            contentCharsRemaining < 0
              ? 'shared-submission-form__textarea--error'
              : ''
          }`}
          disabled={isSubmitting}
          contextId={`${contextId || 'shared-form'}-content`}
          multiline={true}
          viewMode={contentViewMode}
          enableHashtags={true}
          enableUserMentions={true}
          enableEmojis={true}
          enableImagePaste={true}
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
          placeholder="#tag1, #tag2 or #tag1 #tag2 #tag3"
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
            and underscores. You can separate tags with commas (#tag1, #tag2) or
            spaces (#tag1 #tag2). Tags from your title and content will be
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
