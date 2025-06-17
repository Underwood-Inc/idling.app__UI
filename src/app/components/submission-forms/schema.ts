import { z, ZodError } from 'zod';

export const SUBMISSION_NAME_MAX_LENGTH = 255;

export const submissionSchema = z.object({
  submission_id: z.number(),
  submission_name: z.string(),
  submission_title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  submission_datetime: z.date(),
  author_id: z.string().min(1),
  author: z.string(),
  tags: z.array(z.string()),
  thread_parent_id: z.number().nullable()
});

export const deleteSubmissionSchema = z.object({
  submission_id: z.coerce.number().gte(1),
  submission_name: z.string().min(1).max(SUBMISSION_NAME_MAX_LENGTH)
});

export const editSubmissionSchema = z.object({
  submission_id: z.coerce.number().gte(1),
  submission_title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  submission_name: z
    .string()
    .min(1, 'Submission name is required')
    .max(SUBMISSION_NAME_MAX_LENGTH),
  tags: z.array(z.string()).optional()
});

export type Submission = z.infer<typeof submissionSchema>;
export type CreateSubmission = z.infer<typeof submissionSchema>;
export type DeleteSubmission = z.infer<typeof deleteSubmissionSchema>;
export type EditSubmission = z.infer<typeof editSubmissionSchema>;

/**
 * CREATE Submission Schema Parser
 */
export function parseSubmission({
  submission_datetime,
  submission_name,
  submission_title,
  tags,
  thread_parent_id
}: Partial<CreateSubmission>) {
  return submissionSchema.safeParse({
    submission_name: submission_name?.toString().trim(),
    submission_title: submission_title?.toString().trim(),
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
 * EDIT Submission Schema Parser
 */
export function parseEditSubmission({
  submission_id,
  submission_title,
  submission_name,
  tags
}: Partial<EditSubmission>) {
  return editSubmissionSchema.safeParse({
    submission_id,
    submission_title: submission_title?.toString().trim(),
    submission_name: submission_name?.toString().trim(),
    tags
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
    if (key === 'submission_title') {
      return 'title';
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

export const submissionFormSchema = z.object({
  submission_title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  submission_name: z.string().min(1, 'Submission name is required'),
  tags: z.array(z.string()).optional()
});

export type SubmissionForm = z.infer<typeof submissionFormSchema>;
