import { NextResponse } from 'next/server';

/**
 * Convert relative URLs to absolute URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url; // Return original if URL construction fails
  }
}

/**
 * Extract image URL with multiple fallback options
 */
function extractImageUrl(html: string, baseUrl: string): string {
  // Try multiple meta tag patterns in order of preference
  const imagePatterns = [
    /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i,
    /<meta[^>]*property="og:image:url"[^>]*content="([^"]*)"[^>]*>/i,
    /<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i,
    /<meta[^>]*name="twitter:image:src"[^>]*content="([^"]*)"[^>]*>/i,
    /<meta[^>]*name="image"[^>]*content="([^"]*)"[^>]*>/i,
    /<meta[^>]*itemprop="image"[^>]*content="([^"]*)"[^>]*>/i,
  ];

  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const imageUrl = match[1].trim();
      // Convert relative URLs to absolute
      return imageUrl.startsWith('http') ? imageUrl : resolveUrl(imageUrl, baseUrl);
    }
  }

  return '';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    let targetUrl: string;
    let baseUrl: string;

    // Handle internal links
    if (url.startsWith('/')) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      targetUrl = resolveUrl(url, baseUrl);
    } else {
      targetUrl = url;
      baseUrl = new URL(url).origin;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IdlingApp-LinkPreview/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract metadata using enhanced patterns
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionPatterns = [
      /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i,
      /<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i,
      /<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"[^>]*>/i,
    ];

    let description = '';
    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        description = match[1].trim();
        break;
      }
    }

    const metadata = {
      title: titleMatch ? titleMatch[1].trim() : '',
      description,
      image: extractImageUrl(html, baseUrl),
      url: url
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch link preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
