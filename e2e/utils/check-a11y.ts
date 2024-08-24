import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

export async function checkA11y(page: Page, excludeSelector: string = '') {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .options({
      // filtersprovider context wrapper is required in a client context which results in the aside
      // being rendered as a child of other top level elements
      rules: {
        'landmark-complementary-is-top-level': { enabled: false }
      }
    })
    .exclude(excludeSelector)
    .exclude('iframe') // never analyze third party content
    .exclude('crate > div') // never analyze third party content: discord widget
    .withTags([
      'wcag2a',
      'wcag2aa',
      'best-practice',
      'section508',
      'cat.keyboard'
    ])
    .analyze();

  if (accessibilityScanResults.violations) {
    accessibilityScanResults.violations.forEach((violation, index) => {
      console.warn(`violation #${index} nodes:`, violation.nodes);
    });
  }

  return accessibilityScanResults;
}
