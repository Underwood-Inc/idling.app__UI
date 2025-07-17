/**
 * @swagger
 * /api/emojis:
 *   get:
 *     summary: Get emojis by OS and category
 *     description: Fetches OS-specific emojis with optional filtering by category and search terms
 *     tags:
 *       - Emojis
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by emoji category (e.g., 'smileys', 'animals')
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter emojis by name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of emojis per page
 *       - in: query
 *         name: include_custom
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include custom user-uploaded emojis
 *     responses:
 *       200:
 *         description: Successfully retrieved emojis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emojis:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       emoji_id:
 *                         type: string
 *                       unicode_codepoint:
 *                         type: string
 *                         nullable: true
 *                       unicode_char:
 *                         type: string
 *                         nullable: true
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       category:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           name:
 *                             type: string
 *                           display_name:
 *                             type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       aliases:
 *                         type: array
 *                         items:
 *                           type: string
 *                       keywords:
 *                         type: array
 *                         items:
 *                           type: string
 *                         nullable: true
 *                       is_custom:
 *                         type: boolean
 *                         nullable: true
 *                       custom_image_url:
 *                         type: string
 *                         nullable: true
 *                       usage_count:
 *                         type: number
 *                         nullable: true
 *                       version_min:
 *                         type: string
 *                         nullable: true
 *                       is_approved:
 *                         type: boolean
 *                         nullable: true
 *                       is_personal:
 *                         type: boolean
 *                         nullable: true
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       name:
 *                         type: string
 *                       display_name:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       emoji_count:
 *                         type: number
 *                 total_count:
 *                   type: number
 *                 page:
 *                   type: number
 *                 per_page:
 *                   type: number
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *   post:
 *     summary: Upload custom emoji
 *     description: Upload a custom emoji image for the authenticated user
 *     tags:
 *       - Emojis
 *     security:
 *       - NextAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Emoji image file (PNG, JPG, GIF)
 *               name:
 *                 type: string
 *                 description: Name for the custom emoji
 *               category:
 *                 type: string
 *                 description: Category for the emoji
 *             required:
 *               - file
 *               - name
 *     responses:
 *       201:
 *         description: Emoji uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 emoji:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     emoji_id:
 *                       type: string
 *                     unicode_codepoint:
 *                       type: string
 *                       nullable: true
 *                     unicode_char:
 *                       type: string
 *                       nullable: true
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     category:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: number
 *                         name:
 *                           type: string
 *                         display_name:
 *                           type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     aliases:
 *                       type: array
 *                       items:
 *                         type: string
 *                     keywords:
 *                       type: array
 *                       items:
 *                         type: string
 *                       nullable: true
 *                     is_custom:
 *                       type: boolean
 *                       nullable: true
 *                     custom_image_url:
 *                       type: string
 *                       nullable: true
 *                     usage_count:
 *                       type: number
 *                       nullable: true
 *                     version_min:
 *                       type: string
 *                       nullable: true
 *                     is_approved:
 *                       type: boolean
 *                       nullable: true
 *                     is_personal:
 *                       type: boolean
 *                       nullable: true
 *       400:
 *         description: Invalid file or parameters
 *       401:
 *         description: Authentication required
 *       413:
 *         description: File too large
 *       500:
 *         description: Upload failed
 *   put:
 *     summary: Track emoji usage
 *     description: Track usage statistics for an emoji
 *     tags:
 *       - Emojis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emoji_id:
 *                 type: string
 *                 description: ID of the emoji being used
 *               emoji_type:
 *                 type: string
 *                 enum: [windows, mac, custom]
 *                 description: Type of emoji being tracked
 *             required:
 *               - emoji_id
 *               - emoji_type
 *     responses:
 *       200:
 *         description: Usage tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Tracking failed
 */

/**
 * Emoji API Routes
 * Handles fetching OS-specific emojis using server actions
 */

import {
  getCategoryMapping,
  getCustomEmojis,
  getEmojiCategories,
  getOSEmojis,
  trackEmojiUsage,
  uploadCustomEmoji
} from '@lib/actions/emoji.actions';
import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { createLogger } from '@lib/logging';
import { OSDetection } from '@lib/utils/os-detection';
import { NextRequest, NextResponse } from 'next/server';

const logger = createLogger({
  context: {
    component: 'EmojisAPI',
    module: 'api'
  },
  enabled: false
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
async function getHandler(request: NextRequest) {
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
            emoji_id: emoji.emoji_id,
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
            emoji_id: emoji.emoji_id,
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
        os: userOS,
        version: osInfo.version,
        is_supported: true,
        emoji_support: {
          supports_unicode: true,
          supports_custom: true,
          max_emoji_version: userOS === 'mac' ? '15.0' : '11.0',
          recommended_format: userOS === 'mac' ? 'unicode' : 'image'
        }
      },
      total_count: osEmojis.length + customEmojis.length,
      page,
      per_page: perPage
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching emojis:', error as Error);
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
async function postHandler(request: NextRequest) {
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
    logger.error('Error uploading custom emoji:', error as Error);
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
async function putHandler(request: NextRequest) {
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
    logger.error('Error tracking emoji usage:', error as Error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}

// Apply universal enhancements to all handlers
export const GET = withUniversalEnhancements(getHandler);
export const POST = withUniversalEnhancements(postHandler);
export const PUT = withUniversalEnhancements(putHandler);
