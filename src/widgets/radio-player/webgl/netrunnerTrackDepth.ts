export interface WrapTrackDepthInput {
  z: number;
  spanZ: number;
}

export interface AdvanceBoundedScrollZInput {
  current: number;
  increment: number;
  spanZ: number;
}

/** Keep building depth within the visible avenue loop. */
export function wrapTrackDepth({ z, spanZ }: WrapTrackDepthInput): number {
  const trackMin = -spanZ * 0.92;
  const trackMax = spanZ * 0.5;
  const trackLength = trackMax - trackMin;

  if (trackLength <= 0) {
    return z;
  }

  const relative = z - trackMin;
  const normalized = ((relative % trackLength) + trackLength) % trackLength;
  return trackMin + normalized;
}

/** Prevent scroll offset from growing without bound over long sessions. */
export function advanceBoundedScrollZ({
  current,
  increment,
  spanZ,
}: AdvanceBoundedScrollZInput): number {
  if (spanZ <= 0) {
    return current + increment;
  }

  const next = current + increment;
  return ((next % spanZ) + spanZ) % spanZ;
}
