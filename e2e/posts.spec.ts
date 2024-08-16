import { expect, test } from '@playwright/test';
import { checkA11y } from './utils/check-a11y';

test.beforeEach(async ({ page }) => {
  await page.goto('/posts');

  const results = await checkA11y(page);
  expect(results.violations).toEqual([]);
});

test.afterEach(async ({ page }) => {
  const results = await checkA11y(page);
  expect(results.violations).toEqual([]);
});

test('loads posts page', async ({ page }) => {
  // setup fake auth for testing
});
