# Idling.app Documentation

This directory contains the Jekyll-based documentation site for the Idling.app project.

## 🏗️ Setup

### Prerequisites
- Ruby 3.3.4 (matches GitHub Pages)
- Bundler 2.5+

### Local Development

1. **Install dependencies:**
   ```bash
   yarn docs:install
   # or manually:
   cd DOCS && bundle install
   ```

2. **Start the development server:**
   ```bash
   yarn docs:dev
   # or manually:
   cd DOCS && bundle exec jekyll serve --livereload --port=4000
   ```

3. **Visit:** http://localhost:4000

### Building for Production

```bash
yarn docs:build
# or manually:
cd DOCS && bundle exec jekyll build
```

## 🚀 Deployment

The documentation is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `master` branch.

### GitHub Pages Configuration
- **Jekyll Version:** 3.10.0 (GitHub Pages compatible)
- **Ruby Version:** 3.3.4
- **Deployment:** Automatic via `.github/workflows/docs.yml`
- **URL:** https://underwood-inc.github.io/idling.app__UI

### Manual Deployment
If needed, you can also enable automatic GitHub Pages deployment:
1. Go to repository Settings → Pages
2. Set Source to "Deploy from a branch"
3. Select branch: `master` and folder: `/DOCS`

## 📁 Structure

```
DOCS/
├── _config.yml          # Jekyll configuration
├── _includes/           # Reusable components
├── _layouts/            # Page templates
├── _sass/               # SCSS stylesheets
├── _site/               # Generated site (ignored)
├── api/                 # API documentation
├── database/            # Database docs
├── deployment/          # Deployment guides
├── development/         # Development guides
├── project/             # Project information
├── Gemfile              # Ruby dependencies
├── index.md             # Homepage
└── README.md            # This file
```

## 🔧 Configuration

The site is configured for GitHub Pages compatibility:
- Uses `github-pages` gem for dependency management
- Jekyll 3.10.0 (latest supported by GitHub Pages)
- GitHub Pages whitelisted plugins only
- Proper baseurl configuration for repository pages

## 📝 Writing Documentation

- Use Markdown files with `.md` extension
- Add front matter for page metadata
- Follow existing structure and navigation patterns
- Test locally before committing

## 🐛 Troubleshooting

### Bundle Install Issues
```bash
# Clear cache and reinstall
cd DOCS
bundle clean --force
bundle install
```

### Jekyll Version Conflicts
The site uses Jekyll 3.10.0 for GitHub Pages compatibility. If you need Jekyll 4.x features locally, you'll need to use GitHub Actions deployment instead of automatic GitHub Pages.

### Docker Development
The main Dockerfile includes Jekyll setup for development in containers.

## 🏗️ Documentation Structure

```
DOCS/
├── index.md                    # Main documentation homepage
├── getting-started.md          # Setup and development guide
├── _config.yml                 # Jekyll configuration for GitHub Pages
├── README.md                   # This file
│
├── database/                  # Database & Migration Documentation
│   ├── migrations.md          # Complete migration system guide
│   ├── optimization.md        # Performance optimization strategies
│   └── seeding.md             # Massive test data generation
│
├── development/               # Development Guides
│   ├── smart-filters.md       # Advanced filtering system
│   ├── caching.md             # Production caching strategy
│   └── testing.md             # CI/CD testing pipeline
│
├── deployment/                # Deployment & Operations
│   ├── cache-management.md    # Cache disabling and management
│   └── releases.md            # Release notes and versioning
│
└── project/                   # Project Management
    ├── commits.md             # Git commit standards
    ├── updates.md             # Latest project updates
    └── discord.md             # Discord integration and releases
```

## 🚀 GitHub Pages Deployment

The documentation is automatically built and deployed to GitHub Pages using Jekyll.

### Automatic Deployment

- **Trigger**: Push to `main`/`master` branch with changes to `DOCS/**`
- **Build**: Jekyll processes Markdown files with front matter
- **Deploy**: Automatic deployment to `https://underwood-inc.github.io/idling.app__UI/`

### Manual Deployment

```bash
# Trigger manual deployment
gh workflow run docs.yml
```

### Local Development

To test documentation locally:

#### Prerequisites (WSL/Ubuntu)

If you're on WSL or Ubuntu and don't have Ruby installed:

```bash
# Install Ruby and dependencies
sudo apt update
sudo apt install ruby-full build-essential zlib1g-dev

# Install bundler
gem install bundler jekyll
```

#### Development Commands

```bash
# From project root, use npm scripts:
npm run docs:install    # Install Jekyll dependencies
npm run docs:dev        # Serve with live reload
npm run docs:build      # Build static site

# Or manually:
cd DOCS

# Install dependencies
bundle install

# Serve locally with live reload
bundle exec jekyll serve --livereload --host=0.0.0.0 --port=4000

# Visit: http://localhost:4000/ (or http://0.0.0.0:4000/ on WSL)
```

**Note**: The `--host=0.0.0.0` flag is required for WSL compatibility.

## 📝 Writing Documentation

### Front Matter Requirements

All documentation files must include Jekyll front matter:

```yaml
---
layout: default
title: "Page Title"
description: "SEO-friendly description"
---

# Your Content Here
```

### Markdown Features

- **Code blocks** with syntax highlighting
- **Tables** for structured data
- **Emoji** for visual appeal 🎉
- **Links** between documentation pages
- **Images** (store in `assets/` if needed)

### Cross-References

Link to other documentation pages:

```markdown
[Migration Guide](./database/migrations)
[Getting Started](./getting-started)
```

## 🔧 Jekyll Configuration

Key settings in `_config.yml`:

- **Theme**: `minima` (GitHub Pages compatible)
- **Plugins**: SEO, sitemap, feed generation
- **Navigation**: Structured menu system
- **Collections**: Organized content grouping

## 📊 Documentation Metrics

Current documentation includes:

- ✅ **12 comprehensive guides** covering all aspects
- ✅ **GitHub Pages compatible** with Jekyll
- ✅ **SEO optimized** with meta tags and sitemaps
- ✅ **Mobile responsive** with clean design
- ✅ **Cross-linked** for easy navigation
- ✅ **Searchable** content structure

## 🚀 GitHub Actions Integration

The documentation workflow (`.github/workflows/docs.yml`) provides:

### For Pull Requests:
- ✅ **Build validation** - Ensures Jekyll builds successfully
- ✅ **PR comments** - Shows generated pages and preview links
- ✅ **Error detection** - Catches broken links and build issues

### For Main Branch:
- ✅ **Automatic deployment** - Builds and deploys to GitHub Pages
- ✅ **Build artifacts** - Preserves generated site for debugging
- ✅ **Deployment status** - Shows live site URL

## 🎯 Content Guidelines

### Documentation Standards:
1. **Clear structure** with logical hierarchy
2. **Practical examples** with code snippets
3. **Visual elements** (emojis, tables, diagrams)
4. **Cross-references** between related topics
5. **SEO optimization** with proper meta data

### Update Process:
1. Edit Markdown files in `DOCS/` directory
2. Test locally with Jekyll if needed
3. Commit changes to feature branch
4. Create PR - automatic build validation
5. Merge to main - automatic deployment

## 🔗 Quick Links

- **Live Documentation**: https://underwood-inc.github.io/idling.app__UI/
- **GitHub Repository**: https://github.com/Underwood-Inc/idling.app__UI
- **Jekyll Documentation**: https://jekyllrb.com/docs/
- **GitHub Pages**: https://pages.github.com/

---

> **Contributing**: To add new documentation, create Markdown files with proper front matter and update the navigation in `_config.yml` if needed. 