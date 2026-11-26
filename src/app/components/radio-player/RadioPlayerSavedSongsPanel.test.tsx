import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { RADIO_EN } from '$i18n-source/radio.en';
import type { RadioSongFavorite } from '@widgets/radio-player/radioSongFavorites';
import { RadioPlayerSavedSongsPanel } from './RadioPlayerSavedSongsPanel';

const song: RadioSongFavorite = {
  songKey: "fleetwood mac — don't stop",
  display: "Fleetwood Mac — Don't Stop",
  artist: 'Fleetwood Mac',
  title: "Don't Stop",
  stationName: 'Radio Paradise',
  savedAt: 10,
};

describe('RadioPlayerSavedSongsPanel', () => {
  test('when saved songs are open, each song keeps a search button for the full title', () => {
    render(
      <RadioPlayerSavedSongsPanel
        panelRef={createRef()}
        panelHeightPx={240}
        onBeginResize={() => undefined}
        onResetHeight={() => undefined}
        signedIn
        songs={[song]}
        onToggleSong={() => undefined}
      />
    );

    expect(screen.getByTestId('radio-track-search-button')).toHaveAttribute(
      'aria-label',
      RADIO_EN.aria.searchWebForTrack.replace('{query}', "Fleetwood Mac Don't Stop")
    );
    expect(screen.getByTitle(song.display)).toBeInTheDocument();
  });
});
