---
name: meaningful-unit-tests
description: Write Vitest unit tests with use-case descriptions, real fixtures, and minimal boundary mocking.
---

# Meaningful unit tests

See `.cursor/skills/meaningful-unit-tests/SKILL.md` for the full skill (keep in sync on edits).

Quick rules:

- **Vitest** (`pnpm test`) — not Jest.
- `test('when …, …', ...)` use-case titles; no `it(...)`.
- Real fixtures; mock only auth/DNS/fetch boundaries with `vi.*`.
- Tests live beside the module under test.
