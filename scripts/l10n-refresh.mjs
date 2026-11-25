#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;

function run(rel, args = []) {
  const res = spawnSync(node, [path.join(ROOT, rel), ...args], {
    stdio: 'inherit',
    cwd: ROOT,
  });
  return res.status === 0;
}

function pnpm(script) {
  const res = spawnSync('pnpm', [script], { stdio: 'inherit', cwd: ROOT, shell: true });
  return res.status === 0;
}

const quoteOk = run('scripts/message-ticker/translate-ticker-quotes.mjs');
if (!quoteOk) {
  console.warn('[l10n] quote MT failed — syncing EN quote shards');
  run('scripts/message-ticker/translate-ticker-quotes.mjs', ['--sync-en']);
}

const uiOk = run('scripts/i18n-translate-locales.mjs');
if (!uiOk) {
  console.warn('[l10n] UI MT failed — syncing EN UI catalog');
  run('scripts/i18n-sync-en-locales.mjs');
}

if (!run('scripts/i18n-sync-locale-modules.mjs')) {
  process.exit(1);
}
if (!pnpm('i18n:generate')) {
  process.exit(1);
}