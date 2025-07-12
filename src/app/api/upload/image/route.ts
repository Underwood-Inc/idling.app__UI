/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload an image file
 *     description: Upload an image file to the server with validation and security checks
 *     tags:
 *       - Upload
 *     security:
 *       - NextAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPG, PNG, GIF, WebP)
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   description: Public URL of the uploaded image
 *                   example: "/uploads/images/1640995200000-a1b2c3d4.jpg"
 *                 filename:
 *                   type: string
 *                   description: Generated filename
 *                   example: "1640995200000-a1b2c3d4.jpg"
 *                 size:
 *                   type: number
 *                   description: File size in bytes
 *                   example: 204800
 *                 type:
 *                   type: string
 *                   description: MIME type of the uploaded file
 *                   example: "image/jpeg"
 *       400:
 *         description: Invalid file or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "File validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Validation error details
 *                 allowedTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Allowed MIME types
 *                 maxSize:
 *                   type: number
 *                   description: Maximum file size in bytes
 *                 maxSizeMB:
 *                   type: number
 *                   description: Maximum file size in MB
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "File too large"
 *                 maxSize:
 *                   type: number
 *                 maxSizeMB:
 *                   type: number
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Method not allowed
 *     description: GET requests are not supported for file uploads
 *     tags:
 *       - Upload
 *     responses:
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { auth } from '@lib/auth';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { ImageUploadSchema } from '@lib/schemas/upload.schema';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { z } from 'zod';
import {
  getMediaConfig,
  validateFileSize,
  validateMimeType
} from '../../../../lib/config/media-domains';

// This route uses dynamic features (auth/headers) and should not be pre-rendered
export const dynamic = 'force-dynamic';

interface UploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  type?: string;
  error?: string;
  details?: any[];
}

async function postHandler(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file with Zod schema
    const validationResult = ImageUploadSchema.safeParse({ file });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateMimeType(file, 'image')) {
      const config = getMediaConfig('image');
      return NextResponse.json(
        {
          error: 'Invalid file type',
          allowedTypes: config.allowedMimeTypes
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file, 'image')) {
      const config = getMediaConfig('image');
      return NextResponse.json(
        {
          error: 'File too large',
          maxSize: config.maxSize,
          maxSizeMB: Math.round(config.maxSize / (1024 * 1024))
        },
        { status: 400 }
      );
    }

    // Generate secure filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${randomBytes}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images');
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/images/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Image upload error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid file data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler);

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
