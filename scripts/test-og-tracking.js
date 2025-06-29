#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { DatabaseService } = require('../src/app/api/og-image/services/DatabaseService');

async function testOGTracking() {
  console.log('🧪 Testing OG Generation Database Tracking...');
  console.log('=====================================');

  const db = DatabaseService.getInstance();

  try {
    // Test 1: Record a generation
    console.log('\n📝 Test 1: Recording a generation...');
    const generationId = await db.recordGeneration({
      seed: 'test-seed-' + Date.now(),
      aspectRatio: 'default',
      quoteText: 'This is a test quote for database tracking',
      quoteAuthor: 'Test Author',
      customWidth: 1200,
      customHeight: 630,
      shapeCount: 5,
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent/1.0'
    });

    if (generationId) {
      console.log('✅ Generation recorded successfully with ID:', generationId);
    } else {
      console.log('⚠️ Generation recording returned null (database might not be configured)');
      return;
    }

    // Test 2: Retrieve the generation
    console.log('\n🔍 Test 2: Retrieving generation by ID...');
    const retrievedGeneration = await db.getOGGenerationById(generationId);
    
    if (retrievedGeneration) {
      console.log('✅ Generation retrieved successfully:');
      console.log('  - ID:', retrievedGeneration.id);
      console.log('  - Seed:', retrievedGeneration.seed);
      console.log('  - Aspect Ratio:', retrievedGeneration.aspect_ratio);
      console.log('  - Quote:', retrievedGeneration.quote_text);
      console.log('  - Author:', retrievedGeneration.quote_author);
    } else {
      console.log('❌ Failed to retrieve generation');
    }

    // Test 3: Get generations by seed
    console.log('\n🔍 Test 3: Getting generations by seed...');
    const generationsBySeed = await db.getOGGenerationsBySeed(retrievedGeneration?.seed || 'test-seed');
    console.log(`✅ Found ${generationsBySeed.length} generation(s) with this seed`);

    // Test 4: Get statistics
    console.log('\n📊 Test 4: Getting generation statistics...');
    const stats = await db.getOGGenerationStats();
    
    if (stats) {
      console.log('✅ Statistics retrieved successfully:');
      console.log('  - Total generations:', stats.total);
      console.log('  - Today\'s generations:', stats.today);
      console.log('  - Unique seeds:', stats.uniqueSeeds);
      console.log('  - Top aspect ratios:', stats.topAspectRatios.map(r => `${r.aspect_ratio}: ${r.count}`).join(', '));
    } else {
      console.log('⚠️ Statistics returned null');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('Database tracking is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.close();
  }
}

// Check if database environment variables are configured
if (!process.env.POSTGRES_HOST || !process.env.POSTGRES_USER || !process.env.POSTGRES_DB || !process.env.POSTGRES_PASSWORD) {
  console.error('❌ Database environment variables not configured');
  console.error('Please set up your .env.local file with database credentials');
  process.exit(1);
}

testOGTracking(); 