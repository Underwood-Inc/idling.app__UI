---
title: DiscordLink
description: Footer Discord invite with tooltip and locale labels
---

# DiscordLink

Client footer link to `https://discord.gg/mpThbx67J7` wrapped in `LinkTooltip`.

## Exports

- `DiscordLink` — named export
- `DiscordLinkProps` — interface

## Props (`DiscordLinkProps`)

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `isInsideParagraph` | `boolean` | `false` | Passed to `LinkTooltip` |

## Render

- Label and `aria-label` from `ll.footer.discord()` / `discordAria()` via `useIdlingLocale`.
- `data-testid`: `DISCORD_LINK_SELECTORS.LINK`; `target="_blank"` + `rel="noopener noreferrer"`.

---

**Sources:** `src/app/components/discord-link/DiscordLink.tsx`, `src/app/components/locale/IdlingLocaleProvider.tsx`, `@lib/test-selectors/components/discord-link.selectors`