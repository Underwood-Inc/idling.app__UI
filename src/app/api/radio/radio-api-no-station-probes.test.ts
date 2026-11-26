import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const RADIO_API_DIR = join(__dirname);

const FORBIDDEN_IN_RADIO_API = [
  'probeRadioStationCatalog',
  'probeRadioStreamUrl',
  'probeRadioStreamInBrowser',
  'runStationAvailabilityChecks',
  'rerunStationAvailabilityChecks',
  '/api/radio/stations',
];

function collectRouteSourceFiles(dir: string): string[] {
  const files: string[] = [];

  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...collectRouteSourceFiles(path));
      continue;
    }

    if (name === 'route.ts') {
      files.push(path);
    }
  }

  return files;
}

describe('radio API routes', () => {
  test('do not run station catalog reachability probes on the server', () => {
    const routeFiles = collectRouteSourceFiles(RADIO_API_DIR);

    expect(routeFiles.length).toBeGreaterThan(0);

    for (const file of routeFiles) {
      const source = readFileSync(file, 'utf8');

      for (const token of FORBIDDEN_IN_RADIO_API) {
        expect(source, `${file} must not reference ${token}`).not.toContain(token);
      }
    }
  });
});