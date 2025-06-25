---
layout: default
title: "Syntax Highlighting"
---

This documentation site features enhanced syntax highlighting powered by [Rouge](http://rouge.jneen.net/) with a custom Monokai theme that matches the main application's styling.

## Code Block Highlighting

All code blocks use Rouge with enhanced Monokai-inspired syntax highlighting:

```javascript
// Example JavaScript with enhanced Rouge highlighting
const message = "Hello, enhanced Rouge!";
console.log(message);

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
```

## Language Support

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};
```

Rouge supports a wide variety of programming languages, including:

- **JavaScript/TypeScript** - Full ES6+ and TypeScript support
- **Python** - Python 2 and 3 syntax
- **Ruby** - Complete Ruby syntax including Rails
- **Go, Rust, Java, C/C++** - Systems programming languages
- **PHP, HTML, CSS, SCSS** - Web development languages
- **SQL** - Database query language
- **JSON, YAML, XML** - Data formats
- **Shell/Bash** - Command line scripts
- **And 60+ more languages**

## Ruby Example

```ruby
class User
  attr_accessor :name, :email
  
  def initialize(name, email)
    @name = name
    @email = email
  end
  
  def greet
    puts "Hello, I'm #{@name}!"
  end
end

user = User.new("Alice", "alice@example.com")
user.greet
```

## SQL Example

```sql
-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com');

-- Query with joins
SELECT u.name, u.email, p.title
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at > '2024-01-01'
ORDER BY u.name;
```

## Configuration

Rouge is configured in `_config.yml` with enhanced settings:

```yaml
# Build settings
highlighter: rouge

# Kramdown settings
kramdown:
  input: GFM
  syntax_highlighter: rouge
  syntax_highlighter_opts:
    css_class: 'highlight'

# Enhanced Rouge configuration
rouge:
  css_class: 'highlight'
  default_lang: 'text'
  line_numbers: false
```

## Theme Features

Our custom Monokai-inspired theme includes:

- **Dark Background** - Matches the main application's dark theme
- **Vibrant Colors** - Authentic Monokai color palette
- **Enhanced Readability** - Optimized contrast and spacing
- **Custom Scrollbars** - Styled to match the application
- **Professional Appearance** - Clean, modern code presentation

### Color Palette

- **Keywords**: `#66d9ef` (blue) - `if`, `function`, `class`
- **Strings**: `#e6db74` (yellow) - Text and string literals
- **Functions**: `#a6e22e` (green) - Function names and calls
- **Operators**: `#f92672` (pink) - `=`, `+`, `->`, etc.
- **Numbers**: `#ae81ff` (purple) - Numeric literals
- **Comments**: `#75715e` (gray) - Code comments 