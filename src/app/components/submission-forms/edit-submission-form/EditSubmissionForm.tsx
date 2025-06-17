'use client';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { validateTagsInput } from '../../../../lib/utils/string/tag-regex';
import { SmartInput } from '../../ui/SmartInput';
import { editSubmissionAction } from '../actions';
import './EditSubmissionForm.css';

const initialState = {
  status: 0,
  message: '',
  error: ''
};

interface SubmissionData {
  submission_id: number;
  submission_title: string;
  submission_name: string;
  tags: string[];
}

function SubmitButton({
  isDisabled,
  title
}: {
  isDisabled: boolean;
  title?: string;
}) {
  const { pending } = useFormStatus();
  const canSubmit = !pending && !isDisabled;

  return (
    <button
      type="submit"
      aria-disabled={!canSubmit}
      disabled={!canSubmit}
      title={title}
      className="submission__submit-button"
    >
      Update Post
    </button>
  );
}

export function EditSubmissionForm({
  submission,
  onSuccess,
  onCancel
}: {
  submission: SubmissionData;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);
  const { data: session } = useSession();
  const isAuthorized = !!session?.user;

  const [state, formAction] = useFormState(editSubmissionAction, initialState);

  const [titleValue, setTitleValue] = useState(submission.submission_title);
  const [contentValue, setContentValue] = useState(
    submission.submission_name || ''
  );
  const [tagsValue, setTagsValue] = useState(
    submission.tags
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join(', ')
  );
  const [titleLength, setTitleLength] = useState(
    submission.submission_title.length
  );
  const [contentLength, setContentLength] = useState(
    (submission.submission_name || '').length
  );
  const [tagErrors, setTagErrors] = useState<string[]>([]);

  const isDisabled = !isAuthorized || tagErrors.length > 0;

  const submitButtonTitle =
    tagErrors.length > 0
      ? 'Fix tag errors.'
      : !isAuthorized
        ? 'Login to manage posts.'
        : undefined;

  useEffect(() => {
    if (state.status) {
      setShouldUpdate(!!state.status);
      if (state.status === 1) {
        onSuccess?.();
      }
    }
  }, [state.status, state.message, setShouldUpdate, onSuccess]);

  const handleTitleChange = (value: string) => {
    setTitleValue(value);
    setTitleLength(value.trim().length);
  };

  const handleContentChange = (value: string) => {
    setContentValue(value);
    setContentLength(value.trim().length);
  };

  const handleTagsChange = (value: string) => {
    setTagsValue(value);
    const validationErrors = validateTagsInput(value);
    setTagErrors(validationErrors);
  };

  const getTitleLengthStatus = () => {
    const percentOfMax = (titleLength / 255) * 100;

    if (percentOfMax >= 80 && percentOfMax < 100) {
      return 'warning';
    }

    if (percentOfMax >= 100) {
      return 'error';
    }

    return 'info';
  };

  const getContentLengthStatus = () => {
    const percentOfMax = (contentLength / 1000) * 100;

    if (percentOfMax >= 80 && percentOfMax < 100) {
      return 'warning';
    }

    if (percentOfMax >= 100) {
      return 'error';
    }

    return 'info';
  };

  return (
    <form
      ref={ref}
      action={formAction}
      className="submission__form"
      role="form"
    >
      {/* Hidden submission ID */}
      <input
        type="hidden"
        name="submission_id"
        value={submission.submission_id}
      />

      {/* Title Field */}
      <label htmlFor="submission_title" className="submission__title-label">
        <div className="row--sm-margin">
          <span>Title *</span>
          <SmartInput
            value={titleValue}
            onChange={handleTitleChange}
            disabled={!isAuthorized}
            placeholder="Enter a title for your post... Use #hashtags and @mentions!"
            className="submission__title-input"
            as="input"
            enableHashtags={true}
            enableUserMentions={true}
          />
          <input type="hidden" name="submission_title" value={titleValue} />
        </div>
        <div className="row">
          <p className={`column ${getTitleLengthStatus()}`}>
            {titleLength}/255
          </p>
        </div>
      </label>

      {/* Content Field */}
      <label htmlFor="submission_content" className="submission__content-label">
        <div className="row--sm-margin">
          <span>Content</span>
          <SmartInput
            value={contentValue}
            onChange={handleContentChange}
            disabled={!isAuthorized}
            placeholder="Write your post content... Use #hashtags and @mentions!"
            className="submission__content-input"
            as="textarea"
            rows={4}
            enableHashtags={true}
            enableUserMentions={true}
          />
          <input type="hidden" name="submission_content" value={contentValue} />
        </div>
        <div className="row">
          <p className={`column ${getContentLengthStatus()}`}>
            {contentLength}/1000
          </p>
        </div>
      </label>

      {/* Tags Field */}
      <label htmlFor="submission_tags" className="submission__tags-label">
        <div className="row--sm-margin">
          <span>Additional Tags</span>
          <SmartInput
            value={tagsValue}
            onChange={handleTagsChange}
            disabled={!isAuthorized}
            placeholder="#tag1, #tag2, #tag3"
            className="submission__tags-input"
            as="input"
            enableHashtags={true}
            enableUserMentions={false}
          />
          <input type="hidden" name="submission_tags" value={tagsValue} />
        </div>
        {tagErrors.length > 0 && (
          <div className="submission__tag-errors">
            {tagErrors.map((error, index) => (
              <p key={index} className="error" role="alert">
                {error}
              </p>
            ))}
          </div>
        )}
        <div className="submission__tag-help">
          <p className="info">
            Tags must start with # and contain only letters, numbers, hyphens,
            and underscores. Tags from your title and content will be
            automatically detected.
          </p>
        </div>
      </label>

      {/* Hidden submission_name field - now populated from content */}
      <input
        type="hidden"
        id="submission_name"
        name="submission_name"
        value={contentValue}
      />

      {/* Submit Button */}
      <div className="submission__form-actions">
        <SubmitButton isDisabled={isDisabled} title={submitButtonTitle} />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="submission__cancel-button"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Status Messages */}
      <div className="row">
        <p
          aria-live="polite"
          className={`column ${state.error ? 'error' : 'info'}`}
          role="status"
        >
          {state.error || state.message}
        </p>
      </div>
    </form>
  );
}
