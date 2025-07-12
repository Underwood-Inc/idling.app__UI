---
title: 'WithUserRoles'
description: 'Documentation for WithUserRoles'
---

# withUserRoles

**Purpose:**

`withUserRoles` is a reusable API wrapper for Next.js/Node.js route handlers. It automatically augments any JSON response with the current user's roles, making it easy for frontend code to know what roles the user has—without extra API calls.

---

## Usage

```ts
import { withUserRoles } from './withUserRoles';

async function getHandler(req, ctx) {
  // ...your handler logic...
  return NextResponse.json({ foo: 'bar' });
}

export default withUserRoles(getHandler);
```

You can also compose it with other wrappers:

```ts
export default withUserRoles(withUserPermissions(getHandler));
```

---

## API

- **Input:** An async handler `(req, ctx) => NextResponse`
- **Output:** A handler that returns the same response, but with a `userRoles` array in the JSON (if available)
- **If the user is not authenticated:** `userRoles` will be `undefined`
- **If the handler returns non-JSON:** The response is returned as-is

---

## Example Response

```json
{
  "foo": "bar",
  "userRoles": ["admin", "wizard"]
}
```

---

## Caveats

- If the user is not logged in, `userRoles` will not be present.
- If the handler returns a non-JSON response, it will not be modified.
- If fetching roles fails, the response will still be returned (with `userRoles: undefined`).
- This wrapper is fully composable with other wrappers (like `withUserPermissions`).

---

## When to Use

- Any API where the frontend needs to know the user's roles for UI/logic.
- To avoid extra round-trips for permission/role checks.
- For scalable, DRY, and maintainable API design.

---

_For more details, see the source code and tests in this directory._
