import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { NextRequest } from 'next/server';
import { OGImageService } from './services/OGImageService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ogImageService = new OGImageService();

async function getHandler(request: NextRequest) {
  try {
    // Use the unified OGImageService which handles all quota checking internally
    // This eliminates duplicate quota systems and ensures consistency

    const { searchParams } = new URL(request.url);

    // Get ALL configuration parameters
    const customSeed = searchParams.get('seed');
    const avatarSeed = searchParams.get('avatarSeed');
    const customQuote = searchParams.get('quote');
    const customAuthor = searchParams.get('author');

    // Parse custom dimensions and shape count
    const customWidth = searchParams.get('width')
      ? parseInt(searchParams.get('width')!)
      : null;
    const customHeight = searchParams.get('height')
      ? parseInt(searchParams.get('height')!)
      : null;
    const shapeCount = searchParams.get('shapes')
      ? parseInt(searchParams.get('shapes')!)
      : null;

    // Advanced positioning controls
    const avatarX = searchParams.get('avatarX')
      ? parseFloat(searchParams.get('avatarX')!)
      : null;
    const avatarY = searchParams.get('avatarY')
      ? parseFloat(searchParams.get('avatarY')!)
      : null;
    const avatarSize = searchParams.get('avatarSize')
      ? parseFloat(searchParams.get('avatarSize')!)
      : null;
    const textMaxWidth = searchParams.get('textMaxWidth')
      ? parseFloat(searchParams.get('textMaxWidth')!)
      : null;
    const textStartY = searchParams.get('textStartY')
      ? parseFloat(searchParams.get('textStartY')!)
      : null;
    const fontSize = searchParams.get('fontSize')
      ? parseFloat(searchParams.get('fontSize')!)
      : null;

    // Visual styling controls
    const borderColor = searchParams.get('borderColor');
    const borderOpacity = searchParams.get('borderOpacity')
      ? parseFloat(searchParams.get('borderOpacity')!)
      : null;
    const patternSeed = searchParams.get('patternSeed');
    const textPadding = searchParams.get('textPadding')
      ? parseFloat(searchParams.get('textPadding')!)
      : null;
    const lineHeight = searchParams.get('lineHeight')
      ? parseFloat(searchParams.get('lineHeight')!)
      : null;
    const glassBackground = searchParams.get('glassBackground') === 'true';

    // Check if this is a JSON format request
    const wantsJson = searchParams.get('format') === 'json';

    // Generate the image with ALL parameters - handles quota checking and recording internally
    const result = await ogImageService.generateImage(request);

    // Determine if this is a seeded (deterministic) request
    const isSeededRequest = !!(customSeed || (customQuote && customAuthor));

    // Set appropriate cache headers based on whether content is deterministic
    const cacheHeaders: Record<string, string> = isSeededRequest
      ? {
          'Cache-Control':
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800', // 1 day cache, 1 week stale
          'CDN-Cache-Control': 'public, max-age=31536000', // 1 year for CDN
          'Vercel-CDN-Cache-Control': 'public, max-age=31536000'
        }
      : {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        };

    // Return JSON response if requested
    if (wantsJson) {
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          ...cacheHeaders
        }
      });
    }

    // Return SVG response (default) with ALL generation options in headers
    return new Response(result.svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        ...cacheHeaders,

        // Core generation info
        'X-Generated-Seed': result.seed,
        'X-Generation-ID': result.generationId || '',
        'X-Dimensions': `${result.dimensions.width}x${result.dimensions.height}`,
        'X-Aspect-Ratio': result.aspectRatio,
        'X-Remaining-Generations': result.remainingGenerations.toString(),
        'X-Is-Seeded': isSeededRequest.toString(),

        // User controls for frontend prefilling
        'X-Seed': customSeed || '',
        'X-Avatar-Seed': avatarSeed || '',
        'X-Quote': customQuote || '',
        'X-Author': customAuthor || '',
        'X-Custom-Width': customWidth?.toString() || '',
        'X-Custom-Height': customHeight?.toString() || '',
        'X-Shape-Count': shapeCount?.toString() || '',

        // Advanced positioning controls
        'X-Avatar-X': avatarX?.toString() || '',
        'X-Avatar-Y': avatarY?.toString() || '',
        'X-Avatar-Size': avatarSize?.toString() || '',
        'X-Text-Max-Width': textMaxWidth?.toString() || '',
        'X-Text-Start-Y': textStartY?.toString() || '',
        'X-Font-Size': fontSize?.toString() || '',

        // Visual styling controls
        'X-Border-Color': borderColor || '',
        'X-Border-Opacity': borderOpacity?.toString() || '',
        'X-Pattern-Seed': patternSeed || '',
        'X-Text-Padding': textPadding?.toString() || '',
        'X-Line-Height': lineHeight?.toString() || '',
        'X-Glass-Background': glassBackground.toString()
      }
    });
  } catch (error) {
    console.error('Error in OG image generation:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate OG image',
        message: error instanceof Error ? error.message : 'Unknown error'
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

// Apply rate limiting to handler
export const GET = withRateLimit(getHandler);
