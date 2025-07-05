import { readFileSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

/**
 * @swagger
 * /api/openapi:
 *   get:
 *     summary: OpenAPI specification
 *     description: Returns the OpenAPI 3.0 specification for the Idling.app API
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET(request: NextRequest) {
  try {
    // Read the OpenAPI spec from the static file
    const openApiPath = join(process.cwd(), 'src/app/api/openapi.json');
    const openApiSpec = readFileSync(openApiPath, 'utf8');
    const spec = JSON.parse(openApiSpec);

    // Update server URLs based on environment
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://idling.app'
      : `http://localhost:${process.env.PORT || 3000}`;

    spec.servers = [
      {
        url: baseUrl,
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server'
          : 'Development server'
      }
    ];

    // Add current timestamp for cache busting
    spec.info.version = `${spec.info.version} (${new Date().toISOString()})`;

    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Error serving OpenAPI spec:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load OpenAPI specification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
} 