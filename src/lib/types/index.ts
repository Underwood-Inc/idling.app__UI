/**
 * Centralized Type Exports
 *
 * This file serves as the single source of truth for type definitions.
 * Always import types from here to avoid confusion and duplication.
 */

// === SUBMISSIONS SYSTEM (CURRENT) ===
// Use these types for all submission-related functionality

export type {
  CreateSubmission,
  DeleteSubmission,
  EditSubmission,
  Submission,
  SubmissionForm
} from '../../app/components/submission-forms/schema';

export type { SubmissionWithReplies } from '../../app/components/submissions-list/actions';

// === FILTERING SYSTEM ===
export type { Filter } from '../state/atoms';
export type { PostFilters } from './filters';

// === LEGACY TYPES (DEPRECATED) ===
// These are kept for backward compatibility only
// DO NOT use these for new features

/**
 * @deprecated Use Submission types instead
 */
export type { CreatePost, Post } from '../schemas/post.schemas';

/**
 * @deprecated Use Comment system will be replaced with threaded submissions
 */
export type { Comment, CreateComment } from '../schemas/comment.schemas';

// === TYPE UTILITIES ===
export type {
  GetSubmissionsActionArguments,
  GetSubmissionsActionResponse,
  PaginatedResponse
} from '../../app/components/submissions-list/actions';

// === UI TYPES ===
export type { OverlayConfig } from '../context/OverlayContext';

/**
 * USAGE GUIDELINES:
 *
 * ✅ DO:
 * - Import from this file: `import { Submission, SubmissionWithReplies } from '@/lib/types'`
 * - Use Submission types for all new features
 * - Use SubmissionWithReplies for components that handle nested replies
 * - Use Filter<PostFilters> for filtering functionality
 *
 * ❌ DON'T:
 * - Import types directly from individual files
 * - Use Post types for new features
 * - Create duplicate type definitions
 * - Mix Submission and Post types in the same component
 *
 * MIGRATION PLAN:
 * 1. All new features use Submission types
 * 2. Gradually migrate existing Post components to use Submission types
 * 3. Eventually remove deprecated Post types
 */
