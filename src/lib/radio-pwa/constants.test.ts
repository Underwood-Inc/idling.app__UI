import { describe, expect, test } from 'vitest';
import { isPwaPublicAssetPath, PWA_PUBLIC_ASSET_PATHS } from './constants';

describe('isPwaPublicAssetPath', () => {
  test('when the path is a PWA manifest or service worker, auth bypass applies', () => {
    for (const path of PWA_PUBLIC_ASSET_PATHS) {
      expect(isPwaPublicAssetPath(path)).toBe(true);
    }
  });

  test('when the path is a protected page, auth bypass does not apply', () => {
    expect(isPwaPublicAssetPath('/posts')).toBe(false);
    expect(isPwaPublicAssetPath('/api/health')).toBe(false);
  });
});
