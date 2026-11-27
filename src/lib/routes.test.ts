import { describe, expect, test } from 'vitest';
import {
  isPublicApiPath,
  isPublicInfraPath,
  isPublicPagePath,
  PUBLIC_API_ROUTES,
  PUBLIC_INFRA_PATHS,
  PUBLIC_ROUTES,
} from './routes';

describe('public route infrastructure', () => {
  test('when the path is PWA or ads infra, auth bypass applies', () => {
    for (const path of PUBLIC_INFRA_PATHS) {
      expect(isPublicInfraPath(path)).toBe(true);
    }
  });

  test('when the path is a radio API route, session auth is required at the proxy', () => {
    expect(PUBLIC_API_ROUTES).not.toContain('/api/radio/');
    expect(isPublicApiPath('/api/radio/now-playing')).toBe(false);
    expect(isPublicApiPath('/api/radio/playlist')).toBe(false);
    expect(isPublicApiPath('/api/radio/favorites/stations')).toBe(false);
  });

  test('when the path is a protected page, page auth still applies', () => {
    expect(isPublicPagePath('/admin')).toBe(false);
    expect(isPublicPagePath('/portfolio')).toBe(true);
    expect(isPublicPagePath('/products/mappy')).toBe(true);
    expect(isPublicInfraPath('/manifest.json')).toBe(true);
  });

  test('when the path is a public page route, guests may view it', () => {
    for (const path of PUBLIC_ROUTES) {
      expect(isPublicPagePath(path)).toBe(true);
    }
  });
});
