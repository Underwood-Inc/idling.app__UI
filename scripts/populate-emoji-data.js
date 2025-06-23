#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Populate Emoji Database Script
 * Populates the database with Windows and Mac emoji data
 */

// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const sql = require('../src/lib/db');

// Import comprehensive emoji data
const { getAllEmojis } = require('./emoji-data-comprehensive');
const { getAllNewEmojis } = require('./emoji-data-comprehensive-part2');
const { getAllAsciiEmojis } = require('./emoji-data-ascii');

// Combine all emoji data
const allEmojis = [...getAllEmojis(), ...getAllNewEmojis()];
const allAsciiEmojis = getAllAsciiEmojis();

console.log(`Total Unicode emojis: ${allEmojis.length}`);
console.log(`Total ASCII emojis: ${allAsciiEmojis.length}`);
console.log(
  `Total emojis to populate: ${allEmojis.length + allAsciiEmojis.length}`
);

// Comprehensive emoji data for Mac (similar to Windows but with different version requirements)
const macEmojis = allEmojis.map((emoji) => ({
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
    for (const emoji of allEmojis) {
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

    // Insert ASCII emojis for Windows
    console.log('Inserting ASCII emojis for Windows...');
    for (const ascii of allAsciiEmojis) {
      const categoryId = categoryMap[ascii.category];
      if (!categoryId) {
        console.warn(
          `Category '${ascii.category}' not found for ASCII emoji '${ascii.name}'`
        );
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_windows (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, windows_version_min
          ) VALUES (
            ${ascii.emoji_id}, ${ascii.unicode_codepoint}, ${ascii.unicode_char}, 
            ${ascii.name}, ${ascii.description}, ${categoryId}, ${ascii.tags}, 
            ${ascii.aliases}, ${ascii.keywords}, ${ascii.windows_version_min}
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

        console.log(`✓ Inserted Windows ASCII emoji: ${ascii.name}`);
      } catch (error) {
        console.error(
          `✗ Failed to insert Windows ASCII emoji '${ascii.name}':`,
          error.message
        );
      }
    }

    // Insert ASCII emojis for Mac
    console.log('Inserting ASCII emojis for Mac...');
    for (const ascii of allAsciiEmojis) {
      const categoryId = categoryMap[ascii.category];
      if (!categoryId) {
        console.warn(
          `Category '${ascii.category}' not found for ASCII emoji '${ascii.name}'`
        );
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_mac (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, macos_version_min
          ) VALUES (
            ${ascii.emoji_id}, ${ascii.unicode_codepoint}, ${ascii.unicode_char}, 
            ${ascii.name}, ${ascii.description}, ${categoryId}, ${ascii.tags}, 
            ${ascii.aliases}, ${ascii.keywords}, ${'1.0'}
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

        console.log(`✓ Inserted Mac ASCII emoji: ${ascii.name}`);
      } catch (error) {
        console.error(
          `✗ Failed to insert Mac ASCII emoji '${ascii.name}':`,
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

    // Show ASCII emoji counts
    const windowsAsciiCount = await sql`
      SELECT COUNT(*) as count FROM emojis_windows WHERE category_id = (SELECT id FROM emoji_categories WHERE name = 'ascii') AND is_active = true
    `;
    const macAsciiCount = await sql`
      SELECT COUNT(*) as count FROM emojis_mac WHERE category_id = (SELECT id FROM emoji_categories WHERE name = 'ascii') AND is_active = true
    `;

    console.log(`📊 Windows ASCII emojis: ${windowsAsciiCount[0].count}`);
    console.log(`📊 Mac ASCII emojis: ${macAsciiCount[0].count}`);
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
