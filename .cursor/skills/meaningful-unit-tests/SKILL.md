---
name: meaningful-unit-tests
description: Write Vitest unit tests with use-case descriptions, real fixtures, and minimal boundary mocking. Use when adding tests, reviewing test quality, or when the user asks for meaningful tests without over-mocking.
---

# Meaningful unit tests (Vitest)

## When to use

- Adding tests for security guards, parsers, validators, or API access helpers.
- Reviewing tests that feel like mock verification lists.
- User asks for human-friendly test names or “no made-up data”.
- Migrating or authoring tests in this repo (**Vitest**, not Jest).

## Runner

This repo uses **Vitest** (`vitest.config.ts`, `vitest.setup.ts`). Do not add Jest config or `jest.mock`.

```bash
pnpm test              # vitest run
pnpm test:watch        # vitest watch
pnpm test:coverage     # vitest run --coverage
```

## Description formula

Write each `test(...)` title as a **short use case**:

```
when [actor] [action], [expected outcome]
```

Examples:

- `when a link preview targets the metadata IP, the URL is rejected before fetch`
- `when an admin assigns a role without roles.manage permission, the route responds forbidden`
- `when an upload is a JPEG disguised with a .html filename, detection still yields image/jpeg`

Avoid: `validateUrl works`, `returns 403`, `mock auth called`.

## Fixture rules

| Kind | Do | Don't |
|------|----|-------|
| Binary uploads | Minimal valid file headers (JPEG SOI, PNG signature) | Empty `Buffer.alloc(0)` unless testing empty |
| URLs / SSRF | RFC1918, link-local, metadata IPs; real IANA zones | Random strings unrelated to attack vectors |
| Timezones | `America/New_York`, `UTC`, SQL-injection-shaped rejects | Fake zone `Zone99` |
| Auth guards | Mock `@lib/auth` session + permission port only | Mock entire `requireAdminApiAccess` |

## Mocking (Vitest)

1. List **ports** the module needs (session, DNS, HTTP, DB).
2. Mock **only** ports you cannot run in Vitest cheaply (`vi.mock`, `vi.spyOn`).
3. Assert **user-visible outcomes** (status, `{ ok: false }`, detected MIME), not `toHaveBeenCalledTimes` alone.

```ts
import { vi, expect, test } from 'vitest';

vi.mock('@lib/auth', () => ({ auth: vi.fn() }));

test('when a signed-in member lacks admin.access, admin routes respond forbidden', async () => {
  const result = await requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS);
  expect(result.granted).toBe(false);
});
```

## Environment

- Default: `jsdom` (see `vitest.config.ts`).
- Node modules (`dns`, `Buffer`, route handlers): covered by `environmentMatchGlobs` for `src/lib/security/**`, `src/lib/api/**`, and `**/actions.test.ts`.
- Optional file hint: `/** @vitest-environment node */` at top of file.

## File placement

```
src/lib/security/foo.ts
src/lib/security/foo.test.ts   ← preferred
```

## Checklist before finishing

- [ ] Every test title reads like a use case without opening the file.
- [ ] No test exists solely to satisfy coverage on a constant.
- [ ] Mocks use `vi.*` and are boundary-only.
- [ ] At least one test per **reject** path for security validators.
- [ ] `pnpm test` passes locally.

## Related

- `.cursor/rules/meaningful-unit-tests.mdc` — file-scoped rule for `*.test.ts`
- Traceability (`test('[FR-001] ...')`) when `requirements-registry.yaml` defines IDs for the feature
