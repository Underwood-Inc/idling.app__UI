"use server";

import { revalidatePath } from "next/cache";
import postgres from "postgres";
import { deleteSubmissionSchema, Submission, submissionSchema } from "./schema";

let sql = postgres(process.env.PGSQL_HOST!, {
  ssl: "allow",
});

function parseSubmission({
  submission_datetime,
  submission_name,
}: Partial<Submission>) {
  const parse = submissionSchema.safeParse({
    submission_name: submission_name?.toString().trim(),
    submission_datetime,
  });

  if (!parse.success) {
    console.error(parse.error);

    return null;
  }

  return parse.data;
}

function parseDeleteSubmission({
  submission_id,
  submission_name,
}: Partial<Submission>) {
  const parse = deleteSubmissionSchema.safeParse({
    submission_id,
    submission_name,
  });

  if (!parse.success) {
    console.error(parse.error);

    return null;
  }

  return parse.data;
}

export async function createSubmission(
  prevState: {
    message: string;
  },
  formData: FormData
) {
  const submissionName = formData.get("submission_name");
  const submissionDatetime = new Date().toISOString();
  const data = parseSubmission({
    submission_datetime: submissionDatetime,
    submission_name: submissionName?.toString().trim() || "",
  });

  if (!data) {
    return { message: "Failed to create submission, parsing error!" };
  }

  try {
    await sql`
      insert into submissions (submission_name, submission_datetime)
      VALUES (${data.submission_name},${data.submission_datetime})
    `;

    revalidatePath("/");
    return { message: `Added submission: ${data.submission_name}.` };
  } catch (e) {
    console.error(e);
    return { message: `Failed to create submission.` };
  }
}

export async function deleteSubmission(
  prevState: {
    message: string;
  },
  formData: FormData
) {
  const data = parseDeleteSubmission({
    submission_id: Number.parseInt(formData.get("submission_id") as string),
    submission_name: formData.get("submission_name") as string,
  });

  if (!data) {
    return { message: "Failed to delete submission, parsing error!" };
  }

  const sqlSubmissionId = data.submission_id!.toString();

  try {
    await sql`
      DELETE FROM submissions
      WHERE submission_id = ${sqlSubmissionId}
    `;

    revalidatePath("/");
    return { message: `Deleted submission ${data.submission_name}.` };
  } catch (e) {
    return { message: `Failed to delete submission.` };
  }
}
