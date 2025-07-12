---
title: 'WithUserPermissions'
description: 'Documentation for WithUserPermissions'
---

# withUserPermissions

**Purpose:**

`withUserPermissions` is a reusable API wrapper for Next.js/Node.js route handlers. It automatically augments any JSON response with the current user's permissions, making it easy for frontend code to know what permissions the user has—without extra API calls.

---

## Usage

```ts
import { withUserPermissions } from './withUserPermissions';

async function getHandler(req, ctx) {
  // ...your handler logic...
  return NextResponse.json({ foo: 'bar' });
}

export default withUserPermissions(getHandler);
```

You can also compose it with other wrappers:

```ts
export default withUserRoles(withUserPermissions(getHandler));
```

---

## API

- **Input:** An async handler `(req, ctx) => NextResponse`
- **Output:** A handler that returns the same response, but with a `userPermissions` array in the JSON (if available)
- **If the user is not authenticated:** `userPermissions` will be `undefined`
- **If the handler returns non-JSON:** The response is returned as-is

---

## Example Response

```json
{
  "foo": "bar",
  "userPermissions": ["read", "write"]
}
```

---

## Caveats

- If the user is not logged in, `userPermissions` will not be present.
- If the handler returns a non-JSON response, it will not be modified.
- If fetching permissions fails, the response will still be returned (with `userPermissions: undefined`).
- This wrapper is fully composable with other wrappers (like `withUserRoles`).

---

## When to Use

- Any API where the frontend needs to know the user's permissions for UI/logic.
- To avoid extra round-trips for permission/role checks.
- For scalable, DRY, and maintainable API design.

---

_For more details, see the source code and tests in this directory._
