'use server';

import { revalidatePath } from "next/cache";
import postgres from "postgres";
import { z } from "zod";

let sql = postgres(process.env.PGSQL_HOST!, {
  ssl: 'allow'
});

interface Submission {
  submission_id: string
  submission_name: string
  submission_datetime: string
}

export async function createSubmission(
  prevState: {
    message: string;
  },
  formData: FormData,
) {
  const schema = z.object({
    submission_name: z.string().min(1).max(255),
    submission_datetime: z.date()
  });
  const parse = schema.safeParse({
    submission_id: formData.get('submission_id'),
    submission_name: formData.get('submission_name'),
    submission_datetime: formData.get('submission_datetime')
  });

  if (!parse.success) {
    return { message: "Failed to create submission!"};
  }

  const data = parse.data;

  try {
    await sql`
      insert into submissions (submission_name, submission_datetime)
      VALUES (${data.submission_name},${data.submission_datetime})
    `;

    revalidatePath('/');
    return { message: `Added submission ${data.submission_name}.`};
  } catch (e) {
    return { message: `Failed to create submission.`};
  }
}

export async function deleteSubmission(
  prevState: {
    message: string
  },
  formData: FormData
) {
  const schema = z.object({
    submission_id: z.string().min(1),
    submission_name: z.string().min(1),
  });
  const data = schema.parse({
    submission_id: formData.get('submission_id'),
    submission_name: formData.get('submission_name')
  });

  try {
    await sql`
      DELETE FROM submissions
      WHERE id = ${data.submission_id}
    `;

    revalidatePath('/')
    return { message: `Deleted submission ${data.submission_name}.`}
  } catch(e) {
    return { message: `Failed to delete submission.`}
  }
}