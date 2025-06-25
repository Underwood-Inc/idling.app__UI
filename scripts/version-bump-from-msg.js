#!/usr/bin/env node

/* eslint-disable no-console */
/* global Promise */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');

/**
 * Auto-increment package.json version based on commit message type
 * - chore, refactor, docs, style, test, ci, build: patch version increment (0.52.1 -> 0.52.2)
 * - feat, fix, perf, revert: minor version increment (0.52.1 -> 0.53.0)
 * - BREAKING CHANGE or major: never increment major version (as per requirements)
 *
 * Usage:
 *   echo "feat: new feature" | node scripts/version-bump-from-msg.js           # Normal mode from stdin
 *   node scripts/version-bump-from-msg.js --test                               # Test mode with interactive prompt
 *   node scripts/version-bump-from-msg.js --test "feat: new feature"           # Test mode with commit message as argument
 *   node scripts/version-bump-from-msg.js --dry-run "fix: bug fix"             # Same as test mode
 */

// Parse command line arguments
const args = process.argv.slice(2);
const isTestMode = args.includes('--test') || args.includes('--dry-run');
const commitMessageArg = args.find((arg) => !arg.startsWith('--'));

function readCommitMessageFromStdin() {
  return new Promise((resolve) => {
    let data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data.trim());
    });

    // Handle case where there's no stdin
    setTimeout(() => {
      if (data === '') {
        resolve(null);
      }
    }, 100);
  });
}

function promptForCommitMessage() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.cyan.bold('📝 Interactive Version Bump Test Mode\n'));
    console.log(chalk.white('Choose an option:'));
    console.log(
      chalk.yellow('  1. ') + chalk.white('Enter a custom commit message')
    );
    console.log(
      chalk.yellow('  2. ') + chalk.white('Select from example commit messages')
    );
    console.log(
      chalk.gray('  (or type ') +
        chalk.cyan('exit') +
        chalk.gray('/') +
        chalk.cyan('quit') +
        chalk.gray(' to exit)\n')
    );

    rl.question(chalk.yellow('Enter your choice (1 or 2): '), (choice) => {
      if (choice.toLowerCase() === 'exit' || choice.toLowerCase() === 'quit') {
        rl.close();
        resolve(null);
        return;
      }

      if (choice === '1') {
        // Custom commit message input
        console.log(
          chalk.white('\nEnter a commit message to test version bumping:')
        );
        console.log(chalk.gray('Examples:'));
        console.log(chalk.gray('  feat: add new user authentication'));
        console.log(chalk.gray('  fix: resolve login endpoint bug'));
        console.log(chalk.gray('  chore: update dependencies'));
        console.log(chalk.gray('  docs: improve README documentation\n'));

        rl.question(chalk.yellow('Commit message: '), (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      } else if (choice === '2') {
        // Example selection menu
        const examples = [
          {
            type: 'feat',
            message: 'feat: add user authentication system',
            bump: 'minor'
          },
          {
            type: 'feat',
            message: 'feat(api): implement OAuth2 integration',
            bump: 'minor'
          },
          {
            type: 'fix',
            message: 'fix: resolve login endpoint timeout',
            bump: 'minor'
          },
          {
            type: 'fix',
            message: 'fix(ui): correct button alignment issue',
            bump: 'minor'
          },
          {
            type: 'perf',
            message: 'perf: optimize database query performance',
            bump: 'minor'
          },
          {
            type: 'chore',
            message: 'chore: update npm dependencies',
            bump: 'patch'
          },
          {
            type: 'refactor',
            message: 'refactor: simplify user validation logic',
            bump: 'patch'
          },
          {
            type: 'docs',
            message: 'docs: improve API documentation',
            bump: 'patch'
          },
          {
            type: 'style',
            message: 'style: fix code formatting issues',
            bump: 'patch'
          },
          {
            type: 'test',
            message: 'test: add unit tests for auth module',
            bump: 'patch'
          },
          {
            type: 'ci',
            message: 'ci: update GitHub Actions workflow',
            bump: 'patch'
          },
          {
            type: 'build',
            message: 'build: optimize webpack configuration',
            bump: 'patch'
          },
          {
            type: 'revert',
            message: 'revert: undo previous authentication changes',
            bump: 'minor'
          },
          {
            type: 'invalid',
            message: 'random commit message without type',
            bump: 'none'
          }
        ];

        console.log(chalk.white('\nSelect an example commit message:\n'));

        examples.forEach((example, index) => {
          const number = chalk.yellow(
            `${(index + 1).toString().padStart(2)}. `
          );
          const bumpColor =
            example.bump === 'minor'
              ? chalk.green
              : example.bump === 'patch'
                ? chalk.yellow
                : chalk.gray;
          const bumpText =
            chalk.gray(' (') +
            bumpColor(example.bump + ' bump') +
            chalk.gray(')');
          console.log(number + chalk.white(example.message) + bumpText);
        });

        console.log(
          chalk.gray('\n  (or type ') +
            chalk.cyan('back') +
            chalk.gray(' to go back to main menu)\n')
        );

        rl.question(
          chalk.yellow('Enter example number (1-' + examples.length + '): '),
          async (selection) => {
            if (selection.toLowerCase() === 'back') {
              rl.close();
              // Recursively call to go back to main menu
              const result = await promptForCommitMessage();
              resolve(result);
              return;
            }

            const selectedIndex = parseInt(selection) - 1;
            if (selectedIndex >= 0 && selectedIndex < examples.length) {
              const selectedExample = examples[selectedIndex];
              console.log(
                chalk.green('\n✅ Selected: ') +
                  chalk.white(selectedExample.message)
              );
              rl.close();
              resolve(selectedExample.message);
            } else {
              console.log(
                chalk.red('\n❌ Invalid selection. Please try again.')
              );
              rl.close();
              // Recursively call to try again
              const result = await promptForCommitMessage();
              resolve(result);
            }
          }
        );
      } else {
        console.log(chalk.red('\n❌ Invalid choice. Please enter 1 or 2.'));
        rl.close();
        // Recursively call to try again
        promptForCommitMessage().then(resolve);
      }
    });
  });
}

async function getCommitMessage() {
  // If commit message provided as argument (only in test mode)
  if (commitMessageArg && isTestMode) {
    return commitMessageArg;
  }

  // If in test mode without argument, prompt for input
  if (isTestMode) {
    return await promptForCommitMessage();
  }

  // Normal mode: read from stdin
  return await readCommitMessageFromStdin();
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
        chalk.magenta.bold(`🧪 [TEST MODE] `) +
          chalk.white(`Would bump version: `) +
          chalk.cyan(oldVersion) +
          chalk.white(` → `) +
          chalk.green(newVersion)
      );
      console.log(
        chalk.magenta(`📝 [TEST MODE] `) +
          chalk.gray(`package.json would be updated but was not modified`)
      );
      console.log(
        chalk.magenta(`🔄 [TEST MODE] `) +
          chalk.gray(`git add package.json would be executed but was skipped`)
      );
      return true;
    }

    packageJson.version = newVersion;

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n'
    );

    console.log(
      chalk.green(`📦 Version bumped: `) +
        chalk.cyan(oldVersion) +
        chalk.white(` → `) +
        chalk.green.bold(newVersion)
    );

    // Note: package.json staging is handled by the post-commit hook
    // to ensure the version change is included in the current commit via amend

    return true;
  } catch (error) {
    console.error(
      chalk.red(`Error ${testMode ? 'simulating' : 'updating'} package.json:`),
      error.message
    );
    return false;
  }
}

function showVersionBumpRules() {
  console.groupCollapsed(chalk.blue.bold('📋 VERSION BUMP RULES'));

  console.log(
    chalk.green.bold('🟢 Minor Version Bump') +
      chalk.gray(' (e.g., 0.52.1 → 0.53.0)')
  );
  console.log(chalk.yellow('   feat, fix, perf, revert'));
  console.log('');

  console.log(
    chalk.yellow.bold('🟡 Patch Version Bump') +
      chalk.gray(' (e.g., 0.52.1 → 0.52.2)')
  );
  console.log(chalk.yellow('   chore, refactor, docs, style, test, ci, build'));
  console.log('');

  console.log(chalk.gray.bold('⚪ No Version Bump'));
  console.log(
    chalk.gray('   Non-conventional commit messages or unrecognized types')
  );

  console.groupEnd();
  console.log('');
}

async function runInteractiveMode() {
  console.groupCollapsed(chalk.magenta.bold('🧪 INTERACTIVE TEST MODE'));
  console.log(chalk.gray('No files will be modified during this session'));
  console.groupEnd();
  console.log('');

  showVersionBumpRules();

  let continueRunning = true;
  while (continueRunning) {
    try {
      const commitMessage = await promptForCommitMessage();

      if (
        !commitMessage ||
        commitMessage.toLowerCase() === 'exit' ||
        commitMessage.toLowerCase() === 'quit'
      ) {
        console.log(chalk.blue('\n👋 Goodbye!'));
        break;
      }

      console.log('\n' + chalk.gray('='.repeat(60)));
      await processCommitMessage(commitMessage, true);
      console.log(chalk.gray('='.repeat(60)));

      // Ask if they want to try another
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const tryAnother = await new Promise((resolve) => {
        rl.question(
          chalk.cyan('\nTry another commit message? (y/n): '),
          (answer) => {
            rl.close();
            resolve(answer.toLowerCase().startsWith('y'));
          }
        );
      });

      if (!tryAnother) {
        console.log(chalk.blue('\n👋 Goodbye!'));
        continueRunning = false;
      }

      if (continueRunning) {
        console.log('\n');
      }
    } catch (error) {
      console.error(chalk.red('Error in interactive mode:'), error);
      continueRunning = false;
    }
  }
}

async function processCommitMessage(commitMessage, testMode) {
  if (!commitMessage) {
    console.log(
      chalk.yellow('No commit message provided, skipping version bump')
    );
    return false;
  }

  // Skip version bump commits to prevent infinite loops
  if (
    commitMessage.includes('chore: bump version to') ||
    commitMessage.includes('Automatic version increment')
  ) {
    console.log(chalk.gray('📝 Skipping version bump for version bump commit'));
    return false;
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
    if (testMode) {
      console.log(
        chalk.gray(
          '💡 Tip: Use format like "feat: description" or "fix: description"'
        )
      );
    }
    console.groupEnd();
    return false;
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

  if (!bumpType) {
    console.log(
      chalk.gray(
        `⏭️  Commit type '${commitType}' does not require version bump`
      )
    );
    console.groupEnd();
    return false;
  }

  const bumpColor = bumpType === 'minor' ? chalk.green : chalk.yellow;
  console.log(chalk.blue('Bump: ') + bumpColor.bold(bumpType));
  console.groupEnd();

  // Get current version
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;

  // Calculate new version
  const newVersion = incrementVersion(currentVersion, bumpType);

  if (newVersion === currentVersion) {
    console.log(chalk.gray('No version change needed'));
    return false;
  }

  // Show version change
  console.groupCollapsed(chalk.blue('📦 VERSION UPDATE'));
  console.log(
    chalk.white('  ') +
      chalk.cyan(currentVersion) +
      chalk.white(' → ') +
      chalk.green.bold(newVersion) +
      chalk.white(' (') +
      (bumpType === 'minor' ? chalk.green(bumpType) : chalk.yellow(bumpType)) +
      chalk.white(' bump, ') +
      (testMode ? chalk.magenta('TEST') : chalk.blue('LIVE')) +
      chalk.white(' mode)')
  );
  console.groupEnd();

  // Update package.json (or simulate in test mode)
  const success = updatePackageVersion(newVersion, testMode);

  if (success) {
    const successMessage = testMode ? 'simulation' : '';
    console.log(
      chalk.green.bold(
        `✅ Version bump ${successMessage} completed successfully`
      )
    );
    return true;
  } else {
    const failMessage = testMode ? 'simulation' : '';
    console.log(chalk.red.bold(`❌ Version bump ${failMessage} failed`));
    return false;
  }
}

async function main() {
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

  // Handle different modes
  if (isTestMode && !commitMessageArg) {
    // Interactive mode when no commit message argument provided
    await runInteractiveMode();
    return;
  }

  // Single commit message mode (either from argument or stdin)
  if (isTestMode && !commitMessageArg) {
    console.log(
      chalk.magenta.bold('🧪 Running in TEST MODE') +
        chalk.gray(' - no files will be modified\n')
    );
  }

  const commitMessage = await getCommitMessage();
  await processCommitMessage(commitMessage, isTestMode);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Error in version bump script:'), error);
    process.exit(1);
  });
}

module.exports = {
  parseCommitType,
  getVersionBumpType,
  incrementVersion,
  updatePackageVersion
};
