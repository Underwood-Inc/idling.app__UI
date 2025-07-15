# Profile by ID API - What It Does & How It Helps

**Description**: View user profiles by database ID with privacy protection (read-only version).

## What this page is about

This page documents the preferred endpoint for viewing user profiles by their database ID. This is the cleaner, more straightforward version of the profile API that only handles viewing (not updating) profiles.

**Recommended Usage**: Use this endpoint instead of `/api/profile/[username]` for viewing profiles, as the URL path clearly indicates it expects an ID.

## What Does This Actually Do?

This is the "read-only" version of our profile system. Think of it like looking up someone's business card in a company directory - you can view their information, but you can't change it.

Unlike the `/api/profile/[username]` endpoint which can both view and update profiles, this endpoint only lets you view profiles, making it perfect for:

- Displaying user profiles in lists
- Showing profile cards or tooltips
- Building user directories
- Social profile browsing

## Why Use This Endpoint?

### Benefits Over `/api/profile/[username]`

- **Clearer Intent**: URL path clearly shows it expects an ID
- **Read-Only Safety**: Can't accidentally update profiles
- **Better Semantics**: Does what the URL suggests (ID-based lookup)
- **Simpler Implementation**: Only handles viewing, not editing

### Perfect For

- **Profile Lists**: Showing multiple user profiles
- **User Cards**: Quick profile previews
- **Directory Views**: Browsing community members
- **Social Features**: Following, friends lists, etc.

## Quick Usage

```javascript
// Simple profile viewing
const viewProfile = async (userId) => {
  const response = await fetch(`/api/profile/id/${userId}`);

  if (response.ok) {
    return await response.json();
  } else {
    // Handle private profile or error
    return null;
  }
};

// Usage example
const profile = await viewProfile('123');
if (profile) {
  console.log(`Found ${profile.display_name} (@${profile.username})`);
}
```

## API Details

### Endpoint

```
GET /api/profile/id/[id]
```

### Response Format

```json
{
  "id": "123",
  "username": "johndoe",
  "display_name": "John Doe",
  "avatar_url": "https://idling.app/avatars/123.jpg",
  "bio": "Software developer and coffee enthusiast ☕",
  "created_at": "2024-01-15T10:30:00Z",
  "profile_visibility": "public"
}
```

## Privacy & Error Handling

This endpoint uses the same privacy protection system as the main profile API:

### Privacy Responses

```json
// Public profile - returns full data
{
  "id": "123",
  "username": "johndoe",
  "display_name": "John Doe",
  // ... full profile data
}

// Private profile - returns error
{
  "error": "Profile is private",
  "status": "privacy_protected"
}

// Profile not found
{
  "error": "User not found"
}
```

## When to Use Each Endpoint

| Endpoint                  | Best For                  | Can Update? |
| ------------------------- | ------------------------- | ----------- |
| `GET /api/profile/id/123` | **Viewing profiles**      | ❌ No       |
| `GET /api/profile/123`    | Viewing profiles          | ❌ No       |
| `PATCH /api/profile/123`  | **Updating your profile** | ✅ Yes      |

**Recommendation**: Use `/api/profile/id/[id]` for all profile viewing needs, and `/api/profile/[id]` only when you need to update profiles.

## Complete Documentation

For full details including:

- Privacy protection system
- Error handling
- Performance considerations
- Security features
- Testing examples
- Migration information

See the complete documentation at: [Profile Management API](/api/profile/[username]/)

## Quick Examples

### Build a User Directory

```javascript
const buildUserDirectory = async (userIds) => {
  const profiles = await Promise.all(
    userIds.map((id) => fetch(`/api/profile/id/${id}`).then((r) => r.json()))
  );

  // Filter out private/error profiles
  return profiles.filter((profile) => !profile.error);
};
```

### Profile Card Component

```javascript
const ProfileCard = ({ userId }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch(`/api/profile/id/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setProfile(data);
      });
  }, [userId]);

  if (!profile) return <div>Profile not available</div>;

  return (
    <div className="profile-card">
      <img src={profile.avatar_url} alt={profile.display_name} />
      <h3>{profile.display_name}</h3>
      <p>@{profile.username}</p>
      <p>{profile.bio}</p>
    </div>
  );
};
```

---

_Last updated: 2024-01-15 | API Version: 2.0 | Source: `/src/app/api/profile/id/[id]/route.ts`_
