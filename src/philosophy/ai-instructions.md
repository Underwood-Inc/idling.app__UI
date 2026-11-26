---
title: 'AI instructions map'
description: 'Where Cursor, VS Code, and Copilot policies live in the workspace'
---

# AI instructions map

**What this page is about:** one policy set, multiple loaders — so humans and assistants do not contradict each other across tools.

## Index

Canonical checklist: **`docs/ai-instructions.md`** in the parent `__CODE` repository.

| Location | Used by |
| -------- | ------- |
| `AGENTS.md` | Cursor, VS Code agents charter |
| `.github/copilot-instructions.md` | GitHub Copilot workspace |
| `.github/instructions/*.instructions.md` | VS Code file-scoped rules |
| `.cursor/rules/*.mdc` | Cursor always-on / glob rules |
| `.cursor/skills/*/SKILL.md` | Cursor invoked skills |
| `apps/mappy/AGENTS.md` | Mappy subtree |

## Maintenance rule

When charter bullets change, update **`AGENTS.md`** and **`.github/copilot-instructions.md`** together. Skills copy to `.claude/skills/` per `docs/ai-instructions.md` § Maintenance.

## Related philosophy

- [CLAD](/philosophy/clad) — structure vocabulary
- [Contributing](/guides/contributing) — hub ban list for stale stack claims