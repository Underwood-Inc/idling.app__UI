# Scripts Directory

This directory contains various utility scripts for the project.

## Feature Debrief Generator

### `generate-feature-debrief.js`

A comprehensive wrapper around `auto-changelog` that generates business-friendly development activity reports with interactive prompts and professional formatting.

#### Features

- **Interactive CLI** with colored prompts and progress indicators
- **Multiple report styles**: Executive, Technical, Comprehensive, Metrics-focused
- **Flexible time ranges**: 7 days, 30 days, 3 months, since last release, custom, or all time
- **Business-friendly language** that translates technical commits into business impact
- **Real git analysis** with fallback when auto-changelog fails
- **Development velocity metrics** and trend analysis
- **Professional markdown output** with hashtags and formatting

#### Usage

```bash
# Using npm script (recommended)
npm run debrief

# Or directly
node scripts/generate-feature-debrief.js

# Or as executable
./scripts/generate-feature-debrief.js
```

#### Interactive Options

The script will prompt you for:
- **Time Range**: Select from predefined ranges or custom dates
- **Report Style**: Choose focus level (executive vs technical)
- **Commit Types**: Select which types to include (feat, fix, perf, etc.)
- **Output Filename**: Customize the report filename
- **Metrics & Trends**: Include velocity and pattern analysis

#### Output

Reports are saved to `./reports/` directory with:
- Executive summaries with business impact descriptions
- Development velocity and consistency metrics
- Team contribution analysis
- Trend insights and recommendations
- Professional hashtags for social sharing

#### Dependencies

- `auto-changelog`: Primary changelog generation
- `chalk`: Colored terminal output
- `prompts`: Interactive CLI prompts

#### Business Value Translation

The script maps technical commit types to business-friendly descriptions:

- `feat` → "New Features & Enhancements" - Delivers new value to users
- `fix` → "Bug Fixes & Improvements" - Enhances user experience and reliability
- `perf` → "Performance Optimizations" - Improves application speed
- `refactor` → "Code Quality & Architecture" - Strengthens codebase foundation
- `style` → "UI/UX & Design Updates" - Modernizes user interface
- And more...

#### Example Output

```markdown
# 📊 Feature Debrief Report
## *Development Activity Analysis*

### 🎯 **Executive Summary**

Our development team has maintained a **high-velocity development pace** 
with **42 commits** during this period, averaging **6.0 commits per day**.

### 🚀 **Key Highlights**
- **45.2%** New Features & Enhancements (19 commits)
- **28.6%** Bug Fixes & Improvements (12 commits)
- **16.7%** Performance Optimizations (7 commits)
```

The script provides a professional way to communicate development progress to stakeholders, translating technical git data into business-friendly insights. 