import { z } from 'zod';

// ================================
// ADMIN RATE LIMIT SCHEMAS
// ================================

/**
 * Schema for rate limit reset parameters
 */
export const RateLimitResetParamsSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  type: z.enum(['api', 'upload', 'auth', 'search', 'admin', 'attack', 'og-image']).default('api'),
});

/**
 * Schema for rate limit configuration types
 */
export const RateLimitConfigTypeSchema = z.enum([
  'api',
  'upload', 
  'auth',
  'search',
  'admin',
  'attack',
  'og-image'
]);

/**
 * Schema for rate limit statistics response
 */
export const RateLimitStatsSchema = z.object({
  success: z.boolean(),
  stats: z.object({
    totalRequests: z.number().int().min(0),
    blockedRequests: z.number().int().min(0),
    activeIdentifiers: z.number().int().min(0),
    configuredLimits: z.record(z.string(), z.any()),
    timestamp: z.string().datetime(),
  }),
});

/**
 * Schema for rate limit reset response
 */
export const RateLimitResetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  identifier: z.string().optional(),
  type: z.string().optional(),
});

// ================================
// TYPE EXPORTS
// ================================

export type RateLimitResetParams = z.infer<typeof RateLimitResetParamsSchema>;
export type RateLimitConfigType = z.infer<typeof RateLimitConfigTypeSchema>;
export type RateLimitStats = z.infer<typeof RateLimitStatsSchema>;
export type RateLimitResetResponse = z.infer<typeof RateLimitResetResponseSchema>; 