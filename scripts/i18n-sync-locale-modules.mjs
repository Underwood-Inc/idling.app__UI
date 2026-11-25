#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'src/i18n/supported-locales.json');
const I18N_ROOT = path.join(ROOT, 'src/i18n');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const localeIds = manifest.locales.map((row) => row.id);
const baseLocale = manifest.baseLocale;
const basePath = path.join(I18N_ROOT, 'locales', `${baseLocale}.json`);
const baseTree = JSON.parse(fs.readFileSync(basePath, 'utf8'));

for (const id of localeIds) {
  const localePath = path.join(I18N_ROOT, 'locales', `${id}.json`);
  if (!fs.existsSync(localePath)) {
    fs.writeFileSync(localePath, `${JSON.stringify(baseTree, null, 2)}\n`, 'utf8');
  }
  const dir = path.join(I18N_ROOT, id);
  fs.mkdirSync(dir, { recursive: true });
  const typeImport = id === baseLocale ? 'BaseTranslation' : 'Translation';
  const cast = id === baseLocale ? 'as BaseTranslation' : 'as Translation';
  const indexTs = `import type { ${typeImport} } from '../i18n-types.js';
import ${id} from '../locales/${id}.json' with { type: 'json' };

const translation = ${id} ${cast};

export default translation;
`;
  fs.writeFileSync(path.join(dir, 'index.ts'), indexTs, 'utf8');
}

console.log(`Synced ${localeIds.length} locale modules`);