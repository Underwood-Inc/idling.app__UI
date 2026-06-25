import type { RadioPlayerHandle } from '@widgets/radio-player/radioPlayer.types';
import {
  openRadioNowPlayingSearchInBrowser,
  resolveRadioNowPlayingSearchQuery,
} from '@widgets/radio-player/radioNowPlayingSearch';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import styles from './RadioPlayerTrackSearchButton.module.css';

export interface RadioPlayerTrackSearchButtonProps {
  handle: RadioPlayerHandle;
  trackDisplay: string | null;
}

export function RadioPlayerTrackSearchButton({
  handle,
  trackDisplay,
}: RadioPlayerTrackSearchButtonProps) {
  const nowPlaying = handle.getNowPlaying();
  const searchQuery = resolveRadioNowPlayingSearchQuery({
    display: trackDisplay,
    artist: nowPlaying.artist,
    title: nowPlaying.title,
  });

  if (!searchQuery) {
    return null;
  }

  return (
    <button
      type="button"
      className={`${styles.findBtn} no-glass`}
      aria-label={`Search the web for ${searchQuery}`}
      title={`Find “${searchQuery}”`}
      data-testid="radio-track-search-button"
      onClick={() => {
        openRadioNowPlayingSearchInBrowser(searchQuery);
      }}
    >
      <SiteIcon id="search" sizeRem={0.8} title="" />
    </button>
  );
}
