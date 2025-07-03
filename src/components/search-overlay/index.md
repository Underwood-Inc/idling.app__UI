---
layout: default
title: 'Search Overlay'
description: 'Contextual search and suggestion overlay for rich text inputs'
permalink: /components/search-overlay/
parent: Components
categories: [components, search, overlay]
tags: [search-overlay, suggestions, rich-input, ui-components]
---

# Search Overlay Component

## Overview

The Search Overlay provides contextual search and suggestion functionality for rich text inputs. It appears automatically when users type trigger characters like `#`, `@`, or `:`, offering real-time suggestions and search results.

## Key Features

- **Trigger-Based Activation** - Responds to `#`, `@`, `:` characters
- **Real-Time Search** - Instant results with debounced queries
- **Keyboard Navigation** - Arrow keys, Enter, Escape support
- **Smart Positioning** - Contextual placement near cursor
- **Multiple Content Types** - Hashtags, users, emojis
- **Loading States** - Visual feedback during search
- **Empty States** - Helpful messaging when no results found

## Trigger Types

### Hashtag Search (`#`)

- Searches existing hashtags in the system
- Shows usage counts and popularity
- Prevents duplicate selections
- Creates new hashtags when needed

### User Mentions (`@`)

- Searches active users by username and display name
- Shows profile pictures and user status
- Supports different mention types (author, general)
- Validates user existence

### Emoji Search (`:`)

- Searches emoji database by name and keywords
- Organized by categories
- Shows Unicode emoji with names
- Supports custom emoji sets

## Positioning Logic

The overlay intelligently positions itself:

- **Primary**: Below the trigger character
- **Fallback**: Above if insufficient space below
- **Constraints**: Stays within viewport bounds
- **Responsive**: Adjusts on window resize

## Integration Points

Works seamlessly with:

- [Rich Input System](/components/rich-input-system/) - Primary integration
- [Floating Toolbar](/components/floating-toolbar/) - Complementary interface

## Usage Examples

_Implementation examples coming soon..._

## API Reference

_Detailed API documentation coming soon..._

---

_This component is part of the Idling.app UI component library. For implementation details, see the [Development](/development/) section._
