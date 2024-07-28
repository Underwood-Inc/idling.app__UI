import { z, ZodError } from 'zod';

export const SUBMISSION_NAME_MAX_LENGTH = 255;

export const submissionSchema = z.object({
  author: z.string().min(3).optional(), // added in action handler
  submission_id: z.coerce.number().gte(1).optional(), // added in action handler
  submission_name: z
    .string()
    .min(1)
    .max(SUBMISSION_NAME_MAX_LENGTH, {
      message: `Message character count must not exceed ${SUBMISSION_NAME_MAX_LENGTH}`
    }),
  submission_datetime: z.string().datetime()
});

export const deleteSubmissionSchema = z.object({
  submission_id: z.coerce.number().gte(1),
  submission_name: z.string().min(1).max(SUBMISSION_NAME_MAX_LENGTH)
});

export type Submission = Required<z.infer<typeof submissionSchema>>;
export type CreateSubmission = z.infer<typeof submissionSchema>;
export type DeleteSubmission = z.infer<typeof deleteSubmissionSchema>;

/**
 * CREATE Submission Schema Parser
 */
export function parseSubmission({
  submission_datetime,
  submission_name
}: Partial<CreateSubmission>) {
  return submissionSchema.safeParse({
    submission_name: submission_name?.toString().trim(),
    submission_datetime
  });
}

/**
 * DELETE Submission Schema Parser
 */
export function parseDeleteSubmission({
  submission_id,
  submission_name
}: Partial<DeleteSubmission>) {
  return deleteSubmissionSchema.safeParse({
    submission_id,
    submission_name
  });
}

/**
 * Zod Error Parser
 * @returns a string containing any/all errors
 */
export function parseZodErrors(error: ZodError): string {
  const errors: string[] = [];
  const flat = error.flatten();

  Object.entries(flat.fieldErrors).forEach(([k, v]) => {
    errors.push(`${k}: ${v?.join('\n')}`);
  });

  return errors.join('\n');
}
