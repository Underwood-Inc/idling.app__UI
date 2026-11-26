---
title: DiscordEmbed
description: Fixed-size Discord server widget iframe
---

# DiscordEmbed

Client component rendering Discord's official server widget for guild `1234783462335189080` (dark theme).

## Exports

- `DiscordEmbed` — named export, no props

## Render

- `<iframe className="discord-embed">` 350×600, `sandbox` allows popups/scripts/same-origin.
- `data-testid` from `DISCORD_EMBED_SELECTORS.IFRAME`.

---

**Sources:** `src/app/components/discord-embed/DiscordEmbed.tsx`, `src/app/components/discord-embed/DiscordEmbed.css`, `@lib/test-selectors/components/discord-embed.selectors`