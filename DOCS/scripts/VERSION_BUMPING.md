# Automatic Version Bumping

This project includes an automatic version bumping system that increments the `package.json` version based on conventional commit message types.

## How It Works

The system uses a Git `prepare-commit-msg` hook that runs after you write your commit message but before the commit is finalized. It analyzes your commit message and automatically bumps the version in `package.json`.

## Version Bump Rules

- **Minor version bump** (e.g., `0.52.1` → `0.53.0`):
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `perf:` - Performance improvements
  - `revert:` - Reverting previous changes

- **Patch version bump** (e.g., `0.52.1` → `0.52.2`):
  - `chore:` - Maintenance tasks
  - `refactor:` - Code refactoring
  - `docs:` - Documentation changes
  - `style:` - Code style changes
  - `test:` - Test changes
  - `ci:` - CI/CD changes
  - `build:` - Build system changes

- **No version bump**:
  - Commit messages that don't follow conventional commit format
  - Major version bumps are never automatic (as per project requirements)

## Commit Message Format

The system recognizes conventional commit format:

```
type(scope): description

Examples:
feat: add new user authentication
fix(api): resolve login endpoint bug
chore: update dependencies
docs: improve README documentation
```

## Manual Version Bumping

### Safe Mode (Default - With Confirmation)
```bash
# Prompts for confirmation before making changes
npm run version:bump

# Example output:
# ⚠️  CONFIRMATION REQUIRED
#   You are about to modify package.json in LIVE mode
# 
# ┌─────────────────┬─────────────┬───────────┬──────────────────────────────┐
# │ Current Version │ New Version │ Bump Type │ Commit                       │
# ├─────────────────┼─────────────┼───────────┼──────────────────────────────┤
# │ 0.52.1          │ 0.53.0      │ minor     │ feat: add user authentication │
# └─────────────────┴─────────────┴───────────┴──────────────────────────────┘
# Do you want to proceed with this version bump? (yes/no):
```

### Force Mode (Skip Confirmation)
```bash
# Skips confirmation prompt - use with caution!
npm run version:bump:force
```

### Test Mode (Simulation Only)
```bash
# Simulates version bump without making changes
npm run version:bump:test

# Shows what would happen without modifying files
```

## Testing

### Interactive Mode (Recommended)

The easiest way to test version bumping is using the interactive prompt mode with beautiful colorized output:

```bash
# Start interactive test mode - offers menu with custom input or examples
npm run version:test

# You'll see colorized output like:
# 🧪 INTERACTIVE TEST MODE
#   No files will be modified during this session
# 
# 📋 VERSION BUMP RULES
# 🟢 Minor Version Bump (e.g., 0.52.1 → 0.53.0)
#    feat, fix, perf, revert
# 
# 🟡 Patch Version Bump (e.g., 0.52.1 → 0.52.2)
#    chore, refactor, docs, style, test, ci, build
# 
# ⚪ No Version Bump
#    Non-conventional commit messages or unrecognized types
# 
# 📝 Interactive Version Bump Test Mode
# 
# Choose an option:
#   1. Enter a custom commit message
#   2. Select from example commit messages
#   (or type exit/quit to exit)
# 
# Enter your choice (1 or 2): _
```

**Option 1: Custom Input** - Enter your own commit message with helpful examples shown

**Option 2: Example Selection** - Choose from 14 predefined examples covering all commit types:
- Minor bump examples (feat, fix, perf, revert)
- Patch bump examples (chore, refactor, docs, style, test, ci, build)  
- Invalid commit example (no version bump)
- Each example shows the expected bump type in color

### Quick Demo

```bash
# See a quick demo with a predefined example
npm run version:demo

# Shows colorized output for "feat: example feature for demo"
```

### Command Line Arguments

```bash
# Test with commit message as argument (colorized output)
node scripts/version-bump-from-msg.js --test "feat: add new feature"
node scripts/version-bump-from-msg.js --dry-run "fix: resolve critical bug"

# Test with current git commit message (if you have commits)
node scripts/version-bump.js --test

# Force version bump without confirmation (use with caution!)
node scripts/version-bump.js --force
```

### Advanced Testing

```bash
# Test multiple scenarios quickly with beautiful colors
node scripts/version-bump-from-msg.js --test "feat(auth): add OAuth support"
node scripts/version-bump-from-msg.js --test "fix(api): resolve timeout issue"
node scripts/version-bump-from-msg.js --test "chore: update dependencies"
node scripts/version-bump-from-msg.js --test "docs: improve installation guide"
node scripts/version-bump-from-msg.js --test "refactor: optimize database queries"
```

## Available NPM Scripts

```bash
# Manual version bumping (with confirmation)
npm run version:bump              # Safe mode - prompts for confirmation
npm run version:bump:force        # Force mode - skips confirmation
npm run version:bump:test         # Test mode - simulation only

# Interactive testing
npm run version:test              # Interactive test mode with examples
npm run version:demo              # Quick demo with predefined example
npm run version:help              # Show help and examples
```

## Test Mode vs Normal Mode

### Normal Mode (Default)
- **With Confirmation**: Prompts user before making changes to package.json
- **With --force**: Skips confirmation and updates immediately
- Stages the updated file with `git add package.json`
- Used by the git hook during real commits
- Includes colorized output for better visibility

### Test Mode (`--test` or `--dry-run`)
- **Interactive Test Mode** (`--test` with no arguments): Opens interactive prompt for testing multiple commit messages
- **Single Test Mode** (`--test "commit message"`): Tests a single commit message provided as argument
- Shows what would happen without modifying any files
- Perfect for understanding the system before using it live

### Interactive Test Mode Features
- Shows colorized version bump rules and examples
- Allows testing multiple scenarios in one session
- Type `exit` or `quit` to exit, or answer `n` when asked to try another
- Beautiful color-coded output for different commit types and bump types

## Color Coding

The scripts use color coding to make output easier to read:

- **🟢 Green**: Success messages, minor version bumps, feat/fix/perf/revert commit types
- **🟡 Yellow**: Patch version bumps, chore/refactor/docs/style/test/ci/build commit types, warnings
- **🔵 Blue**: Information messages, analysis steps
- **🟣 Magenta**: Test mode indicators
- **🔴 Red**: Errors and failures
- **⚪ Gray**: Secondary information, examples, separators

## Safety Features

### Confirmation Prompts
- **Default behavior**: Always prompts for confirmation in live mode
- **Clear information**: Shows exactly what will change before proceeding
- **Easy cancellation**: Type 'no' or 'n' to cancel
- **Force option**: Use `--force` flag to skip confirmation when needed

### Test Mode
- **Risk-free testing**: Simulate version bumps without making changes
- **Interactive exploration**: Try different commit messages safely
- **Learning tool**: Understand the system before using it live

## Files

- `.husky/prepare-commit-msg` - Git hook that triggers version bumping
- `scripts/version-bump-from-msg.js` - Main version bumping script (reads from stdin)
- `scripts/version-bump.js` - Alternative script that reads from git log

## Example Interactive Session

```bash
$ npm run version:test

🧪 INTERACTIVE TEST MODE
  No files will be modified during this session

📋 VERSION BUMP RULES
🟢 Minor Version Bump (e.g., 0.52.1 → 0.53.0)
   feat, fix, perf, revert

🟡 Patch Version Bump (e.g., 0.52.1 → 0.52.2)
   chore, refactor, docs, style, test, ci, build

⚪ No Version Bump
   Non-conventional commit messages or unrecognized types

📝 Interactive Version Bump Test Mode

Choose an option:
  1. Enter a custom commit message
  2. Select from example commit messages
  (or type exit/quit to exit)

Enter your choice (1 or 2): 2

Select an example commit message:

 1. feat: add user authentication system (minor bump)
 2. feat(api): implement OAuth2 integration (minor bump)
 3. fix: resolve login endpoint timeout (minor bump)
 4. fix(ui): correct button alignment issue (minor bump)
 5. perf: optimize database query performance (minor bump)
 6. chore: update npm dependencies (patch bump)
 7. refactor: simplify user validation logic (patch bump)
 8. docs: improve API documentation (patch bump)
 9. style: fix code formatting issues (patch bump)
10. test: add unit tests for auth module (patch bump)
11. ci: update GitHub Actions workflow (patch bump)
12. build: optimize webpack configuration (patch bump)
13. revert: undo previous authentication changes (minor bump)
14. random commit message without type (none bump)

  (or type back to go back to main menu)

Enter example number (1-14): 1

✅ Selected: feat: add user authentication system

============================================================
🔍 COMMIT ANALYSIS
  Message: "feat: add user authentication system"
  Type: feat
  Bump: minor

📦 VERSION UPDATE
┌─────────────────┬─────────────┬───────────┬──────┐
│ Current Version │ New Version │ Bump Type │ Mode │
├─────────────────┼─────────────┼───────────┼──────┤
│ 0.52.1          │ 0.53.0      │ minor     │ TEST │
└─────────────────┴─────────────┴───────────┴──────┘
✅ Version bump simulation completed successfully
============================================================

Try another commit message? (y/n): n

👋 Goodbye!
```

## Troubleshooting

If version bumping isn't working:

1. Ensure the hook is executable: `chmod +x .husky/prepare-commit-msg`
2. Check that your commit message follows conventional commit format
3. Test interactively: `npm run version:test`
4. Test with your specific commit message: `node scripts/version-bump-from-msg.js --test "your: commit message"`
5. Check git hooks are enabled: `git config core.hooksPath .husky`

## Disabling

To temporarily disable version bumping, you can:

1. Skip the hook for a single commit: `git commit --no-verify`
2. Rename the hook file to disable it: `mv .husky/prepare-commit-msg .husky/prepare-commit-msg.disabled` 