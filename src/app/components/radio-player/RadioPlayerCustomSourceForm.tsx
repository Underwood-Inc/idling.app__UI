'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { CUSTOM_AUDIO_SOURCE_URL_HINT } from '@widgets/radio-player/customAudioSourceBrowse';
import { FormEvent, useCallback, useState } from 'react';
import styles from './RadioPlayerBar.module.css';

export interface RadioPlayerCustomSourceFormProps {
  onAdded?: () => void;
}

export function RadioPlayerCustomSourceForm({ onAdded }: RadioPlayerCustomSourceFormProps) {
  const { addCustomSource } = useRadioPlayer();
  const [url, setUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrorMessage(null);
      setIsSubmitting(true);

      const result = await addCustomSource({ url });

      setIsSubmitting(false);

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setUrl('');
      onAdded?.();
    },
    [addCustomSource, onAdded, url]
  );

  return (
    <form className={styles.customSourceForm} onSubmit={handleSubmit} aria-label="Add custom audio source">
      <div className={styles.customSourceForm__header}>
        <h3 className={styles.customSourceForm__title}>Add your own stream</h3>
        <p className={styles.customSourceForm__hint}>{CUSTOM_AUDIO_SOURCE_URL_HINT}</p>
      </div>

      <label className={styles.customSourceForm__field}>
        <span className={styles.customSourceForm__label}>Stream URL</span>
        <input
          type="url"
          className={styles.customSourceForm__input}
          value={url}
          autoComplete="off"
          placeholder="https://example.com/stream.mp3"
          onChange={(event) => {
            setUrl(event.target.value);
          }}
        />
      </label>

      {errorMessage ? (
        <p className={styles.customSourceForm__error} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button type="submit" className={`${styles.customSourceForm__submit} no-glass`} disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add stream'}
      </button>
    </form>
  );
}
