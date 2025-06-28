---
layout: default
title: OG Image API
description: Generate dynamic Open Graph images with quotes and avatars
---

# 🖼️ OG Image API

The OG Image API generates beautiful Open Graph images dynamically with inspirational quotes, procedural backgrounds, and unique avatars. These images are used when sharing links to idling.app on social media platforms.

## 🎯 What are OG Images?

Open Graph images are the preview images you see when sharing links on:

- **Facebook** - Shows in post previews
- **Twitter** - Displays as card images
- **LinkedIn** - Appears in shared content
- **Discord** - Shows in link embeds
- **Slack** - Displays in message previews

## 📡 Endpoint

```
GET /api/og-image
```

**Response Format:**

- **Browser requests:** Redirects to interactive viewer (`/og-image-viewer`)
- **Bot/Crawler requests:** Direct image response (PNG by default, SVG with `?type=svg`)
- **Direct API access:** Use `?direct=true` to bypass browser redirect

**Cache:** 1 hour (3600 seconds)

## 🔧 Parameters

All parameters are optional. If not provided, the API will generate random content.

### Query Parameters

| Parameter | Type   | Description                       | Example               |
| --------- | ------ | --------------------------------- | --------------------- |
| `seed`    | string | Custom seed for avatar generation | `seed=john-doe-123`   |
| `quote`   | string | Custom quote text                 | `quote=Hello%20World` |
| `author`  | string | Custom quote author               | `author=Jane%20Doe`   |
| `random`  | string | Force randomization (true/false)  | `random=true`         |
| `type`    | string | Image format (png/svg)            | `type=svg`            |
| `direct`  | string | Bypass browser redirect           | `direct=true`         |

## 🎨 Features

### Dynamic Quote System

The API uses a **weighted round-robin system** to fetch quotes from multiple sources:

- **DummyJSON** (40% weight) - 100+ real quotes from historical figures
- **Quotable API** (30% weight) - Large database of authentic quotes
- **ZenQuotes** (20% weight) - 3,237+ quotes from influential people
- **API-Ninjas** (10% weight) - Premium quote database (requires API key)

### Procedural Backgrounds

Each image features a unique procedural background with:

- **3-8 random pattern layers** - Circles, lines, polygons, grids, waves
- **Seeded randomness** - Same seed always produces same pattern
- **Dynamic colors** - 8 vibrant colors that contrast with dark background
- **Predominant color borders** - Border color matches most-used pattern color

### Avatar Integration

- **@dicebear adventurer avatars** - Unique character for each generation
- **Fade mask effects** - Smooth transition from center to edges
- **SVG embedding** - Crisp, scalable avatar graphics
- **Random seeding** - Each request gets a unique avatar

### Text Rendering

- **Dynamic font sizing** - Adjusts based on quote length
- **Smart text wrapping** - Proper line breaks for readability
- **Glass background effect** - Dark semi-transparent background with blur
- **Responsive layout** - Text positioning adapts to content

## 🖥️ Interactive Viewer

When you access the OG Image API from a browser, you'll be redirected to an interactive viewer at `/og-image-viewer`. This viewer provides:

- **Visual preview** of the generated image
- **Right-click context menu** with save options
- **Download buttons** for PNG and SVG formats
- **Client-side SVG-to-PNG conversion** for perfect quality
- **Responsive design** that works on all devices

### Features of the Interactive Viewer

- **Context Menu**: Right-click on the image to save as PNG or SVG
- **Fallback Buttons**: Click the download buttons if right-click doesn't work
- **High Quality**: Client-side conversion preserves all details and patterns
- **Fast Performance**: No server-side processing for downloads
- **Mobile Friendly**: Touch-friendly interface for mobile devices

## 📖 Usage Examples

### Browser Usage

Open in your browser for interactive viewer:

```
https://idling.app/api/og-image
```

### Basic API Usage

Generate a random OG image (direct API):

```bash
curl https://idling.app/api/og-image?direct=true
```

### Custom Quote

Generate an image with your own quote:

```bash
curl "https://idling.app/api/og-image?quote=Hello%20World&author=Jane%20Doe"
```

### Seeded Generation

Generate a consistent image using a seed:

```bash
curl "https://idling.app/api/og-image?seed=my-unique-seed"
```

### Force Random

Generate a completely random image:

```bash
curl "https://idling.app/api/og-image?random=true"
```

## 🌐 Integration

### HTML Meta Tags

The OG image is automatically used in the site's meta tags:

```html
<!-- Open Graph -->
<meta property="og:image" content="https://idling.app/api/og-image" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Idling.app - Wisdom & Community" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://idling.app/api/og-image" />
```

### Custom Implementation

You can use the API to generate images for specific content:

```javascript
// Generate OG image for a specific post
const ogImageUrl = `https://idling.app/api/og-image?quote=${encodeURIComponent(postTitle)}&author=${encodeURIComponent(postAuthor)}`;

// Use in meta tags
document.querySelector('meta[property="og:image"]').content = ogImageUrl;
```

## 📊 Response Format

### Success Response

**Content-Type:** `image/svg+xml`

**Status:** `200 OK`

**Cache-Control:** `public, max-age=3600`

The response is a complete SVG image with:

- **1200x630 dimensions** - Standard OG image size
- **Embedded avatar** - Base64-encoded SVG avatar
- **Procedural patterns** - Dynamic background elements
- **Styled text** - Quote and author with proper formatting
- **Glass effects** - Modern UI elements with blur and transparency

### Error Response

If generation fails, a fallback SVG is returned:

```svg
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <!-- Fallback pattern -->
  <text x="600" y="280" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="48px">Idling.app</text>
  <text x="600" y="350" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, sans-serif" font-size="24px">Wisdom &amp; Community</text>
</svg>
```

## 🔧 Technical Details

### Quote API Fallback System

If external quote APIs fail, the system uses these fallback quotes:

1. "The mind is everything. What you think you become." — Buddha
2. "Peace comes from within. Do not seek it without." — Buddha
3. "Idling is the art of being present in the moment." — Idling.app
4. "Every moment is a fresh beginning." — T.S. Eliot
5. "The journey of a thousand miles begins with one step." — Lao Tzu
6. "Believe you can and you're halfway there." — Theodore Roosevelt

### Environment Variables

To enable API-Ninjas quotes (optional):

```bash
# Add to .env.local
API_NINJAS_API_KEY=your_api_key_here
```

Get a free API key at [api-ninjas.com/api/quotes](https://api-ninjas.com/api/quotes)

### Performance

- **Edge Runtime** - Fast response times globally
- **SVG Format** - Lightweight, scalable images
- **1 Hour Cache** - Reduces API calls and improves performance
- **Fallback System** - Always returns a valid image

## 🎨 Customization

### Pattern Generation

The procedural background uses these pattern types:

1. **Scattered Circles** - Random circles of varying sizes
2. **Random Lines** - Lines at various angles and positions
3. **Random Polygons** - Triangular and geometric shapes
4. **Grid Patterns** - Organized grids with rotation
5. **Wave Patterns** - Flowing curved lines

### Color Palette

The system uses 8 vibrant colors:

- `#ff6b35` - Orange (brand color)
- `#118ab2` - Blue (brand color)
- `#06d6a0` - Green
- `#f72585` - Pink
- `#7209b7` - Purple
- `#ffd60a` - Yellow
- `#f77f00` - Amber
- `#d00000` - Red

## 🚀 Best Practices

### For Social Sharing

- **Use custom quotes** for specific content
- **Include meaningful authors** for credibility
- **Test on multiple platforms** to ensure compatibility
- **Use consistent seeding** for repeated shares of same content

### For Performance

- **Cache images** when possible
- **Use appropriate seeds** to avoid regeneration
- **Don't make rapid requests** to respect rate limits
- **Handle fallbacks gracefully** in case of API errors

## 🔗 Related APIs

- **[Avatar Image API](./avatar-image)** - Standalone avatar generation _(coming soon)_
- **[Upload APIs](./upload)** - Custom image uploads

---

_The OG Image API helps make your shared content more engaging and visually appealing across all social media platforms._
