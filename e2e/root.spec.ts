import { expect, test } from '@playwright/test';
import { NAV_PATHS } from '../src/lib/routes';
import { DISCORD_EMBED_SELECTORS } from '../src/lib/test-selectors/components/discord-embed.selectors';
import { ABOUT_PAGE_SELECTORS } from '../src/lib/test-selectors/pages/about.selectors';
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

test('loads root page', async ({ page, isMobile }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Idling.app/);
  await expect(page.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK)).toBeVisible();
  await expect(page.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK)).toBeEnabled();
  await expect(
    page.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK)
  ).toHaveAttribute('href', NAV_PATHS.ROOT);
  await expect(
    page.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK)
  ).not.toHaveAttribute('target', '_blank');

  if (isMobile) {
    await expect(
      page.getByTestId(DISCORD_EMBED_SELECTORS.IFRAME)
    ).not.toBeVisible();
  } else {
    await expect(
      page.getByTestId(DISCORD_EMBED_SELECTORS.IFRAME)
    ).toBeVisible();
  }
});
