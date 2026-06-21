import {
  buildRadioStationProbeCatalog,
  RADIO_STATIONS,
} from '@widgets/radio-player/radioStationCatalog';
import type {
  RadioStationCatalog,
  RadioStationProbeFailure,
  RadioStationProbeResult,
} from '@widgets/radio-player/radioPlayer.types';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PROBE_TIMEOUT_MS = 8000;

interface ProbeStreamResult {
  ok: boolean;
  reason?: string;
}

async function probeStreamUrl(url: string): Promise<ProbeStreamResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'IdlingRadioProbe/1.0',
        'Icy-MetaData': '1',
      },
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'IdlingRadioProbe/1.0',
          'Icy-MetaData': '1',
          Range: 'bytes=0-0',
        },
      });
    }

    await response.body?.cancel();

    if (response.ok) {
      return { ok: true };
    }

    return { ok: false, reason: `HTTP ${response.status}` };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'AbortError'
        ? 'Timed out waiting for stream'
        : error instanceof Error
          ? error.message
          : 'Request failed';

    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

async function probeCatalog(catalog: RadioStationCatalog): Promise<RadioStationProbeResult> {
  const entries = Object.entries(catalog);
  const probeResults = await Promise.all(
    entries.map(async ([name, url]) => {
      const result = await probeStreamUrl(url);
      return { name, url, result };
    })
  );

  const available: RadioStationCatalog = {};
  const failures: RadioStationProbeFailure[] = [];

  probeResults.forEach(({ name, url, result }) => {
    if (result.ok) {
      available[name] = url;
      return;
    }

    failures.push({
      name,
      url,
      reason: result.reason ?? 'Stream failed to load',
    });
  });

  return { available, failures };
}

export async function GET(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const catalog = buildRadioStationProbeCatalog(RADIO_STATIONS, hostname, true);
  const result = await probeCatalog(catalog);

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
}
