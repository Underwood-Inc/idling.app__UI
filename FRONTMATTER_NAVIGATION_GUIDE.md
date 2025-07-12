---
title: 'Frontmatter Navigation Guide'
description: 'How to use the automatic frontmatter-based navigation system'
permalink: /frontmatter-navigation-guide/
nav_exclude: true
---

# 🧙‍♂️ Frontmatter Navigation Guide

This project uses a **pure frontmatter-driven navigation system** that automatically generates navigation from your markdown files. No complex configuration needed!

## 🎯 How It Works

```mermaid
flowchart TD
    A[Scan .md Files] --> B[Extract Frontmatter]
    B --> C{Has parent or category?}
    C -->|Yes| D[Create Hierarchy]
    C -->|No| E[Add to Root Level]
    D --> F[Sort by nav_order]
    E --> F
    F --> G[Generate Navigation]
    G --> H[Render Menu]

    classDef process fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef output fill:#e8f5e8,stroke:#388e3c,stroke-width:2px

    class A,B,D,E,F,G process
    class C decision
    class H output
```

The system scans all `.md` files in your project and builds navigation based on two simple frontmatter fields:

- `parent` - Creates parent-child relationships
- `category` - Groups pages into categories

## 📝 Basic Usage

### Root-Level Pages

```yaml
---
title: 'Getting Started'
description: 'Setup and installation guide'
permalink: /getting-started/
---
```

### Category Pages

```yaml
---
title: 'Component Documentation'
description: 'React component library'
category: 'Development'
permalink: /development/components/
nav_order: 1
---
```

### Child Pages (Using Parent)

```yaml
---
title: 'Button Component'
description: 'Reusable button component'
parent: 'Development'
permalink: /development/components/button/
nav_order: 2
---
```

### Child Pages (Using Category)

```yaml
---
title: 'Installation Guide'
description: 'How to install the project'
category: 'Getting Started'
permalink: /getting-started/installation/
nav_order: 1
---
```

## 🔧 Frontmatter Fields

```mermaid
graph LR
    A[Frontmatter Fields] --> B[Required]
    A --> C[Optional]

    B --> D[title]
    B --> E[parent OR category]
    B --> F[permalink]

    C --> G[nav_order]
    C --> H[description]
    C --> I[nav_exclude]

    classDef required fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef optional fill:#e8f5e8,stroke:#388e3c,stroke-width:2px

    class B,D,E,F required
    class C,G,H,I optional
```

### Required Fields (at least one)

- `parent` - Name of the parent category/section
- `category` - Name of the category this page belongs to
- `title` + `permalink` - For root-level pages

### Optional Fields

- `nav_order` - Sort order within category (default: 999)
- `description` - Shown in navigation tooltips
- `nav_exclude: true` - Exclude from navigation entirely

## 🏗️ Navigation Structure

```mermaid
graph TD
    A[Root Navigation] --> B[Root Pages]
    A --> C[Category 1]
    A --> D[Category 2]
    A --> E[Another Root Page]

    B --> B1[No parent/category]

    C --> C1[Page A<br/>category: 'Category 1']
    C --> C2[Page B<br/>category: 'Category 1']

    D --> D1[Page C<br/>parent: 'Category 2']
    D --> D2[Page D<br/>parent: 'Category 2']

    classDef root fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef category fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef page fill:#e8f5e8,stroke:#388e3c,stroke-width:2px

    class A,B,E root
    class C,D category
    class B1,C1,C2,D1,D2 page
```

The system creates this hierarchy:

```
Root Pages (no parent/category)
├── Category 1
│   ├── Page A (category: "Category 1")
│   └── Page B (category: "Category 1")
├── Category 2
│   ├── Page C (parent: "Category 2")
│   └── Page D (parent: "Category 2")
└── Another Root Page
```

## 📋 Examples

### API Documentation Structure

```mermaid
graph TD
    A[API Reference] --> B[Users API]
    A --> C[Authentication API]
    A --> D[Admin API]

    B --> B1[GET /users]
    B --> B2[POST /users]

    C --> C1[POST /auth/login]
    C --> C2[POST /auth/logout]

    D --> D1[GET /admin/users]
    D --> D2[POST /admin/moderate]

    classDef api fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef endpoint fill:#e8f5e8,stroke:#388e3c,stroke-width:2px

    class A,B,C,D api
    class B1,B2,C1,C2,D1,D2 endpoint
```

```yaml
# src/app/api/index.md
---
title: 'API Reference'
description: 'Complete API documentation'
permalink: /api/
---
# src/app/api/users/index.md
---
title: 'Users API'
description: 'User management endpoints'
category: 'API Reference'
permalink: /api/users/
nav_order: 1
---
# src/app/api/auth/index.md
---
title: 'Authentication API'
description: 'Auth endpoints and flows'
category: 'API Reference'
permalink: /api/auth/
nav_order: 2
---
```

### Development Documentation

```mermaid
graph TD
    A[Development Guide] --> B[Components]
    A --> C[Libraries]
    A --> D[Testing]

    B --> B1[Button Component]
    B --> B2[Input Component]

    C --> C1[API Client]
    C --> C2[Utilities]

    D --> D1[Unit Tests]
    D --> D2[E2E Tests]

    classDef dev fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef section fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef item fill:#e8f5e8,stroke:#388e3c,stroke-width:2px

    class A dev
    class B,C,D section
    class B1,B2,C1,C2,D1,D2 item
```

```yaml
# development.md
---
title: 'Development Guide'
description: 'Development tools and resources'
permalink: /development/
---
# src/app/components/index.md
---
title: 'Components'
description: 'UI component library'
parent: 'Development Guide'
permalink: /development/components/
nav_order: 1
---
# src/lib/index.md
---
title: 'Libraries'
description: 'Shared utilities and services'
parent: 'Development Guide'
permalink: /development/libraries/
nav_order: 2
---
```

## 🚀 Benefits

```mermaid
mindmap
  root((Frontmatter Navigation))
    Zero Configuration
      Just Add Frontmatter
      No Config Files
      Automatic Discovery

    Co-located Benefits
      Docs With Code
      Easy Maintenance
      Version Control

    Flexibility
      Parent OR Category
      Custom Ordering
      Selective Exclusion

    Automation
      Auto-generated Menus
      Live Updates
      Dynamic Structure
```

✅ **Zero Configuration** - Just add frontmatter  
✅ **Co-located** - Documentation lives with code  
✅ **Automatic** - Navigation updates when you add files  
✅ **Flexible** - Use parent OR category as needed  
✅ **Ordered** - Control sort order with nav_order

## 🔍 Debugging

```mermaid
flowchart TD
    A[Navigation Issues?] --> B[Check Jekyll Build Logs]
    B --> C{Found Generation Message?}
    C -->|Yes| D[Check Browser DevTools]
    C -->|No| E[Verify Frontmatter Format]

    D --> F[Inspect site.data.auto_navigation]
    E --> G[YAML Syntax Valid?]

    F --> H[Navigation Structure Correct?]
    G -->|No| I[Fix YAML Errors]
    G -->|Yes| J[Check File Permissions]

    H -->|No| K[Verify Parent/Category Names]
    H -->|Yes| L[Check CSS/JS Issues]

    classDef debug fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef fix fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef check fill:#e3f2fd,stroke:#1976d2,stroke-width:2px

    class A,B,C,D,E,F,G,H debug
    class I,J,K,L fix
    class B,D,E,F,G,H,K,L check
```

To see the generated navigation structure, check:

- Jekyll build logs: `Dynamic Navigation: Generated navigation with X sections from Y pages`
- Browser dev tools: `site.data.auto_navigation` in Jekyll templates

## 💡 Tips

```mermaid
graph LR
    A[Best Practices] --> B[Index Pages]
    A --> C[Consistent Names]
    A --> D[Permalinks]
    A --> E[Ordering]
    A --> F[Exclusion]

    B --> B1[Create category index pages]
    C --> C1[Match parent/category names exactly]
    D --> D1[Always include permalinks]
    E --> E1[Use nav_order for sorting]
    F --> F1[Use nav_exclude for utility pages]

    classDef tip fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef detail fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class A,B,C,D,E,F tip
    class B1,C1,D1,E1,F1 detail
```

1. **Index Pages**: Create index pages for categories (e.g., `/development/index.md`)
2. **Consistent Names**: Use exact same parent/category names across files
3. **Permalinks**: Always include permalinks for predictable URLs
4. **Ordering**: Use nav_order to control sort order within categories
5. **Exclusion**: Use `nav_exclude: true` to hide utility pages from navigation

That's it! 🎉 Just add the frontmatter fields and the navigation builds itself automatically!
