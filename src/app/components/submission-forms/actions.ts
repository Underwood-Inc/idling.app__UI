'use server';
import { revalidatePath } from 'next/cache';
import postgres from 'postgres';
import {
  parseDeleteSubmission,
  parseSubmission,
  parseZodErrors
} from './schema';

let sql = postgres(process.env.PGSQL_HOST!, {
  ssl: 'allow'
});

/**
 * Form validation action for create submission form
 */
async function validateCreateSubmissionForm(formData: FormData) {
  const submissionName = formData.get('submission_name');
  const submissionDatetime = new Date().toISOString();

  const { success, data, error } = parseSubmission({
    submission_datetime: submissionDatetime,
    submission_name: submissionName?.toString().trim() || ''
  });

  if (!success) {
    return { errors: parseZodErrors(error) };
  }

  return { data };
}

export async function validateCreateSubmissionFormAction(
  prevState: {
    message: string;
  },
  formData: FormData
): Promise<{ message: string }> {
  const { data, errors } = await validateCreateSubmissionForm(formData);

  if (!data) {
    return { message: errors };
  }

  return { message: '' };
}

/**
 * CREATE new submission action
 * performs SQL
 */
export async function createSubmissionAction(
  prevState: {
    message: string;
  },
  formData: FormData
): Promise<{ message: string }> {
  const { data, errors } = await validateCreateSubmissionForm(formData);

  if (!data) {
    return { message: errors };
  }

  try {
    await sql`
      insert into submissions (submission_name, submission_datetime)
      VALUES (${data.submission_name},${data.submission_datetime})
    `;

    revalidatePath('/');
    return { message: `Added submission: ${data.submission_name}.` };
  } catch (e) {
    console.error(e);
    return { message: `Failed to create submission.` };
  }
}

/**
 * DELETE submission action
 * performs SQL
 */
export async function deleteSubmissionAction(
  prevState: {
    message: string;
  },
  formData: FormData
) {
  const { success, data, error } = parseDeleteSubmission({
    submission_id: Number.parseInt(formData.get('submission_id') as string),
    submission_name: formData.get('submission_name') as string
  });

  if (!success) {
    return { message: parseZodErrors(error) };
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
    return { message: `Failed to delete submission.` };
  }
}
