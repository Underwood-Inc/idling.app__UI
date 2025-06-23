#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Populate Emoji Database Script
 * Populates the database with Windows and Mac system emoji data
 *
 * IMPORTANT: This script ONLY affects system emojis in emojis_windows and emojis_mac tables.
 * User-uploaded custom emojis in the custom_emojis table are COMPLETELY PROTECTED and
 * will never be deleted or modified by this script.
 *
 * Data Safety:
 * ✅ custom_emojis table - PROTECTED (user uploads preserved)
 * 🔄 emojis_windows table - REFRESHED (system data only)
 * 🔄 emojis_mac table - REFRESHED (system data only)
 */

// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

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

// Import comprehensive emoji data
const { getAllEmojis } = require('./emoji-data-comprehensive');
const { getAllNewEmojis } = require('./emoji-data-comprehensive-part2');
const { getAllAsciiEmojis } = require('./emoji-data-ascii');
const {
  getAllMissingCategoryEmojis
} = require('./emoji-data-missing-categories');

// Combine all emoji data
const allEmojis = [
  ...getAllEmojis(),
  ...getAllNewEmojis(),
  ...getAllMissingCategoryEmojis()
];
const allAsciiEmojis = getAllAsciiEmojis();

console.log(`Total Unicode emojis: ${allEmojis.length}`);
console.log(`Total ASCII emojis: ${allAsciiEmojis.length}`);
console.log(
  `Total emojis to populate: ${allEmojis.length + allAsciiEmojis.length}`
);
console.log(
  `  - Comprehensive emojis: ${getAllEmojis().length + getAllNewEmojis().length}`
);
console.log(
  `  - Missing category emojis: ${getAllMissingCategoryEmojis().length}`
);
console.log(`  - ASCII emojis: ${allAsciiEmojis.length}`);

// Validate ASCII emoji data
console.log('\n🔍 Validating ASCII emoji data...');
if (allAsciiEmojis.length > 0) {
  const sample = allAsciiEmojis[0];
  console.log('Sample ASCII emoji:', JSON.stringify(sample, null, 2));

  // Check for required fields
  const requiredFields = ['emoji_id', 'unicode_char', 'name', 'category'];
  const missingFields = requiredFields.filter((field) => !sample[field]);
  if (missingFields.length > 0) {
    console.warn('⚠️  Missing required fields in ASCII emojis:', missingFields);
  } else {
    console.log('✅ ASCII emoji structure looks good');
  }

  // Show ASCII emoji categories
  const asciiCategories = allAsciiEmojis.reduce((categories, emoji) => {
    if (!categories.includes(emoji.category)) {
      categories.push(emoji.category);
    }
    return categories;
  }, []);
  console.log('ASCII emoji categories found:', asciiCategories);
} else {
  console.error('❌ No ASCII emojis loaded!');
}

// Comprehensive emoji data for Mac (similar to Windows but with different version requirements)
const macEmojis = allEmojis.map((emoji) => ({
  ...emoji,
  macos_version_min: '10.15', // Catalina and above
  windows_version_min: undefined
}));

async function validateEmojiIds() {
  console.log('\n🔍 Checking for potential duplicate emoji IDs...');

  // Check for duplicates within Unicode emojis
  const unicodeIds = allEmojis.map((e) => e.emoji_id);
  const unicodeDuplicates = unicodeIds.filter(
    (id, index) => unicodeIds.indexOf(id) !== index
  );

  // Check for duplicates within ASCII emojis
  const asciiIds = allAsciiEmojis.map((e) => e.emoji_id);
  const asciiDuplicates = asciiIds.filter(
    (id, index) => asciiIds.indexOf(id) !== index
  );

  // Check for overlaps between Unicode and ASCII
  const overlaps = unicodeIds.filter((id) => asciiIds.includes(id));

  if (unicodeDuplicates.length > 0) {
    console.warn('⚠️  Duplicate Unicode emoji IDs found:', unicodeDuplicates);
  }

  if (asciiDuplicates.length > 0) {
    console.warn('⚠️  Duplicate ASCII emoji IDs found:', asciiDuplicates);
  }

  if (overlaps.length > 0) {
    console.warn('⚠️  Emoji ID overlaps between Unicode and ASCII:', overlaps);
  }

  if (
    unicodeDuplicates.length === 0 &&
    asciiDuplicates.length === 0 &&
    overlaps.length === 0
  ) {
    console.log('✅ No duplicate emoji IDs found');
  }
}

async function clearSystemEmojiData() {
  console.log(
    '🧹 Clearing SYSTEM emoji data (preserving user custom emojis)...'
  );

  try {
    // Get counts before deletion
    const beforeWindows =
      await sql`SELECT COUNT(*) as count FROM emojis_windows`;
    const beforeMac = await sql`SELECT COUNT(*) as count FROM emojis_mac`;

    // Check for custom emojis to reassure user they're safe
    const customCount =
      await sql`SELECT COUNT(*) as count FROM custom_emojis WHERE is_active = true`;

    console.log(
      `Found ${beforeWindows[0].count} existing Windows system emojis`
    );
    console.log(`Found ${beforeMac[0].count} existing Mac system emojis`);
    console.log(
      `Found ${customCount[0].count} user custom emojis (will be preserved)`
    );

    // Clear ONLY system emoji data from both tables
    // custom_emojis table is NOT touched - user data is preserved
    const windowsDeleted = await sql`DELETE FROM emojis_windows`;
    const macDeleted = await sql`DELETE FROM emojis_mac`;

    console.log(`✓ Cleared ${beforeWindows[0].count} Windows system emojis`);
    console.log(`✓ Cleared ${beforeMac[0].count} Mac system emojis`);
    console.log(
      `✅ Preserved ${customCount[0].count} user custom emojis in custom_emojis table`
    );
    console.log('✅ System emoji data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing system emoji data:', error);
    throw error;
  }
}

async function populateEmojiData() {
  try {
    console.log('🚀 Starting emoji data population...');
    console.log('====================================');

    // Step 1: Validate emoji data integrity
    await validateEmojiIds();

    // Step 2: Clear system emoji data (preserve user custom emojis)
    await clearSystemEmojiData();

    // Step 3: Get category IDs
    console.log('\n📂 Loading emoji categories...');
    const categoryResult = await sql`
      SELECT id, name FROM emoji_categories
    `;
    const categoryMap = {};
    categoryResult.forEach((row) => {
      categoryMap[row.name] = row.id;
    });

    console.log('Found categories:', Object.keys(categoryMap));

    // Step 4: Validate emoji data before insertion
    console.log('\n📊 Validating emoji data...');
    console.log(`Unicode emojis loaded: ${allEmojis.length}`);
    console.log(`ASCII emojis loaded: ${allAsciiEmojis.length}`);
    console.log(
      `Total emojis to insert: ${allEmojis.length + allAsciiEmojis.length}`
    );

    if (allEmojis.length === 0) {
      throw new Error('No Unicode emojis loaded! Check emoji data files.');
    }

    if (allAsciiEmojis.length === 0) {
      throw new Error('No ASCII emojis loaded! Check ASCII emoji data file.');
    }

    // Step 5: Insert Windows emojis
    console.log('\n🪟 Inserting Windows emojis...');
    let windowsSuccessCount = 0;
    let windowsErrorCount = 0;

    for (const [index, emoji] of allEmojis.entries()) {
      const categoryId = categoryMap[emoji.category];
      if (!categoryId) {
        console.warn(
          `Category '${emoji.category}' not found for emoji '${emoji.name}'`
        );
        windowsErrorCount++;
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_windows (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, windows_version_min, is_active
          ) VALUES (
            ${emoji.emoji_id}, ${emoji.unicode_codepoint}, ${emoji.unicode_char}, 
            ${emoji.name}, ${emoji.description}, ${categoryId}, ${emoji.tags}, 
            ${emoji.aliases}, ${emoji.keywords}, ${emoji.windows_version_min}, true
          )
        `;

        windowsSuccessCount++;
        if (index % 10 === 0 || index === allEmojis.length - 1) {
          console.log(
            `  Progress: ${index + 1}/${allEmojis.length} (${Math.round(((index + 1) / allEmojis.length) * 100)}%)`
          );
        }
      } catch (error) {
        windowsErrorCount++;
        console.error(
          `✗ Failed to insert Windows emoji '${emoji.name}' (${emoji.emoji_id}):`,
          error.message
        );
      }
    }

    console.log(
      `✅ Windows emojis inserted: ${windowsSuccessCount} success, ${windowsErrorCount} errors`
    );

    // Step 6: Insert Mac emojis
    console.log('\n🍎 Inserting Mac emojis...');
    let macSuccessCount = 0;
    let macErrorCount = 0;

    for (const [index, emoji] of macEmojis.entries()) {
      const categoryId = categoryMap[emoji.category];
      if (!categoryId) {
        console.warn(
          `Category '${emoji.category}' not found for emoji '${emoji.name}'`
        );
        macErrorCount++;
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_mac (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, macos_version_min, is_active
          ) VALUES (
            ${emoji.emoji_id}, ${emoji.unicode_codepoint}, ${emoji.unicode_char}, 
            ${emoji.name}, ${emoji.description}, ${categoryId}, ${emoji.tags}, 
            ${emoji.aliases}, ${emoji.keywords}, ${emoji.macos_version_min}, true
          )
        `;

        macSuccessCount++;
        if (index % 10 === 0 || index === macEmojis.length - 1) {
          console.log(
            `  Progress: ${index + 1}/${macEmojis.length} (${Math.round(((index + 1) / macEmojis.length) * 100)}%)`
          );
        }
      } catch (error) {
        macErrorCount++;
        console.error(
          `✗ Failed to insert Mac emoji '${emoji.name}' (${emoji.emoji_id}):`,
          error.message
        );
      }
    }

    console.log(
      `✅ Mac emojis inserted: ${macSuccessCount} success, ${macErrorCount} errors`
    );

    // Step 7: Insert ASCII emojis for Windows
    console.log('\n🔤 Inserting ASCII emojis for Windows...');
    let windowsAsciiSuccessCount = 0;
    let windowsAsciiErrorCount = 0;

    for (const [index, ascii] of allAsciiEmojis.entries()) {
      const categoryId = categoryMap[ascii.category];
      if (!categoryId) {
        console.warn(
          `Category '${ascii.category}' not found for ASCII emoji '${ascii.name}'`
        );
        windowsAsciiErrorCount++;
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_windows (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, windows_version_min, is_active
          ) VALUES (
            ${ascii.emoji_id}, ${ascii.unicode_codepoint}, ${ascii.unicode_char}, 
            ${ascii.name}, ${ascii.description}, ${categoryId}, ${ascii.tags}, 
            ${ascii.aliases}, ${ascii.keywords}, ${ascii.windows_version_min}, true
          )
        `;

        windowsAsciiSuccessCount++;
        if (index % 10 === 0 || index === allAsciiEmojis.length - 1) {
          console.log(
            `  Progress: ${index + 1}/${allAsciiEmojis.length} (${Math.round(((index + 1) / allAsciiEmojis.length) * 100)}%) - ${ascii.name}`
          );
        }
      } catch (error) {
        windowsAsciiErrorCount++;
        console.error(
          `✗ Failed to insert Windows ASCII emoji '${ascii.name}' (${ascii.emoji_id}):`,
          error.message
        );
      }
    }

    console.log(
      `✅ Windows ASCII emojis inserted: ${windowsAsciiSuccessCount} success, ${windowsAsciiErrorCount} errors`
    );

    // Step 8: Insert ASCII emojis for Mac
    console.log('\n🔤 Inserting ASCII emojis for Mac...');
    let macAsciiSuccessCount = 0;
    let macAsciiErrorCount = 0;

    for (const [index, ascii] of allAsciiEmojis.entries()) {
      const categoryId = categoryMap[ascii.category];
      if (!categoryId) {
        console.warn(
          `Category '${ascii.category}' not found for ASCII emoji '${ascii.name}'`
        );
        macAsciiErrorCount++;
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_mac (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, macos_version_min, is_active
          ) VALUES (
            ${ascii.emoji_id}, ${ascii.unicode_codepoint}, ${ascii.unicode_char}, 
            ${ascii.name}, ${ascii.description}, ${categoryId}, ${ascii.tags}, 
            ${ascii.aliases}, ${ascii.keywords}, ${'1.0'}, true
          )
        `;

        macAsciiSuccessCount++;
        if (index % 10 === 0 || index === allAsciiEmojis.length - 1) {
          console.log(
            `  Progress: ${index + 1}/${allAsciiEmojis.length} (${Math.round(((index + 1) / allAsciiEmojis.length) * 100)}%) - ${ascii.name}`
          );
        }
      } catch (error) {
        macAsciiErrorCount++;
        console.error(
          `✗ Failed to insert Mac ASCII emoji '${ascii.name}' (${ascii.emoji_id}):`,
          error.message
        );
      }
    }

    console.log(
      `✅ Mac ASCII emojis inserted: ${macAsciiSuccessCount} success, ${macAsciiErrorCount} errors`
    );

    // Step 9: Final verification and summary
    console.log('\n🎯 Final verification and summary...');
    console.log('=====================================');

    // Get detailed counts for system emojis
    const windowsCount = await sql`
      SELECT COUNT(*) as count FROM emojis_windows WHERE is_active = true
    `;
    const macCount = await sql`
      SELECT COUNT(*) as count FROM emojis_mac WHERE is_active = true
    `;

    // Get custom emoji counts (preserved from deletion)
    const customEmojiCount = await sql`
      SELECT COUNT(*) as count FROM custom_emojis WHERE is_active = true
    `;
    const approvedCustomCount = await sql`
      SELECT COUNT(*) as count FROM custom_emojis WHERE is_active = true AND is_approved = true
    `;

    // Get ASCII emoji counts specifically
    const windowsAsciiCount = await sql`
      SELECT COUNT(*) as count FROM emojis_windows 
      WHERE category_id = (SELECT id FROM emoji_categories WHERE name = 'ascii') 
      AND is_active = true
    `;
    const macAsciiCount = await sql`
      SELECT COUNT(*) as count FROM emojis_mac 
      WHERE category_id = (SELECT id FROM emoji_categories WHERE name = 'ascii') 
      AND is_active = true
    `;

    // Get category breakdown including custom emojis
    const categoryBreakdown = await sql`
      SELECT 
        ec.name as category,
        COALESCE(windows_counts.count, 0) as windows_count,
        COALESCE(mac_counts.count, 0) as mac_count,
        COALESCE(custom_counts.count, 0) as custom_count
      FROM emoji_categories ec
      LEFT JOIN (
        SELECT category_id, COUNT(*) as count 
        FROM emojis_windows 
        WHERE is_active = true 
        GROUP BY category_id
      ) windows_counts ON ec.id = windows_counts.category_id
      LEFT JOIN (
        SELECT category_id, COUNT(*) as count 
        FROM emojis_mac 
        WHERE is_active = true 
        GROUP BY category_id
      ) mac_counts ON ec.id = mac_counts.category_id
      LEFT JOIN (
        SELECT category_id, COUNT(*) as count 
        FROM custom_emojis 
        WHERE is_active = true 
        GROUP BY category_id
      ) custom_counts ON ec.id = custom_counts.category_id
      ORDER BY ec.name
    `;

    console.log(`\n✅ EMOJI DATA POPULATION COMPLETED!`);
    console.log(`==========================================`);
    console.log(`📊 System Emoji Results:`);
    console.log(`   🪟 Windows emojis: ${windowsCount[0].count}`);
    console.log(`   🍎 Mac emojis: ${macCount[0].count}`);
    console.log(
      `   📱 Total system emojis: ${parseInt(windowsCount[0].count) + parseInt(macCount[0].count)}`
    );

    console.log(`\n🔤 ASCII Emoji Results:`);
    console.log(`   🪟 Windows ASCII emojis: ${windowsAsciiCount[0].count}`);
    console.log(`   🍎 Mac ASCII emojis: ${macAsciiCount[0].count}`);

    console.log(`\n👤 Custom User Emojis (Preserved):`);
    console.log(`   📁 Total custom emojis: ${customEmojiCount[0].count}`);
    console.log(
      `   ✅ Approved custom emojis: ${approvedCustomCount[0].count}`
    );
    console.log(
      `   ⏳ Pending approval: ${parseInt(customEmojiCount[0].count) - parseInt(approvedCustomCount[0].count)}`
    );

    console.log(`\n📂 Category Breakdown:`);
    categoryBreakdown.forEach((cat) => {
      console.log(
        `   ${cat.category}: Windows(${cat.windows_count}) | Mac(${cat.mac_count}) | Custom(${cat.custom_count})`
      );
    });

    // Verify expected counts
    console.log(`\n🔍 Data Validation:`);
    console.log(`   Expected Unicode emojis: ${allEmojis.length}`);
    console.log(`   Expected ASCII emojis: ${allAsciiEmojis.length}`);
    console.log(`   Actual Windows ASCII: ${windowsAsciiCount[0].count}`);
    console.log(`   Actual Mac ASCII: ${macAsciiCount[0].count}`);

    const expectedSystemTotal =
      allEmojis.length * 2 + allAsciiEmojis.length * 2; // Unicode for both platforms + ASCII for both platforms
    const actualSystemTotal =
      parseInt(windowsCount[0].count) + parseInt(macCount[0].count);
    const totalAllEmojis =
      actualSystemTotal + parseInt(customEmojiCount[0].count);

    console.log(`   Expected system emojis: ${expectedSystemTotal}`);
    console.log(`   Actual system emojis: ${actualSystemTotal}`);
    console.log(`   Total emojis (including custom): ${totalAllEmojis}`);

    if (actualSystemTotal === expectedSystemTotal) {
      console.log(`   ✅ All system emojis inserted successfully!`);
    } else {
      console.log(
        `   ⚠️  System emoji count mismatch! Check for errors above.`
      );
    }

    console.log(`\n🔒 Data Protection Summary:`);
    console.log(
      `   ✅ User custom emojis preserved: ${customEmojiCount[0].count}`
    );
    console.log(`   🔄 System emojis refreshed: ${actualSystemTotal}`);
    console.log(`   🛡️  No user data was lost during system emoji refresh`);

    if (parseInt(customEmojiCount[0].count) > 0) {
      console.log(
        `\n💡 Note: Custom emojis are stored in the 'custom_emojis' table`
      );
      console.log(
        `   and are completely protected from system emoji refreshes.`
      );
    }
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
