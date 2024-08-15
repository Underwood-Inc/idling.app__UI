import { expect, test } from '@playwright/test';
import { NAV_PATHS } from '../src/lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../src/lib/utils/test-selectors/pages/about.selectors';

test('loads root page', async ({ page }) => {
  await page.goto('http://localhost:3000/');

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

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(
//     page.getByRole('heading', { name: 'Installation' })
//   ).toBeVisible();
// });
