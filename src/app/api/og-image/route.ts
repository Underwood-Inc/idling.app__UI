import { NextRequest, NextResponse } from 'next/server';
import { OGImageService } from './services/OGImageService';

export async function GET(request: NextRequest) {
  try {
    const ogImageService = new OGImageService();
    const result = await ogImageService.generateImage(request);
    
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const isDryRun = searchParams.get('dry-run') === 'true';

    // For dry runs, return JSON with quota info
    if (isDryRun) {
      return NextResponse.json({
        remainingGenerations: result.remainingGenerations,
        generationOptions: result.generationOptions
      });
    }

    // For format=json, return full metadata
    if (format === 'json') {
      return NextResponse.json({
        id: result.id,
        svg: result.svg,
        seed: result.seed,
        dimensions: result.dimensions,
        aspectRatio: result.aspectRatio,
        generationOptions: result.generationOptions,
        remainingGenerations: result.remainingGenerations
      });
    }

    // Default: return SVG with metadata in headers
    const response = new NextResponse(result.svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Generation-ID': result.id || '',
        'X-Generation-Seed': result.seed,
        'X-Remaining-Generations': result.remainingGenerations.toString(),
        'X-Generation-Options': JSON.stringify(result.generationOptions)
      }
    });

    return response;
  } catch (error) {
    console.error('OG Image generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    
    // Check if it's a quota exceeded error
    if (errorMessage.includes('Daily generation limit exceeded')) {
      return NextResponse.json(
        { 
          error: errorMessage,
          remainingGenerations: 0,
          upgradeUrl: '/subscription'
        },
        { status: 429 } // Too Many Requests
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 