'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../auth';
import sql from '../db';
import { EmojiEncryptionService } from '../encryption/emoji-encryption';
import { PERMISSIONS } from '../permissions/permissions';
import { checkUserPermission } from './permissions.actions';

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
  const tableName = userOS === 'mac' ? 'mac_emojis' : 'windows_emojis';

  let whereClause = sql`WHERE 1=1`;

  if (category) {
    whereClause = sql`${whereClause} AND category = ${category}`;
  }

  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    whereClause = sql`${whereClause} AND (
      LOWER(name) LIKE ${searchTerm} OR 
      LOWER(display_name) LIKE ${searchTerm} OR
      LOWER(aliases::text) LIKE ${searchTerm}
    )`;
  }

  const result = await sql<
    {
      id: number;
      name: string;
      display_name: string;
      unicode_char: string;
      category: string;
      aliases: string[];
      usage_count: number;
    }[]
  >`
    SELECT 
      id, name, display_name, unicode_char, category, aliases, usage_count
    FROM ${sql(tableName)}
    ${whereClause}
    ORDER BY usage_count DESC, name ASC
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
      LOWER(display_name) LIKE ${searchTerm}
    )`;
  }

  const result = await sql<
    {
      id: number;
      name: string;
      display_name: string;
      encrypted_image_data: string;
      category: string;
      usage_count: number;
      created_by: number;
    }[]
  >`
    SELECT 
      id, name, display_name, encrypted_image_data, category, 
      usage_count, created_by
    FROM custom_emojis
    ${whereClause}
    ORDER BY usage_count DESC, name ASC
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
            userId
          );
        return {
          ...emoji,
          image_data: decryptedImageData.toString('base64')
        };
      } catch (error) {
        console.error(`Failed to decrypt emoji ${emoji.name}:`, error);
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
  category: string = 'custom'
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

  // Insert the custom emoji (pending approval)
  await sql`
    INSERT INTO custom_emojis (
      name, display_name, encrypted_image_data, category, created_by
    ) VALUES (
      ${name}, ${displayName}, ${JSON.stringify(encryptedData)}, ${category}, ${userId}
    )
  `;

  console.error(
    `AUDIT: Custom emoji '${name}' uploaded by user ${userId} - pending approval`
  );

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
    console.error(
      `SECURITY VIOLATION: User ${userId} attempted to approve emoji without permission`
    );
    throw new Error('Insufficient permissions to approve emojis');
  }

  await sql`
    UPDATE custom_emojis 
    SET 
      is_approved = true,
      approved_by = ${userId},
      approved_at = CURRENT_TIMESTAMP,
      approval_reason = ${reason || null}
    WHERE id = ${emojiId}
  `;

  console.error(`AUDIT: Custom emoji ${emojiId} approved by user ${userId}`);

  revalidatePath('/admin');
  return true;
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
    console.error(
      `SECURITY VIOLATION: User ${userId} attempted to reject emoji without permission`
    );
    throw new Error('Insufficient permissions to reject emojis');
  }

  await sql`
    UPDATE custom_emojis 
    SET 
      is_approved = false,
      approved_by = ${userId},
      approved_at = CURRENT_TIMESTAMP,
      approval_reason = ${reason}
    WHERE id = ${emojiId}
  `;

  console.error(
    `AUDIT: Custom emoji ${emojiId} rejected by user ${userId}. Reason: ${reason}`
  );

  revalidatePath('/admin');
  return true;
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
    console.error(
      `SECURITY VIOLATION: User ${userId} attempted to delete emoji without permission`
    );
    throw new Error('Insufficient permissions to delete emojis');
  }

  // Get emoji info for audit log
  const emojiResult = await sql<{ name: string; created_by: number }[]>`
    SELECT name, created_by FROM custom_emojis WHERE id = ${emojiId}
  `;

  if (emojiResult.length === 0) {
    throw new Error('Emoji not found');
  }

  await sql`
    DELETE FROM custom_emojis WHERE id = ${emojiId}
  `;

  console.error(
    `AUDIT: Custom emoji '${emojiResult[0].name}' (ID: ${emojiId}) deleted by user ${userId}. Reason: ${reason}`
  );

  revalidatePath('/admin');
  return true;
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
        console.error(`Failed to decrypt pending emoji ${emoji.name}:`, error);
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
      const tableName = emojiType === 'mac' ? 'mac_emojis' : 'windows_emojis';
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
    // Don't throw error for usage tracking failures
    console.error('Failed to track emoji usage:', error);
  }
}

/**
 * Server action to get emoji categories
 */
export async function getEmojiCategories(
  userOS: 'windows' | 'mac' = 'windows'
) {
  const tableName = userOS === 'mac' ? 'mac_emojis' : 'windows_emojis';

  const result = await sql<{ category: string; count: number }[]>`
    SELECT category, COUNT(*) as count
    FROM ${sql(tableName)}
    GROUP BY category
    ORDER BY category
  `;

  // Also get custom emoji categories
  const customResult = await sql<{ category: string; count: number }[]>`
    SELECT category, COUNT(*) as count
    FROM custom_emojis
    WHERE is_approved = true
    GROUP BY category
    ORDER BY category
  `;

  return {
    builtin: result,
    custom: customResult
  };
}
