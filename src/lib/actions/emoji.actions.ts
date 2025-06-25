'use server';

import { createLogger } from '@/lib/logging';
import { revalidatePath } from 'next/cache';
import { auth } from '../auth';
import sql from '../db';
import { EmojiEncryptionService } from '../encryption/emoji-encryption';
import { PERMISSIONS } from '../permissions/permissions';
import { checkUserPermission } from './permissions.actions';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'EmojiActions',
    module: 'actions'
  }
});

/**
 * Server action to get OS-specific emojis for the current user
 */
export async function getOSEmojis(
  userOS: 'windows' | 'mac' = 'windows',
  category?: string,
  search?: string,
  limit: number = 50,
  offset: number = 0
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to access emojis');
  }

  const userId = parseInt(session.user.id);

  // Build the query based on OS
  const tableName = userOS === 'mac' ? 'emojis_mac' : 'emojis_windows';

  let whereClause = sql`WHERE 1=1`;

  if (category) {
    whereClause = sql`${whereClause} AND category_id = ${category}`;
  }

  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    whereClause = sql`${whereClause} AND (
      LOWER(name) LIKE ${searchTerm} OR 
      LOWER(aliases::text) LIKE ${searchTerm} OR
      LOWER(keywords::text) LIKE ${searchTerm}
    )`;
  }

  // Get usage counts from emoji_usage table
  const result = await sql<
    {
      id: number;
      emoji_id: string;
      name: string;
      unicode_char: string;
      category_id: number;
      aliases: string[];
      usage_count: number;
    }[]
  >`
    SELECT 
      e.id, 
      e.emoji_id,
      e.name, 
      e.unicode_char, 
      e.category_id, 
      e.aliases,
      COALESCE(u.usage_count, 0) as usage_count
    FROM ${sql(tableName)} e
    LEFT JOIN emoji_usage u ON u.emoji_id = e.emoji_id::text 
      AND u.emoji_type = ${userOS} 
      AND u.user_id = ${userId}
    ${whereClause}
    ORDER BY usage_count DESC, e.name ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result;
}

/**
 * Server action to get approved custom emojis
 */
export async function getCustomEmojis(
  search?: string,
  limit: number = 50,
  offset: number = 0
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to access custom emojis');
  }

  const userId = parseInt(session.user.id);

  let whereClause = sql`WHERE is_approved = true`;

  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    whereClause = sql`${whereClause} AND (
      LOWER(name) LIKE ${searchTerm} OR 
      LOWER(tags::text) LIKE ${searchTerm}
    )`;
  }

  const result = await sql<
    {
      id: number;
      emoji_id: string;
      name: string;
      encrypted_image_data: string;
      category_id: number;
      usage_count: number;
      user_id: number;
    }[]
  >`
    SELECT 
      c.id, 
      c.emoji_id,
      c.name, 
      c.encrypted_image_data, 
      c.category_id, 
      COALESCE(u.usage_count, 0) as usage_count,
      c.user_id
    FROM custom_emojis c
    LEFT JOIN emoji_usage u ON u.emoji_id = c.emoji_id::text 
      AND u.emoji_type = 'custom' 
      AND u.user_id = ${userId}
    ${whereClause}
    ORDER BY usage_count DESC, c.name ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Decrypt image data for each emoji
  const decryptedEmojis = await Promise.all(
    result.map(async (emoji) => {
      try {
        const decryptedImageData =
          await EmojiEncryptionService.decryptImageData(
            {
              ...JSON.parse(emoji.encrypted_image_data),
              context: 'emoji' as const
            },
            emoji.user_id
          );
        return {
          ...emoji,
          image_data: decryptedImageData.toString('base64')
        };
      } catch (error) {
        logger.group('getCustomEmojis');
        logger.error('Failed to decrypt emoji', error as Error, {
          emojiName: emoji.name,
          emojiId: emoji.id,
          userId: emoji.user_id
        });
        logger.groupEnd();
        return {
          ...emoji,
          image_data: null
        };
      }
    })
  );

  return decryptedEmojis;
}

/**
 * Server action to upload a custom emoji
 */
export async function uploadCustomEmoji(
  name: string,
  displayName: string,
  imageData: string,
  categoryId: number = 9 // Default to 'custom' category ID
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to upload custom emojis');
  }

  const userId = parseInt(session.user.id);

  // Convert base64 to buffer and validate
  const imageBuffer = Buffer.from(imageData, 'base64');
  const format = 'png'; // Assume PNG for now, in production you'd detect format

  const validation = EmojiEncryptionService.validateImageConstraints(
    imageBuffer,
    format
  );
  if (!validation.isValid) {
    throw new Error(`Invalid image: ${validation.errors.join(', ')}`);
  }

  // Encrypt the image data
  const encryptedData = await EmojiEncryptionService.encryptImageData(
    imageBuffer,
    'personal',
    userId
  );

  // Generate a unique emoji_id
  const emojiId = `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

  // Insert the custom emoji (pending approval)
  await sql`
    INSERT INTO custom_emojis (
      emoji_id, name, description, encrypted_image_data, category_id, user_id,
      image_format, image_size_bytes, encryption_type
    ) VALUES (
      ${emojiId}, ${name}, ${displayName}, ${JSON.stringify(encryptedData)}, 
      ${categoryId}, ${userId}, ${format}, ${imageBuffer.length}, 'personal'
    )
  `;

  logger.group('uploadCustomEmoji');
  logger.error(
    `AUDIT: Custom emoji '${name}' uploaded by user ${userId} - pending approval`,
    undefined,
    {
      emojiName: name,
      userId,
      categoryId,
      action: 'EMOJI_UPLOADED',
      audit: true
    }
  );
  logger.groupEnd();

  return true;
}

/**
 * Server action to approve a custom emoji (admin only)
 */
export async function approveCustomEmoji(emojiId: number, reason?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to approve emojis');
  }

  const userId = parseInt(session.user.id);

  // Check if user has permission to approve emojis
  const hasPermission = await checkUserPermission(
    userId,
    PERMISSIONS.ADMIN.EMOJI_APPROVE
  );
  if (!hasPermission) {
    logger.group('approveEmoji');
    logger.error(
      'SECURITY VIOLATION: User attempted to approve emoji without permission',
      undefined,
      {
        userId,
        emojiId,
        action: 'SECURITY_VIOLATION',
        audit: true
      }
    );
    logger.groupEnd();
    throw new Error('Insufficient permissions to approve emojis');
  }

  try {
    await sql`
    UPDATE custom_emojis 
    SET 
      is_approved = true,
      approved_by = ${userId},
      approved_at = CURRENT_TIMESTAMP,
      approval_reason = ${reason || null}
    WHERE id = ${emojiId}
  `;

    revalidatePath('/admin');
    logger.group('approveEmoji');
    logger.error(
      `AUDIT: Custom emoji ${emojiId} approved by user ${userId}`,
      undefined,
      {
        emojiId,
        userId,
        reason,
        action: 'EMOJI_APPROVED',
        audit: true
      }
    );
    logger.groupEnd();
    return true;
  } catch (error) {
    logger.group('approveEmoji');
    logger.error('Error approving emoji', error as Error, {
      emojiId,
      userId
    });
    logger.groupEnd();
    throw new Error('Failed to approve emoji');
  }
}

/**
 * Server action to reject a custom emoji (admin only)
 */
export async function rejectCustomEmoji(emojiId: number, reason: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to reject emojis');
  }

  const userId = parseInt(session.user.id);

  // Check if user has permission to reject emojis
  const hasPermission = await checkUserPermission(
    userId,
    PERMISSIONS.ADMIN.EMOJI_APPROVE
  );
  if (!hasPermission) {
    logger.group('rejectEmoji');
    logger.error(
      'SECURITY VIOLATION: User attempted to reject emoji without permission',
      undefined,
      {
        userId,
        emojiId,
        action: 'SECURITY_VIOLATION',
        audit: true
      }
    );
    logger.groupEnd();
    throw new Error('Insufficient permissions to reject emojis');
  }

  try {
    await sql`
    UPDATE custom_emojis 
    SET 
      is_approved = false,
      approved_by = ${userId},
      approved_at = CURRENT_TIMESTAMP,
      approval_reason = ${reason}
    WHERE id = ${emojiId}
  `;

    revalidatePath('/admin');
    logger.group('rejectEmoji');
    logger.error(
      `AUDIT: Custom emoji ${emojiId} rejected by user ${userId}`,
      undefined,
      {
        emojiId,
        userId,
        reason,
        action: 'EMOJI_REJECTED',
        audit: true
      }
    );
    logger.groupEnd();
    return true;
  } catch (error) {
    logger.group('rejectEmoji');
    logger.error('Error rejecting emoji', error as Error, {
      emojiId,
      userId,
      reason
    });
    logger.groupEnd();
    throw new Error('Failed to reject emoji');
  }
}

/**
 * Server action to delete a custom emoji (admin only)
 */
export async function deleteCustomEmoji(emojiId: number, reason: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to delete emojis');
  }

  const userId = parseInt(session.user.id);

  // Check if user has permission to delete emojis
  const hasPermission = await checkUserPermission(
    userId,
    PERMISSIONS.ADMIN.EMOJI_MANAGE
  );
  if (!hasPermission) {
    logger.group('deleteEmoji');
    logger.error(
      'SECURITY VIOLATION: User attempted to delete emoji without permission',
      undefined,
      {
        userId,
        emojiId,
        action: 'SECURITY_VIOLATION',
        audit: true
      }
    );
    logger.groupEnd();
    throw new Error('Insufficient permissions to delete emojis');
  }

  // Get emoji info for audit log
  const emojiResult = await sql<{ name: string; user_id: number }[]>`
    SELECT name, user_id FROM custom_emojis WHERE id = ${emojiId}
  `;

  if (emojiResult.length === 0) {
    throw new Error('Emoji not found');
  }

  try {
    await sql`
    DELETE FROM custom_emojis WHERE id = ${emojiId}
  `;

    logger.group('deleteEmoji');
    logger.error(
      `AUDIT: Custom emoji '${emojiResult[0].name}' deleted by user ${userId}`,
      undefined,
      {
        emojiId,
        emojiName: emojiResult[0].name,
        emojiOwnerId: emojiResult[0].user_id,
        userId,
        reason,
        action: 'EMOJI_DELETED',
        audit: true
      }
    );
    logger.groupEnd();
    revalidatePath('/admin');
    return true;
  } catch (error) {
    logger.group('deleteEmoji');
    logger.error('Error deleting emoji', error as Error, {
      emojiId,
      userId,
      reason
    });
    logger.groupEnd();
    throw new Error('Failed to delete emoji');
  }
}

/**
 * Server action to get pending custom emojis for admin review
 */
export async function getPendingCustomEmojis(
  limit: number = 50,
  offset: number = 0
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to view pending emojis');
  }

  const userId = parseInt(session.user.id);

  // Check if user has permission to view pending emojis
  const hasPermission = await checkUserPermission(
    userId,
    PERMISSIONS.ADMIN.EMOJI_APPROVE
  );
  if (!hasPermission) {
    throw new Error('Insufficient permissions to view pending emojis');
  }

  const result = await sql<
    {
      id: number;
      name: string;
      display_name: string;
      encrypted_image_data: string;
      category: string;
      created_by: number;
      created_at: string;
      creator_email: string;
    }[]
  >`
    SELECT 
      ce.id, ce.name, ce.display_name, ce.encrypted_image_data, 
      ce.category, ce.created_by, ce.created_at,
      u.email as creator_email
    FROM custom_emojis ce
    JOIN users u ON ce.created_by = u.id
    WHERE ce.is_approved IS NULL
    ORDER BY ce.created_at ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Decrypt image data for each emoji
  const decryptedEmojis = await Promise.all(
    result.map(async (emoji) => {
      try {
        const decryptedImageData =
          await EmojiEncryptionService.decryptImageData(
            {
              ...JSON.parse(emoji.encrypted_image_data),
              context: 'emoji' as const
            },
            emoji.created_by
          );
        return {
          ...emoji,
          image_data: decryptedImageData.toString('base64')
        };
      } catch (error) {
        logger.group('getPendingEmojis');
        logger.error('Failed to decrypt pending emoji', error as Error, {
          emojiName: emoji.name,
          emojiId: emoji.id,
          createdBy: emoji.created_by
        });
        logger.groupEnd();
        return {
          ...emoji,
          image_data: null
        };
      }
    })
  );

  return decryptedEmojis;
}

/**
 * Server action to track emoji usage
 */
export async function trackEmojiUsage(
  emojiType: 'windows' | 'mac' | 'custom',
  emojiId: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return; // Don't throw error for usage tracking
  }

  const userId = parseInt(session.user.id);

  try {
    // Update usage count in the appropriate table
    if (emojiType === 'custom') {
      await sql`
        UPDATE custom_emojis 
        SET usage_count = usage_count + 1 
        WHERE id = ${emojiId}
      `;
    } else {
      const tableName = emojiType === 'mac' ? 'emojis_mac' : 'emojis_windows';
      await sql`
        UPDATE ${sql(tableName)} 
        SET usage_count = usage_count + 1 
        WHERE id = ${emojiId}
      `;
    }

    // Insert usage analytics record
    await sql`
      INSERT INTO emoji_usage_analytics (
        user_id, emoji_type, emoji_id, used_at
      ) VALUES (
        ${userId}, ${emojiType}, ${emojiId}, CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    logger.group('trackEmojiUsage');
    logger.error('Failed to track emoji usage', error as Error, {
      emojiType,
      emojiId,
      userId
    });
    logger.groupEnd();
  }
}

/**
 * Server action to get emoji categories
 */
export async function getEmojiCategories(
  userOS: 'windows' | 'mac' = 'windows'
) {
  const tableName = userOS === 'mac' ? 'emojis_mac' : 'emojis_windows';

  const result = await sql<
    {
      category_id: number;
      category_name: string;
      display_name: string;
      count: number;
    }[]
  >`
    SELECT 
      ec.id as category_id,
      ec.name as category_name, 
      ec.display_name,
      COUNT(e.*) as count
    FROM ${sql(tableName)} e
    JOIN emoji_categories ec ON e.category_id = ec.id
    WHERE e.is_active = true
    GROUP BY ec.id, ec.name, ec.display_name, ec.sort_order
    ORDER BY ec.sort_order, ec.name
  `;

  // Also get custom emoji categories
  const customResult = await sql<
    {
      category_id: number;
      category_name: string;
      display_name: string;
      count: number;
    }[]
  >`
    SELECT 
      ec.id as category_id,
      ec.name as category_name, 
      ec.display_name,
      COUNT(c.*) as count
    FROM custom_emojis c
    JOIN emoji_categories ec ON c.category_id = ec.id
    WHERE c.is_approved = true AND c.is_active = true
    GROUP BY ec.id, ec.name, ec.display_name, ec.sort_order
    ORDER BY ec.sort_order, ec.name
  `;

  return {
    builtin: result,
    custom: customResult
  };
}

/**
 * Server action to get category name to ID mapping
 */
export async function getCategoryMapping(): Promise<Record<string, number>> {
  const result = await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM emoji_categories
    ORDER BY id
  `;

  const mapping: Record<string, number> = {};
  result.forEach((category) => {
    mapping[category.name.toLowerCase()] = category.id;
  });

  return mapping;
}
