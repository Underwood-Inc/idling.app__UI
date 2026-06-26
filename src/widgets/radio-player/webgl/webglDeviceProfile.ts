export interface WebglDeviceProfile {
  isMobile: boolean;
  maxPixelRatio: number;
  preferAntialias: boolean;
  powerPreference: WebGLPowerPreference;
}

export function resolveWebglDeviceProfile(): WebglDeviceProfile {
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  return {
    isMobile,
    maxPixelRatio: isMobile ? 1.5 : 2,
    preferAntialias: !isMobile,
    powerPreference: isMobile ? 'default' : 'high-performance',
  };
}

export function resolveWebglPixelRatio(profile: WebglDeviceProfile): number {
  return Math.min(window.devicePixelRatio || 1, profile.maxPixelRatio);
}
