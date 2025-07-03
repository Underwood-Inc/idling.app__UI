import { test as base } from '@playwright/test';
import { getFakeAuthCookie } from './setup-state';

export const testWithFakeAuth = base.extend({
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({}, use) => {
    const cookies = getFakeAuthCookie();
    await use({ cookies, origins: [] });
  }
});
