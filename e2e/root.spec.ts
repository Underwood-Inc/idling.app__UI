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

  test('loads root page', async ({ page, isMobile }) => {
    await expect(page).toHaveTitle(/Idling.app/);
    await expect(page.getByTestId(HOME_DASHBOARD)).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1 })
    ).toBeVisible();

    if (isMobile) {
      await expect(page.getByTestId(HOME_DASHBOARD)).toBeVisible();
    }
  });
});