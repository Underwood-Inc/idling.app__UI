'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useRadioCopy } from './useRadioCopy';
import styles from './RadioPlayerSongControls.module.css';

export interface RadioPlayerViewSavedSongsButtonProps {
  expanded: boolean;
  onClick: () => void;
}

export function RadioPlayerViewSavedSongsButton({
  expanded,
  onClick,
}: RadioPlayerViewSavedSongsButtonProps) {
  const { aria } = useRadioCopy();

  return (
    <button
      type="button"
      className={`${styles.libraryBtn} no-glass`}
      aria-expanded={expanded}
      aria-label={aria.viewSavedSongs}
      title={aria.viewSavedSongs}
      data-testid="radio-view-saved-songs"
      onClick={onClick}
    >
      <SiteIcon id="library" sizeRem={0.8} title="" />
    </button>
  );
}
