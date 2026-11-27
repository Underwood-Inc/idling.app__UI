'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { RadioSongFavorite } from '@widgets/radio-player/radioSongFavorites';
import {
  filterRadioSongFavorites,
  radioSongFavoriteGenreLabel,
} from '@widgets/radio-player/radioSongFavorites';
import { resolveRadioGenreLabel } from '@molecules/i18n/idlingRadioI18n';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { RadioStationGenreId } from '@widgets/radio-player/radioPlayer.types';
import { RADIO_STATION_GENRES } from '@widgets/radio-player/radioStationBrowse';
import { useRadioCopy } from './useRadioCopy';
import { RadioPlayerOverflowText } from './RadioPlayerOverflowText';
import { RadioPlayerPanelResizeHandle } from './RadioPlayerPanelResizeHandle';
import { RadioPlayerSongSaveButton } from './RadioPlayerSongSaveButton';
import { RadioPlayerTrackSearchButton } from './RadioPlayerTrackSearchButton';
import {
  RADIO_SAVED_SONG_ROW_HEIGHT_PX,
  resolveRadioSavedSongViewportHeight,
  windowRadioSavedSongRange,
} from './radioSavedSongsWindow';
import barStyles from './RadioPlayerBar.module.css';
import styles from './RadioPlayerSongControls.module.css';

const UNKNOWN_DETAIL = '—';

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

function isKnownGenre(genre: string): genre is RadioStationGenreId {
  return Object.prototype.hasOwnProperty.call(RADIO_STATION_GENRES, genre);
}

function detailOrUnknown(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : UNKNOWN_DETAIL;
}

function favoritedOnLabel(song: RadioSongFavorite): string {
  const raw =
    song.favoritedAt ?? (song.savedAt > 0 ? new Date(song.savedAt).toISOString() : null);
  if (!raw) {
    return UNKNOWN_DETAIL;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return UNKNOWN_DETAIL;
  }
  return parsed.toISOString().slice(0, 10);
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
  const radioCopy = useRadioCopy();
  const { aria, bar } = radioCopy;
  const [query, setQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const filteredSongs = useMemo(() => filterRadioSongFavorites(songs, query), [query, songs]);
  const viewportHeight = resolveRadioSavedSongViewportHeight(measuredHeight, panelHeightPx);
  const windowRange = windowRadioSavedSongRange(filteredSongs.length, scrollTop, viewportHeight);
  const visibleSongs = filteredSongs.slice(windowRange.start, windowRange.end);

  useEffect(() => {
    setScrollTop(0);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [query]);

  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node) {
      return undefined;
    }

    const measure = () => {
      if (node.clientHeight > 0) {
        setMeasuredHeight(node.clientHeight);
      }
    };

    measure();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [filteredSongs.length, signedIn]);

  const genreLabel = (genre: string | null | undefined) => {
    if (!genre?.trim()) {
      return UNKNOWN_DETAIL;
    }
    if (isKnownGenre(genre)) {
      return resolveRadioGenreLabel(radioCopy, genre);
    }
    return radioSongFavoriteGenreLabel(genre) || UNKNOWN_DETAIL;
  };

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
      {signedIn && songs.length > 0 ? (
        <div className={styles.search}>
          <div className={barStyles.stationSearch}>
            <SiteIcon
              id="search"
              className={barStyles.stationSearch__icon}
              sizeRem={0.9}
              title=""
            />
            <input
              type="search"
              className={barStyles.stationSearch__input}
              value={query}
              placeholder={bar.savedSongsSearchPlaceholder}
              aria-label={aria.searchSavedSongs}
              data-testid="radio-saved-songs-search"
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
            {query ? (
              <button
                type="button"
                className={`${barStyles.stationSearch__clear} no-glass`}
                aria-label={aria.clearSavedSongSearch}
                onClick={() => {
                  setQuery('');
                }}
              >
                <SiteIcon id="close" sizeRem={0.85} title="" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {!signedIn ? (
        <p className={styles.note}>{bar.savedSongsSignIn}</p>
      ) : songs.length === 0 ? (
        <p className={styles.note}>{bar.emptySavedSongs}</p>
      ) : filteredSongs.length === 0 ? (
        <p className={barStyles.stationSearchEmpty}>
          {bar.emptySavedSongSearchPrefix}{' '}
          <span className={barStyles.stationSearchEmpty__query}>{query.trim()}</span>
        </p>
      ) : (
        <div
          ref={listRef}
          className={styles.list}
          data-testid="radio-saved-songs-list"
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop);
          }}
        >
          <div
            className={styles.window}
            style={{ height: filteredSongs.length * RADIO_SAVED_SONG_ROW_HEIGHT_PX }}
          >
            {visibleSongs.map((song, index) => {
              const rowIndex = windowRange.start + index;
              return (
                <div
                  key={song.songKey}
                  className={`${styles.row} ${styles.rowWindowed}`}
                  style={{ top: rowIndex * RADIO_SAVED_SONG_ROW_HEIGHT_PX }}
                  data-testid="radio-saved-song-row"
                >
                  <RadioPlayerTrackSearchButton
                    trackDisplay={song.display}
                    artist={song.artist}
                    title={song.title}
                  />
                  <RadioPlayerOverflowText text={song.display} className={styles.title} />
                  <span className={styles.meta} data-testid="radio-saved-song-meta">
                    {detailOrUnknown(song.stationName)}
                    {' · '}
                    {genreLabel(song.stationGenre)}
                    {' · '}
                    {favoritedOnLabel(song)}
                  </span>
                  <RadioPlayerSongSaveButton
                    signedIn
                    saved
                    onToggle={() => {
                      onToggleSong(song);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
