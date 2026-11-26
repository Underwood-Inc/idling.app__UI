---
title: Footer
description: Site footer shell with ad, nav, locale, and version
---

# Footer

Server component assembling the global page footer.

## Exports

- Default export `Footer` — no props

## Structure

1. `footer-ad-section` — `AdUnit` (`ad-unit--footer`, `testId="footer-ad"`)
2. `<footer className="footer">`
   - **Leading:** `SmartCacheStatus`, `LocalePicker`
   - **Center:** `FooterNav`
   - **Trailing:** `AppVersion` with `footer__app-version`

Styles: `Footer.scss`, outer `footer-wrapper`.

---

**Sources:** `src/app/components/footer/Footer.tsx`, `src/app/components/footer/Footer.scss`, `src/app/components/ad-unit`, `src/app/components/cache-status/SmartCacheStatus`, `src/app/components/locale/LocalePicker`, `src/app/components/footer-nav/FooterNav`, `src/app/components/app-version/AppVersion`