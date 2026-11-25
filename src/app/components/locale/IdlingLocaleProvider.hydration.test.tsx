import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from 'vitest';

test('when IdlingLocaleProvider mounts, useState starts at base locale not localStorage', () => {
  const src = readFileSync(
    join(process.cwd(), 'src/app/components/locale/IdlingLocaleProvider.tsx'),
    'utf8'
  );
  expect(src).toMatch(/useState<IdlingLocaleId>\(IDLING_BASE_LOCALE\)/);
  expect(src).not.toMatch(/useState<IdlingLocaleId>\(resolveInitialLocale\)/);
  expect(src).not.toMatch(/useState\(\(\) => resolveIdlingLocale/);
});