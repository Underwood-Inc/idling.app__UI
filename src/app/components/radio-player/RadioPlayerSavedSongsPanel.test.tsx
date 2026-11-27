import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { RADIO_EN } from '$i18n-source/radio.en';
import type { RadioSongFavorite } from '@widgets/radio-player/radioSongFavorites';
import { RadioPlayerSavedSongsPanel } from './RadioPlayerSavedSongsPanel';
import { RADIO_SAVED_SONG_ROW_HEIGHT_PX } from './radioSavedSongsWindow';

const song: RadioSongFavorite = {
  songKey: "fleetwood mac — don't stop",
  display: "Fleetwood Mac — Don't Stop",
  artist: 'Fleetwood Mac',
  title: "Don't Stop",
  stationName: 'Radio Paradise',
  stationGenre: 'eclectic',
  savedAt: 1_700_000_000_000,
  favoritedAt: new Date(1_700_000_000_000).toISOString(),
};

const jazzSong: RadioSongFavorite = {
  songKey: 'miles davis — so what',
  display: 'Miles Davis — So What',
  artist: 'Miles Davis',
  title: 'So What',
  stationName: 'WBGO Jazz',
  stationGenre: 'jazz',
  savedAt: 1_700_000_100_000,
  favoritedAt: new Date(1_700_000_100_000).toISOString(),
};

function renderPanel(songs: readonly RadioSongFavorite[], panelHeightPx: number | null = 240) {
  return render(
    <RadioPlayerSavedSongsPanel
      panelRef={createRef()}
      panelHeightPx={panelHeightPx}
      onBeginResize={() => undefined}
      onResetHeight={() => undefined}
      signedIn
      songs={songs}
      onToggleSong={() => undefined}
    />
  );
}

describe('RadioPlayerSavedSongsPanel', () => {
  test('when saved songs are open, each song keeps a search button for the full title', () => {
    renderPanel([song]);

    expect(screen.getByTestId('radio-track-search-button')).toHaveAttribute(
      'aria-label',
      RADIO_EN.aria.searchWebForTrack.replace('{query}', "Fleetwood Mac Don't Stop")
    );
    expect(screen.getByTitle(song.display)).toBeInTheDocument();
  });

  test('when a saved song has station, genre, and a favorited date, the row shows them', () => {
    renderPanel([song]);

    expect(screen.getByTestId('radio-saved-song-meta')).toHaveTextContent(
      'Radio Paradise · Eclectic · 2023-11-14'
    );
  });

  test('when an older saved song is missing station, genre, and date, the row shows em dashes', () => {
    const legacy: RadioSongFavorite = {
      songKey: 'legacy',
      display: 'Legacy Tune',
      artist: null,
      title: null,
      stationName: '',
      savedAt: 0,
    };

    renderPanel([legacy]);

    expect(screen.getByTitle('Legacy Tune')).toBeInTheDocument();
    expect(screen.getByTestId('radio-saved-song-meta')).toHaveTextContent('— · — · —');
  });

  test('when the listener searches saved songs, the virtualized list follows the query parser', () => {
    renderPanel([song, jazzSong]);

    fireEvent.change(screen.getByTestId('radio-saved-songs-search'), {
      target: { value: '#jazz' },
    });

    expect(screen.getByTitle(jazzSong.display)).toBeInTheDocument();
    expect(screen.queryByTitle(song.display)).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('radio-saved-songs-search'), {
      target: { value: '"Don\'t Stop"' },
    });

    expect(screen.getByTitle(song.display)).toBeInTheDocument();
    expect(screen.queryByTitle(jazzSong.display)).not.toBeInTheDocument();
  });

  test('when many songs are saved, only the visible window is in the document', () => {
    const songs = Array.from({ length: 40 }, (_, index) => ({
      songKey: `track-${index}`,
      display: `Saved track ${index}`,
      artist: 'Artist',
      title: `Track ${index}`,
      stationName: 'Radio Paradise',
      stationGenre: 'eclectic' as const,
      savedAt: 1_700_000_000_000 + index,
      favoritedAt: new Date(1_700_000_000_000 + index).toISOString(),
    }));

    renderPanel(songs, 120);

    const rows = screen.getAllByTestId('radio-saved-song-row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(songs.length);
    expect(screen.getByTitle('Saved track 0')).toBeInTheDocument();
    expect(screen.queryByTitle('Saved track 39')).not.toBeInTheDocument();

    const list = screen.getByTestId('radio-saved-songs-list');
    list.scrollTop = RADIO_SAVED_SONG_ROW_HEIGHT_PX * 20;
    fireEvent.scroll(list);

    expect(screen.queryByTitle('Saved track 0')).not.toBeInTheDocument();
    expect(screen.getByTitle('Saved track 20')).toBeInTheDocument();
    expect(screen.queryByTitle('Saved track 39')).not.toBeInTheDocument();
  });
});
