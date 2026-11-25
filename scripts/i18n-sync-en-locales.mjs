#!/usr/bin/env node
/** Mirror EN UI catalog into sibling locale files (no [locale] stubs). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { atomicWriteFileSync } from './lib/atomic-write-file.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const I18N_ROOT = path.join(ROOT, 'src/i18n');
const manifest = JSON.parse(
  fs.readFileSync(path.join(I18N_ROOT, 'supported-locales.json'), 'utf8')
);
const en = JSON.parse(
  fs.readFileSync(path.join(I18N_ROOT, 'locales', 'en.json'), 'utf8')
);

for (const row of manifest.locales) {
  if (row.id === 'en') {
    continue;
  }
  const localePath = path.join(I18N_ROOT, 'locales', `${row.id}.json`);
  atomicWriteFileSync(localePath, `${JSON.stringify(en, null, 2)}\n`);
}

console.log(`Synced EN UI strings to ${manifest.locales.length - 1} locales`);