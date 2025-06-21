# Rich Text Parser System

A comprehensive, zero-dependency parsing system for rich content including markdown, emojis, images, and existing content pills (hashtags, mentions, URLs).

## Features

- **Markdown Support**: Bold, italic, code, links, strikethrough, underline, blockquotes, lists
- **Emoji Support**: Unicode emojis + custom emoji registry with runtime additions
- **Image Embeds**: Multiple formats (markdown, HTML, custom) with security controls
- **Content Pills**: Hashtags, mentions, and URL pills (existing system)
- **Zero Dependencies**: No external libraries required
- **Security First**: XSS protection, URL sanitization, domain whitelisting
- **Scalable**: Modular architecture, easy to extend

## Quick Start

### Basic Usage

```typescript
import { richTextParser } from '@/lib/utils/parsers/rich-text-parser';

// Parse and render content
const content = "Hello **world**! :smile: Check out ![this image](https://example.com/image.jpg)";
const html = richTextParser.replaceWithHtml(content);
```

### React Component

```tsx
import RichTextRenderer from '@/app/components/rich-text/RichTextRenderer';

function MyComponent() {
  const content = "**Bold text** with :fire: emoji and #hashtag";
  
  return (
    <RichTextRenderer 
      content={content}
      onEmojiClick={(emojiId) => console.log('Clicked emoji:', emojiId)}
      onImageClick={(src) => console.log('Clicked image:', src)}
    />
  );
}
```

## Supported Syntax

### Markdown

| Syntax | Result | Example |
|--------|--------|---------|
| `**bold**` | **bold** | `**Hello world**` |
| `*italic*` | *italic* | `*emphasized text*` |
| `~~strikethrough~~` | ~~strikethrough~~ | `~~deleted text~~` |
| `<u>underline</u>` | <u>underline</u> | `<u>important</u>` |
| `` `code` `` | `code` | `` `console.log()` `` |
| `[link](url)` | [link](url) | `[Google](https://google.com)` |
| `> quote` | > quote | `> This is a quote` |
| `- list item` | • list item | `- First item` |

### Emojis

| Syntax | Result | Notes |
|--------|--------|-------|
| `:smile:` | 😄 | Standard Unicode emoji |
| `:custom_emoji:` | ![custom] | Custom emoji (if registered) |

**Built-in Emojis**: smile, joy, heart_eyes, wink, thinking, thumbsup, thumbsdown, clap, wave, heart, fire, rocket, star, trophy, computer, sun, moon, tree, flower, and more.

### Images

| Format | Syntax | Example |
|--------|--------|---------|
| Markdown | `![alt](url "title")` | `![Logo](https://example.com/logo.png "Company Logo")` |
| HTML | `<img src="url" alt="alt">` | `<img src="https://example.com/image.jpg" alt="Photo">` |
| Custom | `{img:url\|alt\|title\|width\|height}` | `{img:https://example.com/pic.jpg\|Photo\|My Photo\|400\|300}` |

### Content Pills (Existing System)

| Type | Syntax | Example |
|------|--------|---------|
| Hashtag | `#tagname` | `#javascript` |
| Mention | `@[username\|userId]` | `@[john\|123]` |
| Enhanced Mention | `@[username\|userId\|filterType]` | `@[john\|123\|author]` |
| URL Pill | `![behavior](url)` | `![embed](https://youtube.com/watch?v=abc)` |

## API Reference

### RichTextParser

```typescript
class RichTextParser {
  constructor(config?: RichTextConfig)
  parse(text: string): RichTextToken[]
  replaceWithHtml(text: string): string
  tokensToHtml(tokens: RichTextToken[]): string
  updateConfig(config: Partial<RichTextConfig>): void
  addCustomEmoji(emoji: EmojiDefinition): void
}
```

### Configuration

```typescript
interface RichTextConfig {
  enableMarkdown?: boolean;     // Default: true
  enableEmojis?: boolean;       // Default: true
  enableImages?: boolean;       // Default: true
  enableHashtags?: boolean;     // Default: true
  enableMentions?: boolean;     // Default: true
  enableUrls?: boolean;         // Default: true
  imageConfig?: {
    maxWidth?: number;          // Default: 800
    maxHeight?: number;         // Default: 600
    allowedDomains?: string[];  // Default: common CDNs
  };
}
```

### Individual Parsers

#### MarkdownParser

```typescript
class MarkdownParser {
  static parse(text: string): MarkdownToken[]
  static tokensToHtml(tokens: MarkdownToken[]): string
}
```

#### EmojiParser

```typescript
class EmojiParser {
  parse(text: string): EmojiToken[]
  replaceEmojisWithHtml(text: string): string
  getSuggestions(query: string, limit?: number): EmojiDefinition[]
  addCustomEmoji(emoji: EmojiDefinition): void
}
```

#### ImageParser

```typescript
class ImageParser {
  constructor(config?: ImageConfig)
  parse(text: string): ImageToken[]
  replaceImagesWithHtml(text: string): string
  updateConfig(config: Partial<ImageConfig>): void
}
```

## Advanced Usage

### Custom Emoji Registry

```typescript
import { emojiRegistry } from '@/lib/utils/parsers/emoji-parser';

// Add custom emoji
emojiRegistry.registerEmoji({
  id: 'custom_logo',
  name: 'custom_logo',
  imageUrl: 'https://example.com/logo.png',
  category: 'custom',
  tags: ['logo', 'brand'],
  aliases: ['logo', 'brand']
});

// Search emojis
const results = emojiRegistry.searchEmojis('happy');
```

### Image Security Configuration

```typescript
import { imageParser } from '@/lib/utils/parsers/image-parser';

imageParser.updateConfig({
  maxWidth: 1200,
  maxHeight: 800,
  allowedDomains: [
    'imgur.com',
    'github.com',
    'your-cdn.com'
  ],
  allowedExtensions: ['jpg', 'png', 'gif', 'webp']
});
```

### Selective Parsing

```typescript
// Only enable specific features
const parser = new RichTextParser({
  enableMarkdown: true,
  enableEmojis: true,
  enableImages: false,  // Disable images
  enableHashtags: false, // Disable hashtags
  enableMentions: true,
  enableUrls: true
});
```

### Token-Level Processing

```typescript
const tokens = richTextParser.parse("**Bold** text with :smile:");

tokens.forEach(token => {
  switch (token.type) {
    case 'markdown':
      console.log('Markdown:', token.markdownType, token.content);
      break;
    case 'emoji':
      console.log('Emoji:', token.emojiId, token.emojiUnicode);
      break;
    case 'text':
      console.log('Text:', token.content);
      break;
  }
});
```

## React Components

### RichTextRenderer

```tsx
<RichTextRenderer
  content="Your **rich** content here :smile:"
  config={{
    enableMarkdown: true,
    enableEmojis: true,
    enableImages: true
  }}
  onEmojiClick={(emojiId) => handleEmojiClick(emojiId)}
  onImageClick={(src) => openImageModal(src)}
  onLinkClick={(url) => handleLinkClick(url)}
  maxLength={500}
  className="my-rich-text"
/>
```

### EmojiPicker

```tsx
<EmojiPicker
  onEmojiSelect={(emoji) => insertEmoji(emoji)}
  categories={['faces', 'gestures', 'hearts']}
  searchQuery={searchTerm}
  maxResults={30}
/>
```

### EmojiRenderer

```tsx
<EmojiRenderer
  emojiId="smile"
  size="large"
  className="my-emoji"
/>
```

## Security Features

### XSS Protection
- All user input is escaped before rendering
- HTML attributes are sanitized
- Dangerous protocols (javascript:, data:) are blocked

### URL Sanitization
- Only HTTPS URLs allowed for external content
- Domain whitelisting for images
- Protocol validation for all links

### Content Security Policy
- Image sources are validated against allowlist
- Custom emoji URLs are sanitized
- File extension validation for images

## Performance Considerations

### Parsing Order
1. **Images** (highest priority - avoid markdown conflicts)
2. **Content Pills** (hashtags, mentions, URLs)
3. **Markdown** (after URLs to prevent conflicts)
4. **Emojis** (lowest priority - fill remaining text)

### Optimization Tips
- Use `useMemo` in React components to cache parsed content
- Implement debouncing for real-time preview
- Consider pagination for large emoji sets
- Use lazy loading for custom emoji images

## Browser Support

- **Modern Browsers**: Full support (Chrome 80+, Firefox 75+, Safari 13+)
- **Legacy Browsers**: Graceful degradation (emojis show as text)
- **Mobile**: Responsive design with touch-friendly controls

## Migration from Existing System

The new parser is fully backward compatible with existing content pills:

```typescript
// Old way (still works)
import { renderContentWithPills } from '@/lib/utils/content-parsers';
const html = renderContentWithPills(content);

// New way (enhanced features)
import { renderRichContent } from '@/lib/utils/content-parsers';
const html = renderRichContent(content, {
  enableMarkdown: true,
  enableEmojis: true,
  enableImages: true
});
```

## Examples

### Blog Post Content
```typescript
const blogContent = `
# My Blog Post

This is **bold** and *italic* text with some \`code\`.

> Here's an important quote

Check out this image: ![Screenshot](https://example.com/screenshot.png)

And here's a custom emoji: :custom_logo:

Don't forget to follow me: @[username|123] and check out #webdev
`;

const html = richTextParser.replaceWithHtml(blogContent);
```

### Social Media Post
```typescript
const socialPost = `
Just launched my new app! :rocket: :fire:

**Features:**
- Real-time chat :speech_balloon:
- Image sharing ![Camera](https://example.com/camera.png)
- Custom emojis :custom_heart:

Check it out: ![link](https://myapp.com)

#webapp #javascript #react
`;
```

### Comment System
```typescript
const comment = `
Great post @[author|456]! :thumbsup:

The part about **performance optimization** was especially helpful.

Here's a related article: ![link](https://example.com/article)
`;
```

## Troubleshooting

### Common Issues

1. **Emojis not showing**: Check emoji registry and ensure proper aliases
2. **Images not loading**: Verify domain whitelist and HTTPS requirements
3. **Markdown conflicts**: Review parsing order and escape special characters
4. **Performance issues**: Implement memoization and debouncing

### Debug Mode

```typescript
// Enable debug logging
const parser = new RichTextParser();
const tokens = parser.parse(content);
console.log('Parsed tokens:', tokens);
```

### Testing

```typescript
// Test individual parsers
import { MarkdownParser } from '@/lib/utils/parsers/markdown-parser';
const tokens = MarkdownParser.parse('**test**');
console.log(tokens); // [{ type: 'bold', content: 'test', ... }]
``` 