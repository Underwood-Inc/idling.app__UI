---
title: Documentation Coverage Badge System
description: Comprehensive guide to the centralized documentation coverage badge system
category: development
status: published
---

# 📚 Documentation Coverage Badge System

Our project uses a sophisticated centralized badge system to track and display documentation coverage across multiple locations. This system ensures consistency and provides real-time visibility into our documentation quality.

## 🎯 System Overview

The documentation coverage system operates on two levels:

### Pull Request Level

- **Workflow**: `.github/workflows/documentation-coverage-pr.yml`
- **Purpose**: Validates documentation coverage for PRs
- **Behavior**:
  - Runs on every PR (opened, synchronized, reopened)
  - Updates PR descriptions with coverage badges
  - Posts detailed coverage reports as comments
  - Fails workflow if coverage is below threshold (85%)
  - Generates documentation stubs for missing files

### Master Branch Level

- **Workflow**: `.github/workflows/documentation-coverage-master.yml`
- **Purpose**: Updates official badges and creates issues
- **Behavior**:
  - Runs on every push to master
  - Updates all badge locations using centralized system
  - Commits badge updates back to repository
  - Creates GitHub issues for coverage violations

## 🏗️ Architecture

### Centralized Badge File

- **Location**: `DOCS/badges/documentation-coverage.md`
- **Purpose**: Single source of truth for badge markdown
- **Auto-generated**: Updated by GitHub Actions, never edit manually
- **Contains**: Badge markdown, metadata, and coverage statistics

### Badge Update Script

- **Location**: `scripts/update-centralized-badges.py`
- **Purpose**: Updates badges across all locations consistently
- **Capabilities**:
  - Updates centralized markdown file
  - Updates README.md badge
  - Updates Jekyll header badge
  - Updates Jekyll include file
  - Handles badge creation and replacement intelligently

### Badge Locations

#### 1. README.md

```markdown
[![Documentation Coverage](badge-url)](https://underwood-inc.github.io/idling.app__UI/)
```

- **Location**: After React version badge in "Code Analysis" section
- **Auto-updated**: By master workflow on every push

#### 2. Jekyll Documentation Header

```html
<a
  href="https://underwood-inc.github.io/idling.app__UI/"
  target="_blank"
  rel="noopener"
>
  <img src="badge-url" alt="Documentation Coverage" />
</a>
```

- **Location**: `DOCS/_includes/header.html`
- **Position**: After React badge, before SonarCloud badges
- **Auto-updated**: By master workflow on every push

#### 3. Jekyll Include File

```html
<!-- DOCS/_includes/documentation-coverage-badge.html -->
<a
  href="https://underwood-inc.github.io/idling.app__UI/"
  target="_blank"
  rel="noopener"
>
  <img src="badge-url" alt="Documentation Coverage" />
</a>
```

- **Purpose**: Reusable badge component for Jekyll pages
- **Usage**: `{% include documentation-coverage-badge.html %}`
- **Auto-updated**: By master workflow on every push

## 📊 Coverage Calculation

The system calculates coverage using a weighted average:

```python
# Weighted average calculation
overall_coverage = (doc_files_coverage * 0.6) + (docstring_coverage * 0.4)
```

### Coverage Types

1. **Documentation Files Coverage** (60% weight)

   - Checks for corresponding `.md` files in `DOCS/` directories
   - Scans TypeScript/JavaScript files in `src/`
   - Maps to organized documentation structure

2. **Python Docstring Coverage** (40% weight)
   - Uses `interrogate` tool for analysis
   - Checks functions, classes, and methods
   - Follows NumPy docstring convention

### Badge Colors

- **🟢 Bright Green**: 90%+ coverage
- **🟢 Green**: 75-89% coverage
- **🟡 Yellow**: 60-74% coverage
- **🟠 Orange**: 40-59% coverage
- **🔴 Red**: <40% coverage

## 🔧 Manual Badge Updates

If you need to manually update badges (for testing or troubleshooting):

```bash
# Run the centralized badge update script
python scripts/update-centralized-badges.py \
  --badge-url="https://img.shields.io/badge/Documentation%20Coverage-85%25-green?style=flat&logo=gitbook&logoColor=white" \
  --overall-coverage=85 \
  --doc-coverage=80 \
  --docstring-coverage=92

# Make script executable first if needed
chmod +x scripts/update-centralized-badges.py
```

## 🚀 Workflow Integration

### PR Workflow Features

- **Non-blocking documentation checks**: Won't prevent merging
- **Detailed reporting**: Shows exactly what's missing
- **Stub generation**: Creates template files automatically
- **Smart badge generation**: Dynamic colors based on coverage

### Master Workflow Features

- **Centralized updates**: Updates all badge locations consistently
- **Git integration**: Commits changes with detailed messages
- **Issue creation**: Automatically creates GitHub issues for violations
- **Skip CI**: Uses `[skip ci]` to prevent infinite loops

## 📝 Usage Examples

### In Jekyll Documentation

```liquid
<!-- Use the include file -->
{% include documentation-coverage-badge.html %}

<!-- Or reference the centralized markdown -->
{% include_relative ../badges/documentation-coverage.md %}
```

### In Markdown Files

```markdown
<!-- Reference the centralized badge file -->

{% include_relative DOCS/badges/documentation-coverage.md %}

<!-- Or use direct markdown (will be auto-updated) -->

[![Documentation Coverage](badge-url)](https://underwood-inc.github.io/idling.app__UI/)
```

## 🔍 Monitoring and Troubleshooting

### Check Coverage Locally

```bash
# Check Python docstring coverage
pip install interrogate
interrogate --verbose=2 src/

# Check documentation file coverage
python scripts/check-docs-coverage.py

# Generate missing documentation stubs
python scripts/check-docs-coverage.py --generate-stubs
```

### View Badge Status

- **Current Coverage**: Check any badge location for real-time status
- **Detailed Reports**: View PR comments for comprehensive analysis
- **GitHub Issues**: Automatic issues created for coverage violations

### Common Issues

#### Badge Not Updating

1. Check if master workflow ran successfully
2. Verify script has proper permissions (`chmod +x`)
3. Check for git conflicts or permission issues

#### Coverage Calculation Seems Wrong

1. Run coverage check locally to verify
2. Check if all source files are being scanned
3. Verify docstring format follows NumPy convention

#### Workflow Failures

1. Check Python dependencies are installed
2. Verify script paths are correct
3. Check GitHub token permissions

## 🎉 Benefits

### For Developers

- **Real-time feedback**: Immediate visibility into documentation status
- **Automated workflows**: No manual badge management required
- **Consistent standards**: Same coverage calculation everywhere
- **Smart stub generation**: Templates created automatically

### For Project Management

- **Quality metrics**: Quantifiable documentation coverage
- **Trend tracking**: Historical coverage data via git history
- **Issue automation**: Automatic issue creation for violations
- **Professional appearance**: Consistent badges across all platforms

### For Documentation

- **Single source of truth**: Centralized badge management
- **Always up-to-date**: Automatic updates on every change
- **Multiple integration points**: README, Jekyll docs, and includes
- **Flexible usage**: Can be referenced anywhere in the project

---

_This documentation coverage system ensures our project maintains high-quality documentation standards while providing excellent developer experience and professional presentation._
