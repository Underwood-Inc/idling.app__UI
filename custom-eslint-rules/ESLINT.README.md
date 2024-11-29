# ESLint Custom Rules

This package contains two ESLint rules:

## 1. Declaration Spacing Rule

This rule enforces blank lines between different types of declarations and between declarations that belong to different naming groups.

### Basic Usage

Add to your `.eslintrc.js`:
```javascript
{
  "rules": {
    "custom-rules/declaration-spacing": ["warn", {
      minLines: 1,
      groups: [
        '[A-Z][A-Z_]+',                    // Constants (USER_ID, API_URL)
        '(handle|validate|update)[A-Z]\\w+' // Functions by purpose (handleClick, validateUser)
      ]
    }]
  }
}
```

### Configuration Options

- `minLines`: Number of blank lines required between different groups (default: 1)
- `groups`: Array of regex patterns that identify different declaration groups. Declarations matching different groups must be separated by blank lines.

### Examples

✅ **Correct** usage:
```typescript
// Constants group
const USER_ID = 1;
const USER_NAME = 'John';
const USER_EMAIL = 'john@example.com';

// Regular variables (different group)
const firstName = 'John';
const lastName = 'Doe';

// Event handlers group
const handleClick = () => {};
const handleSubmit = () => {};
```

❌ **Incorrect** usage:
```typescript
const USER_ID = 1;
const handleClick = () => {};  // Should be separated from constants
const USER_NAME = 'John';      // Should be grouped with USER_ID
```

## 2. Link Target Blank Rule

This rule enforces proper attributes on external links using Next.js `Link` components.

### Basic Usage

Add to your `.eslintrc.js`:
```javascript
{
  "rules": {
    "custom-rules/link-target-blank": "warn"
  }
}
```

### Examples

✅ **Correct** usage:
```jsx
<Link
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="External link"
>
  External Link
</Link>
```

❌ **Incorrect** usage:
```jsx
<Link href="https://example.com">
  External Link
</Link>
```