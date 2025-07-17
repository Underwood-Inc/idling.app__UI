import { buildThreadUrl } from '@lib/routes';
import { getEffectiveCharacterCount } from '@lib/utils/string';
import { validateTagsInput } from '@lib/utils/string/tag-regex';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSubmissionAction, editSubmissionAction } from '../../actions';

interface UseSubmissionFormProps {
  mode: 'create' | 'reply' | 'edit';
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string;
  replyToAuthor?: string;
  submissionId?: number;
  parentId?: number;
  onSuccess?: (result?: any) => void;
}

export const useSubmissionForm = ({
  mode,
  initialTitle = '',
  initialContent = '',
  initialTags = '',
  replyToAuthor,
  submissionId,
  parentId,
  onSuccess
}: UseSubmissionFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagErrors, setTagErrors] = useState<string[]>([]);
  const [contentViewMode, setContentViewMode] = useState<'preview' | 'raw'>(
    'preview'
  );

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
          const { getUserInfo } = await import('@lib/actions/search.actions');
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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Validate tags if tags field changed
    if (field === 'tags') {
      const validationErrors = validateTagsInput(value);
      setTagErrors(validationErrors);
    }
  };

  const processTemporaryImages = async (content: string): Promise<string> => {
    // Find all temporary image pills
    const tempImageRegex =
      /!\[([^\]]*)\]\(data:temp-image;name=[^;]*;(data:image\/[^;]*;base64,[A-Za-z0-9+/=]+)\)/g;
    const tempImages: Array<{
      fullMatch: string;
      behavior: string;
      dataURL: string;
      start: number;
      end: number;
    }> = [];

    let match;
    while ((match = tempImageRegex.exec(content)) !== null) {
      tempImages.push({
        fullMatch: match[0],
        behavior: match[1],
        dataURL: match[2],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    if (tempImages.length === 0) {
      return content;
    }

    // Convert data URLs back to files and upload them
    const { uploadImageFile } = await import('../utils/imageUpload');
    const uploadPromises = tempImages.map(async (tempImage) => {
      try {
        const response = await fetch(tempImage.dataURL);
        const blob = await response.blob();
        const file = new File([blob], 'pasted-image.png', { type: blob.type });
        const uploadedURL = await uploadImageFile(file);
        return { ...tempImage, uploadedURL };
      } catch (error) {
        console.error('Failed to upload temporary image:', error);
        return { ...tempImage, uploadedURL: null };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Replace temporary pills with uploaded URLs (process from end to start)
    let processedContent = content;
    const sortedResults = uploadResults.sort((a, b) => b.start - a.start);

    for (const result of sortedResults) {
      if (result.uploadedURL) {
        const newPill = `![${result.behavior}](${result.uploadedURL})`;
        processedContent =
          processedContent.slice(0, result.start) +
          newPill +
          processedContent.slice(result.end);
      } else {
        processedContent =
          processedContent.slice(0, result.start) +
          '[Image upload failed]' +
          processedContent.slice(result.end);
      }
    }

    return processedContent;
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

    if (getEffectiveCharacterCount(formData.title) > 255) {
      setError('Title must be 255 characters or less');
      return;
    }

    if (getEffectiveCharacterCount(formData.content) > 1000) {
      setError('Content must be 1000 characters or less');
      return;
    }

    if (tagErrors.length > 0) {
      setError('Please fix tag errors before submitting');
      return;
    }

    if (mode === 'reply' && !parentId) {
      setError('Parent ID is required for replies');
      return;
    }

    if (mode === 'edit' && !submissionId) {
      setError('Submission ID is required for editing');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Process temporary images in title and content before submission
      const processedTitle = await processTemporaryImages(formData.title);
      const processedContent = await processTemporaryImages(formData.content);

      const submitFormData = new FormData();
      submitFormData.append('submission_title', processedTitle.trim());
      submitFormData.append('submission_content', processedContent.trim());
      submitFormData.append('submission_tags', formData.tags.trim());

      // Add parent ID for replies
      if (mode === 'reply' && parentId) {
        submitFormData.append('thread_parent_id', parentId.toString());
      }

      // Add submission ID for edits
      if (mode === 'edit' && submissionId) {
        submitFormData.append('submission_id', submissionId.toString());
      }

      // Choose the correct action based on mode
      const action =
        mode === 'edit' ? editSubmissionAction : createSubmissionAction;
      const result = await action({ status: 0 }, submitFormData);

      if (result.status === 1) {
        // Reset form only for create/reply modes, not edit
        if (mode !== 'edit') {
          if (mode === 'reply' && replyToAuthor) {
            // Try to get proper mention format for reset
            try {
              const { getUserInfo } = await import(
                '@lib/actions/search.actions'
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

        // Handle redirect for reply mode - only redirect if not already on thread page
        if (mode === 'reply' && parentId) {
          // Check if we're already on the thread page
          const currentPath = window.location.pathname;
          const threadPath = buildThreadUrl(parentId);

          // Only redirect if we're not already on the thread page
          if (!currentPath.includes(`/t/${parentId}`)) {
            // Use setTimeout to allow the success callback to run first
            setTimeout(() => {
              router.push(threadPath);
            }, 100);
          }
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        const errorMessage =
          result.error ||
          `Failed to ${mode === 'reply' ? 'submit reply' : mode === 'edit' ? 'update post' : 'create post'}`;
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
  const titleCharsRemaining = 255 - getEffectiveCharacterCount(formData.title);
  const contentCharsRemaining =
    1000 - getEffectiveCharacterCount(formData.content);

  return {
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
  };
};
