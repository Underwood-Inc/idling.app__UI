---
applyTo: "**/*.test.ts,**/*.test.tsx,**/__tests__/**"
---

# Meaningful unit tests (Vitest)

This repo uses **Vitest** — not Jest. Config: `vitest.config.ts`, setup: `vitest.setup.ts`.

- Use `test(...)`, not `it(...)`.
- Titles: **when [actor] [action], [outcome]** — human-readable use cases.
- Real inputs (magic bytes, private IPs, IANA timezones); no fabricated stubs that bypass the unit under test.
- Mock only boundary ports with `vi.mock` / `vi.spyOn`; never mock the module under test.
- Place tests beside source: `foo.test.ts` next to `foo.ts`.
- Node-only code: `environmentMatchGlobs` in `vitest.config.ts` or `/** @vitest-environment node */`.

Commands: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`.

Full skill: `.cursor/skills/meaningful-unit-tests/SKILL.md`
