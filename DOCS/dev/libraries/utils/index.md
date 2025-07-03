---
layout: default
title: 'Utilities'
description: 'Helper functions and parsers'
permalink: /dev/libraries/utils/
---

# 🔧 Utilities

Helper functions, parsers, and utility modules that provide common functionality across the Idling.app platform.

## 🎯 Core Utilities

### String Utilities

```typescript
// String manipulation and formatting
export const stringUtils = {
  // Capitalize first letter
  capitalize: (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1),

  // Convert to slug format
  slugify: (str: string): string =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),

  // Truncate with ellipsis
  truncate: (str: string, maxLength: number): string =>
    str.length > maxLength ? str.slice(0, maxLength) + '...' : str,

  // Extract mentions from text
  extractMentions: (text: string): string[] =>
    text.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [],

  // Extract hashtags from text
  extractHashtags: (text: string): string[] =>
    text.match(/#(\w+)/g)?.map((h) => h.slice(1)) || []
};
```

### Date Utilities

```typescript
// Date formatting and manipulation
export const dateUtils = {
  // Format relative time
  formatRelative: (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  },

  // Check if date is today
  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  // Get start of day
  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  // Get end of day
  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
};
```

### Array Utilities

```typescript
// Array manipulation helpers
export const arrayUtils = {
  // Remove duplicates
  unique: <T>(array: T[]): T[] => [...new Set(array)],

  // Group by property
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce(
      (groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  },

  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Shuffle array
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
};
```

### Object Utilities

```typescript
// Object manipulation helpers
export const objectUtils = {
  // Deep merge objects
  deepMerge: <T extends Record<string, any>>(
    target: T,
    source: Partial<T>
  ): T => {
    const result = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
    return result;
  },

  // Pick properties from object
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  // Omit properties from object
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach((key) => {
      delete result[key];
    });
    return result;
  },

  // Check if object is empty
  isEmpty: (obj: object): boolean => Object.keys(obj).length === 0
};
```

## 🔍 Parsers

### Markdown Parser

```typescript
// Simple markdown parsing utilities
export const markdownParser = {
  // Parse basic markdown to HTML
  parseBasic: (markdown: string): string => {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');
  },

  // Extract links from markdown
  extractLinks: (markdown: string): Array<{ text: string; url: string }> => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: Array<{ text: string; url: string }> = [];
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      links.push({ text: match[1], url: match[2] });
    }

    return links;
  },

  // Strip markdown formatting
  stripMarkdown: (markdown: string): string => {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }
};
```

### URL Parser

```typescript
// URL parsing and validation utilities
export const urlParser = {
  // Validate URL format
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Extract domain from URL
  extractDomain: (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  },

  // Parse query parameters
  parseQueryParams: (url: string): Record<string, string> => {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    } catch {
      return {};
    }
  },

  // Build URL with query parameters
  buildUrl: (baseUrl: string, params: Record<string, string>): string => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }
};
```

## 🎨 Styling Utilities

### CSS Class Name Utilities

```typescript
// CSS class name manipulation
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

// Conditional class names
export const clsx = (
  ...classes: (string | Record<string, boolean> | undefined | null | false)[]
): string => {
  const result: string[] = [];

  classes.forEach((cls) => {
    if (typeof cls === 'string') {
      result.push(cls);
    } else if (cls && typeof cls === 'object') {
      Object.entries(cls).forEach(([key, value]) => {
        if (value) result.push(key);
      });
    }
  });

  return result.join(' ');
};
```

### Color Utilities

```typescript
// Color manipulation utilities
export const colorUtils = {
  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  },

  // Convert RGB to hex
  rgbToHex: (r: number, g: number, b: number): string => {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // Generate random color
  randomColor: (): string => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  },

  // Check if color is dark
  isDark: (hex: string): boolean => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return false;
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness < 128;
  }
};
```

## 🔐 Validation Utilities

### Form Validation

```typescript
// Form validation helpers
export const validators = {
  // Email validation
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password strength validation
  password: (
    password: string
  ): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    issues: string[];
  } => {
    const issues: string[] = [];
    let score = 0;

    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain lowercase letters');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain uppercase letters');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      issues.push('Password must contain numbers');
    } else {
      score += 1;
    }

    if (!/[^a-zA-Z\d]/.test(password)) {
      issues.push('Password must contain special characters');
    } else {
      score += 1;
    }

    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';
    return {
      isValid: issues.length === 0,
      strength,
      issues
    };
  },

  // URL validation
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Phone number validation (basic)
  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
};
```

## 🚀 Performance Utilities

### Debounce and Throttle

```typescript
// Performance optimization utilities
export const performanceUtils = {
  // Debounce function execution
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  // Throttle function execution
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Memoize function results
  memoize: <T extends (...args: any[]) => any>(func: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }
};
```

## 🧪 Testing Utilities

### Test Helpers

```typescript
// Testing utility functions
export const testUtils = {
  // Generate mock data
  generateMockUser: (overrides?: Partial<User>): User => ({
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date(),
    ...overrides
  }),

  // Wait for async operations
  waitFor: (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  // Create mock API response
  mockApiResponse: <T>(data: T, success = true): ApiResponse<T> => ({
    success,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  }),

  // Generate random string
  randomString: (length = 10): string =>
    Math.random()
      .toString(36)
      .substring(2, length + 2)
};
```

## 📦 Usage Examples

### Basic Usage

```typescript
import { stringUtils, dateUtils, arrayUtils } from '@/lib/utils';

// String manipulation
const slug = stringUtils.slugify('Hello World!'); // 'hello-world'
const mentions = stringUtils.extractMentions('Hello @john and @jane'); // ['john', 'jane']

// Date formatting
const timeAgo = dateUtils.formatRelative(new Date(Date.now() - 3600000)); // '1h ago'
const isToday = dateUtils.isToday(new Date()); // true

// Array operations
const uniqueItems = arrayUtils.unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]
const grouped = arrayUtils.groupBy(users, 'role'); // { admin: [...], user: [...] }
```

### Advanced Usage

```typescript
import { performanceUtils, validators, markdownParser } from '@/lib/utils';

// Performance optimization
const debouncedSearch = performanceUtils.debounce(searchFunction, 300);
const throttledScroll = performanceUtils.throttle(scrollHandler, 100);

// Form validation
const emailValid = validators.email('user@example.com'); // true
const passwordCheck = validators.password('MyPassword123!');
// { isValid: true, strength: 'strong', issues: [] }

// Markdown processing
const html = markdownParser.parseBasic('**Bold** and *italic* text');
// '<strong>Bold</strong> and <em>italic</em> text'
```

## 🔗 Related Documentation

- **[Core Services](../services/)** - Service implementations using these utilities
- **[React Hooks](../hooks/)** - Custom hooks that utilize these utilities
- **[Testing Guide](../../testing/)** - Testing strategies and utilities
- **[Component Library](../../components/)** - Components using these utilities

---

**Last Updated**: {{ site.time | date: "%B %d, %Y" }}

> **Performance Note**: All utilities are optimized for performance and include TypeScript definitions for better developer experience.
