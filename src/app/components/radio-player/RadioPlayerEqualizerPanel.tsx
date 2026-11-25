'use client';

import {
  buildRadioEqualizerCustomPresetNameDrafts,
  buildRadioEqualizerDeleteConfirmMessage,
  buildRadioEqualizerMatchMessage,
  formatRadioEqualizerCustomSlotDefault,
  resolveRadioEqualizerPresetLabel,
} from '@molecules/i18n/idlingRadioI18n';
import type { RadioPlayerHandle } from '@widgets/radio-player/radioPlayer.types';
import type {
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RadioEqualizerBandFader } from './RadioEqualizerBandFader';
import styles from './RadioPlayerEqualizerPanel.module.css';
import { useRadioCopy } from './useRadioCopy';

export interface RadioPlayerEqualizerPanelProps {
  handle: RadioPlayerHandle;
  className?: string;
}

export type { RadioEqualizerMatchMessage } from '@molecules/i18n/idlingRadioI18n';
export {
  buildRadioEqualizerCustomPresetNameDrafts,
  buildRadioEqualizerDeleteConfirmMessage,
  buildRadioEqualizerMatchMessage,
} from '@molecules/i18n/idlingRadioI18n';

function formatRadioEqTemplate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template
  );
}

export function RadioPlayerEqualizerPanel({ handle, className }: RadioPlayerEqualizerPanelProps) {
  const radioCopy = useRadioCopy();
  const radioCopyRef = useRef(radioCopy);
  radioCopyRef.current = radioCopy;
  const { aria, equalizer } = radioCopy;
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
    buildRadioEqualizerCustomPresetNameDrafts(radioCopy, handle.getEqualizerSettings().customPresets)
  );
  const [pendingDeleteSlot, setPendingDeleteSlot] = useState<RadioEqualizerCustomSlot | null>(null);

  const syncFromHandle = useCallback(() => {
    const settings = handle.getEqualizerSettings();
    setPresetId(settings.presetId);
    setCustomPresetSlot(settings.customPresetSlot);
    setCustomPresets(settings.customPresets);
    setBandGains([...settings.bandGains]);
    setLastSelection({ ...settings.lastSelection });
    setCustomPresetNameDrafts(
      buildRadioEqualizerCustomPresetNameDrafts(radioCopyRef.current, settings.customPresets)
    );
  }, [handle]);

  useEffect(() => {
    syncFromHandle();
  }, [syncFromHandle]);

  useEffect(() => {
    const settings = handle.getEqualizerSettings();
    setCustomPresetNameDrafts(
      buildRadioEqualizerCustomPresetNameDrafts(radioCopy, settings.customPresets)
    );
  }, [handle, radioCopy]);

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

    return match ? buildRadioEqualizerMatchMessage(radioCopy, match) : null;
  }, [bandGains, customPresetSlot, customPresets, presetId, radioCopy]);

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
      aria-label={aria.equalizer}
      data-testid="radio-equalizer-panel"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{equalizer.title}</h3>
        <button
          type="button"
          className={`${styles.resetBtn} no-glass`}
          title={`${equalizer.resetAriaPrefix} ${resetLabel}`}
          aria-label={`${equalizer.resetAriaPrefix} ${resetLabel}`}
          onClick={handleReset}
        >
          {equalizer.reset}
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

      <div className={styles.presets} role="group" aria-label={aria.equalizerPresets}>
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
            {resolveRadioEqualizerPresetLabel(radioCopy, preset.id, preset.label)}
          </button>
        ))}
      </div>

      <div className={styles.customPresets} role="group" aria-label={aria.customEqualizerPresets}>
        {RADIO_EQUALIZER_CUSTOM_SLOTS.map((slot) => {
          const preset = customPresets.find((entry) => entry.slot === slot);
          const isSaved = preset ? isRadioEqualizerCustomPresetSaved(preset) : false;
          const isActive = customPresetSlot === slot;
          const draftLabel = customPresetNameDrafts[slot] ?? formatRadioEqualizerCustomSlotDefault(radioCopy, slot);
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
                  isSaved
                    ? formatRadioEqTemplate(equalizer.loadPresetAria, { label: resolvedLabel })
                    : formatRadioEqTemplate(equalizer.emptySlotAria, { slot })
                }
                title={
                  isSaved
                    ? formatRadioEqTemplate(equalizer.loadPresetAria, { label: resolvedLabel })
                    : formatRadioEqTemplate(equalizer.slotEmptyTitle, { slot })
                }
                onClick={() => {
                  handle.applyEqualizerCustomPreset(slot);
                  syncFromHandle();
                }}
              >
                {equalizer.load}
              </button>
              <input
                type="text"
                className={styles.customPresetName}
                value={draftLabel}
                maxLength={RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH}
                placeholder={formatRadioEqualizerCustomSlotDefault(radioCopy, slot)}
                aria-label={formatRadioEqTemplate(equalizer.nameSlotAria, { slot })}
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
                aria-label={formatRadioEqTemplate(equalizer.saveToAria, { label: resolvedLabel })}
                title={formatRadioEqTemplate(equalizer.saveToAria, { label: resolvedLabel })}
                onClick={() => {
                  setPendingDeleteSlot(null);
                  handle.saveEqualizerCustomPreset(slot, draftLabel);
                  syncFromHandle();
                }}
              >
                {equalizer.save}
              </button>
              {isDeletePending ? (
                <div
                  className={styles.customPresetDeleteConfirm}
                  role="group"
                  aria-label={buildRadioEqualizerDeleteConfirmMessage(radioCopy, resolvedLabel)}
                >
                  <button
                    type="button"
                    className={`${styles.customPresetDeleteConfirmBtn} no-glass`}
                    aria-label={formatRadioEqTemplate(equalizer.confirmDeleteAria, {
                      label: resolvedLabel,
                    })}
                    title={formatRadioEqTemplate(equalizer.confirmDeleteAria, { label: resolvedLabel })}
                    onClick={() => {
                      handle.deleteEqualizerCustomPreset(slot);
                      setPendingDeleteSlot(null);
                      syncFromHandle();
                    }}
                  >
                    {equalizer.confirm}
                  </button>
                  <button
                    type="button"
                    className={`${styles.customPresetDeleteCancel} no-glass`}
                    aria-label={formatRadioEqTemplate(equalizer.cancelDeleteAria, { label: resolvedLabel })}
                    title={equalizer.cancel}
                    onClick={() => {
                      setPendingDeleteSlot(null);
                    }}
                  >
                    {equalizer.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${styles.customPresetDelete} no-glass`}
                  aria-label={formatRadioEqTemplate(equalizer.deletePresetAria, { label: resolvedLabel })}
                  title={formatRadioEqTemplate(equalizer.deletePresetAria, { label: resolvedLabel })}
                  disabled={!isSaved}
                  onClick={() => {
                    setPendingDeleteSlot(slot);
                  }}
                >
                  {equalizer.delete}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.bands} role="group" aria-label={aria.equalizerBands}>
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