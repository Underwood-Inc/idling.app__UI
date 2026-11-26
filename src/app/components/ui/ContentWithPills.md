---
title: ContentWithPills
description: Parses post strings into hashtags, mentions, URLs, and navigation pills
---

# ContentWithPills

Default export wraps `ContentWithPillsInternal` in `Suspense` because the inner tree calls `useSearchParams`.

## Props (`ContentWithPillsProps`)

| Prop | Role |
|------|------|
| `content` | Raw post/filter string |
| `contextId` | Stable key for pill tooltips and filters |
| `isFilterBarContext` | Inverts hashtag/mention URL mutations (remove vs add) |
| `enableInlineFilterControl` | Extra inline filter affordances |
| `isEditMode` | Passes through to `URLPill` authoring controls |
| `onHashtagClick`, `onMentionClick`, `onURLClick`, `onURLBehaviorChange`, `onURLRemove` | Override default router/searchParam behavior |

## Parsing

`ContentParser.parse(text)` (`@lib/utils/content-parsers`) with strict segment precedence: structured URL pills, hashtags, mentions, then fallback URLs in residual text.

## Rendering

Segments map to `InstantLink`, `URLPill`, `InteractiveTooltip`, and plain spans. Filter URLs built via `URLSearchParams` from current `pathname` + `searchParams` (tags, author, mentions).

---

**Sources:** `src/app/components/ui/ContentWithPills.tsx`, `@lib/utils/content-parsers`, `src/app/components/ui/URLPill.tsx`