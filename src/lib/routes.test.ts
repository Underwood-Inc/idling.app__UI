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

  test('when the path is the radio API, guests may reach station probes', () => {
    expect(PUBLIC_API_ROUTES).toContain('/api/radio/');
    expect(isPublicApiPath('/api/radio/stations')).toBe(true);
    expect(isPublicApiPath('/api/radio/now-playing')).toBe(true);
  });

  test('when the path is a protected page, page auth still applies', () => {
    expect(isPublicPagePath('/posts')).toBe(true);
    expect(isPublicPagePath('/my-posts')).toBe(false);
    expect(isPublicInfraPath('/manifest.json')).toBe(true);
    expect(isPublicInfraPath('/posts')).toBe(false);
  });

  test('when the path is a public page route, guests may view it', () => {
    for (const path of PUBLIC_ROUTES) {
      expect(isPublicPagePath(path)).toBe(true);
    }
  });
});
