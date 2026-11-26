/** @vitest-environment node */
import { test, expect } from 'vitest';

import { getServerLL } from './idling-server-i18n';

test('when getServerLL runs on the server, it uses sync English without async locale chunks', () => {
  const ll = getServerLL();
  expect(ll.home.masthead.line().length).toBeGreaterThan(0);
});