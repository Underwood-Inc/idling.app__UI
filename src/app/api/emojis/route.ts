/**
 * Emoji API Routes
 * Handles fetching OS-specific emojis using server actions
 */

import { createLogger } from '@/lib/logging';
import { NextRequest, NextResponse } from 'next/server';
import {
  getCategoryMapping,
  getCustomEmojis,
  getEmojiCategories,
  getOSEmojis,
  trackEmojiUsage,
  uploadCustomEmoji
} from '../../../lib/actions/emoji.actions';
import { OSDetection } from '../../../lib/utils/os-detection';

const logger = createLogger({
  context: {
    component: 'EmojisAPI',
    module: 'api'
  }
});

export interface EmojiResponse {
  id: number;
  emoji_id: string;
  unicode_codepoint?: string;
  unicode_char?: string;
  name: string;
  description?: string;
  category: {
    id: number;
    name: string;
    display_name: string;
  };
  tags: string[];
  aliases: string[];
  keywords?: string[];
  is_custom?: boolean;
  custom_image_url?: string;
  usage_count?: number;
  version_min?: string;
  is_approved?: boolean;
  is_personal?: boolean;
}

export interface EmojiListResponse {
  emojis: EmojiResponse[];
  categories: Array<{
    id: number;
    name: string;
    display_name: string;
    description?: string;
    emoji_count: number;
  }>;
  os_info: {
    os: string;
    version?: string;
    is_supported: boolean;
    emoji_support: {
      supports_unicode: boolean;
      supports_custom: boolean;
      max_emoji_version: string;
      recommended_format: string;
    };
  };
  total_count: number;
  page: number;
  per_page: number;
}

/**
 * GET /api/emojis
 * Fetch emojis based on user's OS and preferences using server actions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(
      parseInt(searchParams.get('per_page') || '50'),
      100
    );
    const includeCustom = searchParams.get('include_custom') === 'true';

    // Detect user's OS from headers
    const userAgent = request.headers.get('user-agent') || '';
    const osInfo = OSDetection.detectFromUserAgent(userAgent);
    const userOS = osInfo.os === 'mac' ? 'mac' : 'windows';

    const offset = (page - 1) * perPage;

    // Get category mapping from database and convert category name to ID if provided
    let categoryId: string | undefined;
    if (category) {
      const categoryMapping = await getCategoryMapping();
      const mappedId = categoryMapping[category.toLowerCase()];
      if (mappedId) {
        categoryId = mappedId.toString();
      }
    }

    // Get categories first to build category lookup
    const categories = await getEmojiCategories(userOS);
    const categoryLookup = new Map<
      number,
      { name: string; display_name: string }
    >();

    // Build category lookup from both builtin and custom categories
    [...categories.builtin, ...categories.custom].forEach((cat) => {
      categoryLookup.set(cat.category_id, {
        name: cat.category_name,
        display_name: cat.display_name
      });
    });

    // Fetch OS-specific emojis using server action
    const osEmojis = await getOSEmojis(
      userOS,
      categoryId,
      search,
      perPage,
      offset
    );

    // Fetch custom emojis if requested
    let customEmojis: any[] = [];
    if (includeCustom) {
      customEmojis = await getCustomEmojis(search, perPage, 0);
    }

    const response: EmojiListResponse = {
      emojis: [
        ...osEmojis.map((emoji) => {
          const categoryInfo = categoryLookup.get(emoji.category_id) || {
            name: 'unknown',
            display_name: 'Unknown'
          };
          return {
            id: emoji.id,
            emoji_id: emoji.name,
            unicode_char: emoji.unicode_char,
            name: emoji.name,
            description: emoji.name,
            category: {
              id: emoji.category_id,
              name: categoryInfo.name,
              display_name: categoryInfo.display_name
            },
            tags: [],
            aliases: emoji.aliases || [],
            is_custom: false,
            usage_count: emoji.usage_count
          };
        }),
        ...customEmojis.map((emoji) => {
          const categoryInfo = categoryLookup.get(emoji.category_id) || {
            name: 'custom',
            display_name: 'Custom'
          };
          return {
            id: emoji.id,
            emoji_id: emoji.name,
            name: emoji.name,
            description: emoji.name,
            category: {
              id: emoji.category_id,
              name: categoryInfo.name,
              display_name: categoryInfo.display_name
            },
            tags: [],
            aliases: [],
            is_custom: true,
            custom_image_url: emoji.image_data
              ? `data:image/png;base64,${emoji.image_data}`
              : undefined,
            usage_count: emoji.usage_count
          };
        })
      ],
      categories: [
        ...categories.builtin.map((cat) => ({
          id: cat.category_id,
          name: cat.category_name,
          display_name: cat.display_name,
          emoji_count: cat.count
        })),
        ...categories.custom.map((cat) => ({
          id: cat.category_id,
          name: cat.category_name,
          display_name: cat.display_name,
          emoji_count: cat.count
        }))
      ],
      os_info: {
        os: osInfo.os,
        version: osInfo.version,
        is_supported: true,
        emoji_support: {
          supports_unicode: true,
          supports_custom: true,
          max_emoji_version: '15.0',
          recommended_format: 'unicode'
        }
      },
      total_count: osEmojis.length + customEmojis.length,
      page,
      per_page: perPage
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching emojis', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch emojis' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emojis
 * Create a new custom emoji using server actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, imageData, category } = body;

    if (!name || !displayName || !imageData) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, imageData' },
        { status: 400 }
      );
    }

    // Convert category to category ID (default to 9 for 'custom' category)
    const categoryId = category ? parseInt(category) || 9 : 9;

    // Upload custom emoji using server action
    await uploadCustomEmoji(name, displayName, imageData, categoryId);

    return NextResponse.json({
      success: true,
      message: 'Custom emoji uploaded successfully and is pending approval'
    });
  } catch (error) {
    logger.error('Error uploading custom emoji', error as Error);
    return NextResponse.json(
      { error: 'Failed to upload emoji' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/emojis
 * Track emoji usage using server actions
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { emojiType, emojiId } = body;

    if (!emojiType || !emojiId) {
      return NextResponse.json(
        { error: 'Missing required fields: emojiType, emojiId' },
        { status: 400 }
      );
    }

    // Track emoji usage using server action
    await trackEmojiUsage(emojiType, emojiId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error tracking emoji usage', error as Error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
