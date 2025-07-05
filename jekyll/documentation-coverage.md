---
layout: default
title: Documentation Coverage System
description: Comprehensive guide to our automated documentation coverage analysis system
permalink: /documentation-coverage/
---

# 📚 Documentation Coverage System

Our automated documentation coverage system ensures comprehensive documentation across all source code files using industry-standard practices and multi-format reporting.

## 🎯 System Overview

The documentation coverage system operates across three main Git events, analyzing all source files and generating detailed reports with downloadable artifacts.

```mermaid
graph TD
    A[Git Event] --> B{Event Type}

    B -->|Local Commit| C[Pre-commit Hook]
    B -->|PR Creation/Update| D[GitHub Actions - PR]
    B -->|Push to Master| E[GitHub Actions - Master]

    C --> C1[Run check-docs-coverage.py]
    C1 --> C2[Analyze ALL Source Files]
    C2 --> C3[Update README.md Badge]
    C3 --> C4[Create Jekyll Badge Files]
    C4 --> C5[Generate Artifacts]

    D --> D1[documentation-coverage Job]
    D1 --> D2[Analyze ALL Source Files]
    D2 --> D3[Generate Reports]
    D3 --> D4[Upload Artifacts]
    D4 --> D5[Comment on PR]
    D5 --> D6[Update PR Description]

    E --> E1[docs.yml Workflow]
    E1 --> E2[Build Jekyll Site]
    E2 --> E3[Deploy to GitHub Pages]
    E3 --> E4[Update Live Badge URLs]

    style C fill:#e1f5fe
    style D fill:#f3e5f5
    style E fill:#e8f5e8
```

## 🔍 Files Analyzed

Our system comprehensively analyzes all source files across the codebase:

```mermaid
graph LR
    A[Source Files] --> B[Components]
    A --> C[Pages & Layouts]
    A --> D[API Routes]
    A --> E[Services & Utils]
    A --> F[Hooks & Types]
    A --> G[Root Level]

    B --> B1["src/components/**/*.tsx<br/>src/app/**/components/**/*.tsx<br/>src/lib/components/**/*.tsx"]
    C --> C1["src/app/**/page.tsx<br/>src/app/**/layout.tsx<br/>src/app/**/loading.tsx<br/>src/app/**/error.tsx"]
    D --> D1["src/app/api/**/route.ts"]
    E --> E1["src/lib/services/**/*.ts<br/>src/lib/utils/**/*.ts<br/>src/app/**/services/**/*.ts"]
    F --> F1["src/lib/hooks/**/*.ts<br/>src/lib/types/**/*.ts<br/>src/app/**/hooks/**/*.ts"]
    G --> G1["src/*.ts<br/>src/*.tsx<br/>src/middleware/**/*.ts"]

    style B1 fill:#e3f2fd
    style C1 fill:#f1f8e9
    style D1 fill:#fff3e0
    style E1 fill:#fce4ec
    style F1 fill:#e8eaf6
    style G1 fill:#f9fbe7
```

### 📁 Complete File Pattern Analysis

| Category            | Pattern                          | Description                    |
| ------------------- | -------------------------------- | ------------------------------ |
| **Components**      | `src/components/**/*.tsx`        | Standalone reusable components |
|                     | `src/app/**/components/**/*.tsx` | App-specific components        |
|                     | `src/lib/components/**/*.tsx`    | Library components             |
| **Pages & Layouts** | `src/app/**/page.tsx`            | Next.js app pages              |
|                     | `src/app/**/layout.tsx`          | Layout components              |
|                     | `src/app/**/loading.tsx`         | Loading states                 |
|                     | `src/app/**/error.tsx`           | Error boundaries               |
|                     | `src/app/**/not-found.tsx`       | 404 pages                      |
| **API Routes**      | `src/app/api/**/route.ts`        | API route handlers             |
| **Services**        | `src/lib/services/**/*.ts`       | Core service layer             |
|                     | `src/app/**/services/**/*.ts`    | App-specific services          |
| **Utilities**       | `src/lib/utils/**/*.ts`          | Utility functions              |
|                     | `src/app/**/utils/**/*.ts`       | App-specific utilities         |
| **Hooks**           | `src/lib/hooks/**/*.ts`          | Custom React hooks             |
|                     | `src/app/**/hooks/**/*.ts`       | App-specific hooks             |
| **Types**           | `src/lib/types/**/*.ts`          | Type definitions               |
|                     | `src/app/**/types/**/*.ts`       | App-specific types             |
| **Constants**       | `src/app/**/constants/**/*.ts`   | Constants                      |
| **Root Level**      | `src/*.ts`, `src/*.tsx`          | Root-level files               |
| **Middleware**      | `src/middleware/**/*.ts`         | Middleware functions           |

## 🚀 Event-Driven Analysis

### 🔄 Local Commits (Pre-commit Hook)

**Trigger**: Every `git commit`

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Hook as Pre-commit Hook
    participant Script as check-docs-coverage.py
    participant FS as File System

    Dev->>Hook: git commit
    Hook->>Script: Execute analysis
    Script->>FS: Analyze all source files
    Script->>FS: Check co-located docs
    Script->>FS: Generate JSON/HTML/CSV reports
    Script->>Hook: Return coverage data
    Hook->>FS: Update README.md badge
    Hook->>FS: Create Jekyll badge files
    Hook->>FS: Generate artifacts
    Hook->>Dev: Commit successful (non-blocking)
```

**Features**:

- ✅ **Real-time badge updates** in README.md
- ✅ **Local artifact generation** in `DOCS/coverage-artifacts/`
- ✅ **Jekyll badge file creation** for documentation site
- ✅ **Non-blocking** - won't fail commits
- ✅ **Comprehensive analysis** of all source files

### 🔀 Pull Requests (GitHub Actions)

**Trigger**: PR opened, synchronized, or reopened

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub Actions
    participant Job as documentation-coverage
    participant Artifacts as GitHub Artifacts
    participant PR as Pull Request

    Dev->>GH: Create/Update PR
    GH->>Job: Trigger documentation-coverage job
    Job->>Job: Analyze all source files
    Job->>Job: Generate multi-format reports
    Job->>Artifacts: Upload coverage artifacts
    Job->>PR: Add detailed comment
    Job->>PR: Update PR description with badges
    Job->>Dev: Non-blocking completion
```

**Features**:

- ✅ **Multi-format reports** (JSON, Markdown, HTML, CSV)
- ✅ **GitHub artifact uploads** with download links
- ✅ **Automated PR comments** with detailed coverage
- ✅ **PR description updates** with badge integration
- ✅ **Non-blocking** - uses warnings instead of failures

### 🚀 Master Branch (GitHub Actions)

**Trigger**: Push to `main`/`master` branch

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub Actions
    participant Jekyll as Jekyll Build
    participant Pages as GitHub Pages
    participant Site as Live Documentation

    Dev->>GH: Push to master
    GH->>Jekyll: Trigger docs.yml workflow
    Jekyll->>Jekyll: Build Jekyll site
    Jekyll->>Jekyll: Include coverage artifacts
    Jekyll->>Pages: Deploy to GitHub Pages
    Pages->>Site: Update live documentation
    Site->>Site: Live badge URLs updated
```

**Features**:

- ✅ **Live documentation deployment** to GitHub Pages
- ✅ **Updated badge URLs** pointing to live site
- ✅ **Artifact deployment** for public access
- ✅ **Jekyll site integration** with coverage data

## 📊 Documentation Sources

Our system analyzes documentation from multiple sources:

```mermaid
graph TD
    A[Documentation Sources] --> B[Co-located Documentation]
    A --> C[Centralized Documentation]

    B --> B1["index.md<br/>README.md<br/>docs.md<br/>documentation.md"]
    C --> C1["docs/**/*.md<br/>jekyll/**/*.md<br/>DOCS/**/*.md"]

    B1 --> D[File-specific Documentation]
    C1 --> E[Project-wide Documentation]

    D --> F[Quality Analysis]
    E --> F

    F --> G[Coverage Calculation]
    G --> H[Report Generation]

    style B fill:#e1f5fe
    style C fill:#f3e5f5
    style F fill:#fff3e0
    style G fill:#e8f5e8
```

## 🎯 Quality Standards

### 📏 Coverage Thresholds

| Level           | Minimum Coverage | Quality Score |
| --------------- | ---------------- | ------------- |
| **Production**  | 85%              | 0.7           |
| **Development** | 70%              | 0.6           |
| **Warning**     | 50%              | 0.5           |

### 📝 Required Documentation Sections

```mermaid
graph LR
    A[File Type] --> B[Required Sections]

    A --> A1[API Route]
    A --> A2[Component]
    A --> A3[Service]
    A --> A4[Utility]
    A --> A5[Hook]

    A1 --> B1["Overview<br/>Usage<br/>API Reference<br/>Examples"]
    A2 --> B2["Overview<br/>Props<br/>Usage<br/>Examples"]
    A3 --> B3["Overview<br/>Usage<br/>API Reference<br/>Configuration"]
    A4 --> B4["Overview<br/>Usage<br/>Examples"]
    A5 --> B5["Overview<br/>Usage<br/>Examples<br/>API Reference"]

    style A1 fill:#e3f2fd
    style A2 fill:#f1f8e9
    style A3 fill:#fff3e0
    style A4 fill:#fce4ec
    style A5 fill:#e8eaf6
```

### 📊 Word Count Requirements

| Priority     | Minimum Words | Description                            |
| ------------ | ------------- | -------------------------------------- |
| **Critical** | 200 words     | Core APIs, main components             |
| **High**     | 150 words     | Important utilities, auth              |
| **Medium**   | 100 words     | Helper functions, secondary components |
| **Low**      | 50 words      | Internal utilities, dev tools          |

## 📥 Available Reports

### 📋 Interactive HTML Report

- **Features**: Visual interface, filtering, search
- **Best for**: Quick review, presentations
- **Download**: Available in artifacts or `/coverage-artifacts/`

### 📊 CSV Report

- **Features**: Structured data, Excel-compatible
- **Best for**: Analysis, tracking, reporting
- **Download**: Available in artifacts or `/coverage-artifacts/`

### 📄 JSON Report

- **Features**: Structured data, API integration
- **Best for**: Automation, custom analysis
- **Download**: Available in GitHub Actions artifacts

### 📝 Markdown Report

- **Features**: Human-readable, GitHub-compatible
- **Best for**: Documentation, PR reviews
- **Download**: Available in GitHub Actions artifacts

## 🔧 Configuration

The system is configured via `scripts/docs-coverage-config.json`:

```json
{
  "documentation_standards": {
    "minimum_coverage_percentage": 85.0,
    "minimum_quality_score": 0.7
  },
  "code_analysis": {
    "file_patterns": {
      "components": "src/components/**/*.tsx",
      "api_routes": "src/app/api/**/route.ts"
    }
  }
}
```

## 🚀 Manual Usage

### Command Line Interface

```bash
# Generate HTML report
python scripts/check-docs-coverage.py --format html

# Generate CSV report
python scripts/check-docs-coverage.py --format csv

# Generate all formats
python scripts/check-docs-coverage.py --format all
```

### Local Development

```bash
# Check coverage before commit
python scripts/check-docs-coverage.py --format console

# Generate report for specific format
python scripts/check-docs-coverage.py --format html --output my-report.html
```

## 📈 Understanding Metrics

### Coverage Percentage

```
Coverage = (Documented Files / Total Files) × 100
```

### Quality Score

```
Quality = Average of all file documentation quality scores
```

### Priority Distribution

Files are categorized by complexity and importance:

- **Critical**: Core APIs, main components
- **High**: Important utilities, authentication
- **Medium**: Helper functions, secondary components
- **Low**: Internal utilities, development tools

## 🔄 Continuous Improvement

### Workflow Integration

1. **Pre-commit**: Immediate feedback on documentation changes
2. **PR Review**: Detailed analysis with downloadable reports
3. **Deployment**: Live documentation with updated metrics

### Best Practices

- ✅ **Write documentation alongside code**
- ✅ **Use co-located documentation files**
- ✅ **Include all required sections**
- ✅ **Meet minimum word count requirements**
- ✅ **Review coverage reports regularly**

---

## 📊 Current Status

{% include documentation-coverage-badge.html %}

[📥 Download Latest Reports](/coverage-artifacts/)

---

_This documentation is automatically updated with each deployment. For technical details, see the [configuration file](https://github.com/Underwood-Inc/idling.app__UI/blob/main/scripts/docs-coverage-config.json)._
