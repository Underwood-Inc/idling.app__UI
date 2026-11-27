/**
 * One-shot typography purge: remove font-size / fontSize outside allowlist.
 * Plan: .github/typography + globals canon.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { relative, normalize } from 'node:path';

const root = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const allowSuffixes = new Set([
  'src/app/globals.css',
  'src/css/base.css',
  'static/js/mermaid-viewer.js',
  'public/offline.html',
]);

const allowIncludes = [
  'src/css/swagger-ui/',
  'src/app/api/og-image/',
  'scripts/',
  'src/i18n/',
  'src/lib/rich-input/utils/WidthMeasurement.ts',
  'src/lib/rich-input/utils/measurementHelpers.ts',
  'src/lib/rich-input/utils/cursorCalculations.ts',
  'src/lib/rich-input/utils/clickPositioning.ts',
];

function isAllowed(rel) {
  const r = rel.replace(/\\/g, '/');
  if (allowSuffixes.has(r)) return true;
  return allowIncludes.some((p) => r.includes(p.replace(/\\/g, '/')));
}

function stripCss(text) {
  let out = text.replace(/^\s*font-size\s*:[^;]*;\s*\r?\n/gm, '');
  out = out.replace(/([{;]\s*)font-size\s*:[^;]*;\s*/g, '$1');
  return out;
}

function stripTs(text) {
  let out = text.replace(/\bfontSize\s*:\s*(?:'[^']*'|"[^"]*"|`[^`]*`|\{[^}]+\}|\d+(?:\.\d+)?(?:px|rem|em|%)?)\s*,?\s*/g, '');
  out = out.replace(/style=\{\{\s*\}\}/g, '');
  out = out.replace(/style=\{\{\s*,/g, 'style={{');
  return out;
}

const out = execSync(
  `rg -l "font-size|fontSize" src public/widgets --glob "!node_modules/**"`,
  { cwd: root, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
);

let changed = 0;
for (const file of out.split(/\r?\n/).filter(Boolean)) {
  const rel = file.replace(/\\/g, '/');
  if (isAllowed(rel)) continue;

  const path = `${root}/${file}`;
  const raw = readFileSync(path, 'utf8');
  const isTs = /\.(tsx?|jsx?|mjs|cjs)$/.test(file);
  const next = isTs ? stripTs(raw) : stripCss(raw);
  if (next !== raw) {
    writeFileSync(path, next, 'utf8');
    changed += 1;
  }
}

console.log(`strip-component-font-size: updated ${changed} files`);