'use server';
import { revalidatePath } from 'next/cache';
import { CustomSession } from '../../../auth.config';
import { auth } from '../../../lib/auth';
import sql from '../../../lib/db';
import { tagRegex } from '../../../lib/utils/string/tag-regex';
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
  const submissionName =
    formData.get('submission_name')?.toString().trim() || submissionTitle; // Fallback to title
  const tagsString = formData.get('submission_tags')?.toString().trim() || '';
  const tags = tagsString ? tagsString.split(',').map((tag) => tag.trim()) : [];
  const submissionDatetime = new Date();
  const session = await auth();

  if (session && session.user?.name) {
    // For validation, we use a simpler schema that doesn't require all database fields
    const validationData = {
      submission_title: submissionTitle,
      submission_name: submissionName,
      tags: tags
    };

    // Basic validation - just check required fields
    if (!submissionTitle.trim()) {
      return { errors: 'Title is required' };
    }

    if (!submissionName.trim()) {
      return { errors: 'Submission name is required' };
    }

    return {
      data: {
        submission_title: submissionTitle,
        submission_name: submissionName,
        submission_datetime: submissionDatetime,
        author: session.user.name,
        tags
      }
    };
  }

  return { errors: 'Session error. Please login again.' };
}

export async function validateCreateSubmissionFormAction(
  prevState: {
    message?: string;
    error?: string;
  },
  formData: FormData
): Promise<{ message: string; error?: string }> {
  const { data, errors } = await validateCreateSubmissionForm(formData);

  if (!data) {
    return { message: '', error: errors };
  }

  return { message: '' };
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

  if (!data) {
    return { status: -1, error: errors };
  }

  if (!session || !session?.user?.name || !session.user.providerAccountId) {
    return { status: -1, error: 'Authentication error.' };
  }

  // Extract tags from both the title and the explicit tags field
  const titleTags =
    data.submission_title.match(tagRegex)?.map((tag) => tag.toLowerCase()) ||
    [];
  const explicitTags = data.tags || [];
  // Remove duplicates
  const allTags = [...new Set([...titleTags, ...explicitTags])];

  const threadParentId = formData.get('thread_parent_id');

  try {
    const result = await sql`
      insert into submissions (
        submission_name, 
        submission_title, 
        submission_datetime, 
        author, 
        author_id, 
        tags, 
        thread_parent_id
      )
      VALUES (
        ${data.submission_name},
        ${data.submission_title},
        ${data.submission_datetime},
        ${session?.user?.name},
        ${session?.user.providerAccountId},
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
    console.error(e);
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

  if (!session || !session.user?.providerAccountId) {
    return { status: -1, error: 'Authentication error.' };
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
    await sql`
      DELETE FROM submissions
      WHERE submission_id = ${sqlSubmissionId}
      AND author_id = ${session?.user?.providerAccountId!}
    `;

    return {
      status: 1,
      message: `Deleted post ${data.submission_name}.`
    };
  } catch (e) {
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

  if (!session || !session.user?.providerAccountId) {
    return { status: -1, error: 'Authentication error.' };
  }

  const submissionId = Number.parseInt(formData.get('submission_id') as string);
  const submissionTitle =
    formData.get('submission_title')?.toString().trim() || '';
  const submissionName =
    formData.get('submission_name')?.toString().trim() || '';
  const tagsString = formData.get('submission_tags')?.toString().trim() || '';
  const tags = tagsString ? tagsString.split(',').map((tag) => tag.trim()) : [];

  const { success, data, error } = parseEditSubmission({
    submission_id: submissionId,
    submission_title: submissionTitle,
    submission_name: submissionName,
    tags
  });

  if (!success) {
    return { status: -1, error: parseZodErrors(error) };
  }

  // Extract tags from both the title and the explicit tags field
  const titleTags =
    data.submission_title.match(tagRegex)?.map((tag) => tag.toLowerCase()) ||
    [];
  const explicitTags = data.tags || [];
  // Remove duplicates
  const allTags = [...new Set([...titleTags, ...explicitTags])];

  try {
    const result = await sql`
      UPDATE submissions 
      SET 
        submission_title = ${data.submission_title},
        submission_name = ${data.submission_name},
        tags = ${allTags}
      WHERE submission_id = ${data.submission_id}
      AND author_id = ${session?.user?.providerAccountId}
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
