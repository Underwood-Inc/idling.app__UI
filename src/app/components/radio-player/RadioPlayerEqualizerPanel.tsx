'use client';

import type { RadioPlayerHandle } from '@widgets/radio-player/radioPlayer.types';
import type {
  RadioEqualizerBandGainsMatch,
  RadioEqualizerCustomSlot,
  RadioEqualizerPresetId,
} from '@widgets/radio-player/radioEqualizer.types';
import {
  RADIO_EQUALIZER_BAND_COUNT,
  RADIO_EQUALIZER_BAND_LABELS,
  RADIO_EQUALIZER_PRESET_DEFINITIONS,
} from '@widgets/radio-player/radioEqualizerPresets';
import {
  isRadioEqualizerCustomPresetSaved,
  normalizeRadioEqualizerCustomPresetLabel,
  RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH,
  RADIO_EQUALIZER_CUSTOM_SLOTS,
} from '@widgets/radio-player/radioEqualizerCustomPresets';
import { resolveRadioEqualizerLastSelectionLabel } from '@widgets/radio-player/radioEqualizerLastSelection';
import { resolveRadioEqualizerBandGainsMatch } from '@widgets/radio-player/radioEqualizerMatch';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RadioEqualizerBandFader } from './RadioEqualizerBandFader';
import styles from './RadioPlayerEqualizerPanel.module.css';

export interface RadioPlayerEqualizerPanelProps {
  handle: RadioPlayerHandle;
  className?: string;
}

export interface RadioEqualizerMatchMessage {
  kind: RadioEqualizerBandGainsMatch['kind'];
  text: string;
}

export function buildRadioEqualizerMatchMessage(
  match: RadioEqualizerBandGainsMatch
): RadioEqualizerMatchMessage {
  if (match.kind === 'exact') {
    return {
      kind: 'exact',
      text: `These slider settings match ${match.label} exactly. Select that preset instead of duplicating it manually.`,
    };
  }

  return {
    kind: 'near',
    text: `These slider settings are close to ${match.label}. Consider selecting that preset.`,
  };
}

export function buildRadioEqualizerCustomPresetNameDrafts(
  customPresets: readonly { slot: RadioEqualizerCustomSlot; label: string }[]
): Record<RadioEqualizerCustomSlot, string> {
  const drafts = {} as Record<RadioEqualizerCustomSlot, string>;

  for (const slot of RADIO_EQUALIZER_CUSTOM_SLOTS) {
    const preset = customPresets.find((entry) => entry.slot === slot);
    drafts[slot] = preset?.label ?? `Custom ${slot}`;
  }

  return drafts;
}

export function buildRadioEqualizerDeleteConfirmMessage(label: string): string {
  return `Delete saved preset "${label}"? This cannot be undone.`;
}

export function RadioPlayerEqualizerPanel({ handle, className }: RadioPlayerEqualizerPanelProps) {
  const [presetId, setPresetId] = useState<RadioEqualizerPresetId | null>(
    () => handle.getEqualizerSettings().presetId
  );
  const [customPresetSlot, setCustomPresetSlot] = useState<RadioEqualizerCustomSlot | null>(
    () => handle.getEqualizerSettings().customPresetSlot
  );
  const [customPresets, setCustomPresets] = useState(() => handle.getEqualizerSettings().customPresets);
  const [bandGains, setBandGains] = useState<number[]>(() => [
    ...handle.getEqualizerSettings().bandGains,
  ]);
  const [lastSelection, setLastSelection] = useState(() => handle.getEqualizerSettings().lastSelection);
  const [customPresetNameDrafts, setCustomPresetNameDrafts] = useState(() =>
    buildRadioEqualizerCustomPresetNameDrafts(handle.getEqualizerSettings().customPresets)
  );
  const [pendingDeleteSlot, setPendingDeleteSlot] = useState<RadioEqualizerCustomSlot | null>(null);

  const syncFromHandle = useCallback(() => {
    const settings = handle.getEqualizerSettings();
    setPresetId(settings.presetId);
    setCustomPresetSlot(settings.customPresetSlot);
    setCustomPresets(settings.customPresets);
    setBandGains([...settings.bandGains]);
    setLastSelection({ ...settings.lastSelection });
    setCustomPresetNameDrafts(buildRadioEqualizerCustomPresetNameDrafts(settings.customPresets));
  }, [handle]);

  useEffect(() => {
    syncFromHandle();
  }, [syncFromHandle]);

  const customPresetLabels = useMemo(
    () => new Map(customPresets.map((preset) => [preset.slot, preset.label] as const)),
    [customPresets]
  );

  const resetLabel = useMemo(
    () => resolveRadioEqualizerLastSelectionLabel(lastSelection, customPresetLabels),
    [customPresetLabels, lastSelection]
  );

  const matchMessage = useMemo(() => {
    const match = resolveRadioEqualizerBandGainsMatch({
      bandGains,
      customPresets,
      activePresetId: presetId,
      activeCustomSlot: customPresetSlot,
    });

    return match ? buildRadioEqualizerMatchMessage(match) : null;
  }, [bandGains, customPresetSlot, customPresets, presetId]);

  const handleBandChange = (bandIndex: number, nextValue: number) => {
    const nextGains = [...bandGains];
    nextGains[bandIndex] = nextValue;
    handle.setEqualizerBandGains(nextGains);
    syncFromHandle();
  };

  const handlePresetSelect = (nextPresetId: RadioEqualizerPresetId) => {
    handle.applyEqualizerPreset(nextPresetId);
    syncFromHandle();
  };

  const handleReset = () => {
    handle.resetEqualizerToLastSelection();
    syncFromHandle();
  };

  return (
    <section
      className={className ? `${styles.section} ${className}` : styles.section}
      aria-label="Equalizer"
      data-testid="radio-equalizer-panel"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Equalizer</h3>
        <button
          type="button"
          className={`${styles.resetBtn} no-glass`}
          title={`Reset to ${resetLabel}`}
          aria-label={`Reset equalizer to ${resetLabel}`}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      {matchMessage ? (
        <p
          className={
            matchMessage.kind === 'exact' ? styles.matchExact : styles.matchNear
          }
          role={matchMessage.kind === 'exact' ? 'alert' : 'status'}
          data-testid="radio-equalizer-match-notice"
        >
          {matchMessage.text}
        </p>
      ) : null}

      <div className={styles.presets} role="group" aria-label="Equalizer presets">
        {RADIO_EQUALIZER_PRESET_DEFINITIONS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`${styles.presetBtn} no-glass`}
            aria-pressed={presetId === preset.id && customPresetSlot === null}
            onClick={() => {
              handlePresetSelect(preset.id);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className={styles.customPresets} role="group" aria-label="Custom equalizer presets">
        {RADIO_EQUALIZER_CUSTOM_SLOTS.map((slot) => {
          const preset = customPresets.find((entry) => entry.slot === slot);
          const isSaved = preset ? isRadioEqualizerCustomPresetSaved(preset) : false;
          const isActive = customPresetSlot === slot;
          const draftLabel = customPresetNameDrafts[slot] ?? `Custom ${slot}`;
          const resolvedLabel = normalizeRadioEqualizerCustomPresetLabel(draftLabel, slot);
          const isDeletePending = pendingDeleteSlot === slot;

          return (
            <div key={slot} className={styles.customPresetSlot}>
              <button
                type="button"
                className={`${styles.customPresetLoad} no-glass`}
                aria-pressed={isActive}
                disabled={!isSaved}
                aria-label={
                  isSaved ? `Load ${resolvedLabel}` : `Custom preset slot ${slot} is empty`
                }
                title={isSaved ? `Load ${resolvedLabel}` : `Slot ${slot} is empty`}
                onClick={() => {
                  handle.applyEqualizerCustomPreset(slot);
                  syncFromHandle();
                }}
              >
                Load
              </button>
              <input
                type="text"
                className={styles.customPresetName}
                value={draftLabel}
                maxLength={RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH}
                placeholder={`Custom ${slot}`}
                aria-label={`Name for custom preset slot ${slot}`}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setCustomPresetNameDrafts((current) => ({
                    ...current,
                    [slot]: nextValue,
                  }));
                }}
                onBlur={() => {
                  if (!isSaved) {
                    return;
                  }

                  const normalizedLabel = normalizeRadioEqualizerCustomPresetLabel(draftLabel, slot);
                  if (normalizedLabel === preset?.label) {
                    return;
                  }

                  handle.renameEqualizerCustomPreset(slot, normalizedLabel);
                  syncFromHandle();
                }}
              />
              <button
                type="button"
                className={`${styles.customPresetSave} no-glass`}
                aria-label={`Save current EQ to ${resolvedLabel}`}
                title={`Save current EQ to ${resolvedLabel}`}
                onClick={() => {
                  setPendingDeleteSlot(null);
                  handle.saveEqualizerCustomPreset(slot, draftLabel);
                  syncFromHandle();
                }}
              >
                Save
              </button>
              {isDeletePending ? (
                <div
                  className={styles.customPresetDeleteConfirm}
                  role="group"
                  aria-label={buildRadioEqualizerDeleteConfirmMessage(resolvedLabel)}
                >
                  <button
                    type="button"
                    className={`${styles.customPresetDeleteConfirmBtn} no-glass`}
                    aria-label={`Confirm delete ${resolvedLabel}`}
                    title={`Confirm delete ${resolvedLabel}`}
                    onClick={() => {
                      handle.deleteEqualizerCustomPreset(slot);
                      setPendingDeleteSlot(null);
                      syncFromHandle();
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className={`${styles.customPresetDeleteCancel} no-glass`}
                    aria-label={`Cancel delete for ${resolvedLabel}`}
                    title="Cancel"
                    onClick={() => {
                      setPendingDeleteSlot(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${styles.customPresetDelete} no-glass`}
                  aria-label={`Delete saved preset ${resolvedLabel}`}
                  title={`Delete ${resolvedLabel}`}
                  disabled={!isSaved}
                  onClick={() => {
                    setPendingDeleteSlot(slot);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.bands} role="group" aria-label="Equalizer bands">
        {Array.from({ length: RADIO_EQUALIZER_BAND_COUNT }, (_, bandIndex) => {
          const gain = bandGains[bandIndex] ?? 0;
          const label = RADIO_EQUALIZER_BAND_LABELS[bandIndex] ?? '';

          return (
            <RadioEqualizerBandFader
              key={label}
              bandIndex={bandIndex}
              label={label}
              gain={gain}
              onChange={handleBandChange}
            />
          );
        })}
      </div>
    </section>
  );
}
