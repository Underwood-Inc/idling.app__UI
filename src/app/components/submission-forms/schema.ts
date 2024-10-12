import { z, ZodError } from 'zod';

export const SUBMISSION_NAME_MAX_LENGTH = 255;

export const submissionSchema = z.object({
  author: z.string().min(3).optional(), // added in action handler
  author_id: z.string().min(3).optional(),
  submission_id: z.coerce.number().gte(1).optional(), // added in action handler
  submission_name: z
    .string()
    .min(1)
    .max(SUBMISSION_NAME_MAX_LENGTH, {
      message: `Message length must not exceed ${SUBMISSION_NAME_MAX_LENGTH}`
    }),
  submission_datetime: z.string().datetime(),
  tags: z.array(z.string()).nullable().optional(),
  thread_parent_id: z.coerce.number().gte(1).nullable().optional() // New field
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
  submission_name,
  tags,
  thread_parent_id
}: Partial<CreateSubmission>) {
  return submissionSchema.safeParse({
    submission_name: submission_name?.toString().trim(),
    submission_datetime,
    tags,
    thread_parent_id: thread_parent_id ? Number(thread_parent_id) : null
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

  const getLabelByKey = (key: string) => {
    if (key === 'submission_name') {
      return 'post message';
    }
    if (key === 'thread_parent_id') {
      return 'parent thread';
    }
    return key;
  };

  Object.entries(flat.fieldErrors).forEach(([k, v]) => {
    errors.push(`${getLabelByKey(k)}: ${v?.join('\n')}`);
  });

  return errors.join('\n');
}
