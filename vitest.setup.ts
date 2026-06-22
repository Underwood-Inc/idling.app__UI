/**
 * Vitest global setup — runs before each test file.
 * Playwright E2E tests stay separate under e2e/.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { mockEssentialBrowserAPIs } from './__mocks__/index';

global.fetch = vi.fn((url: RequestInfo | URL) => {
  const urlString =
    typeof url === 'string'
      ? url
      : url instanceof URL
        ? url.toString()
        : (url as Request)?.url || '';

  let mockData: Record<string, unknown> = {};
  if (urlString.includes('/api/streams/live-status')) {
    mockData = {
      twitch: { isLive: false },
      youtube: { isLive: false }
    };
  } else if (urlString.includes('/api/modrinth/stats')) {
    mockData = {
      projects: {
        rituals: { formattedDownloads: '0' },
        strixunPackA: { formattedDownloads: '0' }
      }
    };
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(mockData),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
    redirected: false,
    type: 'default',
    url: urlString,
    clone: function cloneResponse() {
      return {
        ok: this.ok,
        status: this.status,
        statusText: this.statusText,
        json: this.json,
        text: this.text,
        blob: this.blob,
        arrayBuffer: this.arrayBuffer,
        headers: this.headers,
        redirected: this.redirected,
        type: this.type,
        url: this.url
      };
    }
  } as Response);
}) as typeof fetch;

if (typeof window !== 'undefined') {
  mockEssentialBrowserAPIs();

  const setupPortalContainer = () => {
    const overlayPortal = document.createElement('div');
    overlayPortal.id = 'overlay-portal';
    document.body.appendChild(overlayPortal);
  };

  beforeEach(() => {
    mockEssentialBrowserAPIs();
    setupPortalContainer();
  });

  afterEach(() => {
    const overlayPortal = document.getElementById('overlay-portal');
    if (overlayPortal) {
      document.body.removeChild(overlayPortal);
    }
  });
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
