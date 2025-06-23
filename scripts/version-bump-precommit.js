#!/usr/bin/env node

/* eslint-disable no-console */
/* global Promise */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Pre-commit version bump script
 * Analyzes staged changes to determine if a version bump is needed
 * and includes the package.json changes in the current commit
 */

function getCurrentCommitMessage() {
  try {
    // Try to get commit message from COMMIT_EDITMSG if it exists
    const commitMsgPath = '.git/COMMIT_EDITMSG';
    if (fs.existsSync(commitMsgPath)) {
      const commitMsg = fs.readFileSync(commitMsgPath, 'utf8').trim();
      if (commitMsg && !commitMsg.startsWith('#')) {
        return commitMsg;
      }
    }

    // Fallback: check if there's a commit message in environment
    if (process.env.GIT_COMMIT_MESSAGE) {
      return process.env.GIT_COMMIT_MESSAGE;
    }

    // If no commit message available yet, we can't determine version bump
    return null;
  } catch (error) {
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

function updatePackageVersionAndStage(newVersion) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const oldVersion = packageJson.version;

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

    // Stage the updated package.json for the current commit
    execSync('git add package.json', { stdio: 'ignore' });

    console.log(chalk.blue('📝 Staged package.json for current commit'));

    return true;
  } catch (error) {
    console.error(chalk.red('Error updating package.json:'), error.message);
    return false;
  }
}

function main() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
      // No package.json, exit silently
      return;
    }

    // Get current version
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;

    if (!currentVersion) {
      // No version in package.json, exit silently
      return;
    }

    // Try to get commit message (may not be available in pre-commit)
    const commitMessage = getCurrentCommitMessage();
    if (!commitMessage) {
      // No commit message available in pre-commit, skip version bump
      // This is normal for pre-commit hook
      return;
    }

    console.group(chalk.blue('🔍 PRE-COMMIT VERSION ANALYSIS'));
    console.log(
      chalk.blue('Message: ') + chalk.white(`"${commitMessage.split('\n')[0]}"`)
    );

    // Parse commit type
    const commitType = parseCommitType(commitMessage);
    if (!commitType) {
      console.log(
        chalk.gray(
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
    console.group(chalk.blue('📦 VERSION UPDATE'));
    console.log(
      chalk.white('  ') +
        chalk.cyan(currentVersion) +
        chalk.white(' → ') +
        chalk.green.bold(newVersion) +
        chalk.white(' (') +
        (bumpType === 'minor'
          ? chalk.green(bumpType)
          : chalk.yellow(bumpType)) +
        chalk.white(' bump, PRE-COMMIT)')
    );
    console.groupEnd();

    // Update package.json and stage it
    const success = updatePackageVersionAndStage(newVersion);

    if (success) {
      console.log(
        chalk.green.bold(
          '✅ Version bump completed and staged for current commit'
        )
      );
    } else {
      console.log(chalk.red.bold('❌ Version bump failed'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error in pre-commit version bump:'), error);
    process.exit(1);
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
  updatePackageVersionAndStage
};
