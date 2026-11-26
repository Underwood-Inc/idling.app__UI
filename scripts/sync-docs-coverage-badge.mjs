#!/usr/bin/env node
/**
 * Sync documentation coverage badge + static assets from doc-coverage-report.json
 * and generated HTML report into src/index.md and static/coverage/.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const REPORT_JSON = path.join(ROOT, 'doc-coverage-report.json');
const INDEX_MD = path.join(ROOT, 'src/index.md');
const STATIC_DIR = path.join(ROOT, 'static/coverage');
const BADGE_MD = path.join(STATIC_DIR, 'documentation-badge.md');
const INDEX_HTML = path.join(STATIC_DIR, 'index.html');

function badgeColor(pct) {
  if (pct >= 85) return 'brightgreen';
  if (pct >= 50) return 'yellow';
  return 'red';
}

function formatBadge(pct) {
  const color = badgeColor(pct);
  const label = encodeURIComponent('Documentation Coverage');
  const message = encodeURIComponent(`${pct.toFixed(1)}%`);
  return `https://img.shields.io/badge/${label}-${message}-${color}?style=flat&logo=gitbook&logoColor=white`;
}

function main() {
  if (!fs.existsSync(REPORT_JSON)) {
    console.error('Run pnpm docs:coverage:analyze first');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(REPORT_JSON, 'utf8'));
  const pct = report.coverage_percentage ?? 0;
  const adequate = report.adequately_documented ?? 0;
  const total = report.total_code_files ?? 0;
  const badgeUrl = formatBadge(pct);
  const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  if (fs.existsSync(INDEX_MD)) {
    let content = fs.readFileSync(INDEX_MD, 'utf8');
    content = content.replace(
      /\[!\[Documentation Coverage\]\([^)]+\)\]\([^)]+\)/,
      `[![Documentation Coverage](${badgeUrl})](https://docs.idling.app/coverage/)`,
    );
    fs.writeFileSync(INDEX_MD, content, 'utf8');
  }

  fs.mkdirSync(STATIC_DIR, { recursive: true });

  fs.writeFileSync(
    BADGE_MD,
    `<!-- Documentation Coverage Badge - synced by scripts/sync-docs-coverage-badge.mjs -->
[![Documentation Coverage](${badgeUrl})](./documentation-coverage-report.html)

**Coverage:** ${pct.toFixed(1)}% (${adequate}/${total} files)  
**Last Updated:** ${stamp}
`,
    'utf8',
  );

  const htmlReport = path.join(ROOT, 'documentation-coverage-report.html');
  if (!fs.existsSync(htmlReport)) {
    try {
      execSync('py scripts/check-docs-coverage.py --format html --output documentation-coverage-report.html --quiet', {
        stdio: 'inherit',
        cwd: ROOT,
      });
    } catch {
      // fail-under may exit non-zero
    }
  }

  for (const name of [
    'documentation-coverage-report.html',
    'doc-coverage-report.json',
    'doc-coverage-report.csv',
  ]) {
    const src = path.join(ROOT, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(STATIC_DIR, name.replace(/^doc-/, 'documentation-')));
    }
  }

  fs.writeFileSync(
    INDEX_HTML,
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation Coverage Report</title>
  <meta http-equiv="refresh" content="0; url=./documentation-coverage-report.html">
</head>
<body>
  <p><a href="./documentation-coverage-report.html">Documentation coverage report</a> — ${pct.toFixed(1)}% (${adequate}/${total})</p>
</body>
</html>`,
    'utf8',
  );

  console.log(`Badge synced: ${pct.toFixed(1)}% (${adequate}/${total})`);
}

main();