---
layout: default
title: Avatar Image API
description: Generate unique avatar images using @dicebear adventurer collection
---

# 👤 Avatar Image API

The Avatar Image API generates unique, consistent avatar images using the @dicebear adventurer collection. These avatars are perfect for user profiles, placeholder images, and any application requiring distinctive character representations.

## 🎯 What are Avatar Images?

Avatar images are visual representations of users or entities, commonly used for:

- **User profiles** - Profile pictures and account representations
- **Comment systems** - Visual identification in discussions
- **Placeholder content** - Default images before user uploads
- **Game characters** - Unique character representations
- **Social features** - Visual elements in user interactions

## 📡 Endpoint

```
GET /api/avatar-image
```

**Response Format:** SVG image (image/svg+xml)

**Cache:** No cache (dynamic generation)

## 🔧 Parameters

### Query Parameters

| Parameter | Type   | Required | Description                         | Example             |
| --------- | ------ | -------- | ----------------------------------- | ------------------- |
| `seed`    | string | **Yes**  | Unique seed for avatar generation   | `seed=john-doe-123` |
| `size`    | number | No       | Image size in pixels (default: 200) | `size=400`          |

## 🎨 Features

### Adventurer Collection

The API uses the **@dicebear adventurer collection** which provides:

- **Unique characters** - Each seed generates a distinct adventurer
- **Consistent results** - Same seed always produces same avatar
- **Rich details** - Multiple customizable features and accessories
- **SVG format** - Scalable vector graphics for any size
- **Diverse representation** - Wide variety of character appearances

### Deterministic Generation

- **Seed-based** - Identical seeds produce identical avatars
- **Reproducible** - Perfect for user profile consistency
- **Collision-resistant** - Different seeds create different avatars
- **Scalable** - Generate avatars for millions of users

## 📖 Usage Examples

### Basic Usage

Generate an avatar with a specific seed:

```bash
curl "https://idling.app/api/avatar-image?seed=user-123"
```

### Custom Size

Generate a larger avatar:

```bash
curl "https://idling.app/api/avatar-image?seed=user-123&size=400"
```

### User-Specific Avatars

Generate avatars based on user data:

```bash
# Using username as seed
curl "https://idling.app/api/avatar-image?seed=jane-doe"

# Using user ID as seed
curl "https://idling.app/api/avatar-image?seed=user-12345"

# Using email hash as seed
curl "https://idling.app/api/avatar-image?seed=a1b2c3d4e5f6"
```

## 🌐 Integration

### HTML Implementation

Use in HTML img tags:

```html
<!-- Basic avatar -->
<img
  src="https://idling.app/api/avatar-image?seed=user-123"
  alt="User Avatar"
  width="200"
  height="200"
/>

<!-- High-resolution avatar -->
<img
  src="https://idling.app/api/avatar-image?seed=user-123&size=400"
  alt="User Avatar"
  width="200"
  height="200"
  style="border-radius: 50%;"
/>
```

### React Component

```jsx
function Avatar({ userId, size = 200, className = '' }) {
  const avatarUrl = `https://idling.app/api/avatar-image?seed=${encodeURIComponent(userId)}&size=${size}`;

  return (
    <img
      src={avatarUrl}
      alt={`Avatar for ${userId}`}
      width={size}
      height={size}
      className={`avatar ${className}`}
    />
  );
}

// Usage
<Avatar userId="user-123" size={100} className="rounded-full" />;
```

### CSS Styling

```css
.avatar {
  border-radius: 50%;
  border: 2px solid #ff6b35;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
```

## 📊 Response Format

### Success Response

**Content-Type:** `image/svg+xml`

**Status:** `200 OK`

The response is a complete SVG image featuring:

- **Adventurer character** - Unique design based on seed
- **Scalable vector graphics** - Crisp at any resolution
- **Rich details** - Hair, clothing, accessories, facial features
- **Consistent styling** - Cohesive art style across all avatars

### Error Response

**Status:** `400 Bad Request` (if seed is missing)

```json
{
  "error": "Seed parameter is required",
  "status": 400
}
```

**Status:** `500 Internal Server Error` (if generation fails)

```json
{
  "error": "Avatar generation failed",
  "status": 500
}
```

## 🔧 Technical Details

### Seed Requirements

- **Required parameter** - Must provide a seed value
- **String format** - Any string value is acceptable
- **Deterministic** - Same seed always produces same result
- **Case sensitive** - "User123" and "user123" produce different avatars

### Size Specifications

- **Default size:** 200x200 pixels
- **Minimum size:** 50x50 pixels
- **Maximum size:** 1000x1000 pixels
- **Square format:** Always generates square images
- **SVG scaling:** Can be resized in CSS without quality loss

### Performance

- **Fast generation** - Typically responds in under 100ms
- **No caching** - Fresh generation for each request
- **Edge runtime** - Low latency globally
- **Lightweight** - SVG format keeps file sizes small

## 🎨 Customization

### Seed Strategies

**Username-based:**

```javascript
const seed = username.toLowerCase().replace(/[^a-z0-9]/g, '');
```

**User ID-based:**

```javascript
const seed = `user-${userId}`;
```

**Email-based:**

```javascript
const seed = btoa(email).replace(/[^a-zA-Z0-9]/g, '');
```

**Random but persistent:**

```javascript
// Generate once, store in database
const seed = crypto.randomUUID();
```

### Display Options

**Circular avatars:**

```css
.avatar {
  border-radius: 50%;
  overflow: hidden;
}
```

**Rounded corners:**

```css
.avatar {
  border-radius: 12px;
}
```

**With borders:**

```css
.avatar {
  border: 3px solid #ff6b35;
  padding: 2px;
}
```

## 🚀 Best Practices

### For User Profiles

- **Use consistent seeds** - Same user should always get same avatar
- **Include fallbacks** - Handle API errors gracefully
- **Optimize sizes** - Request appropriate resolution for display size
- **Cache in browser** - Let browser cache the SVG responses

### For Performance

- **Batch requests** - Don't make simultaneous requests for same seed
- **Appropriate sizing** - Don't request 1000px avatars for 50px displays
- **Error handling** - Provide fallback images for failed requests
- **Progressive loading** - Show placeholder while avatar loads

### For Accessibility

```html
<img
  src="/api/avatar-image?seed=user-123"
  alt="Profile picture for John Doe"
  role="img"
  loading="lazy"
/>
```

## 🔗 Related APIs

- **[OG Image API](./og-image)** - Uses avatars in social media images
- **[Upload APIs](./upload)** - Alternative custom avatar uploads

## 📋 Common Use Cases

### User Registration

```javascript
// Generate avatar during user signup
async function createUser(userData) {
  const avatarSeed = `user-${userData.username}-${Date.now()}`;
  const user = await db.users.create({
    ...userData,
    avatarSeed: avatarSeed
  });

  // Avatar URL is constructed when needed
  user.avatarUrl = `/api/avatar-image?seed=${avatarSeed}`;
  return user;
}
```

### Comment Systems

```jsx
function Comment({ comment, author }) {
  return (
    <div className="comment">
      <img
        src={`/api/avatar-image?seed=${author.id}&size=40`}
        alt={`${author.name}'s avatar`}
        className="comment-avatar"
      />
      <div className="comment-content">
        <strong>{author.name}</strong>
        <p>{comment.text}</p>
      </div>
    </div>
  );
}
```

### Profile Lists

```jsx
function UserList({ users }) {
  return (
    <div className="user-grid">
      {users.map((user) => (
        <div key={user.id} className="user-card">
          <img
            src={`/api/avatar-image?seed=${user.id}&size=120`}
            alt={`${user.name}'s profile`}
            className="profile-avatar"
          />
          <h3>{user.name}</h3>
          <p>{user.bio}</p>
        </div>
      ))}
    </div>
  );
}
```

---

_The Avatar Image API provides consistent, unique visual identity for users without requiring custom image uploads._
