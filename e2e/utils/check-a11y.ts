import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

export async function checkA11y(page: Page) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    // .exclude(elementSelector)
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
}
