---
layout: default
title: Text Extraction Utility
description: Comprehensive text parsing and manipulation system for extracting structured content from user input
---

# 📝 Text Extraction Utility

The **Text Extraction Utility** is a powerful text parsing and manipulation system designed to extract structured content from user input. It provides comprehensive tools for parsing hashtags, mentions, URLs, emojis, and other structured elements from text, as well as advanced text manipulation capabilities.

## 🎯 What is Text Extraction?

**Text extraction** is the process of identifying and extracting specific patterns or structured content from raw text. Think of it as a smart text analyzer that can:

- **Find hashtags** - Identify #tags in social media posts
- **Extract mentions** - Find @username references and user IDs
- **Locate URLs** - Identify web links in text
- **Parse emojis** - Extract emoji shortcodes like :smile:
- **Manipulate text** - Insert, replace, and modify text content intelligently

### Why Text Extraction is Important

In social media and content management applications, users often include structured elements in their text:

- **Social engagement** - Hashtags help categorize and discover content
- **User connections** - Mentions create links between users
- **Rich content** - URLs and emojis enhance the user experience
- **Data analysis** - Extracted elements can be analyzed for insights

## 🛠️ Core Components

### TextExtractor Class

The main class for extracting structured content from text.

#### `extractHashtags(text, includeHash)`

**Purpose**: Extract hashtags from text content.

**Parameters**:

- `text` (string) - The text to analyze
- `includeHash` (boolean, optional) - Whether to include the # symbol in results (default: true)

**Returns**: Array of hashtag strings

**Example**:

```typescript
const text = 'Check out this #amazing #javascript tutorial!';
const hashtags = TextExtractor.extractHashtags(text);
// Result: ["#amazing", "#javascript"]

const hashtagsWithoutSymbol = TextExtractor.extractHashtags(text, false);
// Result: ["amazing", "javascript"]
```

**How it works**:

- Uses regex pattern `/#(\w+)/g` to find hashtag patterns
- Captures word characters after the # symbol
- Returns array of found hashtags

#### `extractUserMentions(text)`

**Purpose**: Extract structured user mentions from text.

**Parameters**:

- `text` (string) - The text to analyze

**Returns**: Array of mention objects with:

- `username` (string) - The displayed username
- `userId` (string) - The unique user identifier
- `filterType` (string, optional) - Type of mention filter ('author' or 'mentions')
- `fullMatch` (string) - The complete mention text

**Example**:

```typescript
const text = 'Hey @[john_doe|user123] and @[jane_smith|user456|mentions]!';
const mentions = TextExtractor.extractUserMentions(text);
// Result: [
//   {
//     username: "john_doe",
//     userId: "user123",
//     filterType: undefined,
//     fullMatch: "@[john_doe|user123]"
//   },
//   {
//     username: "jane_smith",
//     userId: "user456",
//     filterType: "mentions",
//     fullMatch: "@[jane_smith|user456|mentions]"
//   }
// ]
```

**Mention Format**:

- **Standard**: `@[username|userId]`
- **Enhanced**: `@[username|userId|filterType]`

#### `extractUserIds(text)`

**Purpose**: Extract only the user IDs from mentions.

**Parameters**:

- `text` (string) - The text to analyze

**Returns**: Array of user ID strings

**Example**:

```typescript
const text = 'Meeting with @[alice|user789] and @[bob|user101]';
const userIds = TextExtractor.extractUserIds(text);
// Result: ["user789", "user101"]
```

#### `extractUrls(text)`

**Purpose**: Extract HTTP/HTTPS URLs from text.

**Parameters**:

- `text` (string) - The text to analyze

**Returns**: Array of URL strings

**Example**:

```typescript
const text = 'Visit https://example.com and http://test.org for more info';
const urls = TextExtractor.extractUrls(text);
// Result: ["https://example.com", "http://test.org"]
```

**URL Pattern**: Matches `https?://[^\s<>"{}|\\^`[\]]+`

#### `extractEmojiShortcodes(text)`

**Purpose**: Extract emoji shortcodes from text.

**Parameters**:

- `text` (string) - The text to analyze

**Returns**: Array of emoji shortcode strings (without colons)

**Example**:

```typescript
const text = "I'm so happy :smile: and excited :tada:!";
const emojis = TextExtractor.extractEmojiShortcodes(text);
// Result: ["smile", "tada"]
```

#### `extractAll(text)`

**Purpose**: Extract all structured content in one operation.

**Parameters**:

- `text` (string) - The text to analyze

**Returns**: Object containing all extracted content:

- `hashtags` - Array of hashtags
- `mentions` - Array of mention objects
- `userIds` - Array of user IDs
- `urls` - Array of URLs
- `emojiShortcodes` - Array of emoji shortcodes

**Example**:

```typescript
const text =
  'Check out #coding with @[dev|user123] at https://example.com :rocket:';
const extracted = TextExtractor.extractAll(text);
// Result: {
//   hashtags: ["#coding"],
//   mentions: [{ username: "dev", userId: "user123", ... }],
//   userIds: ["user123"],
//   urls: ["https://example.com"],
//   emojiShortcodes: ["rocket"]
// }
```

### TextManipulator Class

Advanced text manipulation and cursor management system.

#### `insertAtPosition(originalText, insertText, position)`

**Purpose**: Insert text at a specific position while tracking cursor movement.

**Parameters**:

- `originalText` (string) - The original text content
- `insertText` (string) - The text to insert
- `position` (number) - The character position to insert at

**Returns**: Object with:

- `newText` (string) - The modified text
- `newCursorPosition` (number) - Where the cursor should be positioned

**Example**:

```typescript
const result = TextManipulator.insertAtPosition(
  'Hello world!',
  ' beautiful',
  5
);
// Result: {
//   newText: "Hello beautiful world!",
//   newCursorPosition: 15
// }
```

**Use cases**:

- Inserting mentions at cursor position
- Adding hashtags or emojis
- Auto-completion of text elements

#### `replaceBetween(originalText, replaceText, startPosition, endPosition)`

**Purpose**: Replace text between two positions.

**Parameters**:

- `originalText` (string) - The original text content
- `replaceText` (string) - The replacement text
- `startPosition` (number) - Start position of replacement
- `endPosition` (number) - End position of replacement

**Returns**: Object with:

- `newText` (string) - The modified text
- `newCursorPosition` (number) - Where the cursor should be positioned

**Example**:

```typescript
const result = TextManipulator.replaceBetween(
  'The quick brown fox',
  'red',
  10,
  15 // Replace "brown"
);
// Result: {
//   newText: "The quick red fox",
//   newCursorPosition: 13
// }
```

**Use cases**:

- Replacing selected text
- Updating mentions or hashtags
- Text correction and editing

#### `findLastTrigger(text, position, triggers)`

**Purpose**: Find the last occurrence of trigger characters before a position.

**Parameters**:

- `text` (string) - The text to search in
- `position` (number) - The position to search before
- `triggers` (string[]) - Array of trigger characters to look for

**Returns**: Object with trigger info or null:

- `index` (number) - Position of the trigger character
- `character` (string) - The trigger character found
- `query` (string) - Text after the trigger character

**Example**:

```typescript
const result = TextManipulator.findLastTrigger(
  'Hello @john and #coding',
  20, // Position after "coding"
  ['@', '#']
);
// Result: {
//   index: 12,
//   character: "#",
//   query: "coding"
// }
```

**Use cases**:

- Implementing autocomplete for mentions (@)
- Hashtag suggestions (#)
- Emoji picker triggers (:)
- Command detection (/)

## 🔧 Technical Implementation

### Regular Expressions Used

The utility uses carefully crafted regular expressions for reliable pattern matching:

```typescript
// Hashtag pattern
const hashtagRegex = /#(\w+)/g;

// Mention pattern (structured format)
const mentionRegex = /@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]/g;

// URL pattern
const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

// Emoji shortcode pattern
const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;
```

### Performance Considerations

- **Efficient regex execution** - Uses global regex with proper reset
- **Memory management** - Processes text in single passes
- **Caching opportunities** - Results can be cached for repeated operations
- **Streaming support** - Can process large texts incrementally

### Error Handling

The utility includes robust error handling:

```typescript
// Safe text processing
if (!text) return [];

// Graceful fallbacks
try {
  // Process text
} catch (error) {
  console.warn('Text extraction failed:', error);
  return [];
}
```

## 🎨 Integration Examples

### React Component Integration

```typescript
import { TextExtractor, TextManipulator } from '@/lib/utils/text-extraction';

function SocialPostEditor() {
  const [text, setText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Extract structured content
    const extracted = TextExtractor.extractAll(newText);
    console.log('Hashtags:', extracted.hashtags);
    console.log('Mentions:', extracted.mentions);
  };

  const insertMention = (username: string, userId: string) => {
    const mentionText = `@[${username}|${userId}]`;
    const result = TextManipulator.insertAtPosition(
      text,
      mentionText,
      cursorPosition
    );

    setText(result.newText);
    setCursorPosition(result.newCursorPosition);
  };

  return (
    <textarea
      value={text}
      onChange={(e) => handleTextChange(e.target.value)}
      onSelect={(e) => setCursorPosition(e.target.selectionStart)}
    />
  );
}
```

### API Integration

```typescript
// Process user input on the server
import { TextExtractor } from '@/lib/utils/text-extraction';

export async function processUserPost(content: string) {
  const extracted = TextExtractor.extractAll(content);

  // Store hashtags for discovery
  await saveHashtags(extracted.hashtags);

  // Create user notifications for mentions
  await notifyMentionedUsers(extracted.userIds);

  // Process URLs for link previews
  await generateLinkPreviews(extracted.urls);

  return {
    content,
    metadata: {
      hashtags: extracted.hashtags,
      mentions: extracted.mentions,
      urls: extracted.urls,
      emojis: extracted.emojiShortcodes
    }
  };
}
```

## 🐛 Common Issues and Solutions

### Issue: "Hashtags not detected in non-English text"

**Solution**: The current regex uses `\w+` which may not capture all Unicode characters. For international support, consider using `[^\s#]+` pattern.

### Issue: "Mentions with special characters break parsing"

**Solution**: Ensure usernames are properly encoded when creating mention format. Use URL encoding for special characters.

### Issue: "URLs with query parameters get truncated"

**Solution**: The URL regex is designed to stop at whitespace and common delimiters. This is intentional to avoid capturing surrounding punctuation.

### Issue: "Cursor position becomes incorrect after text manipulation"

**Solution**: Always use the `newCursorPosition` returned by TextManipulator methods to maintain proper cursor tracking.

## 🔒 Security Considerations

### Input Validation

- **Sanitize extracted content** - Always validate extracted URLs, usernames, and hashtags
- **Prevent injection attacks** - Don't directly execute or render extracted content without sanitization
- **Rate limiting** - Limit the number of mentions/hashtags per post to prevent spam

### Content Filtering

```typescript
// Example security wrapper
function secureExtractHashtags(text: string): string[] {
  const hashtags = TextExtractor.extractHashtags(text);

  return hashtags.filter((tag) => {
    // Remove potentially harmful content
    return (
      tag.length <= 50 &&
      !tag.includes('<script>') &&
      /^[a-zA-Z0-9_-]+$/.test(tag)
    );
  });
}
```

## 🚀 Best Practices

### For Developers

1. **Always validate input** - Check for null/undefined text before processing
2. **Use appropriate extraction methods** - Don't use `extractAll()` if you only need hashtags
3. **Cache results when possible** - Extraction can be expensive for large texts
4. **Handle edge cases** - Empty strings, very long texts, malformed patterns

### For Performance

1. **Batch operations** - Process multiple texts together when possible
2. **Lazy evaluation** - Only extract what you need when you need it
3. **Memory management** - Clear large result arrays when done
4. **Streaming for large content** - Process very large texts in chunks

### For User Experience

1. **Real-time feedback** - Show extracted elements as user types
2. **Visual indicators** - Highlight hashtags, mentions, and URLs in the UI
3. **Autocomplete integration** - Use `findLastTrigger()` for smart suggestions
4. **Error recovery** - Gracefully handle malformed input

## 📚 Related Documentation

- **[Content Parsers](content-parsers.html)** - Advanced content parsing and tokenization
- **[Rich Text Parser](rich-text-parser.html)** - Markdown and rich text processing
- **[Emoji Parser](emoji-parser.html)** - Emoji processing and rendering
- **[Components - Rich Input System](../components/rich-input-system/)** - UI components using text extraction

## 🔗 External Resources

- **[Regular Expressions Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)** - MDN Web Docs
- **[Unicode in JavaScript](https://mathiasbynens.be/notes/javascript-unicode)** - Unicode handling best practices
- **[Text Processing Performance](https://v8.dev/blog/regexp-tier-up)** - V8 regex optimization

---

_The Text Extraction Utility provides the foundation for intelligent text processing in social media applications. It enables rich user experiences while maintaining performance and security._
