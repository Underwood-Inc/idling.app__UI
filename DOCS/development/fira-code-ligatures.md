---
layout: default
title: Fira Code Ligatures
nav_order: 4
parent: Development
---

# Fira Code Ligatures

This page demonstrates Fira Code ligatures in action.

## Common Programming Ligatures

The following code examples should show ligatures when using Fira Code:

```javascript
// Arrow functions and operators
const myFunction = (x, y) => {
  return x >= y && x <= 100;
};

// Comparison operators
if (value !== null && value !== undefined) {
  console.log('Value is valid');
}

// Mathematical operators
const result = x >= 0 && y <= 100;
const isEqual = a === b;
const notEqual = c !== d;

// Other common ligatures
const regex = /[a-z]+/g;
const comment = /* This is a comment */;
```

## HTML/JSX Ligatures

```jsx
// Self-closing tags and attributes
<Component 
  prop1="value" 
  prop2={true}
  onClick={() => handleClick()}
/>

<!-- HTML comments -->
<!-- This should show as a ligature -->
```

## CSS Ligatures

```css
/* CSS comments and selectors */
.selector::before {
  content: "→";
  font-family: 'Fira Code', monospace;
}

/* Pseudo-selectors */
a:hover,
a:focus {
  color: #edae49;
}
```

## Ligature Examples

Here are some common ligatures that should be rendered:

- `->` becomes →
- `=>` becomes ⇒  
- `>=` becomes ≥
- `<=` becomes ≤
- `===` becomes ≡
- `!==` becomes ≢
- `&&` becomes ∧
- `||` becomes ∨
- `::` becomes ∷
- `<!--` becomes ←
- `-->` becomes →

## Disabling Ligatures

You can disable ligatures for specific elements using the `.fira-code-no-ligatures` class:

<div class="fira-code-no-ligatures">
<pre><code>// This code block has ligatures disabled
const arrow = () => {
  return x >= y && x <= 100;
};
</code></pre>
</div>

Compare with ligatures enabled (default):

```javascript
// This code block has ligatures enabled  
const arrow = () => {
  return x >= y && x <= 100;
};
``` 