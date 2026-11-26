---
title: 'Documentation Coverage'
description: 'Documentation coverage analysis and reporting tools'
---

# Documentation Coverage Analysis System (Modular)

🧙‍♂️ **Industry-standard documentation coverage analysis with modular architecture!** ⚡

This is the new modular version of the documentation coverage system, replacing the massive 1,296-line monolithic script with a clean, maintainable, well-documented architecture.

## 📁 Architecture Overview

The system is now broken down into focused, manageable modules:

- **models.py** - Data structures and types (70 lines)
- **config.py** - Configuration management (130 lines)
- **analyzer.py** - Code analysis engine (280 lines)
- **quality.py** - Documentation quality assessment (200 lines)
- **checker.py** - Main orchestrator class (150 lines)
- **reports/** - Report generators (50-200 lines each)

## 🚀 Key Improvements

### ✅ **Modular Design**

- Small, focused modules vs. one 1,296-line monster
- Single responsibility principle
- Easy to test, debug, and extend

### ✅ **Enhanced Features**

- **Automatic file output** for HTML, CSV, and Markdown
- **Console summary** shown with file format reports
- **Better error handling** and logging
- **Improved type safety** with proper typing

## 🛠️ Usage

### Repo scripts (Node + Python)

```bash
pnpm docs:coverage:analyze    # JSON report, no non-zero exit locally
pnpm docs:coverage:bootstrap  # Fill gaps from doc-coverage-report.json
pnpm docs:coverage:refresh    # analyze → bootstrap → analyze → badge sync
```

Badge and HTML ship in `static/coverage/` and `src/index.md` via `scripts/sync-docs-coverage-badge.mjs`. **Protected paths:** `src/index.md`, `src/lib/utils/index.md` (never overwritten by bootstrap).

### File Output (New!)

```bash
# Generate HTML report (auto-saves to documentation-coverage-report.html)
python3 check-docs-coverage.py --format html

# Generate CSV for Excel (auto-saves to documentation-coverage-report.csv)
python3 check-docs-coverage.py --format csv

# Generate Markdown for Jekyll (auto-saves to documentation-coverage-report.md)
python3 check-docs-coverage.py --format markdown
```

### Console Output

```bash
# Console output (default)
python3 check-docs-coverage.py

# JSON output to terminal
python3 check-docs-coverage.py --format json
```

## 📊 Output Formats

- **Console**: Rich terminal output with emojis and colors
- **HTML**: Interactive web interface with filtering (auto-saves to file)
- **CSV**: Excel/Google Sheets compatible (auto-saves to file)
- **Markdown**: Jekyll-compatible with front matter (auto-saves to file)
- **JSON**: API integration and automation

## 🎯 Migration Notes

The new modular system is **100% compatible** with the old script:

- ✅ Same command-line interface
- ✅ Same configuration format
- ✅ Same output formats
- ✅ Enhanced with automatic file output

---

**Built with ❤️ by the Documentation Coverage Team** 🧙‍♂️✨
