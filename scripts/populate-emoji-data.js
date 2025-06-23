#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Populate Emoji Database Script
 * Populates the database with Windows and Mac emoji data
 */

// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

// Import comprehensive emoji data
const { getAllEmojis } = require('./emoji-data-comprehensive');
const { getAllNewEmojis } = require('./emoji-data-comprehensive-part2');

// Create database connection AFTER environment variables are loaded
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: 'prefer',
  onnotice: () => {}, // Ignore NOTICE statements - they're not errors
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

// Combine all emoji data
const windowsEmojis = [...getAllEmojis(), ...getAllNewEmojis()];

// Comprehensive emoji data for Mac (similar to Windows but with different version requirements)
const macEmojis = windowsEmojis.map((emoji) => ({
  ...emoji,
  macos_version_min: '10.15', // Catalina and above
  windows_version_min: undefined
}));

async function populateEmojiData() {
  try {
    console.log('Starting emoji data population...');

    // Get category IDs
    const categoryResult = await sql`
      SELECT id, name FROM emoji_categories
    `;
    const categoryMap = {};
    categoryResult.forEach((row) => {
      categoryMap[row.name] = row.id;
    });

    console.log('Found categories:', Object.keys(categoryMap));

    // Insert Windows emojis
    console.log('Inserting Windows emojis...');
    for (const emoji of windowsEmojis) {
      const categoryId = categoryMap[emoji.category];
      if (!categoryId) {
        console.warn(
          `Category '${emoji.category}' not found for emoji '${emoji.name}'`
        );
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_windows (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, windows_version_min
          ) VALUES (
            ${emoji.emoji_id}, ${emoji.unicode_codepoint}, ${emoji.unicode_char}, 
            ${emoji.name}, ${emoji.description}, ${categoryId}, ${emoji.tags}, 
            ${emoji.aliases}, ${emoji.keywords}, ${emoji.windows_version_min}
          )
          ON CONFLICT (emoji_id) DO UPDATE SET
            unicode_codepoint = EXCLUDED.unicode_codepoint,
            unicode_char = EXCLUDED.unicode_char,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            tags = EXCLUDED.tags,
            aliases = EXCLUDED.aliases,
            keywords = EXCLUDED.keywords,
            windows_version_min = EXCLUDED.windows_version_min,
            updated_at = CURRENT_TIMESTAMP
        `;

        console.log(`✓ Inserted Windows emoji: ${emoji.name}`);
      } catch (error) {
        console.error(
          `✗ Failed to insert Windows emoji '${emoji.name}':`,
          error.message
        );
      }
    }

    // Insert Mac emojis
    console.log('Inserting Mac emojis...');
    for (const emoji of macEmojis) {
      const categoryId = categoryMap[emoji.category];
      if (!categoryId) {
        console.warn(
          `Category '${emoji.category}' not found for emoji '${emoji.name}'`
        );
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_mac (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, macos_version_min
          ) VALUES (
            ${emoji.emoji_id}, ${emoji.unicode_codepoint}, ${emoji.unicode_char}, 
            ${emoji.name}, ${emoji.description}, ${categoryId}, ${emoji.tags}, 
            ${emoji.aliases}, ${emoji.keywords}, ${emoji.macos_version_min}
          )
          ON CONFLICT (emoji_id) DO UPDATE SET
            unicode_codepoint = EXCLUDED.unicode_codepoint,
            unicode_char = EXCLUDED.unicode_char,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            tags = EXCLUDED.tags,
            aliases = EXCLUDED.aliases,
            keywords = EXCLUDED.keywords,
            macos_version_min = EXCLUDED.macos_version_min,
            updated_at = CURRENT_TIMESTAMP
        `;

        console.log(`✓ Inserted Mac emoji: ${emoji.name}`);
      } catch (error) {
        console.error(
          `✗ Failed to insert Mac emoji '${emoji.name}':`,
          error.message
        );
      }
    }

    // Get counts
    const windowsCount = await sql`
      SELECT COUNT(*) as count FROM emojis_windows WHERE is_active = true
    `;
    const macCount = await sql`
      SELECT COUNT(*) as count FROM emojis_mac WHERE is_active = true
    `;

    console.log(`\n✅ Emoji data population completed!`);
    console.log(`📊 Windows emojis: ${windowsCount[0].count}`);
    console.log(`📊 Mac emojis: ${macCount[0].count}`);
    console.log(
      `📊 Total emojis: ${parseInt(windowsCount[0].count) + parseInt(macCount[0].count)}`
    );
  } catch (error) {
    console.error('❌ Error populating emoji data:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
if (require.main === module) {
  populateEmojiData()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateEmojiData };
