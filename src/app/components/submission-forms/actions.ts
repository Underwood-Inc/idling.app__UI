'use server';
import { revalidatePath } from 'next/cache';
import postgres from 'postgres';
import { CustomSession } from '../../../auth.config';
import { auth } from '../../../lib/auth';
import { tagRegex } from '../../../lib/utils/string/tag-regex';
import {
  parseDeleteSubmission,
  parseSubmission,
  parseZodErrors
} from './schema';

// TODO: remove? try the exported one
let sql = postgres(process.env.PGSQL_HOST!, {
  ssl: 'allow'
});

/**
 * Form validation action for create submission form
 */
async function validateCreateSubmissionForm(formData: FormData) {
  const submissionName =
    formData.get('submission_name')?.toString().trim() || '';
  const tags = formData.get('tags') as string[] | null;
  const submissionDatetime = new Date().toISOString();
  const session = await auth();

  if (session && session.user?.name) {
    const { success, data, error } = parseSubmission({
      author: session.user.name,
      submission_datetime: submissionDatetime,
      submission_name: submissionName,
      tags
    });

    if (!success) {
      return { errors: parseZodErrors(error) };
    }

    return { data };
  }

  return { errors: 'Session error. Please login again.' };
}

export async function validateCreateSubmissionFormAction(
  prevState: {
    message?: string;
    error?: string;
  },
  formData: FormData
): Promise<{ message?: string; error?: string }> {
  const { data, errors } = await validateCreateSubmissionForm(formData);

  if (!data) {
    return { error: errors };
  }

  return { message: '' };
}

/**
 * CREATE new submission action
 * performs SQL
 */
export async function createSubmissionAction(
  prevState: {
    message?: string;
    error?: string;
  },
  formData: FormData
): Promise<{ message?: string; error?: string }> {
  const { data, errors } = await validateCreateSubmissionForm(formData);
  const session = (await auth()) as CustomSession;

  if (!data) {
    return { error: errors };
  }

  if (!session || !session?.user?.name || !session.user.providerAccountId) {
    return { error: 'Authentication error.' };
  }

  const tags = data.submission_name.match(tagRegex) || [];

  try {
    await sql`
      insert into submissions (submission_name, submission_datetime, author, author_id, tags)
      VALUES (
        ${data.submission_name},
        ${data.submission_datetime},
        ${session?.user?.name},
        ${session?.user.providerAccountId},
        ${tags}
      );
    `;

    revalidatePath('/');
    return { message: `Added submission: ${data.submission_name}.` };
  } catch (e) {
    console.error(e);
    return { error: `Failed to create submission.` };
  }
}

/**
 * DELETE submission action
 * performs SQL
 */
export async function deleteSubmissionAction(
  prevState: {
    message?: string;
    error?: string;
  },
  formData: FormData
) {
  const { success, data, error } = parseDeleteSubmission({
    submission_id: Number.parseInt(formData.get('submission_id') as string),
    submission_name: formData.get('submission_name') as string
  });

  if (!success) {
    return { error: parseZodErrors(error) };
  }

  const sqlSubmissionId = data.submission_id!.toString();

  try {
    await sql`
      DELETE FROM submissions
      WHERE submission_id = ${sqlSubmissionId}
    `;

    revalidatePath('/');
    return { message: `Deleted submission ${data.submission_name}.` };
  } catch (e) {
    return { error: `Failed to delete submission.` };
  }
}
