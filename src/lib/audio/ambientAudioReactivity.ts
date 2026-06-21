export const AMBIENT_AUDIO_REACTIVITY_STORAGE_KEY = 'ambient-audio-reactivity-global';

export const DEFAULT_AMBIENT_AUDIO_REACTIVITY_PERCENT = 100;
export const MIN_AMBIENT_AUDIO_REACTIVITY_PERCENT = 0;
export const MAX_AMBIENT_AUDIO_REACTIVITY_PERCENT = 100;

export interface ParseAmbientAudioReactivityInput {
  raw: string | null;
}

export function clampAmbientAudioReactivityPercent(percent: number): number {
  return Math.min(
    MAX_AMBIENT_AUDIO_REACTIVITY_PERCENT,
    Math.max(MIN_AMBIENT_AUDIO_REACTIVITY_PERCENT, Math.round(percent))
  );
}

export function parseAmbientAudioReactivityPercent({
  raw,
}: ParseAmbientAudioReactivityInput): number | null {
  if (raw === null || raw.trim() === '') {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return clampAmbientAudioReactivityPercent(parsed);
}

export function ambientAudioReactivityPercentToIntensity(percent: number): number {
  return clampAmbientAudioReactivityPercent(percent) / 100;
}

export function applyAmbientAudioReactivityToDocument(percent: number): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.setProperty(
    '--ambient-audio-intensity',
    ambientAudioReactivityPercentToIntensity(percent).toFixed(4)
  );
}
