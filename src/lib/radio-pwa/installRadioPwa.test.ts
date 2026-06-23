import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  getRadioPwaInstallCapability,
  installRadioPwa,
  isIosSafari,
  isWebInstallApiAvailable,
  shouldOfferRadioPwaInstallUi,
} from './installRadioPwa';
import type { NavigatorWithInstall } from './navigatorInstall.types';

describe('installRadioPwa', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
      install: undefined,
    });
  });

  afterEach(() => {
    vi.stubGlobal('navigator', originalNavigator);
    vi.restoreAllMocks();
  });

  test('when navigator.install is available, capability prefers the Web Install API', () => {
    const navigatorWithInstall = navigator as NavigatorWithInstall;
    navigatorWithInstall.install = vi.fn().mockResolvedValue('installed');

    expect(isWebInstallApiAvailable()).toBe(true);
    expect(getRadioPwaInstallCapability()).toEqual({
      canOfferInstall: true,
      preferredMethod: 'web-install-api',
    });
  });

  test('when navigator.install accepts, installRadioPwa reports web-install-api success', async () => {
    const install = vi.fn().mockResolvedValue('installed');
    (navigator as NavigatorWithInstall).install = install;

    await expect(installRadioPwa()).resolves.toEqual({
      ok: true,
      method: 'web-install-api',
    });
    expect(install).toHaveBeenCalledWith('/idling-radio', '/idling-radio');
  });

  test('when navigator.install is missing on Chromium, the install UI can still be offered', () => {
    expect(shouldOfferRadioPwaInstallUi()).toBe(true);
    expect(getRadioPwaInstallCapability()).toEqual({
      canOfferInstall: false,
      preferredMethod: null,
    });
  });

  test('when the device is iOS Safari, capability offers manual Add to Home Screen', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      install: undefined,
    });

    expect(isIosSafari()).toBe(true);
    expect(getRadioPwaInstallCapability()).toEqual({
      canOfferInstall: true,
      preferredMethod: 'ios-manual',
    });
  });
});
