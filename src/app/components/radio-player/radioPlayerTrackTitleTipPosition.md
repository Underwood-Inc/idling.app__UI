# radioPlayerTrackTitleTipPosition

Pure layout helpers for the track title tooltip (no React).

Exports rect/viewport/placement types and:

- `resolveRadioPlayerTrackTitleTipMaxSize(viewport)` — caps width/height (416×192 defaults)
- `resolveRadioPlayerTrackTitleTipPosition({ trigger, tip, viewport, margin?, gap? })` — chooses `above` | `below` placement with collision-aware `top`/`left`

---

**Sources:** `src/app/components/radio-player/radioPlayerTrackTitleTipPosition.ts`