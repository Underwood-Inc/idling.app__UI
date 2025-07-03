import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Import the swagger configuration
    const swaggerSpec = require('../../../../../swagger.config.js');
    
    return NextResponse.json(swaggerSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        // CORS headers for cross-origin requests from Jekyll docs
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to load OpenAPI specification' },
      { 
        status: 500,
        headers: {
          // CORS headers for error responses too
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    },
  });
} 