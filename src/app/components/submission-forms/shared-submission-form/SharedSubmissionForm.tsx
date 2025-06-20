'use client';

import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  convertURLsToPills,
  hasConvertibleURLs
} from '../../../../lib/config/url-pills';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import {
  ContentParser,
  ContentSegment
} from '../../../../lib/utils/content-parsers';
import { validateTagsInput } from '../../../../lib/utils/string/tag-regex';
import { ContentWithPills } from '../../ui/ContentWithPills';
import { SmartInput } from '../../ui/SmartInput';
import { createSubmissionAction, editSubmissionAction } from '../actions';
import { Submission } from '../schema';
import './SharedSubmissionForm.css';

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

// Custom Form Pill Input Component
const FormPillInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  contextId: string;
  as: 'input' | 'textarea';
  rows?: number;
}> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  contextId,
  as,
  rows
}) => {
  const [isEditing, setIsEditing] = useState(true); // Always in edit mode for forms
  const [inputValue, setInputValue] = useState('');

  // Parse content into segments for pill display
  const segments: ContentSegment[] = ContentParser.parse(value);
  const textOnlySegments = segments.filter(
    (seg: ContentSegment) => seg.type === 'text'
  );
  const pillSegments = segments.filter(
    (seg: ContentSegment) => seg.type !== 'text'
  );

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);

    // Combine existing pills with new text
    const existingPillText = pillSegments
      .map((seg: ContentSegment) => seg.rawFormat || seg.value)
      .join(' ');
    let combinedValue =
      existingPillText + (existingPillText && newValue ? ' ' : '') + newValue;

    // Auto-detect and convert URLs when user types a space
    if (newValue.endsWith(' ') && hasConvertibleURLs(newValue)) {
      const convertedInput = convertURLsToPills(newValue);
      setInputValue(''); // Clear input since URLs became pills
      combinedValue =
        existingPillText + (existingPillText ? ' ' : '') + convertedInput;
    }

    onChange(combinedValue);
  };

  const handlePillRemove = (pillIndex: number) => {
    const updatedPills = pillSegments.filter(
      (_: ContentSegment, index: number) => index !== pillIndex
    );
    const updatedText = updatedPills
      .map((seg: ContentSegment) => seg.rawFormat || seg.value)
      .join(' ');
    const finalValue =
      updatedText + (updatedText && inputValue ? ' ' : '') + inputValue;
    onChange(finalValue);
  };

  const handleURLBehaviorChange = (oldContent: string, newContent: string) => {
    // Replace the old URL pill content with the new one
    const updatedValue = value.replace(oldContent, newContent);
    onChange(updatedValue);
  };

  const InputComponent = as === 'textarea' ? 'textarea' : 'input';

  // Check if there are any URL embeds to determine container styling
  const hasEmbeds = pillSegments.some(
    (segment) => segment.type === 'url' && segment.behavior === 'embed'
  );

  return (
    <div className={`form-pill-input ${className}`}>
      <div
        className={`form-pill-input__container ${hasEmbeds ? 'form-pill-input__container--has-embeds' : ''}`}
      >
        {/* Render existing pills */}
        <div className="form-pill-input__pills">
          {pillSegments.map((segment, index) => (
            <div key={index} className="form-pill-input__pill-wrapper">
              <ContentWithPills
                content={segment.rawFormat || segment.value}
                contextId={`${contextId}-pill-${index}`}
                isEditMode={true}
                onURLBehaviorChange={handleURLBehaviorChange}
                className="form-pill-input__pill"
              />
              <button
                type="button"
                className="form-pill-input__pill-remove"
                onClick={() => handlePillRemove(index)}
                title="Remove pill"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Input for new content */}
        <SmartInput
          value={inputValue}
          onChange={handleInputChange}
          placeholder={pillSegments.length > 0 ? 'Add more...' : placeholder}
          className="form-pill-input__input"
          disabled={disabled}
          as={as}
          rows={rows}
          enableHashtags={true}
          enableUserMentions={true}
        />
      </div>
    </div>
  );
};

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
    const initializeForm = async () => {
      if (mode === 'edit') {
        setFormData({
          title: initialTitle,
          content: initialContent,
          tags: initialTags
        });
      } else if (mode === 'reply' && replyToAuthor) {
        // Create properly formatted mention for reply
        try {
          const { getUserInfo } = await import(
            '../../../../lib/actions/search.actions'
          );
          const userInfo = await getUserInfo(replyToAuthor);

          const properMention =
            userInfo && userInfo.userId
              ? `@[${replyToAuthor}|${userInfo.userId}|author] `
              : `@${replyToAuthor} `;

          setFormData({
            title: '',
            content: properMention,
            tags: ''
          });
        } catch (error) {
          console.error('Error creating mention format:', error);
          // Fallback to simple format
          setFormData({
            title: '',
            content: `@${replyToAuthor} `,
            tags: ''
          });
        }
      } else {
        setFormData({
          title: '',
          content: '',
          tags: ''
        });
      }
    };

    initializeForm();
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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    // Auto-detect and convert URLs for title and content fields
    let processedValue = value;

    if ((field === 'title' || field === 'content') && value.endsWith(' ')) {
      // Check if the text contains convertible URLs
      if (hasConvertibleURLs(value)) {
        processedValue = convertURLsToPills(value);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue
    }));

    // Validate tags if tags field changed
    if (field === 'tags') {
      const validationErrors = validateTagsInput(processedValue);
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
          if (mode === 'reply' && replyToAuthor) {
            // Try to get proper mention format for reset
            try {
              const { getUserInfo } = await import(
                '../../../../lib/actions/search.actions'
              );
              const userInfo = await getUserInfo(replyToAuthor);

              const properMention =
                userInfo && userInfo.userId
                  ? `@[${replyToAuthor}|${userInfo.userId}|author] `
                  : `@${replyToAuthor} `;

              setFormData({
                title: '',
                content: properMention,
                tags: ''
              });
            } catch (error) {
              console.error('Error creating mention format for reset:', error);
              setFormData({
                title: '',
                content: `@${replyToAuthor} `,
                tags: ''
              });
            }
          } else {
            setFormData({
              title: '',
              content: '',
              tags: ''
            });
          }
        }
        setTagErrors([]);
        setShouldUpdate(true);

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }
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
        <FormPillInput
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
          as="input"
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
        <FormPillInput
          value={formData.content}
          onChange={(value) => handleInputChange('content', value)}
          placeholder={`Write your ${isReply ? 'reply' : isEdit ? 'post' : 'post'} content... Use #hashtags, @mentions, and paste URLs!`}
          className={`shared-submission-form__form-input ${
            contentCharsRemaining < 0
              ? 'shared-submission-form__textarea--error'
              : ''
          }`}
          disabled={isSubmitting}
          contextId={`${contextId || 'shared-form'}-content`}
          as="textarea"
          rows={4}
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
