import { z } from 'zod';

// ================================
// FILE UPLOAD SCHEMAS
// ================================

/**
 * Schema for image upload validation
 */
export const ImageUploadSchema = z.object({
  file: z.instanceof(File),
}).refine(
  (data) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    return allowedTypes.includes(data.file.type);
  },
  {
    message: 'Invalid file type. Allowed types: JPEG, JPG, PNG, GIF, WebP',
    path: ['file'],
  }
).refine(
  (data) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return data.file.size <= maxSize;
  },
  {
    message: 'File too large. Maximum size: 10MB',
    path: ['file'],
  }
);

/**
 * Schema for general file upload validation
 */
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  category: z.enum(['image', 'document', 'avatar']).default('image'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

/**
 * Schema for upload response validation
 */
export const UploadResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url().optional(),
  filename: z.string().optional(),
  size: z.number().int().min(0).optional(),
  type: z.string().optional(),
  error: z.string().optional(),
});

// ================================
// UTILITY SCHEMAS
// ================================

/**
 * Schema for file validation metadata
 */
export const FileValidationMetadataSchema = z.object({
  maxSize: z.number().int().min(1),
  allowedTypes: z.array(z.string()),
  allowedExtensions: z.array(z.string()).optional(),
});

// ================================
// TYPE EXPORTS
// ================================

export type ImageUpload = z.infer<typeof ImageUploadSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type UploadResponse = z.infer<typeof UploadResponseSchema>;
export type FileValidationMetadata = z.infer<typeof FileValidationMetadataSchema>; 