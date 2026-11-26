'use client';

import type { CSSProperties, RefObject } from 'react';
import type { RadioSongFavorite } from '@widgets/radio-player/radioSongFavorites';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useRadioCopy } from './useRadioCopy';
import { RadioPlayerOverflowText } from './RadioPlayerOverflowText';
import { RadioPlayerPanelResizeHandle } from './RadioPlayerPanelResizeHandle';
import { RadioPlayerSongSaveButton } from './RadioPlayerSongSaveButton';
import { RadioPlayerTrackSearchButton } from './RadioPlayerTrackSearchButton';
import barStyles from './RadioPlayerBar.module.css';
import styles from './RadioPlayerSongControls.module.css';

export interface RadioPlayerSavedSongsPanelProps {
  panelRef: RefObject<HTMLElement | null>;
  panelStyle?: CSSProperties;
  panelHeightPx: number | null;
  onBeginResize: (clientY: number) => void;
  onResetHeight: () => void;
  signedIn: boolean;
  songs: readonly RadioSongFavorite[];
  onToggleSong: (song: RadioSongFavorite) => void;
}

export function RadioPlayerSavedSongsPanel({
  panelRef,
  panelStyle,
  panelHeightPx,
  onBeginResize,
  onResetHeight,
  signedIn,
  songs,
  onToggleSong,
}: RadioPlayerSavedSongsPanelProps) {
  const { aria, bar } = useRadioCopy();

  return (
    <section
      ref={panelRef}
      className={`${barStyles.panel} ${barStyles.panelResizable}`}
      data-custom-height={panelHeightPx !== null ? 'true' : 'false'}
      style={panelStyle}
      aria-label={aria.savedSongs}
      data-testid="radio-saved-songs-panel"
    >
      <RadioPlayerPanelResizeHandle
        panelHeightPx={panelHeightPx}
        onBeginResize={onBeginResize}
        onResetHeight={onResetHeight}
      />
      <h2 className={styles.heading}>
        <SiteIcon id="library" sizeRem={0.85} title="" />
        {aria.savedSongs}
      </h2>
      {!signedIn ? (
        <p className={styles.note}>{bar.savedSongsSignIn}</p>
      ) : songs.length === 0 ? (
        <p className={styles.note}>{bar.emptySavedSongs}</p>
      ) : (
        <div className={styles.list}>
          {songs.map((song) => (
            <div key={song.songKey} className={styles.row}>
              <RadioPlayerTrackSearchButton
                trackDisplay={song.display}
                artist={song.artist}
                title={song.title}
              />
              <RadioPlayerOverflowText text={song.display} className={styles.title} />
              <RadioPlayerSongSaveButton
                signedIn
                saved
                onToggle={() => {
                  onToggleSong(song);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
