import { z } from 'zod';

// ================================
// ADMIN SUBSCRIPTION MANAGEMENT SCHEMAS
// ================================

/**
 * Schema for admin subscription assignment requests
 */
export const AdminSubscriptionAssignmentSchema = z.object({
  planId: z.number().int().min(1, 'Plan ID is required'),
  billingCycle: z.enum(['weekly', 'monthly', 'yearly', 'lifetime']).default('monthly'),
  expiresAt: z.string().datetime().optional(),
  status: z.enum(['active', 'trialing', 'cancelled', 'expired', 'suspended']).default('active'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').optional(),
  priceOverrideCents: z.number().int().min(0, 'Price override must be 0 or greater').optional(),
  priceOverrideReason: z.string().min(3, 'Price override reason must be at least 3 characters').optional(),
});

/**
 * Schema for admin subscription update requests
 */
export const AdminSubscriptionUpdateSchema = z.object({
  subscriptionId: z.number().int().min(1, 'Subscription ID is required'),
  status: z.enum(['active', 'trialing', 'cancelled', 'expired', 'suspended']).optional(),
  expiresAt: z.string().datetime().optional(),
  reason: z.string().min(3, 'Reason must be at least 3 characters').optional(),
});

/**
 * Schema for admin subscription cancellation parameters
 */
export const AdminSubscriptionCancelParamsSchema = z.object({
  subscriptionId: z.coerce.number().int().min(1, 'Subscription ID is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').optional(),
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

export type AdminSubscriptionAssignment = z.infer<typeof AdminSubscriptionAssignmentSchema>;
export type AdminSubscriptionUpdate = z.infer<typeof AdminSubscriptionUpdateSchema>;
export type AdminSubscriptionCancelParams = z.infer<typeof AdminSubscriptionCancelParamsSchema>;
export type UserIdParams = z.infer<typeof UserIdParamsSchema>; 