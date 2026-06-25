import type { NeonConstellationMotionMode } from './neonConstellationMotion.types';

export type { NeonConstellationMotionMode };

export const NEON_CONSTELLATION_DEFAULT_MOTION_MODE: NeonConstellationMotionMode = 'drift';

export function normalizeNeonConstellationMotionMode(_value: unknown): NeonConstellationMotionMode {
  return NEON_CONSTELLATION_DEFAULT_MOTION_MODE;
}

export function isNeonConstellationPresetId(presetId: string): boolean {
  return presetId === 'neon-constellation';
}
