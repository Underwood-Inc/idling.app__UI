import { z } from "zod";

export const SUBMISSION_NAME_MAX_LENGTH = 255;

export const submissionSchema = z.object({
  submission_id: z.coerce.number().gte(1).optional(),
  submission_name: z.string().min(1).max(SUBMISSION_NAME_MAX_LENGTH),
  submission_datetime: z.string().datetime(),
});

export const deleteSubmissionSchema = z.object({
  submission_id: z.coerce.number().gte(1).optional(),
  submission_name: z.string().min(1).max(SUBMISSION_NAME_MAX_LENGTH),
});

export type Submission = z.infer<typeof submissionSchema> & {
  submission_id: number;
};

export type SubmissionCreateFormInitialState = Submission & { message: string };
export type SubmissionDeleteFormInitialState = z.infer<
  typeof deleteSubmissionSchema
> & { message: string };
