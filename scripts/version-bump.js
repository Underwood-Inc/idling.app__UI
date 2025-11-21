#!/usr/bin/env node

/* eslint-disable no-console */
/* global Promise */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Initialize chalk with ESM/CommonJS compatibility
let chalk;

function initializeChalk() {
  try {
    // Try CommonJS first (chalk v4)
    chalk = require('chalk');

    // Verify chalk is actually working
    if (!chalk || typeof chalk.red !== 'function') {
      throw new Error('Chalk loaded but red function not available');
    }
  } catch (chalkError) {
    // Fallback to no-color functions for chalk v5+ ESM compatibility
    const noColorFn = (str) => str;

    // Create simple method chaining support without recursion
    const createChainableMethod = () => {
      const fn = (str) => str;
      fn.bold = noColorFn;
      fn.green = noColorFn;
      fn.yellow = noColorFn;
      fn.cyan = noColorFn;
      fn.red = noColorFn;
      fn.blue = noColorFn;
      fn.magenta = noColorFn;
      fn.gray = noColorFn;
      fn.white = noColorFn;
      fn.dim = noColorFn;
      return fn;
    };

    chalk = {
      red: createChainableMethod(),
      green: createChainableMethod(),
      yellow: createChainableMethod(),
      blue: createChainableMethod(),
      cyan: createChainableMethod(),
      magenta: createChainableMethod(),
      white: createChainableMethod(),
      gray: createChainableMethod(),
      dim: createChainableMethod(),
      bold: createChainableMethod()
    };
  }
}

// Initialize chalk before using it
initializeChalk();

/**
 * Auto-increment package.json version based on commit message type
 * - chore, refactor, docs, style, test, ci, build: patch version increment (0.52.1 -> 0.52.2)
 * - feat, fix, perf, revert: minor version increment (0.52.1 -> 0.53.0)
 * - BREAKING CHANGE or major: never increment major version (as per requirements)
 *
 * Usage:
 *   node scripts/version-bump.js           # Normal mode - updates package.json (with confirmation)
 *   node scripts/version-bump.js --test    # Test mode - simulates without updating
 *   node scripts/version-bump.js --dry-run # Same as test mode
 *   node scripts/version-bump.js --force   # Skip confirmation prompt in normal mode
 */

// Check for test mode and force mode
const isTestMode =
  process.argv.includes('--test') || process.argv.includes('--dry-run');
const isForceMode = process.argv.includes('--force');

// Create readline interface for confirmation prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function getCurrentCommitMessage() {
  try {
    // Get the commit message from git
    const commitMsg = execSync('git log -1 --pretty=%B', {
      encoding: 'utf8'
    }).trim();
    return commitMsg;
  } catch (error) {
    console.log(
      chalk.yellow('Could not get commit message, skipping version bump')
    );
    return null;
  }
}

function parseCommitType(commitMessage) {
  if (!commitMessage) return null;

  // Match conventional commit format: type(scope): description
  const conventionalCommitRegex = /^(\w+)(\(.+\))?:\s*.+/;
  const match = commitMessage.match(conventionalCommitRegex);

  if (match) {
    return match[1].toLowerCase();
  }

  // Fallback: check if message starts with common types
  const firstWord = commitMessage.split(/[\s:]/)[0].toLowerCase();
  const knownTypes = [
    'feat',
    'fix',
    'chore',
    'refactor',
    'docs',
    'style',
    'test',
    'perf',
    'ci',
    'build',
    'revert'
  ];

  if (knownTypes.includes(firstWord)) {
    return firstWord;
  }

  return null;
}

function getVersionBumpType(commitType) {
  if (!commitType) return null;

  // Minor version bump types (feat, fix, perf, revert)
  const minorTypes = ['feat', 'fix', 'perf', 'revert'];

  // Patch version bump types (chore, refactor, docs, style, test, ci, build)
  const patchTypes = [
    'chore',
    'refactor',
    'docs',
    'style',
    'test',
    'ci',
    'build'
  ];

  if (minorTypes.includes(commitType)) {
    return 'minor';
  } else if (patchTypes.includes(commitType)) {
    return 'patch';
  }

  return null;
}

function incrementVersion(currentVersion, bumpType) {
  const versionParts = currentVersion.split('.').map(Number);
  const [major, minor, patch] = versionParts;

  switch (bumpType) {
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return currentVersion;
  }
}

function updatePackageVersion(newVersion, testMode = false) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const oldVersion = packageJson.version;

    if (testMode) {
      console.log(
        chalk.magenta.bold('🧪 [TEST MODE] ') +
          chalk.white('Would bump version: ') +
          chalk.cyan(oldVersion) +
          chalk.white(' → ') +
          chalk.green(newVersion)
      );
      console.log(
        chalk.magenta('📝 [TEST MODE] ') +
          chalk.gray('package.json would be updated but was not modified')
      );
      console.log(
        chalk.magenta('🔄 [TEST MODE] ') +
          chalk.gray('git add package.json would be executed but was skipped')
      );
      return true;
    }

    packageJson.version = newVersion;

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n'
    );

    console.log(
      chalk.green('📦 Version bumped: ') +
        chalk.cyan(oldVersion) +
        chalk.white(' → ') +
        chalk.green.bold(newVersion)
    );

    // Note: package.json staging is handled by the post-commit hook
    // to ensure the version change is included in the current commit via amend

    return true;
  } catch (error) {
    console.error(
      chalk.red('Error ') +
        (testMode ? 'simulating' : 'updating') +
        chalk.white(' package.json:'),
      error.message
    );
    return false;
  }
}

async function confirmVersionBump(
  currentVersion,
  newVersion,
  bumpType,
  commitMessage
) {
  console.groupCollapsed(chalk.yellow.bold('⚠️  CONFIRMATION REQUIRED'));
  console.log(chalk.white('You are about to modify package.json in LIVE mode'));
  console.groupEnd();
  console.log('');

  // Show what will change
  console.log(chalk.white('Version Change:'));
  console.log(
    chalk.white('  Current: ') +
      chalk.cyan(currentVersion) +
      chalk.white(' → New: ') +
      chalk.green(newVersion) +
      chalk.white(' (') +
      chalk.yellow(bumpType) +
      chalk.white(' bump)')
  );
  console.log(
    chalk.white('  Commit: ') + chalk.gray(commitMessage.split('\n')[0])
  );

  const answer = await prompt(
    chalk.yellow('Do you want to proceed with this version bump? (yes/no): ')
  );

  return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}

async function main() {
  try {
    if (isTestMode) {
      console.groupCollapsed(chalk.magenta.bold('🧪 TEST MODE'));
      console.log(chalk.gray('No files will be modified during this run'));
      console.groupEnd();
      console.log('');
    }

    const packageJsonPath = path.join(process.cwd(), 'package.json');

    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
      console.log(chalk.red('package.json not found, skipping version bump'));
      return;
    }

    // Get current version
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;

    if (!currentVersion) {
      console.log(
        chalk.red('No version found in package.json, skipping version bump')
      );
      return;
    }

    // Get commit message
    const commitMessage = getCurrentCommitMessage();
    if (!commitMessage) {
      return;
    }

    // Skip version bump commits to prevent infinite loops
    if (
      commitMessage.includes('chore: bump version to') ||
      commitMessage.includes('Automatic version increment')
    ) {
      console.log(
        chalk.gray('📝 Skipping version bump for version bump commit')
      );
      return;
    }

    console.groupCollapsed(chalk.blue('🔍 COMMIT ANALYSIS'));
    console.log(
      chalk.blue('Message: ') + chalk.white(`"${commitMessage.split('\n')[0]}"`)
    );

    // Parse commit type
    const commitType = parseCommitType(commitMessage);
    if (!commitType) {
      console.log(
        chalk.yellow(
          '📝 No conventional commit type detected, skipping version bump'
        )
      );
      console.groupEnd();
      return;
    }

    // Determine color for commit type based on bump type
    const bumpType = getVersionBumpType(commitType);
    const typeColor =
      bumpType === 'minor'
        ? chalk.green
        : bumpType === 'patch'
          ? chalk.yellow
          : chalk.gray;

    console.log(chalk.blue('Type: ') + typeColor.bold(commitType));

    // Determine bump type
    if (!bumpType) {
      console.log(
        chalk.gray(
          `⏭️  Commit type '${commitType}' does not require version bump`
        )
      );
      console.groupEnd();
      return;
    }

    const bumpColor = bumpType === 'minor' ? chalk.green : chalk.yellow;
    console.log(chalk.blue('Bump: ') + bumpColor.bold(bumpType));
    console.groupEnd();

    // Calculate new version
    const newVersion = incrementVersion(currentVersion, bumpType);

    if (newVersion === currentVersion) {
      console.log(chalk.gray('No version change needed'));
      return;
    }

    // Show version change
    console.groupCollapsed(chalk.blue('📦 VERSION UPDATE'));
    console.log(
      chalk.white('  ') +
        chalk.cyan(currentVersion) +
        chalk.white(' → ') +
        chalk.green.bold(newVersion) +
        chalk.white(' (') +
        (bumpType === 'minor'
          ? chalk.green(bumpType)
          : chalk.yellow(bumpType)) +
        chalk.white(' bump, ') +
        (isTestMode ? chalk.magenta('TEST') : chalk.blue('LIVE')) +
        chalk.white(' mode)')
    );
    console.groupEnd();

    // Confirmation prompt for live mode (unless --force flag is used)
    if (!isTestMode && !isForceMode) {
      const confirmed = await confirmVersionBump(
        currentVersion,
        newVersion,
        bumpType,
        commitMessage
      );
      if (!confirmed) {
        console.log(chalk.yellow('❌ Version bump cancelled by user'));
        return;
      }
    }

    // Update package.json (or simulate in test mode)
    const success = updatePackageVersion(newVersion, isTestMode);

    if (success) {
      const successMessage = isTestMode ? 'simulation' : '';
      console.log(
        chalk.green.bold(
          `✅ Version bump ${successMessage} completed successfully`
        )
      );
    } else {
      const failMessage = isTestMode ? 'simulation' : '';
      console.log(chalk.red.bold(`❌ Version bump ${failMessage} failed`));
      process.exit(1);
    }
  } finally {
    rl.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  parseCommitType,
  getVersionBumpType,
  incrementVersion,
  updatePackageVersion
};
