import { describe, expect, test } from 'vitest';
import { shouldRedirectRadioPwaInstalledNavigation } from './radioPwaNavigationPolicy';

describe('shouldRedirectRadioPwaInstalledNavigation', () => {
  test('when PWA cookie is absent, does not redirect', () => {
    expect(shouldRedirectRadioPwaInstalledNavigation('/portfolio', false)).toBe(false);
  });

  test('when PWA cookie is set on start path, does not redirect', () => {
    expect(shouldRedirectRadioPwaInstalledNavigation('/', true)).toBe(false);
  });

  test('when PWA cookie is set off start path, redirects', () => {
    expect(shouldRedirectRadioPwaInstalledNavigation('/settings', true)).toBe(true);
  });

  test('when PWA cookie is set on API paths, does not redirect', () => {
    expect(shouldRedirectRadioPwaInstalledNavigation('/api/radio/playlist', true)).toBe(
      false
    );
  });
});