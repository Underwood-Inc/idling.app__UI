#!/bin/bash

# Documentation Coverage Setup Script
# Sets up comprehensive documentation coverage enforcement

set -e

echo "🧙‍♂️ Setting up Documentation Coverage System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Installing Python dependencies for documentation coverage..."

# Install Python dependencies
if command -v python3 &> /dev/null; then
    python3 -m pip install --user interrogate docstr-coverage pydocstyle
    print_success "Python dependencies installed"
else
    print_warning "Python3 not found. Please install Python3 and run: pip install interrogate docstr-coverage pydocstyle"
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."

# Check if yarn is available, otherwise use npm
if command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
    ADD_CMD="yarn add"
else
    PKG_MANAGER="npm"
    ADD_CMD="npm install"
fi

# Install required packages
$ADD_CMD -D eslint-plugin-jsdoc glob

print_success "Node.js dependencies installed"

# Create necessary directories
print_status "Creating documentation directories..."

# Create co-located documentation directories (documentation should live next to code)
# Only create Jekyll-specific directories that are needed
mkdir -p jekyll/badges
mkdir -p scripts

print_success "Documentation directories created"

# Make scripts executable
chmod +x scripts/check-docs-coverage.py
chmod +x scripts/setup-docs-coverage.sh

print_success "Scripts made executable"

# Create/update package.json scripts
print_status "Adding package.json scripts..."

# Use Node.js to update package.json
node -e "
const fs = require('fs');
const path = 'package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));

// Add documentation coverage scripts
pkg.scripts = pkg.scripts || {};
pkg.scripts['docs:check'] = 'python scripts/check-docs-coverage.py';
pkg.scripts['docs:check-verbose'] = 'python scripts/check-docs-coverage.py --format=console';
pkg.scripts['docs:generate-stubs'] = 'python scripts/check-docs-coverage.py --generate-stubs';
pkg.scripts['docs:coverage-report'] = 'python scripts/check-docs-coverage.py --format=markdown --output=jekyll/coverage-report.md';
pkg.scripts['lint:docs'] = 'eslint --config .eslintrc.docs-coverage.js src/';
pkg.scripts['lint:docs-fix'] = 'eslint --config .eslintrc.docs-coverage.js src/ --fix';

// Add pre-commit hooks if husky is available
if (pkg.devDependencies && (pkg.devDependencies.husky || pkg.dependencies.husky)) {
    pkg.scripts['pre-commit'] = 'npm run docs:check && npm run lint:docs';
}

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Package.json scripts updated');
"

# Setup pre-commit hooks if husky is available
if [ -d ".husky" ] || grep -q "husky" package.json 2>/dev/null; then
    print_status "Setting up pre-commit hooks with Husky..."
    
    # Create pre-commit hook
    mkdir -p .husky
    cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Checking documentation coverage..."
npm run docs:check

echo "🔍 Linting documentation..."
npm run lint:docs

echo "✅ Documentation checks passed!"
EOF
    
    chmod +x .husky/pre-commit
    print_success "Pre-commit hooks configured"
else
    print_warning "Husky not found. Consider installing husky for pre-commit hooks."
fi

# Create VS Code settings for better integration
print_status "Creating VS Code settings..."

mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "eslint.workingDirectories": ["."],
  "eslint.options": {
    "configFile": ".eslintrc.docs-coverage.js"
  },
  "files.associations": {
    "*.md": "markdown"
  },
  "markdown.validate.enabled": true,
  "python.defaultInterpreterPath": "/usr/bin/python3",
  "files.watcherExclude": {
    "**/DOCS/badges/**": true
  },
  "search.exclude": {
    "**/DOCS/badges/**": true,
    "**/.next/**": true
  }
}
EOF

print_success "VS Code settings created"

# Create a sample documentation file
print_status "Creating sample documentation..."

# Example service documentation would be co-located: src/services/ratelimitservice.md
# cat > src/services/ratelimitservice.md << 'EOF'
---
title: RateLimitService
category: service
tags: [rate-limiting, security, middleware]
status: complete
---

# RateLimitService

The RateLimitService provides comprehensive rate limiting functionality for the application, supporting both Edge Runtime and Node.js environments.

## Overview

This service manages API rate limiting with features including:
- Multiple rate limiting strategies
- Edge Runtime compatibility
- Attack detection and penalty systems
- Configurable limits per endpoint

## Usage

```typescript
import { RateLimitService } from '@/lib/services/RateLimitService';

const rateLimiter = new RateLimitService();

// Check rate limit for a request
const result = await rateLimiter.checkRateLimit('user-123', 'api-endpoint');

if (!result.allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

## API Reference

### Methods

#### `checkRateLimit(identifier: string, endpoint: string): Promise<RateLimitResult>`

Checks if a request should be allowed based on current rate limits.

**Parameters:**
- `identifier` - Unique identifier for the client (IP, user ID, etc.)
- `endpoint` - The endpoint being accessed

**Returns:** Promise resolving to a RateLimitResult object

---

*This documentation was created as an example for the documentation coverage system.*
EOF

print_success "Sample documentation created"

# Run initial documentation coverage check
print_status "Running initial documentation coverage check..."

python scripts/check-docs-coverage.py || print_warning "Some files are missing documentation (this is expected for a new setup)"

# Create configuration summary
print_status "Creating configuration summary..."

cat > jekyll/documentation-coverage-setup.md << 'EOF'
# Documentation Coverage System Setup

This project now has comprehensive documentation coverage enforcement! 🎉

## What's Been Configured

### 🔍 **Automated Checks**
- **Python Script**: `scripts/check-docs-coverage.py` - Comprehensive documentation coverage analysis
- **ESLint Plugin**: Custom plugin for linter-style documentation errors
- **GitHub Actions**: Automated CI/CD documentation checks
- **Pre-commit Hooks**: Prevent commits with missing documentation

### 📊 **Coverage Requirements**
- **Services**: 95% JSDoc coverage + documentation files required
- **Components**: 90% JSDoc coverage + documentation files required  
- **API Routes**: 95% JSDoc coverage + documentation files required
- **Utils**: 70% JSDoc coverage + documentation files recommended
- **Hooks**: 80% JSDoc coverage + documentation files recommended

### 🛠️ **Available Commands**

```bash
# Check documentation coverage
npm run docs:check

# Generate missing documentation stubs
npm run docs:generate-stubs

# Generate coverage report
npm run docs:coverage-report

# Lint documentation requirements
npm run lint:docs

# Fix auto-fixable documentation issues
npm run lint:docs-fix
```

### 🎯 **How It Works**

1. **File Analysis**: Scans your codebase for TypeScript/JavaScript files
2. **Documentation Matching**: Checks for corresponding `.md` files in organized directories (`DOCS/services/`, `DOCS/components/`, etc.)
3. **JSDoc Validation**: Ensures exported functions/classes have proper JSDoc
4. **Quality Checks**: Validates JSDoc completeness (params, returns, descriptions)
5. **Automated Reporting**: Generates detailed reports with actionable suggestions

### 🚨 **Enforcement Levels**

- **Linter Errors**: Missing documentation files show as ESLint errors
- **CI/CD Failures**: PRs fail if documentation coverage is below threshold
- **Pre-commit Blocks**: Commits blocked if documentation is missing
- **Auto-generation**: Stub files created automatically for missing docs

### 📝 **Next Steps**

1. Run `npm run docs:check` to see current coverage
2. Run `npm run docs:generate-stubs` to create missing documentation files
3. Fill in the generated stub files with actual documentation
4. Commit your changes - the system will validate everything!

### 🔧 **Customization**

Edit these files to customize the system:
- `scripts/docs-coverage.json` - Coverage configuration
- `.eslintrc.docs-coverage.js` - Linter rules
- `.github/workflows/documentation-coverage.yml` - CI/CD settings

---

*The documentation coverage system is now active and will help maintain high-quality documentation across your codebase!*
EOF

echo ""
echo "🎉 Documentation Coverage System Setup Complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Run: npm run docs:check"
echo "   2. Run: npm run docs:generate-stubs" 
echo "   3. Fill in generated documentation files"
echo "   4. Commit and push - CI will validate everything!"
echo ""
echo "📚 For more information, see: jekyll/documentation-coverage-setup.md"
echo "" 