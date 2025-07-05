---
layout: default
title: 'Idling.app Documentation'
description: 'Complete documentation for the Idling.app project - development guides, API reference, architecture, and community resources'
permalink: /
---

# 🎯 Idling.app Documentation

Welcome to the comprehensive documentation for **Idling.app** - your complete resource for development, deployment, and community contribution! 🚀

## 📚 Documentation Sections

### 🚀 [Documentation](/)

Complete project documentation including getting started guides, API reference, architecture details, and deployment procedures.

- **🔧 Getting Started** - Installation, quick start, and Docker setup
- **🔌 API Reference** - Complete API documentation with interactive tools
- **🏗️ Architecture** - System design, security, and performance
- **🚀 Deployment** - Production setup and release processes

### 🛠️ [Development](/development/)

Development tools, resources, and component documentation for contributors and maintainers.

- **🧩 Components** - UI components and design system
- **🗄️ Database** - Schema management and optimization
- **📚 Libraries** - Shared utilities and services
- **🧪 Testing** - Unit, E2E, and CI/CD strategies
- **🔧 Tools** - Development environment and debugging

### 👥 [Community](/community/)

Project community resources, contribution guidelines, and communication channels.

- **🤝 Contributing** - How to contribute to the project
- **📝 Standards** - Development and documentation standards
- **💬 Communication** - Discord, GitHub, and project updates
- **📊 Project Info** - Reports, roadmap, and news

## 📊 Documentation Statistics

{% include documentation-coverage-badge.html %}

- **Total Documentation Files**: 115+ markdown files
- **Co-located Documentation**: 88 files in `src/` directory
- **Documentation Coverage**: 21% of directories documented
- **Search Index**: Real-time search across all content

## 🎯 Quick Navigation

<div class="quick-nav-grid">
  <div class="nav-card">
    <h3>🚀 Get Started</h3>
    <p>New to the project? Start here!</p>
    <a href="/getting-started/" class="btn-primary">Begin Setup</a>
  </div>
  
  <div class="nav-card">
    <h3>🔌 API Docs</h3>
    <p>Explore our comprehensive API</p>
    <a href="/api/" class="btn-primary">View API</a>
  </div>
  
  <div class="nav-card">
    <h3>🧩 Components</h3>
    <p>UI components and design system</p>
    <a href="/development/components/" class="btn-primary">Browse Components</a>
  </div>
  
  <div class="nav-card">
    <h3>🤝 Contribute</h3>
    <p>Join our development community</p>
    <a href="/community/contributing/" class="btn-primary">Start Contributing</a>
  </div>
</div>

## 🔧 Development Status

This documentation uses a **co-located approach** where documentation lives next to the code it describes. This ensures:

- ✅ **Always Up-to-Date** - Docs are updated with code changes
- ✅ **Easy to Find** - Documentation is where you expect it
- ✅ **Developer Friendly** - No context switching required
- ✅ **Comprehensive Coverage** - Every component and feature documented

## 🎨 Features

- **🔍 Real-time Search** - Find any documentation instantly
- **📱 Responsive Design** - Works on all devices
- **🎯 Smart Navigation** - Hierarchical organization
- **📊 Coverage Tracking** - Monitor documentation completeness
- **🔗 Cross-references** - Linked documentation ecosystem

---

<div class="footer-note">
💡 **Tip**: Use the search bar above to quickly find specific topics, or browse by category using the navigation menu.
</div>

<style>
.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.nav-card {
  background: var(--dark-background--secondary, #2a2a2a) !important;
  border: 1px solid var(--glass-border-overlay-medium, #444444) !important;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  backdrop-filter: var(--glass-blur-medium);
  -webkit-backdrop-filter: var(--glass-blur-medium);
}

.nav-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
  background: var(--dark-background--tertiary, #333333) !important;
  border-color: var(--hunyadi-yellow, #EDAE49) !important;
}

.nav-card h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary, #ffffff) !important;
  font-weight: 600;
}

.nav-card p {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary, #cccccc) !important;
  line-height: 1.5;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--hunyadi-yellow, #EDAE49) !important;
  color: var(--dark-background--primary, #1a1a1a) !important;
  text-decoration: none !important;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: 1px solid var(--hunyadi-yellow, #EDAE49);
  box-shadow: 0 2px 4px rgba(237, 174, 73, 0.2);
}

.btn-primary:hover,
.btn-primary:visited,
.btn-primary:active,
.btn-primary:focus {
  background: var(--dark-goldenrod, #B8860B) !important;
  text-decoration: none !important;
  color: var(--dark-background--primary, #1a1a1a) !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(237, 174, 73, 0.4);
  border-color: var(--dark-goldenrod, #B8860B);
}

.btn-primary:visited {
  background: var(--hunyadi-yellow, #EDAE49) !important;
  color: var(--dark-background--primary, #1a1a1a) !important;
  transform: none;
  box-shadow: 0 2px 4px rgba(237, 174, 73, 0.2);
}

.footer-note {
  background: var(--dark-background--secondary, #2a2a2a) !important;
  border: 1px solid var(--glass-border-overlay-medium, #444444) !important;
  border-radius: 8px;
  padding: 1rem;
  margin: 2rem 0;
  text-align: center;
  color: var(--text-secondary, #cccccc) !important;
  backdrop-filter: var(--glass-blur-light);
  -webkit-backdrop-filter: var(--glass-blur-light);
}

@media (max-width: 768px) {
  .quick-nav-grid {
    grid-template-columns: 1fr;
  }
  
  .nav-card {
    padding: 1.25rem;
  }
  
  .btn-primary {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }
}
</style>
