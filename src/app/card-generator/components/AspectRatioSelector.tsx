'use client';

import { AspectRatioConfig } from '../constants/aspectRatios';
import styles from './AspectRatioSelector.module.css';

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
  options: AspectRatioConfig[];
  disabled?: boolean;
}

export function AspectRatioSelector({
  selectedRatio,
  onRatioChange,
  options,
  disabled = false
}: AspectRatioSelectorProps) {
  const currentOption = options.find((option) => option.key === selectedRatio);

  return (
    <div className={styles.aspect__ratio__container}>
      <div className={styles.aspect__ratio__selector}>
        <label htmlFor="aspect-ratio-select" className={styles.selector__label}>
          Aspect Ratio:
        </label>
        <select
          id="aspect-ratio-select"
          value={selectedRatio}
          onChange={(e) => onRatioChange(e.target.value)}
          className={styles.selector__dropdown}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.name} ({option.dimensions})
            </option>
          ))}
        </select>
      </div>

      {currentOption && (
        <div className={styles.aspect__ratio__info}>
          <div className={styles.ratio__info}>
            <span className={styles.ratio__name}>{currentOption.name}</span>
            <span className={styles.ratio__dimensions}>
              {currentOption.dimensions}
            </span>
            <span className={styles.ratio__description}>
              {currentOption.description}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
