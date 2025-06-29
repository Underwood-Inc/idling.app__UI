/* eslint-disable no-console */
import { NextRequest } from 'next/server';
import { DatabaseService } from '../services/DatabaseService';

// Use Node.js runtime for database access
export const runtime = 'nodejs';

const databaseService = DatabaseService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || id.trim() === '') {
      return new Response(
        JSON.stringify({
          error: 'Generation ID is required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get the generation from database
    const generation = await databaseService.getOGGenerationById(id);

    if (!generation) {
      return new Response(
        JSON.stringify({
          error: 'Generation not found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const wantsJson = searchParams.get('format') === 'json';

    // Return JSON response if requested
    if (wantsJson) {
      return new Response(
        JSON.stringify({
          id: generation.id,
          seed: generation.seed,
          aspectRatio: generation.aspect_ratio,
          svg: (generation as any).svg_content || '',
          dimensions: {
            width: generation.custom_width || 1200, // Default fallback
            height: generation.custom_height || 630
          },
          generationOptions: {
            seed: generation.seed,
            avatarSeed:
              (generation as any).generation_options?.avatarSeed ||
              generation.seed,
            aspectRatio: generation.aspect_ratio,
            quoteText: generation.quote_text,
            quoteAuthor: generation.quote_author,
            customWidth: generation.custom_width,
            customHeight: generation.custom_height,
            shapeCount: generation.shape_count,
            // Include all other generation options from the JSONB field
            ...((generation as any).generation_options || {})
          },
          createdAt: generation.created_at
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour since it's historical
          }
        }
      );
    }

    // Return SVG response (default) - assuming svg_content exists in the record
    const svgContent = (generation as any).svg_content;
    if (!svgContent) {
      return new Response(
        JSON.stringify({
          error: 'SVG content not available for this generation'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Generated-Seed': generation.seed,
        'X-Generation-ID': generation.id,
        'X-Aspect-Ratio': generation.aspect_ratio,
        'X-Created-At': generation.created_at.toString()
      }
    });
  } catch (error) {
    console.error('Error retrieving OG image generation:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
