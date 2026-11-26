'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useRadioCopy } from './useRadioCopy';
import styles from './RadioPlayerSongControls.module.css';

export interface RadioPlayerSongSaveButtonProps {
  signedIn: boolean;
  saved: boolean;
  onToggle: () => void;
}

export function RadioPlayerSongSaveButton({
  signedIn,
  saved,
  onToggle,
}: RadioPlayerSongSaveButtonProps) {
  const { aria } = useRadioCopy();
  const label = signedIn
    ? saved
      ? aria.removeSavedSong
      : aria.saveSong
    : aria.signInToFavoriteSongs;

  return (
    <span className={styles.tip} title={label} data-testid="radio-save-song-tip">
      <button
        type="button"
        className={`${styles.songSave} no-glass`}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        disabled={!signedIn}
        data-testid="radio-save-song"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <SiteIcon id="bookmark" sizeRem={0.8} title="" />
      </button>
    </span>
  );
}
