import { z } from 'zod';

export const tagSchema = z.array(z.string());

export type Tags = Required<z.infer<typeof tagSchema>>;
