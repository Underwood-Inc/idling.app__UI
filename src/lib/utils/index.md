---
title: 🛠️ Utility Functions
category: api-documentation
tags: [api, documentation]
---

# 🛠️ Utility Functions

This directory contains utility functions and helpers used throughout the idling.app application. Each utility is designed to be modular, reusable, and well-tested.

## 📁 Directory Structure

```
src/lib/utils/
├── README.md                    # This file - overview of all utilities
├── array/                       # Array manipulation utilities
│   ├── README.md               # Array utilities documentation
│   └── dedupe-string-array.ts  # Remove duplicates from string arrays
├── parsers/                    # Content parsing utilities
│   ├── README.md               # Parser utilities documentation
│   ├── emoji-parser.ts         # Emoji processing and rendering
│   ├── image-parser.ts         # Image URL and metadata parsing
│   ├── markdown-parser.ts      # Markdown to HTML conversion
│   └── rich-text-parser.ts     # Rich text content processing
├── string/                     # String manipulation utilities
│   ├── README.md               # String utilities documentation
│   ├── index.ts                # String utilities exports
│   ├── make-id.ts              # Generate unique identifiers
│   ├── tag-regex.ts            # Regular expressions for tags
│   └── tag-utils.ts            # Tag processing utilities
├── cache-manager.ts            # Application cache management
├── content-parsers.ts          # Advanced content parsing and tokenization
├── hard-reset-manager.ts       # Application state reset utilities
├── os-detection.ts             # Operating system detection
├── privacy.ts                  # Privacy and data protection utilities
├── requestIdentifier.ts        # Request identification and tracking
├── scroll-highlight-demo.ts    # Scroll-based highlighting demo
├── scroll-position.ts          # Scroll position management
├── server-logger.ts            # Server-side logging utilities
├── service-worker-cleanup.ts   # Service worker management and cleanup
├── social-sharing.ts           # Social media sharing utilities
├── text-extraction.ts          # Text parsing and extraction
├── time-utils.ts               # Time and date utilities
└── timeFormatting.ts           # Time formatting and display
```

## 🚀 Core Utilities

### Text Processing

- **[text-extraction.ts](./text-extraction.ts)** - Extract hashtags, mentions, URLs, and emojis from text
- **[content-parsers.ts](./content-parsers.ts)** - Advanced content parsing with tokenization
- **[parsers/](./parsers/)** - Specialized content parsers (emoji, image, markdown, rich text)

### System Management

- **[service-worker-cleanup.ts](./service-worker-cleanup.ts)** - Browser service worker debugging and cleanup
- **[cache-manager.ts](./cache-manager.ts)** - Application cache management and optimization
- **[hard-reset-manager.ts](./hard-reset-manager.ts)** - Complete application state reset

### Data Utilities

- **[string/](./string/)** - String manipulation and ID generation
- **[array/](./array/)** - Array processing and deduplication
- **[time-utils.ts](./time-utils.ts)** & **[timeFormatting.ts](./timeFormatting.ts)** - Time and date handling

### UI & Interaction

- **[scroll-position.ts](./scroll-position.ts)** - Scroll position tracking and management
- **[scroll-highlight-demo.ts](./scroll-highlight-demo.ts)** - Scroll-based highlighting effects
- **[os-detection.ts](./os-detection.ts)** - Operating system and browser detection

### Infrastructure

- **[server-logger.ts](./server-logger.ts)** - Server-side logging and monitoring
- **[requestIdentifier.ts](./requestIdentifier.ts)** - Request tracking and identification
- **[privacy.ts](./privacy.ts)** - Privacy protection and data handling
- **[social-sharing.ts](./social-sharing.ts)** - Social media integration

## 📖 Usage Patterns

### Importing Utilities

```typescript
// Import specific utilities
import { TextExtractor } from '@lib/utils/text-extraction';
import { CacheManager } from '@lib/utils/cache-manager';

// Import from subdirectories
import { makeId } from '@lib/utils/string/make-id';
import { EmojiParser } from '@lib/utils/parsers/emoji-parser';
```

### Common Patterns

```typescript
// Text processing pipeline
import { TextExtractor } from '@lib/utils/text-extraction';
import { ContentParser } from '@lib/utils/content-parsers';

const userInput = 'Check out #coding with @[dev|user123] 🚀';
const extracted = TextExtractor.extractAll(userInput);
const parsed = ContentParser.parse(userInput);

// Cache management
import { CacheManager } from '@lib/utils/cache-manager';

await CacheManager.set('user-data', userData, { ttl: 3600 });
const cachedData = await CacheManager.get('user-data');

// System utilities
import { OSDetection } from '@lib/utils/os-detection';
import { Logger } from '@lib/utils/server-logger';

const userOS = OSDetection.detect();
Logger.info('User connected', { os: userOS });
```

## 🔧 Development Guidelines

### Creating New Utilities

1. **Single Responsibility** - Each utility should have a clear, focused purpose
2. **Type Safety** - Use TypeScript interfaces and proper type definitions
3. **Error Handling** - Include comprehensive error handling and validation
4. **Documentation** - Add JSDoc comments and usage examples
5. **Testing** - Write unit tests for all public functions

### File Organization

- **Root level** - General-purpose utilities used across the application
- **Subdirectories** - Related utilities grouped by domain (string, array, parsers)
- **README.md** - Documentation for each directory and major utility

### Naming Conventions

- **Files** - kebab-case (e.g., `text-extraction.ts`)
- **Classes** - PascalCase (e.g., `TextExtractor`)
- **Functions** - camelCase (e.g., `extractHashtags`)
- **Constants** - UPPER_SNAKE_CASE (e.g., `MAX_CACHE_SIZE`)

## 🧪 Testing

Each utility should include comprehensive tests:

```typescript
// Example test structure
describe('TextExtractor', () => {
  describe('extractHashtags', () => {
    it('should extract hashtags from text', () => {
      const text = 'Love #coding and #javascript!';
      const hashtags = TextExtractor.extractHashtags(text);
      expect(hashtags).toEqual(['#coding', '#javascript']);
    });
  });
});
```

## 📚 Related Documentation

- **[Libraries Documentation](../../DOCS/libraries/)** - Higher-level library documentation
- **[Development Guide](../../DOCS/development/)** - Development setup and practices
- **[API Documentation](../../app/api/README.md)** - API endpoint documentation

---

_These utilities form the foundation of idling.app's functionality. They are designed to be reliable, performant, and easy to use across the entire application._
