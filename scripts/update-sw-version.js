#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

// Read package.json version
const packageJson = require('../package.json');
const version = packageJson.version;

// Path to service worker
const swPath = path.join(__dirname, '../public/sw.js');

// Command line arguments
const args = process.argv.slice(2);
const isRestore = args.includes('--restore');

if (isRestore) {
  console.log('Restoring service worker version placeholder...');

  try {
    // Read the service worker file
    let swContent = fs.readFileSync(swPath, 'utf8');

    // Replace the actual version with the placeholder (for development)
    swContent = swContent.replace(
      new RegExp(`const CACHE_VERSION = '[^']*';`),
      `const CACHE_VERSION = '__VERSION__';`
    );

    // Write the updated content back
    fs.writeFileSync(swPath, swContent, 'utf8');

    console.log('✅ Service worker version placeholder restored');
  } catch (error) {
    console.error(
      '❌ Failed to restore service worker version placeholder:',
      error
    );
    process.exit(1);
  }
} else {
  console.log(`Updating service worker cache version to: ${version}`);

  try {
    // Read the service worker file
    let swContent = fs.readFileSync(swPath, 'utf8');

    // Replace the version placeholder with the actual version
    // This handles both __VERSION__ placeholder and existing version numbers
    swContent = swContent.replace(
      /const CACHE_VERSION = '[^']*';/,
      `const CACHE_VERSION = '${version}';`
    );

    // Write the updated content back
    fs.writeFileSync(swPath, swContent, 'utf8');

    console.log(`✅ Service worker cache version updated to: ${version}`);
  } catch (error) {
    console.error('❌ Failed to update service worker version:', error);
    process.exit(1);
  }
}
