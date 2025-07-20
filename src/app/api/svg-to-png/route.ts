/**
 * SVG to PNG Conversion API Route
 *
 * Standalone service for converting SVG content to PNG images.
 * Supports both simple conversions and advanced options.
 *
 * @example
 * POST /api/svg-to-png
 * Content-Type: application/json
 * {
 *   "svgContent": "<svg>...</svg>",
 *   "options": {
 *     "scale": 2,
 *     "quality": 0.9
 *   }
 * }
 */

import type {
  BatchConversionRequest,
  BatchConversionResult,
  SvgToPngConversionOptions
} from '@lib/services/svg-conversion';
import { createSvgToPngConverter } from '@lib/services/svg-conversion';
import { NextRequest, NextResponse } from 'next/server';

interface ConversionRequestBody {
  /** SVG content to convert */
  svgContent: string;
  /** Optional conversion options */
  options?: SvgToPngConversionOptions;
  /** Optional filename for the download */
  filename?: string;
  /** Response format: 'json' for metadata, 'binary' for direct file download */
  format?: 'json' | 'binary';
}

interface BatchConversionRequestBody {
  /** Array of conversion requests */
  conversions: Array<{
    id: string;
    svgContent: string;
    options?: SvgToPngConversionOptions;
  }>;
  /** Whether to return as individual files or zipped bundle */
  bundled?: boolean;
}

interface ProcessedResult {
  id: string;
  success: boolean;
  dimensions?: { width: number; height: number };
  metadata?: any;
  pngData?: string;
  error?: { message: string; type: string };
}

/**
 * POST: Convert SVG to PNG
 * Supports both single conversions and batch processing
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          error: 'Content-Type must be application/json',
          code: 'INVALID_CONTENT_TYPE'
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if it's a batch conversion request
    if ('conversions' in body) {
      return handleBatchConversion(body as BatchConversionRequestBody);
    }

    // Handle single conversion
    return handleSingleConversion(body as ConversionRequestBody);
  } catch (error) {
    console.error('SVG to PNG conversion API error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single SVG to PNG conversion
 */
async function handleSingleConversion(
  body: ConversionRequestBody
): Promise<NextResponse> {
  const { svgContent, options = {}, filename, format = 'json' } = body;

  if (!svgContent || typeof svgContent !== 'string') {
    return NextResponse.json(
      {
        error: 'svgContent is required and must be a string',
        code: 'MISSING_SVG_CONTENT'
      },
      { status: 400 }
    );
  }

  try {
    // Create converter with logging enabled for API context
    const converter = createSvgToPngConverter({
      enableLogging: true,
      enableSecurityValidation: true,
      defaultOptions: {
        quality: 1,
        scale: 1,
        maintainAspectRatio: true,
        timeout: 30000
      }
    });

    // Validate SVG first
    const validation = converter.validateSvg(svgContent);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.error || 'SVG validation failed',
          code: 'INVALID_SVG',
          details: validation.safetyIssues || []
        },
        { status: 400 }
      );
    }

    // Perform conversion
    const result = await converter.convertToPng(svgContent, options);

    if (format === 'binary') {
      // Return the PNG file directly
      const headers: Record<string, string> = {
        'Content-Type': 'image/png',
        'Content-Length': result.blob.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      };

      if (filename) {
        headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      }

      // Convert blob to buffer for NextResponse
      const arrayBuffer = await result.blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new NextResponse(buffer, { headers });
    }

    // Return JSON with conversion metadata
    return NextResponse.json({
      success: true,
      data: {
        dimensions: result.dimensions,
        originalDimensions: result.originalDimensions,
        metadata: result.metadata,
        // Convert blob to base64 for JSON response
        pngData: `data:image/png;base64,${Buffer.from(await result.blob.arrayBuffer()).toString('base64')}`
      }
    });
  } catch (error: any) {
    console.error('Conversion error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Conversion failed',
        code: error.type || 'CONVERSION_FAILED',
        details: error.context || {}
      },
      { status: 500 }
    );
  }
}

/**
 * Handle batch SVG to PNG conversions
 */
async function handleBatchConversion(
  body: BatchConversionRequestBody
): Promise<NextResponse> {
  const { conversions, bundled = false } = body;

  if (!Array.isArray(conversions) || conversions.length === 0) {
    return NextResponse.json(
      {
        error: 'conversions must be a non-empty array',
        code: 'INVALID_BATCH_REQUEST'
      },
      { status: 400 }
    );
  }

  if (conversions.length > 10) {
    return NextResponse.json(
      {
        error: 'Batch size limited to 10 conversions per request',
        code: 'BATCH_SIZE_EXCEEDED'
      },
      { status: 400 }
    );
  }

  try {
    const converter = createSvgToPngConverter({
      enableLogging: true,
      maxConcurrentConversions: 10
    });

    // Convert to the expected batch format
    const batchRequests: BatchConversionRequest[] = conversions.map((conv) => ({
      id: conv.id,
      svgContent: conv.svgContent,
      options: conv.options
    }));

    const results = await converter.convertBatch(batchRequests);

    // For now, return JSON results (ZIP bundling would require additional implementation)
    const processedResults: ProcessedResult[] = await Promise.all(
      results.map(async (result: BatchConversionResult) => {
        if (result.success && result.result) {
          const base64Data = Buffer.from(
            await result.result.blob.arrayBuffer()
          ).toString('base64');

          return {
            id: result.id,
            success: true,
            dimensions: result.result.dimensions,
            metadata: result.result.metadata,
            pngData: `data:image/png;base64,${base64Data}`
          };
        } else {
          return {
            id: result.id,
            success: false,
            error: {
              message: result.error?.message || 'Unknown error',
              type: result.error?.type || 'UNKNOWN'
            }
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results: processedResults,
      summary: {
        total: conversions.length,
        successful: processedResults.filter((r: ProcessedResult) => r.success)
          .length,
        failed: processedResults.filter((r: ProcessedResult) => !r.success)
          .length
      }
    });
  } catch (error: any) {
    console.error('Batch conversion error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Batch conversion failed',
        code: error.type || 'BATCH_CONVERSION_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Service health check and capabilities
 */
export async function GET(): Promise<NextResponse> {
  try {
    const converter = createSvgToPngConverter();
    const status = converter.getStatus();

    return NextResponse.json({
      service: 'SVG to PNG Converter',
      version: '1.0.0',
      status: 'healthy',
      capabilities: {
        singleConversion: true,
        batchConversion: true,
        maxBatchSize: 10,
        supportedFormats: ['svg'],
        outputFormats: ['png'],
        maxSvgSize: '10MB',
        securityValidation: true
      },
      currentStatus: status
    });
  } catch (error) {
    return NextResponse.json(
      {
        service: 'SVG to PNG Converter',
        status: 'error',
        error: 'Service health check failed'
      },
      { status: 500 }
    );
  }
}
