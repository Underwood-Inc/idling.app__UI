import { expect } from '@playwright/test';
import { PAGINATION_SELECTORS } from '../src/lib/test-selectors/components/pagination.selectors';
import { SUBMISSIONS_LIST_SELECTORS } from '../src/lib/test-selectors/components/submissions-list.selectors';
import { checkA11y } from './utils/check-a11y';
import { testWithFakeAuth } from './utils/with-fake-auth';

testWithFakeAuth.beforeEach(async ({ page }) => {
  await page.goto('/posts');

  const results = await checkA11y(page);
  expect(results.violations).toEqual([]);
});

testWithFakeAuth.afterEach(async ({ page }) => {
  const results = await checkA11y(page);
  expect(results.violations).toEqual([]);
});

testWithFakeAuth('loads posts page', async ({ page }) => {
  // setup fake auth for testing
  await expect(
    page.getByTestId(SUBMISSIONS_LIST_SELECTORS.CONTAINER)
  ).toBeVisible();
  await expect(page.getByTestId(PAGINATION_SELECTORS.STATE)).toBeVisible();
});
