/* eslint-disable no-console */
'use server';
import { revalidatePath } from 'next/cache';
import { CustomSession } from '../../../auth.config';
import { auth } from '../../../lib/auth';
import sql from '../../../lib/db';
import { getEffectiveCharacterCount } from '../../../lib/utils/string';
import {
  extractTagsFromText,
  parseTagsInput,
  validateTagsInput
} from '../../../lib/utils/string/tag-regex';
import {
  parseDeleteSubmission,
  parseEditSubmission,
  parseZodErrors
} from './schema';

/**
 * Form validation action for create submission form
 */
async function validateCreateSubmissionForm(formData: FormData) {
  const submissionTitle =
    formData.get('submission_title')?.toString().trim() || '';
  const submissionContent =
    formData.get('submission_content')?.toString().trim() || '';
  const tagsString = formData.get('submission_tags')?.toString().trim() || '';

  // Use content as submission_name (description), fallback to title if empty
  const submissionName = submissionContent || submissionTitle;

  const submissionDatetime = new Date();
  const session = await auth();

  if (session && session.user?.name) {
    // Basic validation - check required fields
    if (!submissionTitle.trim()) {
      return { errors: 'Title is required' };
    }

    // Validate title length
    if (getEffectiveCharacterCount(submissionTitle) > 255) {
      return { errors: 'Title must be 255 characters or less' };
    }

    // Validate content length
    if (getEffectiveCharacterCount(submissionContent) > 1000) {
      return { errors: 'Content must be 1000 characters or less' };
    }

    // Validate tags format
    const tagValidationErrors = validateTagsInput(tagsString);
    if (tagValidationErrors.length > 0) {
      return { errors: tagValidationErrors.join(', ') };
    }

    return {
      data: {
        submission_title: submissionTitle,
        submission_name: submissionName,
        submission_content: submissionContent,
        submission_datetime: submissionDatetime,
        author: session.user.name,
        tags: parseTagsInput(tagsString)
      }
    };
  }

  return { errors: 'Session error. Please login again.' };
}

/**
 * Form validation action exposed to client
 */
export async function validateCreateSubmissionFormAction(
  prevState: { status: number; message?: string; error?: string },
  formData: FormData
): Promise<{ status: number; message?: string; error?: string }> {
  const result = await validateCreateSubmissionForm(formData);

  if (result.errors) {
    return { status: -1, error: result.errors };
  }

  return { status: 0, message: '' };
}

/**
 * CREATE new submission action
 * performs SQL
 */
export async function createSubmissionAction(
  prevState: {
    status: number;
    message?: string;
    error?: string;
  },
  formData: FormData
): Promise<{
  status: number;
  message?: string;
  error?: string;
  submission?: any;
}> {
  const { data, errors } = await validateCreateSubmissionForm(formData);
  const session = (await auth()) as CustomSession;

  // console.log('🔍 createSubmissionAction - Session:', session);
  // console.log('🔍 createSubmissionAction - User:', session?.user);
  // console.log('🔍 createSubmissionAction - User ID:', session?.user?.id);

  if (!data) {
    return { status: -1, error: errors };
  }

  // Authentication check - session must have user name and internal database ID
  if (!session || !session?.user?.name || !session.user.id) {
    // console.log('❌ createSubmissionAction - Authentication failed');
    // console.log('❌ Session exists:', !!session);
    // console.log('❌ User name:', session?.user?.name);
    // console.log('❌ User ID:', session?.user?.id);
    return { status: -1, error: 'Authentication error.' };
  }

  // console.log('✅ createSubmissionAction - Authentication passed');

  // Extract tags from title and content (these come without # prefix)
  const titleTags = extractTagsFromText(data.submission_title);
  const contentTags = extractTagsFromText(data.submission_content || '');
  const explicitTags = data.tags || [];

  // Ensure all tags are normalized (without # prefix)
  const normalizedTitleTags = titleTags.map((tag) =>
    tag.startsWith('#') ? tag.slice(1) : tag
  );
  const normalizedContentTags = contentTags.map((tag) =>
    tag.startsWith('#') ? tag.slice(1) : tag
  );
  const normalizedExplicitTags = explicitTags.map((tag) =>
    tag.startsWith('#') ? tag.slice(1) : tag
  );

  // Combine all tags and remove duplicates
  const allTags = [
    ...new Set([
      ...normalizedTitleTags,
      ...normalizedContentTags,
      ...normalizedExplicitTags
    ])
  ];

  const threadParentId = formData.get('thread_parent_id');

  // console.log(
  //   '🔍 createSubmissionAction - About to insert with user ID:',
  //   session?.user.id
  // );

  try {
    // Use the internal database ID from the session as the primary identifier
    const userId = parseInt(session?.user.id || '');

    if (!userId || isNaN(userId)) {
      console.error(
        '❌ createSubmissionAction - Invalid user ID in session:',
        session?.user.id
      );
      return {
        status: -1,
        error: 'Invalid user session. Please sign out and sign back in.'
      };
    }

    // Verify the user exists in our database (security check)
    const userExists = await sql`
      SELECT u.id, u.name
      FROM users u 
      WHERE u.id = ${userId}
      LIMIT 1
    `;

    if (userExists.length === 0) {
      console.error(
        '❌ createSubmissionAction - User not found in database for internal ID:',
        userId
      );
      return {
        status: -1,
        error: 'User account not found. Please sign out and sign back in.'
      };
    }

    const user = userExists[0];
    // console.log('✅ createSubmissionAction - Verified user:', {
    //   id: user.id,
    //   name: user.name
    // });

    const result = await sql`
      INSERT INTO submissions (
        submission_name, 
        submission_title, 
        submission_datetime, 
        user_id, 
        tags, 
        thread_parent_id
      )
      VALUES (
        ${data.submission_name},
        ${data.submission_title},
        ${data.submission_datetime},
        ${userId},
        ${allTags},
        ${threadParentId ? parseInt(threadParentId as string) : null}
      )
      RETURNING *;
    `;

    // Get the newly created submission
    const newSubmission = result[0];

    revalidatePath('/');
    return {
      status: 1,
      message: `Added post: ${data.submission_title}.`,
      submission: newSubmission
    };
  } catch (e) {
    console.error('❌ createSubmissionAction - SQL Error:', e);
    return { status: -1, error: `Failed to create post.` };
  }
}

/**
 * DELETE submission action
 * performs SQL
 */
export async function deleteSubmissionAction(
  prevState: {
    status: number;
    message?: string;
    error?: string;
  },
  formData: FormData
) {
  const session = (await auth()) as CustomSession | null;

  if (!session || !session.user?.id) {
    return { status: -1, error: 'Authentication error.' };
  }

  const userId = parseInt(session.user.id);
  if (!userId || isNaN(userId)) {
    return { status: -1, error: 'Invalid user session.' };
  }

  const { success, data, error } = parseDeleteSubmission({
    submission_id: Number.parseInt(formData.get('submission_id') as string),
    submission_name: formData.get('submission_name') as string
  });

  if (!success) {
    return { status: -1, error: parseZodErrors(error) };
  }

  const sqlSubmissionId = data.submission_id!.toString();

  try {
    // First, check if this post has any replies
    const replyCheck = await sql`
      SELECT COUNT(*) as reply_count 
      FROM submissions 
      WHERE thread_parent_id = ${sqlSubmissionId}
    `;

    const replyCount = Number(replyCheck[0]?.reply_count || 0);

    if (replyCount > 0) {
      const replyText = replyCount === 1 ? 'reply' : 'replies';
      const errorMessage =
        `Cannot delete this post because it has ${replyCount} ${replyText}. ` +
        `Delete the ${replyText} first to delete this post.`;
      return {
        status: -1,
        error: errorMessage
      };
    }

    // Check if the post exists and belongs to the user
    const submissionCheck = await sql`
      SELECT submission_id, submission_title 
      FROM submissions 
      WHERE submission_id = ${sqlSubmissionId}
      AND user_id = ${userId}
    `;

    if (submissionCheck.length === 0) {
      return {
        status: -1,
        error: 'Post not found or you do not have permission to delete it.'
      };
    }

    // Now safe to delete
    await sql`
      DELETE FROM submissions
      WHERE submission_id = ${sqlSubmissionId}
      AND user_id = ${userId}
    `;

    revalidatePath('/');
    return {
      status: 1,
      message: `Deleted post "${submissionCheck[0].submission_title}".`
    };
  } catch (e) {
    console.error('Delete submission error:', e);
    return { status: -1, error: `Failed to delete post.` };
  }
}

/**
 * EDIT submission action
 * performs SQL
 */
export async function editSubmissionAction(
  prevState: {
    status: number;
    message?: string;
    error?: string;
  },
  formData: FormData
): Promise<{
  status: number;
  message?: string;
  error?: string;
  submission?: any;
}> {
  const session = (await auth()) as CustomSession | null;

  if (!session || !session.user?.id) {
    return { status: -1, error: 'Authentication error.' };
  }

  const userId = parseInt(session.user.id);
  if (!userId || isNaN(userId)) {
    return { status: -1, error: 'Invalid user session.' };
  }

  const submissionId = Number.parseInt(formData.get('submission_id') as string);
  const submissionTitle =
    formData.get('submission_title')?.toString().trim() || '';
  const submissionContent =
    formData.get('submission_content')?.toString().trim() || '';
  const tagsString = formData.get('submission_tags')?.toString().trim() || '';

  // Use content as submission_name, fallback to title if empty
  const submissionName = submissionContent || submissionTitle;

  // Validate title length
  if (getEffectiveCharacterCount(submissionTitle) > 255) {
    return { status: -1, error: 'Title must be 255 characters or less' };
  }

  // Validate content length
  if (getEffectiveCharacterCount(submissionContent) > 1000) {
    return { status: -1, error: 'Content must be 1000 characters or less' };
  }

  // Validate tags format
  const tagValidationErrors = validateTagsInput(tagsString);
  if (tagValidationErrors.length > 0) {
    return { status: -1, error: tagValidationErrors.join(', ') };
  }

  const { success, data, error } = parseEditSubmission({
    submission_id: submissionId,
    submission_title: submissionTitle,
    submission_name: submissionName,
    tags: parseTagsInput(tagsString)
  });

  if (!success) {
    return { status: -1, error: parseZodErrors(error) };
  }

  // Extract tags from title, content, and explicit tags
  const titleTags = extractTagsFromText(data.submission_title);
  const contentTags = extractTagsFromText(submissionContent);
  const explicitTags = data.tags || [];

  // Ensure all tags are normalized (without # prefix)
  const normalizedTitleTags = titleTags.map((tag) =>
    tag.startsWith('#') ? tag.slice(1) : tag
  );
  const normalizedContentTags = contentTags.map((tag) =>
    tag.startsWith('#') ? tag.slice(1) : tag
  );
  const normalizedExplicitTags = explicitTags.map((tag) =>
    tag.startsWith('#') ? tag.slice(1) : tag
  );

  // Combine all tags and remove duplicates
  const allTags = [
    ...new Set([
      ...normalizedTitleTags,
      ...normalizedContentTags,
      ...normalizedExplicitTags
    ])
  ];

  try {
    const result = await sql`
      UPDATE submissions 
      SET 
        submission_title = ${data.submission_title},
        submission_name = ${data.submission_name},
        tags = ${allTags}
      WHERE submission_id = ${data.submission_id}
      AND user_id = ${userId}
      RETURNING *;
    `;

    if (result.length === 0) {
      return {
        status: -1,
        error: 'Post not found or you do not have permission to edit it.'
      };
    }

    revalidatePath('/');
    return {
      status: 1,
      message: `Updated post: ${data.submission_title}.`,
      submission: result[0]
    };
  } catch (e) {
    console.error(e);
    return { status: -1, error: `Failed to update post.` };
  }
}

/**
 * Check if a submission can be deleted
 * Used by UI components to show/hide delete options
 */
export async function canDeleteSubmission(
  submissionId: number,
  authorId: string
): Promise<{
  canDelete: boolean;
  reason?: string;
  replyCount?: number;
}> {
  try {
    // Check if post has replies
    const replyCheck = await sql`
      SELECT COUNT(*) as reply_count 
      FROM submissions 
      WHERE thread_parent_id = ${submissionId.toString()}
    `;

    const replyCount = Number(replyCheck[0]?.reply_count || 0);

    if (replyCount > 0) {
      const replyText = replyCount === 1 ? 'reply' : 'replies';
      return {
        canDelete: false,
        reason: `This post has ${replyCount} ${replyText} and cannot be deleted until all ${replyText} are removed.`,
        replyCount
      };
    }

    // Check if post exists and user owns it
    const submissionCheck = await sql`
      SELECT submission_id 
      FROM submissions 
      WHERE submission_id = ${submissionId.toString()}
      AND user_id = ${parseInt(authorId)}
    `;

    if (submissionCheck.length === 0) {
      return {
        canDelete: false,
        reason: 'Post not found or you do not have permission to delete it.'
      };
    }

    return { canDelete: true };
  } catch (e) {
    console.error('Error checking delete permission:', e);
    return {
      canDelete: false,
      reason: 'Unable to verify delete permissions.'
    };
  }
}
