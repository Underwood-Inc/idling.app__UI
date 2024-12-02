# ESLint Custom Rules

This package provides ESLint rules to help maintain consistent code style and security practices.

## Installation

```bash
# From your project root
npm install --save-dev eslint-plugin-custom-rules
```

Add to your `.eslintrc.js`:
```javascript
{
  "plugins": ["custom-rules"],
  "rules": {
    // Add the rules you want to use
  }
}
```

## Rules

### 1. Declaration Spacing (`custom-rules/declaration-spacing`)

Enforces consistent spacing between different groups of declarations to improve code readability.

#### Configuration

```javascript
{
  "rules": {
    "custom-rules/declaration-spacing": ["warn", {
      // Number of blank lines required between groups (default: 1)
      minLines: 1,

      // Patterns to identify different groups
      groups: [
        '[A-Z][A-Z_]+',                    // UPPERCASE constants (e.g., USER_ID, API_URL)
        '(handle|validate|update)[A-Z]\\w+' // Function names with specific prefixes
      ]
    }]
  }
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minLines` | number | `1` | Number of blank lines required between different groups |
| `groups` | string[] | `['[A-Z][A-Z_]+', 'handle[A-Z]\\w+']` | Array of regex patterns to identify declaration groups |

#### What It Checks

- Variable declarations (`const`, `let`, `var`)
- Function declarations
- Export default declarations

#### Examples

✅ **Good Code**:
```typescript
// Constants are grouped together
const USER_ID = 1;
const API_URL = '/api';
const USER_NAME = 'John';

// Event handlers are grouped together
const handleClick = () => {};
const handleSubmit = () => {};

// Regular variables can be anywhere
const firstName = 'John';
const lastName = 'Doe';

// Functions are checked too
function validateUser() {}

export default function Component() {}
```

❌ **Code That Will Be Fixed**:
```typescript
const USER_ID = 1;
const handleClick = () => {};  // Wrong: Handler mixed with constants
const API_URL = '/api';        // Wrong: Constant separated from other constants
```

### 2. Link Target Blank (`custom-rules/link-target-blank`)

Enforces security and accessibility best practices for external links in React/Next.js applications.

#### Configuration

```javascript
{
  "rules": {
    "custom-rules/link-target-blank": "warn"
  }
}
```

#### What It Checks

Ensures all `<Link>` and `<a>` components have the following attributes:

| Attribute | Purpose | Security/Accessibility Impact |
|-----------|---------|------------------------------|
| `target="_blank"` | Opens link in new tab | UX: Preserves current page context |
| `rel="noopener noreferrer"` | Security attributes | Prevents [tabnabbing](https://owasp.org/www-community/attacks/Reverse_Tabnabbing) attacks |
| `aria-label="External link"` | Screen reader hint | Accessibility: Indicates link opens in new tab |

#### Auto-fixing

The rule will automatically add any missing attributes when you save the file or run ESLint with the `--fix` option.

#### Examples

✅ **Good Code**:
```jsx
// Next.js Link component
<Link
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="External link"
>
  Visit Example
</Link>

// Regular anchor tag
<a
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="External link"
>
  Visit Example
</a>
```

❌ **Code That Will Be Fixed**:
```jsx
// Missing security and accessibility attributes
<Link href="https://example.com">
  Visit Example
</Link>

// Missing some attributes
<a href="https://example.com" target="_blank">
  Visit Example
</a>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `npm test`
4. Submit a pull request

## License

This project is licensed under the ISC License - a simple, permissive license that lets you:

✅ **Freely Use**: Use the code in your projects (commercial or personal)  
✅ **Modify**: Change the code to suit your needs  
✅ **Distribute**: Share the original or modified code  
✅ **Private Use**: Use in private/internal projects  

The only requirements are:
- Keep the copyright notice
- Include the license text

It's similar to the MIT License but with simpler language. Perfect for open-source projects that want to be as permissive as possible.

Full license text:
```text
Copyright (c) 2024 idling.app

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```