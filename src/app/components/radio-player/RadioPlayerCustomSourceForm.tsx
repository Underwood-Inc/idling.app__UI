'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import type { CustomAudioSourceKind, RadioStationGenreId } from '@widgets/radio-player/radioPlayer.types';
import {
  CUSTOM_AUDIO_SOURCE_URL_HINT,
  defaultCustomSourceGenreId,
  listCustomAudioSourceGenreOptions,
} from '@widgets/radio-player/customAudioSourceBrowse';
import { FormEvent, useCallback, useState } from 'react';
import styles from './RadioPlayerBar.module.css';

export interface RadioPlayerCustomSourceFormProps {
  onAdded?: (genre: RadioStationGenreId) => void;
}

export interface CustomSourceFormState {
  name: string;
  url: string;
  kind: CustomAudioSourceKind;
  genre: RadioStationGenreId;
  supportsTrackMetadata: boolean;
}

const DEFAULT_FORM_STATE: CustomSourceFormState = {
  name: '',
  url: '',
  kind: 'live-stream',
  genre: defaultCustomSourceGenreId(),
  supportsTrackMetadata: true,
};

export function RadioPlayerCustomSourceForm({ onAdded }: RadioPlayerCustomSourceFormProps) {
  const { addCustomSource } = useRadioPlayer();
  const [form, setForm] = useState<CustomSourceFormState>(DEFAULT_FORM_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const genreOptions = listCustomAudioSourceGenreOptions();

  const handleKindChange = useCallback((kind: CustomAudioSourceKind) => {
    setForm((current) => ({
      ...current,
      kind,
      supportsTrackMetadata: kind === 'live-stream',
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrorMessage(null);
      setIsSubmitting(true);

      const result = await addCustomSource({
        name: form.name,
        url: form.url,
        kind: form.kind,
        genre: form.genre,
        supportsTrackMetadata: form.supportsTrackMetadata,
      });

      setIsSubmitting(false);

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      const addedGenre = form.genre;
      setForm(DEFAULT_FORM_STATE);
      onAdded?.(addedGenre);
    },
    [addCustomSource, form, onAdded]
  );

  return (
    <form className={styles.customSourceForm} onSubmit={handleSubmit} aria-label="Add custom audio source">
      <div className={styles.customSourceForm__header}>
        <h3 className={styles.customSourceForm__title}>Add your own source</h3>
        <p className={styles.customSourceForm__hint}>{CUSTOM_AUDIO_SOURCE_URL_HINT}</p>
      </div>

      <label className={styles.customSourceForm__field}>
        <span className={styles.customSourceForm__label}>Name</span>
        <input
          type="text"
          className={styles.customSourceForm__input}
          value={form.name}
          maxLength={80}
          autoComplete="off"
          placeholder="My ambient stream"
          onChange={(event) => {
            setForm((current) => ({ ...current, name: event.target.value }));
          }}
        />
      </label>

      <label className={styles.customSourceForm__field}>
        <span className={styles.customSourceForm__label}>Audio URL</span>
        <input
          type="url"
          className={styles.customSourceForm__input}
          value={form.url}
          autoComplete="off"
          placeholder="https://example.com/stream.mp3"
          onChange={(event) => {
            setForm((current) => ({ ...current, url: event.target.value }));
          }}
        />
      </label>

      <fieldset className={styles.customSourceForm__kind}>
        <legend className={styles.customSourceForm__label}>Source type</legend>
        <div className={styles.customSourceForm__kindOptions} role="group" aria-label="Source type">
          <button
            type="button"
            className={`${styles.customSourceForm__kindBtn} no-glass`}
            aria-pressed={form.kind === 'live-stream'}
            onClick={() => {
              handleKindChange('live-stream');
            }}
          >
            Live stream
          </button>
          <button
            type="button"
            className={`${styles.customSourceForm__kindBtn} no-glass`}
            aria-pressed={form.kind === 'static-media'}
            onClick={() => {
              handleKindChange('static-media');
            }}
          >
            Static file
          </button>
        </div>
      </fieldset>

      <fieldset className={styles.customSourceForm__kind}>
        <legend className={styles.customSourceForm__label}>Genre</legend>
        <div className={styles.customSourceForm__genreOptions} role="group" aria-label="Genre">
          {genreOptions.map((genre) => (
            <button
              key={genre.id}
              type="button"
              className={`${styles.customSourceForm__genreBtn} no-glass`}
              aria-pressed={form.genre === genre.id}
              onClick={() => {
                setForm((current) => ({ ...current, genre: genre.id }));
              }}
            >
              {genre.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={styles.customSourceForm__checkbox}>
        <input
          type="checkbox"
          checked={form.supportsTrackMetadata}
          onChange={(event) => {
            setForm((current) => ({
              ...current,
              supportsTrackMetadata: event.target.checked,
            }));
          }}
        />
        <span>Show now-playing titles when the stream publishes them</span>
      </label>

      {errorMessage ? (
        <p className={styles.customSourceForm__error} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button type="submit" className={`${styles.customSourceForm__submit} no-glass`} disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add source'}
      </button>
    </form>
  );
}
