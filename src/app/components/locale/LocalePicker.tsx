'use client';

import { useIdlingLocale } from './IdlingLocaleProvider';

import type { IdlingLocaleId } from '@molecules/quotes/idlingLocaleCatalog';

import './LocalePicker.css';

export interface LocalePickerProps {
  className?: string;
  showVisibleLabel?: boolean;
}

export function LocalePicker({ className, showVisibleLabel = false }: LocalePickerProps) {
  const { catalog, localeId, setLocaleId, ll, loading } = useIdlingLocale();

  const pickerAria = ll.locale?.pickerAria?.() ?? 'Choose display language';
  const pickerLabel = ll.locale?.pickerLabel?.() ?? 'Language';
  const rootClass = ['locale-picker', className].filter(Boolean).join(' ');

  return (
    <label className={rootClass}>
      {showVisibleLabel ? (
        <span className="locale-picker__label">{pickerLabel}</span>
      ) : (
        <span className="locale-picker__sr-only">{pickerAria}</span>
      )}
      <span className="locale-picker__control">
        <select
          className="locale-picker__select"
          value={localeId}
          disabled={loading}
          title={pickerAria}
          onChange={(event) => setLocaleId(event.target.value as IdlingLocaleId)}
        >
          {catalog.map((row) => (
            <option key={row.id} value={row.id}>
              {row.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}