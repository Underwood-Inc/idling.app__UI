---
layout: default
title: Emoji APIs
description: Complete guide to emoji-related API endpoints for browsing, using, and tracking emojis
---

# 😀 Emoji APIs

This guide explains how to work with emojis in the idling.app through our API endpoints. Whether you want to browse emojis, track usage, or manage custom emojis, this documentation has you covered.

## 🎯 What Are Emoji APIs?

Our emoji system lets users:
- **Browse available emojis** (built-in and custom)
- **Use emojis in posts** and comments
- **Upload custom emojis** for approval
- **Track popular emojis** to see what people use most

Think of it like a digital sticker collection that everyone can share and use!

## 📚 Available Endpoints

### GET /api/emojis - Browse All Emojis

**What it does:** Get a list of all available emojis (both system emojis and approved custom ones)

**Who can use it:** Everyone (no login required)

**How to use it:**
```bash
curl https://yourdomain.com/api/emojis
```

**Query Parameters:**
- `page` - Which page of results (default: 1)
- `per_page` - How many emojis per page (default: 50, max: 100)
- `category` - Filter by category (e.g., "smileys", "animals")
- `search` - Search for specific emojis by name
- `os` - Your operating system ("windows", "mac", "linux") for best compatibility

**Example requests:**
```bash
# Get first 20 emojis
curl "https://yourdomain.com/api/emojis?per_page=20"

# Search for heart emojis
curl "https://yourdomain.com/api/emojis?search=heart"

# Get animal emojis for Windows
curl "https://yourdomain.com/api/emojis?category=animals&os=windows"
```

**Success Response (200):**
```json
{
  "emojis": [
    {
      "id": 1,
      "emoji_id": "grinning-face",
      "unicode_char": "😀",
      "name": "grinning face",
      "description": "A happy, grinning face",
      "category": {
        "id": 1,
        "name": "smileys",
        "display_name": "Smileys & Emotion"
      },
      "tags": ["happy", "smile", "joy"],
      "aliases": ["grinning", "happy"],
      "usage_count": 150,
      "is_custom": false
    },
    {
      "id": 2,
      "emoji_id": "custom-celebration",
      "name": "celebration",
      "description": "Custom celebration emoji",
      "category": {
        "id": 10,
        "name": "custom",
        "display_name": "Custom"
      },
      "tags": ["party", "celebrate"],
      "custom_image_url": "/uploads/emojis/celebration.png",
      "usage_count": 25,
      "is_custom": true,
      "is_approved": true
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "smileys",
      "display_name": "Smileys & Emotion",
      "emoji_count": 156
    }
  ],
  "os_info": {
    "os": "windows",
    "version": "10",
    "is_supported": true,
    "emoji_support": {
      "supports_unicode": true,
      "supports_custom": true,
      "max_emoji_version": "15.0",
      "recommended_format": "unicode"
    }
  },
  "total_count": 1247,
  "page": 1,
  "per_page": 50
}
```

**What each field means:**
- **emoji_id**: Unique identifier for the emoji
- **unicode_char**: The actual emoji character (for system emojis)
- **name**: Human-readable name
- **description**: What the emoji represents
- **category**: What group it belongs to
- **tags**: Keywords for searching
- **aliases**: Other names for the same emoji
- **usage_count**: How many times it's been used
- **is_custom**: Whether it's a user-uploaded emoji
- **custom_image_url**: URL to the custom emoji image
- **is_approved**: Whether custom emoji is approved for use

### POST /api/emojis/usage - Track Emoji Usage

**What it does:** Record that someone used a specific emoji (for statistics and recommendations)

**Who can use it:** Everyone (no login required)

**How to use it:**
```bash
curl -X POST https://yourdomain.com/api/emojis/usage \
  -H "Content-Type: application/json" \
  -d '{
    "emoji_id": "grinning-face",
    "emoji_type": "windows"
  }'
```

**Required Data:**
- `emoji_id` - The ID of the emoji that was used
- `emoji_type` - Type of emoji: "windows", "mac", or "custom"

**Success Response (200):**
```json
{
  "success": true,
  "message": "Emoji usage tracked successfully"
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "Missing required fields: emoji_id and emoji_type"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid emoji_type. Must be one of: windows, mac, custom"
}
```

## 🔧 How to Use Emojis in Your App

### 1. Display Emojis in a Picker

```javascript
// Fetch emojis for your emoji picker
async function loadEmojis() {
  try {
    const response = await fetch('/api/emojis?per_page=100');
    const data = await response.json();
    
    // Group emojis by category
    const emojisByCategory = {};
    data.emojis.forEach(emoji => {
      const categoryName = emoji.category.name;
      if (!emojisByCategory[categoryName]) {
        emojisByCategory[categoryName] = [];
      }
      emojisByCategory[categoryName].push(emoji);
    });
    
    return emojisByCategory;
  } catch (error) {
    console.error('Failed to load emojis:', error);
    return {};
  }
}
```

### 2. Search for Specific Emojis

```javascript
// Search for emojis as user types
async function searchEmojis(query) {
  try {
    const response = await fetch(`/api/emojis?search=${encodeURIComponent(query)}&per_page=20`);
    const data = await response.json();
    return data.emojis;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}
```

### 3. Track Emoji Usage

```javascript
// Track when user selects an emoji
async function trackEmojiUsage(emojiId, emojiType) {
  try {
    await fetch('/api/emojis/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emoji_id: emojiId,
        emoji_type: emojiType
      })
    });
  } catch (error) {
    console.error('Failed to track emoji usage:', error);
  }
}
```

### 4. Handle Different Operating Systems

```javascript
// Detect user's operating system for best emoji support
function detectOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('mac')) return 'mac';
  return 'linux';
}

// Load emojis optimized for user's OS
async function loadOptimizedEmojis() {
  const os = detectOS();
  const response = await fetch(`/api/emojis?os=${os}&per_page=100`);
  return response.json();
}
```

## 🎨 Emoji Categories

Our emojis are organized into these categories:

### System Categories (Unicode Emojis)
- **Smileys & Emotion** - 😀😊😂🥰😍
- **People & Body** - 👋👍👎🙏💪
- **Animals & Nature** - 🐶🐱🌳🌸🌟
- **Food & Drink** - 🍎🍕🍰☕🍺
- **Travel & Places** - 🚗🏠🌍🏖️⛰️
- **Activities** - ⚽🎮🎵🎨📚
- **Objects** - 📱💻⌚🎁💡
- **Symbols** - ❤️⭐✅❌💯
- **Flags** - 🇺🇸🇬🇧🇯🇵🇨🇦🇦🇺

### Custom Categories
- **Community** - User-uploaded emojis approved by moderators
- **Seasonal** - Holiday and season-specific emojis
- **Brand** - App-specific and branded emojis

## 🔍 Search Tips

### Effective Search Queries
- **By emotion**: "happy", "sad", "angry", "excited"
- **By object**: "heart", "star", "car", "house"
- **By activity**: "dance", "eat", "sleep", "work"
- **By color**: "red", "blue", "green" (for custom emojis)

### Search Examples
```bash
# Find all heart-related emojis
curl "https://yourdomain.com/api/emojis?search=heart"

# Find celebration emojis
curl "https://yourdomain.com/api/emojis?search=party"

# Find food emojis
curl "https://yourdomain.com/api/emojis?category=food"
```

## 📊 Usage Statistics

### Popular Emojis
The API automatically tracks which emojis are used most frequently. This helps with:
- **Showing popular emojis first** in pickers
- **Recommending emojis** to users
- **Understanding community preferences**

### How Usage Tracking Works
1. **User selects an emoji** in the app
2. **App calls the usage API** to record it
3. **Usage count increases** for that emoji
4. **Popular emojis appear higher** in results

## 🚨 Common Issues and Solutions

### Emoji Not Displaying Correctly

**Problem:** Emoji shows as a square or question mark
**Solution:** 
- Check if the user's system supports that emoji version
- Use the OS-specific endpoint to get compatible emojis
- Provide fallback custom images for newer emojis

### Slow Emoji Loading

**Problem:** Emoji picker takes too long to load
**Solution:**
- Use pagination (`per_page` parameter)
- Cache emoji data in localStorage
- Load most popular emojis first

### Search Not Finding Emojis

**Problem:** Users can't find the emoji they want
**Solution:**
- Search in both `name` and `tags` fields
- Use partial matching (the API handles this automatically)
- Provide category filtering options

## 💡 Best Practices

### For App Developers

**Caching:**
```javascript
// Cache emojis for better performance
const EMOJI_CACHE_KEY = 'emojis_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCachedEmojis() {
  const cached = localStorage.getItem(EMOJI_CACHE_KEY);
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp < CACHE_DURATION) {
      return data.emojis;
    }
  }
  return null;
}

function setCachedEmojis(emojis) {
  localStorage.setItem(EMOJI_CACHE_KEY, JSON.stringify({
    emojis,
    timestamp: Date.now()
  }));
}
```

**Error Handling:**
```javascript
async function safeEmojiRequest(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Emoji API error:', error);
    // Return fallback emojis or empty array
    return { emojis: [], total_count: 0 };
  }
}
```

**Performance:**
- Load emojis in chunks (use pagination)
- Implement virtual scrolling for large lists
- Preload popular emojis
- Use image optimization for custom emojis

### For Users

**Finding the Right Emoji:**
1. **Search by feeling** - "happy", "sad", "excited"
2. **Search by object** - "heart", "star", "food"
3. **Browse by category** - Look in the right section
4. **Use aliases** - Many emojis have multiple names

---

## 🔗 Related Documentation

- **[Admin Emoji APIs](./admin-emojis)** - Managing and approving custom emojis
- **[Upload APIs](./upload)** - Uploading custom emoji images
- **[User Guide](../getting-started)** - How to use emojis in the app

---

*The emoji system makes communication more fun and expressive. These APIs help you build rich emoji experiences for your users!* 