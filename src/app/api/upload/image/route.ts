import { auth } from '@/lib/auth';
import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { ImageUploadSchema } from '@/lib/schemas/upload.schema';
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
