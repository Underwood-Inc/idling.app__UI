---
layout: default
title: Search Functionality
nav_order: 5
parent: Development
---

# Search Functionality

The documentation site includes a powerful search feature powered by Lunr.js that allows you to quickly find information across all pages.

## How to Search

### Using the Search Box
1. Click on the search input in the header
2. Type at least 3 characters to start searching
3. Results will appear in real-time as you type
4. Click on any result to navigate to that page

### Keyboard Shortcuts
- **Ctrl+K** (Windows/Linux) or **Cmd+K** (Mac): Focus the search input from anywhere on the site
- **Arrow Keys**: Navigate through search results
- **Enter**: Open the selected result
- **Escape**: Close search results

## Search Features

- **Real-time results**: Search results appear as you type
- **Fuzzy matching**: Find content even with slight misspellings
- **Content ranking**: Results are ranked by relevance
- **Keyboard navigation**: Full keyboard support for accessibility
- **Mobile responsive**: Works seamlessly on all devices

## What Gets Searched

The search indexes:
- Page titles (highest priority)
- Page content
- Headers and subheadings
- Code examples and snippets

## Search Tips

1. **Use specific terms**: More specific searches return better results
2. **Try different keywords**: If you don't find what you're looking for, try synonyms
3. **Search for code**: You can search for function names, variables, and code snippets
4. **Partial matches**: You don't need to type complete words

## Technical Implementation

The search is powered by:
- **Lunr.js**: Client-side full-text search engine
- **Jekyll**: Generates search index at build time
- **JSON**: Search data is served as lightweight JSON
- **Vanilla JavaScript**: No framework dependencies

The search index is built automatically when the site is generated and includes all pages and posts in the documentation. 