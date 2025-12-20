import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ModrinthProject {
  id: string;
  slug: string;
  downloads: number;
  followers: number;
}

const PROJECT_SLUGS = {
  RITUALS: 'totem-rituals',
  STRIXUN_PACK_A: 'strixun-pack-a',
} as const;

export async function GET() {
  console.log('[Modrinth API] Fetching project stats...');

  try {
    // Fetch stats for all projects in parallel
    const [ritualsResponse, packResponse] = await Promise.all([
      fetch(`https://api.modrinth.com/v2/project/${PROJECT_SLUGS.RITUALS}`, {
        headers: {
          'User-Agent': 'idling.app/1.0.0',
        },
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
      }),
      fetch(`https://api.modrinth.com/v2/project/${PROJECT_SLUGS.STRIXUN_PACK_A}`, {
        headers: {
          'User-Agent': 'idling.app/1.0.0',
        },
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
      }),
    ]);

    const rituals: ModrinthProject = ritualsResponse.ok
      ? await ritualsResponse.json()
      : { id: '', slug: PROJECT_SLUGS.RITUALS, downloads: 0, followers: 0 };

    const pack: ModrinthProject = packResponse.ok
      ? await packResponse.json()
      : { id: '', slug: PROJECT_SLUGS.STRIXUN_PACK_A, downloads: 0, followers: 0 };

    console.log('[Modrinth API] Stats fetched:', {
      rituals: rituals.downloads,
      pack: pack.downloads,
    });

    return NextResponse.json({
      projects: {
        rituals: {
          slug: PROJECT_SLUGS.RITUALS,
          downloads: rituals.downloads,
          followers: rituals.followers,
          formattedDownloads: formatDownloads(rituals.downloads),
        },
        strixunPackA: {
          slug: PROJECT_SLUGS.STRIXUN_PACK_A,
          downloads: pack.downloads,
          followers: pack.followers,
          formattedDownloads: formatDownloads(pack.downloads),
        },
      },
      totalDownloads: rituals.downloads + pack.downloads,
      formattedTotal: formatDownloads(rituals.downloads + pack.downloads),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Modrinth API] Error fetching stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Modrinth stats',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function formatDownloads(downloads: number): string {
  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M+`;
  } else if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}K+`;
  }
  return `${downloads}+`;
}

