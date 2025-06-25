#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

async function main() {
  // Dynamic import for chalk (ES module)
  const { default: chalk } = await import('chalk');

  // Read package.json version
  const packageJson = require('../package.json');
  const version = packageJson.version;

  // Paths
  const swPath = path.join(__dirname, '../public/sw.js');
  const layoutPath = path.join(__dirname, '../src/app/layout.tsx');

  // Command line arguments
  const args = process.argv.slice(2);
  const isRestore = args.includes('--restore');

  console.groupCollapsed(chalk.blue.bold('🔧 SERVICE WORKER VERSION MANAGER'));
  console.log(chalk.gray(`Current package.json version: ${version}`));
  console.log(chalk.gray(`Service worker path: ${swPath}`));
  console.log(chalk.gray(`Layout path: ${layoutPath}`));
  console.groupEnd();
  console.log('');

  /**
   * Update service worker version
   */
  function updateServiceWorkerVersion(targetVersion, isRestore) {
    try {
      // Read the service worker file
      let swContent = fs.readFileSync(swPath, 'utf8');

      // Find current version in file
      const versionMatch = swContent.match(/const CACHE_VERSION = '([^']*)';/);
      const currentVersion = versionMatch ? versionMatch[1] : 'unknown';

      if (isRestore) {
        // Replace the actual version with the placeholder (for development)
        swContent = swContent.replace(
          new RegExp(`const CACHE_VERSION = '[^']*';`),
          `const CACHE_VERSION = '__VERSION__';`
        );
      } else {
        // Replace the version placeholder with the actual version
        swContent = swContent.replace(
          /const CACHE_VERSION = '[^']*';/,
          `const CACHE_VERSION = '${targetVersion}';`
        );
      }

      // Write the updated content back
      fs.writeFileSync(swPath, swContent, 'utf8');

      return {
        success: true,
        previousValue: currentVersion,
        newValue: isRestore ? '__VERSION__' : targetVersion
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update layout meta tag version
   */
  function updateLayoutVersion(targetVersion, isRestore) {
    try {
      // Read the layout file
      let layoutContent = fs.readFileSync(layoutPath, 'utf8');

      // Find current version in meta tag
      const versionMatch = layoutContent.match(
        /<meta name="app-version" content="([^"]*)" \/>/
      );
      const currentVersion = versionMatch ? versionMatch[1] : 'unknown';

      if (isRestore) {
        // Replace with placeholder for development
        layoutContent = layoutContent.replace(
          /<meta name="app-version" content="[^"]*" \/>/,
          `<meta name="app-version" content="__VERSION__" />`
        );
      } else {
        // Replace with actual version
        layoutContent = layoutContent.replace(
          /<meta name="app-version" content="[^"]*" \/>/,
          `<meta name="app-version" content="${targetVersion}" />`
        );
      }

      // Write the updated content back
      fs.writeFileSync(layoutPath, layoutContent, 'utf8');

      return {
        success: true,
        previousValue: currentVersion,
        newValue: isRestore ? '__VERSION__' : targetVersion
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  if (isRestore) {
    console.groupCollapsed(chalk.yellow.bold('🔄 RESTORE MODE'));
    console.log('Restoring version placeholders...');

    const swResult = updateServiceWorkerVersion(version, true);
    const layoutResult = updateLayoutVersion(version, true);

    const changeTable = [
      {
        File: 'Service Worker',
        'Previous Value': swResult.previousValue,
        'New Value': swResult.newValue,
        Status: swResult.success ? '✅ Success' : `❌ Failed: ${swResult.error}`
      },
      {
        File: 'Layout Meta Tag',
        'Previous Value': layoutResult.previousValue,
        'New Value': layoutResult.newValue,
        Status: layoutResult.success
          ? '✅ Success'
          : `❌ Failed: ${layoutResult.error}`
      }
    ];

    console.table(changeTable);
    console.groupEnd();

    if (swResult.success && layoutResult.success) {
      console.log(
        chalk.green.bold('✅ Version placeholders restored successfully')
      );
    } else {
      console.error(chalk.red.bold('❌ Some operations failed'));
      process.exit(1);
    }
  } else {
    console.groupCollapsed(chalk.green.bold('📦 UPDATE MODE'));
    console.log(`Updating versions to: ${version}`);

    const swResult = updateServiceWorkerVersion(version, false);
    const layoutResult = updateLayoutVersion(version, false);

    const changeTable = [
      {
        File: 'Service Worker',
        'Previous Value': swResult.previousValue,
        'New Value': swResult.newValue,
        Status: swResult.success ? '✅ Success' : `❌ Failed: ${swResult.error}`
      },
      {
        File: 'Layout Meta Tag',
        'Previous Value': layoutResult.previousValue,
        'New Value': layoutResult.newValue,
        Status: layoutResult.success
          ? '✅ Success'
          : `❌ Failed: ${layoutResult.error}`
      }
    ];

    console.table(changeTable);
    console.groupEnd();

    if (swResult.success && layoutResult.success) {
      console.log(chalk.green.bold(`✅ All versions updated to: ${version}`));
      console.log('');
      console.log(chalk.cyan.bold('🚀 HARD RESET INFORMATION'));
      console.log(chalk.cyan(`When this version (${version}) is deployed:`));
      console.log(
        chalk.cyan('• All users will experience a complete hard reset')
      );
      console.log(
        chalk.cyan('• Service workers will be unregistered and re-registered')
      );
      console.log(
        chalk.cyan('• All caches, localStorage, sessionStorage will be cleared')
      );
      console.log(chalk.cyan('• Cookies and IndexedDB will be cleared'));
      console.log(
        chalk.cyan(
          '• Users will experience the app as if visiting for the first time'
        )
      );
      console.log('');
    } else {
      console.error(chalk.red.bold('❌ Some operations failed'));
      process.exit(1);
    }
  }
}

// Run the main function
main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
