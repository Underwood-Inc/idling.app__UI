# RadioPlayerEqualizerPanel

Props: `handle: RadioPlayerHandle`, optional `className`. Multi-band EQ UI with preset picker, custom slots, match detection (`resolveRadioEqualizerBandGainsMatch`), and i18n via `useRadioCopy` / `@molecules/i18n/idlingRadioI18n`.

Renders `RadioEqualizerBandFader` per `RADIO_EQUALIZER_BAND_COUNT` band. Re-exports equalizer match message builders for tests.

---

**Sources:** `src/app/components/radio-player/RadioPlayerEqualizerPanel.tsx`