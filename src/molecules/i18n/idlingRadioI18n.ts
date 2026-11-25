import type { RadioEnCopy } from '$i18n-source/radio.en';
import type { RadioEqualizerBandGainsMatch } from '@widgets/radio-player/radioEqualizer.types';
import {
  RADIO_EQUALIZER_CUSTOM_SLOTS,
  type RadioEqualizerCustomSlot,
} from '@widgets/radio-player/radioEqualizerCustomPresets';
import type { RadioStationGenreId } from '@widgets/radio-player/radioPlayer.types';
import type { AudioStreamTempoBpmDisplayView } from '@widgets/radio-player/audioStreamTempo.types';

export interface RadioEqualizerMatchMessage {
  kind: RadioEqualizerBandGainsMatch['kind'];
  text: string;
}

function replaceRadioTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template
  );
}

export function formatRadioCheckingStations(
  copy: RadioEnCopy,
  count: number
): string {
  if (count === 1) {
    return copy.bar.checkingStationsOne;
  }
  return copy.bar.checkingStationsMany.replace('{count}', String(count));
}

export function resolveRadioGenreLabel(
  copy: RadioEnCopy,
  genreId: RadioStationGenreId
): string {
  return copy.genres[genreId] ?? genreId;
}

export function formatRadioFavoriteAria(
  copy: RadioEnCopy,
  stationName: string,
  isFavorite: boolean
): string {
  const template = isFavorite ? copy.aria.removeFavorite : copy.aria.addFavorite;
  return replaceRadioTemplate(template, { stationName });
}

export function formatRadioTrackSearchAria(
  copy: RadioEnCopy,
  searchQuery: string
): string {
  return replaceRadioTemplate(copy.aria.searchWebForTrack, { query: searchQuery });
}

export function formatRadioTrackSearchTitle(
  copy: RadioEnCopy,
  searchQuery: string
): string {
  return replaceRadioTemplate(copy.aria.findTrackTitle, { query: searchQuery });
}

export function formatRadioTrackTitleTriggerAria(
  copy: RadioEnCopy,
  trackDisplay: string
): string {
  return replaceRadioTemplate(copy.aria.trackTitleTrigger, { track: trackDisplay });
}

export function resolveRadioEqualizerPresetLabel(
  copy: RadioEnCopy,
  presetId: string,
  fallback: string
): string {
  return copy.equalizer.presets[presetId] ?? fallback;
}

export function resolveRadioWebglPresetLabel(
  copy: RadioEnCopy,
  presetId: string,
  fallback: string
): string {
  return copy.presetLabels.webgl[presetId]?.label ?? fallback;
}

export function resolveRadioWebglPresetDescription(
  copy: RadioEnCopy,
  presetId: string,
  fallback: string
): string {
  return copy.presetLabels.webgl[presetId]?.description ?? fallback;
}

export function resolveRadioBarPresetLabel(
  copy: RadioEnCopy,
  presetId: string,
  fallback: string
): string {
  return copy.presetLabels.bar[presetId]?.label ?? fallback;
}

export function resolveRadioBarPresetDescription(
  copy: RadioEnCopy,
  presetId: string,
  fallback: string
): string {
  return copy.presetLabels.bar[presetId]?.description ?? fallback;
}

export function resolveRadioSpectrumPresetLabel(
  copy: RadioEnCopy,
  presetId: string,
  fallback: string
): string {
  return copy.presetLabels.spectrum[presetId] ?? fallback;
}

export function buildRadioEqualizerMatchMessage(
  copy: RadioEnCopy,
  match: RadioEqualizerBandGainsMatch
): RadioEqualizerMatchMessage {
  if (match.kind === 'exact') {
    return {
      kind: 'exact',
      text: replaceRadioTemplate(copy.equalizer.matchExact, { label: match.label }),
    };
  }

  return {
    kind: 'near',
    text: replaceRadioTemplate(copy.equalizer.matchNear, { label: match.label }),
  };
}

export function buildRadioEqualizerCustomPresetNameDrafts(
  copy: RadioEnCopy,
  customPresets: readonly { slot: RadioEqualizerCustomSlot; label: string }[]
): Record<RadioEqualizerCustomSlot, string> {
  const drafts = {} as Record<RadioEqualizerCustomSlot, string>;

  for (const slot of RADIO_EQUALIZER_CUSTOM_SLOTS) {
    const preset = customPresets.find((entry) => entry.slot === slot);
    drafts[slot] =
      preset?.label ?? replaceRadioTemplate(copy.equalizer.customSlotDefault, { slot });
  }

  return drafts;
}

export function buildRadioEqualizerDeleteConfirmMessage(
  copy: RadioEnCopy,
  label: string
): string {
  return replaceRadioTemplate(copy.equalizer.deleteConfirm, { label });
}

export function formatRadioEqualizerCustomSlotDefault(
  copy: RadioEnCopy,
  slot: RadioEqualizerCustomSlot
): string {
  return replaceRadioTemplate(copy.equalizer.customSlotDefault, { slot });
}

export function formatRadioBpmDescription(
  copy: RadioEnCopy,
  display: AudioStreamTempoBpmDisplayView
): string {
  switch (display.state) {
    case 'paused':
      return copy.bpm.paused;
    case 'silent':
      return copy.bpm.silent;
    case 'stable': {
      const rounded = display.label;
      return replaceRadioTemplate(copy.bpm.stable, { bpm: rounded });
    }
    case 'estimating': {
      const rounded = display.label.replace(/^~/, '');
      return replaceRadioTemplate(copy.bpm.estimating, { bpm: rounded });
    }
    case 'listening':
    default:
      return copy.bpm.listening;
  }
}