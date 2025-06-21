/**
 * Emoji API Routes
 * Handles fetching OS-specific emojis using server actions
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomEmojis,
  getEmojiCategories,
  getOSEmojis,
  trackEmojiUsage,
  uploadCustomEmoji
} from '../../../lib/actions/emoji.actions';
import { OSDetection } from '../../../lib/utils/os-detection';

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

    // Fetch OS-specific emojis using server action
    const osEmojis = await getOSEmojis(
      userOS,
      category,
      search,
      perPage,
      offset
    );

    // Fetch custom emojis if requested
    let customEmojis: any[] = [];
    if (includeCustom) {
      customEmojis = await getCustomEmojis(search, perPage, 0);
    }

    // Get categories
    const categories = await getEmojiCategories(userOS);

    const response: EmojiListResponse = {
      emojis: [
        ...osEmojis.map((emoji) => ({
          id: emoji.id,
          emoji_id: emoji.name,
          unicode_char: emoji.unicode_char,
          name: emoji.name,
          description: emoji.display_name,
          category: {
            id: 0,
            name: emoji.category,
            display_name: emoji.category
          },
          tags: [],
          aliases: emoji.aliases || [],
          is_custom: false,
          usage_count: emoji.usage_count
        })),
        ...customEmojis.map((emoji) => ({
          id: emoji.id,
          emoji_id: emoji.name,
          name: emoji.name,
          description: emoji.display_name,
          category: {
            id: 0,
            name: emoji.category,
            display_name: emoji.category
          },
          tags: [],
          aliases: [],
          is_custom: true,
          custom_image_url: emoji.image_data
            ? `data:image/png;base64,${emoji.image_data}`
            : undefined,
          usage_count: emoji.usage_count
        }))
      ],
      categories: [
        ...categories.builtin.map((cat) => ({
          id: 0,
          name: cat.category,
          display_name: cat.category,
          emoji_count: cat.count
        })),
        ...categories.custom.map((cat) => ({
          id: 0,
          name: cat.category,
          display_name: cat.category,
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
    console.error('Error fetching emojis:', error);
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

    // Upload custom emoji using server action
    await uploadCustomEmoji(name, displayName, imageData, category);

    return NextResponse.json({
      success: true,
      message: 'Custom emoji uploaded successfully and is pending approval'
    });
  } catch (error) {
    console.error('Error uploading custom emoji:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upload emoji'
      },
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
    console.error('Error tracking emoji usage:', error);
    return NextResponse.json(
      { error: 'Failed to track emoji usage' },
      { status: 500 }
    );
  }
}
