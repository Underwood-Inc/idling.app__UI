import { expect, test } from '@playwright/test';
import { checkA11y } from './utils/check-a11y';

const HOME_DASHBOARD = 'marketing-dashboard';

test.describe('home /', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId(HOME_DASHBOARD)).toBeVisible({
      timeout: 20_000,
    });
  });

  test.afterEach(async ({ page }) => {
    const results = await checkA11y(page);
    expect(results.violations).toEqual([]);
  });

  test('loads root page', async ({ page }) => {
    await expect(page).toHaveTitle(/Idling.app/);
    const dashboard = page.getByTestId(HOME_DASHBOARD);
    await expect(dashboard).toBeVisible();
    await expect(dashboard.getByRole('heading', { level: 1 })).toBeVisible();
  });
});