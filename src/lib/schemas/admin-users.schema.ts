import { z } from 'zod';

// ================================
// ADMIN USER MANAGEMENT SCHEMAS
// ================================

/**
 * Schema for admin user search and filtering parameters
 */
export const AdminUserSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().nullable().optional().default('').transform(val => val || ''),
});

/**
 * Schema for simple admin user search query parameters
 */
export const AdminUserSimpleSearchParamsSchema = z.object({
  q: z.string()
    .nullable()
    .transform(val => val || '')
    .refine(val => val.length >= 2, 'Search query must be at least 2 characters')
    .refine(val => val.length <= 100, 'Search query cannot exceed 100 characters')
    .refine(val => /^[a-zA-Z0-9@._\-\s]+$/.test(val), 'Search query contains invalid characters')
    .transform(val => val.trim()),
});

/**
 * Schema for admin user timeout requests
 */
export const AdminUserTimeoutRequestSchema = z.object({
  timeoutType: z.string().min(1, 'Timeout type is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  expiresAt: z.string().datetime().optional(),
  duration: z.number().int().min(1).max(8760).optional(), // 1 hour to 1 year
}).refine(
  (data) => data.expiresAt || data.duration,
  {
    message: 'Either expiresAt or duration must be provided',
    path: ['expiresAt'],
  }
);

/**
 * Schema for admin user timeout cancellation parameters
 */
export const AdminUserTimeoutCancelParamsSchema = z.object({
  timeoutId: z.coerce.number().int().min(1).optional(),
  timeoutType: z.string().min(1).optional(),
}).refine(
  (data) => data.timeoutId || data.timeoutType,
  {
    message: 'Either timeoutId or timeoutType is required',
    path: ['timeoutId'],
  }
);

/**
 * Schema for admin user role assignment requests
 */
export const AdminUserRoleAssignmentSchema = z.object({
  roleId: z.number().int().min(1, 'Role ID is required'),
  expiresAt: z.string().datetime().optional(),
  reason: z.string().min(3, 'Reason must be at least 3 characters').optional(),
});

/**
 * Schema for admin user role removal parameters
 */
export const AdminUserRoleRemovalParamsSchema = z.object({
  roleId: z.coerce.number().int().min(1, 'Role ID is required'),
});

/**
 * Schema for admin timeout management requests
 */
export const AdminTimeoutManagementSchema = z.object({
  userId: z.number().int().min(1, 'User ID is required'),
  timeoutType: z.enum(['post_creation', 'comment_creation', 'emoji_submission', 'rate_limit', 'general']),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  durationHours: z.number().int().min(1).max(8760, 'Duration cannot exceed 1 year'),
});

/**
 * Schema for admin timeout revocation parameters
 */
export const AdminTimeoutRevocationParamsSchema = z.object({
  id: z.coerce.number().int().min(1, 'Timeout ID is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').optional(),
});

/**
 * Schema for admin timeout status query parameters
 */
export const AdminTimeoutStatusParamsSchema = z.object({
  userId: z.coerce.number().int().min(1, 'User ID is required'),
  type: z.enum(['post_creation', 'comment_creation', 'emoji_submission', 'rate_limit', 'general']).optional(),
});

/**
 * Schema for route parameters with user ID
 */
export const UserIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'User ID must be a valid number'),
});

// ================================
// TYPE EXPORTS
// ================================

export type AdminUserSearchParams = z.infer<typeof AdminUserSearchParamsSchema>;
export type AdminUserSimpleSearchParams = z.infer<typeof AdminUserSimpleSearchParamsSchema>;
export type AdminUserTimeoutRequest = z.infer<typeof AdminUserTimeoutRequestSchema>;
export type AdminUserTimeoutCancelParams = z.infer<typeof AdminUserTimeoutCancelParamsSchema>;
export type AdminUserRoleAssignment = z.infer<typeof AdminUserRoleAssignmentSchema>;
export type AdminUserRoleRemovalParams = z.infer<typeof AdminUserRoleRemovalParamsSchema>;
export type AdminTimeoutManagement = z.infer<typeof AdminTimeoutManagementSchema>;
export type AdminTimeoutRevocationParams = z.infer<typeof AdminTimeoutRevocationParamsSchema>;
export type AdminTimeoutStatusParams = z.infer<typeof AdminTimeoutStatusParamsSchema>;
export type UserIdParams = z.infer<typeof UserIdParamsSchema>; 