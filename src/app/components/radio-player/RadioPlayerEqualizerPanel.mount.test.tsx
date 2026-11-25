import { render } from '@testing-library/react';
import { vi } from 'vitest';
import type { RadioPlayerHandle } from '@widgets/radio-player/radioPlayer.types';
import { createDefaultRadioEqualizerSettings } from '@widgets/radio-player/radioEqualizerPresets';
import { IdlingLocaleProvider } from '../locale/IdlingLocaleProvider';
import { RadioPlayerEqualizerPanel } from './RadioPlayerEqualizerPanel';

/**
 * @description Mounting the equalizer must not re-sync in an infinite loop when locale copy updates each render.
 */
test('when the equalizer panel mounts, render count stays bounded across a short interval', () => {
  let renderCount = 0;

  const handle = {
    getEqualizerSettings: () => createDefaultRadioEqualizerSettings(),
    setEqualizerBandGains: vi.fn(),
    applyEqualizerPreset: vi.fn(),
    resetEqualizerToLastSelection: vi.fn(),
    applyEqualizerCustomPreset: vi.fn(),
    renameEqualizerCustomPreset: vi.fn(),
    saveEqualizerCustomPreset: vi.fn(),
    deleteEqualizerCustomPreset: vi.fn(),
  } as unknown as RadioPlayerHandle;

  const Observed = () => {
    renderCount += 1;
    return <RadioPlayerEqualizerPanel handle={handle} />;
  };

  render(
    <IdlingLocaleProvider>
      <Observed />
    </IdlingLocaleProvider>
  );

  const afterMount = renderCount;
  expect(afterMount).toBeLessThan(8);
});