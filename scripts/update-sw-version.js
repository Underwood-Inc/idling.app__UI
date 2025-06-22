#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Read package.json version
const packageJson = require('../package.json');
const version = packageJson.version;

// Path to service worker
const swPath = path.join(__dirname, '../public/sw.js');

// Command line arguments
const args = process.argv.slice(2);
const isRestore = args.includes('--restore');

console.group(chalk.blue.bold('🔧 SERVICE WORKER VERSION MANAGER'));
console.log(chalk.gray(`Current package.json version: ${version}`));
console.log(chalk.gray(`Service worker path: ${swPath}`));
console.groupEnd();
console.log('');

if (isRestore) {
  console.group(chalk.yellow.bold('🔄 RESTORE MODE'));
  console.log('Restoring service worker version placeholder...');

  try {
    // Read the service worker file
    let swContent = fs.readFileSync(swPath, 'utf8');

    // Find current version in file
    const versionMatch = swContent.match(/const CACHE_VERSION = '([^']*)';/);
    const currentVersion = versionMatch ? versionMatch[1] : 'unknown';

    // Replace the actual version with the placeholder (for development)
    swContent = swContent.replace(
      new RegExp(`const CACHE_VERSION = '[^']*';`),
      `const CACHE_VERSION = '__VERSION__';`
    );

    // Write the updated content back
    fs.writeFileSync(swPath, swContent, 'utf8');

    const changeTable = [
      {
        'Previous Value': currentVersion,
        'New Value': '__VERSION__',
        Action: 'Restored placeholder',
        Status: '✅ Success'
      }
    ];

    console.table(changeTable);
    console.groupEnd();
    console.log(
      chalk.green.bold('✅ Service worker version placeholder restored')
    );
  } catch (error) {
    console.groupEnd();
    console.error(
      chalk.red.bold(
        '❌ Failed to restore service worker version placeholder:'
      ),
      error
    );
    process.exit(1);
  }
} else {
  console.group(chalk.green.bold('📦 UPDATE MODE'));
  console.log(`Updating service worker cache version to: ${version}`);

  try {
    // Read the service worker file
    let swContent = fs.readFileSync(swPath, 'utf8');

    // Find current version in file
    const versionMatch = swContent.match(/const CACHE_VERSION = '([^']*)';/);
    const currentVersion = versionMatch ? versionMatch[1] : 'unknown';

    // Replace the version placeholder with the actual version
    // This handles both __VERSION__ placeholder and existing version numbers
    swContent = swContent.replace(
      /const CACHE_VERSION = '[^']*';/,
      `const CACHE_VERSION = '${version}';`
    );

    // Write the updated content back
    fs.writeFileSync(swPath, swContent, 'utf8');

    const changeTable = [
      {
        'Previous Value': currentVersion,
        'New Value': version,
        Action: 'Version updated',
        Status: '✅ Success'
      }
    ];

    console.table(changeTable);
    console.groupEnd();
    console.log(
      chalk.green.bold(`✅ Service worker cache version updated to: ${version}`)
    );
  } catch (error) {
    console.groupEnd();
    console.error(
      chalk.red.bold('❌ Failed to update service worker version:'),
      error
    );
    process.exit(1);
  }
}
