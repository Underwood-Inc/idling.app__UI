import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Handle internal links
    if (url.startsWith('/')) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const fullUrl = new URL(url, baseUrl).toString();

      const response = await fetch(fullUrl);
      const html = await response.text();

      // Extract metadata using regex
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descriptionMatch = html.match(
        /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
      );
      const ogImageMatch = html.match(
        /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i
      );

      const metadata = {
        title: titleMatch ? titleMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        image: ogImageMatch ? ogImageMatch[1].trim() : '',
        url: url
      };

      return NextResponse.json(metadata);
    }

    // Handle external links
    const response = await fetch(url);
    const html = await response.text();

    // Extract metadata using regex
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(
      /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
    );
    const ogImageMatch = html.match(
      /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i
    );

    const metadata = {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      image: ogImageMatch ? ogImageMatch[1].trim() : '',
      url: url
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link preview' },
      { status: 500 }
    );
  }
}
