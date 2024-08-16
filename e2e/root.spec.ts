import { expect, test } from '@playwright/test';
import { NAV_PATHS } from '../src/lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../src/lib/utils/test-selectors/pages/about.selectors';
import { checkA11y } from './utils/check-a11y';

test.beforeEach(async ({ page }) => {
  await page.goto('/');

  const results = await checkA11y(page);
  expect(results.violations).toEqual([]);
});

test.afterEach(async ({ page }) => {
  const results = await checkA11y(page);
  expect(results.violations).toEqual([]);
});

test('loads root page', async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK)).toBeVisible();
  await expect(page.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK)).toBeEnabled();
  await expect(
    page.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK)
  ).toHaveAttribute('href', NAV_PATHS.ROOT);
  await expect(
    page.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK)
  ).not.toHaveAttribute('target', '_blank');

  // await expect(page).toHaveTitle(/Playwright/);
});
