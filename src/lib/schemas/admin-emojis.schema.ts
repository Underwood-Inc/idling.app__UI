import { z } from 'zod';

// ================================
// ADMIN EMOJI MANAGEMENT SCHEMAS
// ================================

/**
 * Schema for admin emoji search and filtering parameters
 */
export const AdminEmojiSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).default('pending'),
  search: z.string().optional().default(''),
});

/**
 * Schema for admin emoji approval/rejection requests
 */
export const AdminEmojiActionSchema = z.object({
  emojiId: z.number().int().min(1, 'Emoji ID is required'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be either "approve" or "reject"' }),
  }),
  reason: z.string().min(3, 'Reason must be at least 3 characters').optional(),
}).refine(
  (data) => {
    // Reason is required for rejection
    if (data.action === 'reject') {
      return data.reason && data.reason.length >= 5;
    }
    return true;
  },
  {
    message: 'Reason is required for rejection and must be at least 5 characters',
    path: ['reason'],
  }
);

/**
 * Schema for admin emoji deletion requests
 */
export const AdminEmojiDeleteSchema = z.object({
  emojiId: z.number().int().min(1, 'Emoji ID is required'),
  reason: z.string().min(5, 'Deletion reason must be at least 5 characters'),
  permanent: z.boolean().default(false),
});

/**
 * Schema for emoji ID parameter validation
 */
export const EmojiIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Emoji ID must be a valid number'),
});

// ================================
// TYPE EXPORTS
// ================================

export type AdminEmojiSearchParams = z.infer<typeof AdminEmojiSearchParamsSchema>;
export type AdminEmojiAction = z.infer<typeof AdminEmojiActionSchema>;
export type AdminEmojiDelete = z.infer<typeof AdminEmojiDeleteSchema>;
export type EmojiIdParams = z.infer<typeof EmojiIdParamsSchema>; 