#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const I18N_ROOT = path.join(ROOT, 'src/i18n');
const manifest = JSON.parse(
  fs.readFileSync(path.join(I18N_ROOT, 'supported-locales.json'), 'utf8')
);
const en = JSON.parse(
  fs.readFileSync(path.join(I18N_ROOT, 'locales', 'en.json'), 'utf8')
);

function stubTree(tree, localeId) {
  if (typeof tree === 'string') {
    return localeId === 'en' ? tree : `[${localeId}] ${tree}`;
  }
  if (Array.isArray(tree)) {
    return tree.map((item) => stubTree(item, localeId));
  }
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    out[key] = stubTree(value, localeId);
  }
  return out;
}

for (const row of manifest.locales) {
  const localePath = path.join(I18N_ROOT, 'locales', `${row.id}.json`);
  const body = row.id === 'en' ? en : stubTree(en, row.id);
  fs.writeFileSync(localePath, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
}

console.log(`Stubbed ${manifest.locales.length} locale JSON files`);