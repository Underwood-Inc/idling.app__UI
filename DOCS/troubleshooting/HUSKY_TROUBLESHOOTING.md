# Husky Troubleshooting Guide

This guide helps resolve common issues with Husky Git hooks, especially when using VS Code or other Git clients.

## Common Issues

### 1. Hooks Fail in VS Code but Work in Terminal

**Symptoms:**
- Git commits work fine in terminal
- VS Code shows hook failures or "command not found" errors
- Pre-commit or post-commit hooks don't execute properly

**Solution:**
This project includes automatic environment setup that should resolve most issues. The hooks now:
- Automatically detect and configure Node.js PATH
- Support multiple Node.js version managers (nvm, volta, fnm, etc.)
- Work with VS Code, GitHub Desktop, and other Git clients

### 2. Enable Debug Mode

To troubleshoot hook issues, enable debug mode:

```bash
# Enable debug output for Husky hooks
export HUSKY_DEBUG=1

# Then try your Git operation
git commit -m "test commit"
```

This will show detailed information about:
- PATH resolution
- Node.js detection
- Working directory
- Available commands

### 3. Manual PATH Setup

If automatic detection fails, you can manually set your PATH in your shell profile:

**For bash (~/.bashrc or ~/.bash_profile):**
```bash
# Add Node.js to PATH
export PATH="/usr/local/bin:$PATH"
# Or if using nvm
export PATH="$HOME/.nvm/current/bin:$PATH"
```

**For zsh (~/.zshrc):**
```bash
# Add Node.js to PATH
export PATH="/usr/local/bin:$PATH"
# Or if using nvm
export PATH="$HOME/.nvm/current/bin:$PATH"
```

### 4. VS Code Specific Settings

The project includes VS Code settings to improve Git integration:
- `git.useEditorAsCommitInput: false` - Prevents editor conflicts
- `git.verboseCommit: true` - Shows more detailed commit output
- `git.showProgress: true` - Shows progress for Git operations

### 5. Test Hooks Manually

You can test hooks manually to verify they work:

```bash
# Test pre-commit hook
./.husky/pre-commit

# Test post-commit hook (after making a commit)
./.husky/post-commit
```

### 6. Common Node.js Installation Paths

The setup script automatically checks these paths:
- `/usr/local/bin` (standard installation)
- `/usr/bin` (system installation)
- `$HOME/.nvm/current/bin` (nvm)
- `$HOME/.volta/bin` (volta)
- `$HOME/.fnm/current/bin` (fnm)
- `/opt/homebrew/bin` (macOS Homebrew)
- `/mnt/c/Program Files/nodejs` (WSL/Windows)

### 7. WSL Specific Issues

If you're using WSL (Windows Subsystem for Linux):

1. Ensure Node.js is installed in WSL, not just Windows
2. Check that your VS Code is using the WSL terminal
3. Verify the WSL PATH includes Node.js:
   ```bash
   which node
   which npm
   which npx
   ```

### 8. Verify Husky Installation

Check that Husky is properly installed:

```bash
# Check Husky version
npx husky --version

# Reinstall Husky if needed
npm run prepare
```

### 9. Reset Husky Hooks

If hooks are completely broken, you can reset them:

```bash
# Remove existing hooks
rm -rf .git/hooks

# Reinstall Husky
npm run prepare
```

## Getting Help

If you're still experiencing issues:

1. Enable debug mode (`HUSKY_DEBUG=1`)
2. Run the failing Git operation
3. Share the debug output with the development team
4. Include information about:
   - Your operating system
   - Node.js version (`node --version`)
   - Git client (VS Code, terminal, etc.)
   - Shell type (bash, zsh, etc.)

## Project-Specific Features

This project's Husky setup includes:

### Pre-commit Hook
- Runs `lint-staged` to check code quality
- Formats code with Prettier
- Runs TypeScript checks
- Validates commit message format

### Post-commit Hook
- Automatically bumps version numbers based on commit messages
- Follows conventional commit standards
- Prevents infinite loops with version bump commits
- Cleans up old lock files

Both hooks are designed to work reliably across different environments and Git clients. 