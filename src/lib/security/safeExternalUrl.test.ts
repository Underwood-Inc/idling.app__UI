import dns from 'node:dns/promises';
import { describe, expect, test, vi } from 'vitest';
import { resolveSafeExternalUrl } from './safeExternalUrl';

const appOrigin = 'https://idling.app';

describe('resolveSafeExternalUrl', () => {
  test('when link preview targets the cloud metadata IP, the URL is rejected before fetch', async () => {
    const result = await resolveSafeExternalUrl(
      'http://169.254.169.254/latest/meta-data/',
      appOrigin
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('Target host is not allowed');
    }
  });

  test('when link preview targets loopback, the URL is rejected', async () => {
    const result = await resolveSafeExternalUrl('http://127.0.0.1/admin', appOrigin);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('Target host is not allowed');
    }
  });

  test('when link preview uses a file URL, the URL is rejected', async () => {
    const result = await resolveSafeExternalUrl('file:///etc/passwd', appOrigin);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('Only http and https URLs are allowed');
    }
  });

  test('when link preview embeds credentials in the URL, the URL is rejected', async () => {
    const result = await resolveSafeExternalUrl(
      'https://user:secret@example.com/page',
      appOrigin
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('URLs with credentials are not allowed');
    }
  });

  test('when link preview uses a public HTTPS article URL, the URL is accepted', async () => {
    const result = await resolveSafeExternalUrl('https://example.com/article', appOrigin);

    expect(result).toEqual({
      ok: true,
      targetUrl: 'https://example.com/article',
      baseUrl: 'https://example.com'
    });
  });

  test('when an internal relative path is previewed, it resolves against the app origin', async () => {
    const result = await resolveSafeExternalUrl('/about', appOrigin);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.targetUrl).toBe('https://idling.app/about');
      expect(result.baseUrl).toBe('https://idling.app');
    }
  });

  test('when a hostname resolves to a private address, the URL is rejected', async () => {
    const lookupSpy = vi.spyOn(dns, 'lookup').mockResolvedValue([
      { address: '10.0.0.1', family: 4 }
    ]);

    const result = await resolveSafeExternalUrl(
      'https://innocent-looking.example/',
      appOrigin
    );

    lookupSpy.mockRestore();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('Target host resolves to a blocked address');
    }
  });
});
