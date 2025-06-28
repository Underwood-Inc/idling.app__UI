---
layout: default
title: 'GitHub Pages Deployment'
description: 'Complete guide to deploying Jekyll documentation to GitHub Pages'
nav_order: 6
parent: 'Deployment'
---

# GitHub Pages Deployment

This guide covers the complete setup and deployment process for the Jekyll documentation site to GitHub Pages.

## 🌐 Overview

The Idling.app documentation is deployed to GitHub Pages using Jekyll, providing a publicly accessible documentation site at:

**🔗 [https://underwood-inc.github.io/idling.app\_\_UI](https://underwood-inc.github.io/idling.app__UI)**

## 🏗️ Architecture

### Jekyll Configuration

- **Jekyll Version**: 3.10.0 (GitHub Pages compatible)
- **Ruby Version**: 3.3.4 (matches GitHub Pages environment)
- **Theme**: Minima with custom styling
- **Deployment**: Automated via GitHub Actions

### Repository Structure

```
DOCS/
├── _config.yml          # Jekyll configuration
├── _includes/           # Reusable components
├── _layouts/            # Page templates
├── _sass/               # SCSS stylesheets
├── api/                 # API documentation
├── database/            # Database documentation
├── deployment/          # Deployment guides
├── development/         # Development guides
├── project/             # Project information
├── Gemfile              # Ruby dependencies
└── search.json          # Search index
```

## ⚙️ Configuration Files

### Jekyll Configuration (\_config.yml)

```yaml
# Jekyll Configuration for GitHub Pages
title: 'Idling.app Documentation'
description: 'Complete documentation for the Idling.app project'
url: 'https://underwood-inc.github.io'
baseurl: '/idling.app__UI'

# Build settings
markdown: kramdown
highlighter: rouge
theme: minima

# Plugins (GitHub Pages whitelisted)
plugins:
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate
  - jekyll-gist
  - jemoji
  - jekyll-github-metadata
```

### Ruby Dependencies (Gemfile)

```ruby
source "https://rubygems.org"

# GitHub Pages compatible Jekyll version (Jekyll 3.10.0)
gem "github-pages", group: :jekyll_plugins

# Additional plugins (already included in github-pages gem)
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-paginate", "~> 1.1"
  gem "jekyll-gist", "~> 1.5"
  gem "jemoji", "~> 0.13"
end
```

## 🚀 Deployment Methods

### Method 1: GitHub Actions (Recommended)

**Automatic deployment** via GitHub Actions workflow:

```yaml
# .github/workflows/docs.yml
name: Build and Deploy Documentation

on:
  push:
    branches: [master, main]
    paths:
      - 'DOCS/**'
      - '.github/workflows/docs.yml'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3.4'
          bundler-cache: true
          working-directory: './DOCS'

      - name: Build with Jekyll
        run: bundle exec jekyll build
        working-directory: ./DOCS

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./DOCS/_site/

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

### Method 2: Automatic GitHub Pages

**Direct deployment** from repository:

1. Go to **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `master`
4. **Folder**: `/DOCS`
5. Save settings

## 🔧 Local Development

### Prerequisites

- Ruby 3.3.4
- Bundler 2.5+
- Git

### Setup Commands

```bash
# Install dependencies
yarn docs:install
# or manually:
cd DOCS && bundle install

# Start development server
yarn docs:dev
# or manually:
cd DOCS && bundle exec jekyll serve --livereload --port=4000

# Build for production
yarn docs:build
# or manually:
cd DOCS && bundle exec jekyll build
```

### Development Workflow

1. **Edit documentation** in `DOCS/` directory
2. **Test locally** at http://localhost:4000
3. **Commit changes** to git
4. **Push to master** - triggers automatic deployment

## 📊 GitHub Pages Environment

### Supported Versions

| Component    | Version |
| ------------ | ------- |
| **Jekyll**   | 3.10.0  |
| **Ruby**     | 3.3.4   |
| **Kramdown** | 2.4.0   |
| **Rouge**    | 3.30.0  |
| **Liquid**   | 4.0.4   |

### Whitelisted Jekyll Plugins

- jekyll-coffeescript
- jekyll-default-layout
- jekyll-feed
- jekyll-gist
- jekyll-github-metadata
- jekyll-mentions
- jekyll-optional-front-matter
- jekyll-paginate
- jekyll-readme-index
- jekyll-redirect-from
- jekyll-relative-links
- jekyll-remote-theme
- jekyll-sass-converter
- jekyll-seo-tag
- jekyll-sitemap
- jekyll-titles-from-headings
- jemoji

## 🔍 Search Functionality

### Search Index (search.json)

Automatically generated search index for client-side search:

```json
[
  {% for page in site.pages %}
    {
      "title": {{ page.title | jsonify }},
      "content": {{ page.content | strip_html | truncate: 1000 | jsonify }},
      "url": {{ page.url | jsonify }},
      "date": {{ page.date | date: "%Y-%m-%d" | jsonify }}
    }
  {% endfor %}
]
```

### Navigation Structure

Hierarchical navigation defined in `_config.yml`:

```yaml
navigation:
  - title: 'Development'
    url: '/development/'
    subnav:
      - title: 'Docker Setup'
        url: '/development/docker-setup'
      - title: 'Environment Variables'
        url: '/development/environment-variables'
  - title: 'Deployment'
    url: '/deployment/'
    subnav:
      - title: 'GitHub Pages'
        url: '/deployment/github-pages'
```

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**

```bash
# Check Jekyll version compatibility
bundle exec jekyll --version

# Validate configuration
bundle exec jekyll doctor

# Clean build cache
bundle exec jekyll clean
```

**Plugin Issues:**

```bash
# Check plugin whitelist
bundle exec github-pages versions

# Reinstall dependencies
bundle clean --force
bundle install
```

**Deployment Problems:**

- Check GitHub Actions logs
- Verify repository permissions
- Ensure `DOCS/` directory structure is correct

### Performance Optimization

**Build Speed:**

- Use incremental builds: `jekyll serve --incremental`
- Optimize images and assets
- Minimize plugin usage

**Site Performance:**

- Enable gzip compression
- Optimize CSS and JavaScript
- Use CDN for assets (if needed)

## 🔄 CI/CD Integration

### GitHub Actions Benefits

- **Consistent builds** across environments
- **Custom build processes** beyond GitHub Pages limitations
- **Advanced caching** for faster builds
- **Multiple deployment targets** support

### Deployment Triggers

- **Push to master**: Automatic deployment
- **Pull requests**: Build validation (no deployment)
- **Manual trigger**: Via GitHub Actions UI

## 📈 Monitoring & Analytics

### Build Monitoring

- GitHub Actions build status
- GitHub Pages deployment status
- Build time optimization

### Site Analytics

```yaml
# Optional: Add to _config.yml
google_analytics: GA_TRACKING_ID
```

## 🔒 Security Considerations

### Repository Settings

- **Branch protection** on master
- **Required status checks** for PRs
- **Restrict push access** to maintainers

### Content Security

- **Sanitize user input** in documentation
- **Review external links** regularly
- **Monitor for sensitive data** in commits

## 📝 Related Documentation

- [Docker Development Setup](../development/docker-setup.html)
- [Cache Management](cache-management.html)
- [Production Deployment](production.html)
- [Environment Variables](../development/environment-variables.html)

## 💡 Best Practices

1. **Use GitHub Actions** for reliable deployment
2. **Test locally** before pushing changes
3. **Follow Jekyll conventions** for consistent structure
4. **Optimize for GitHub Pages** limitations
5. **Monitor build performance** and optimize regularly
6. **Keep dependencies updated** within GitHub Pages constraints
7. **Use semantic versioning** for documentation releases
