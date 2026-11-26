import {
  formatRadioTrackSearchAria,
  formatRadioTrackSearchTitle,
} from '@molecules/i18n/idlingRadioI18n';
import { useRadioCopy } from './useRadioCopy';
import {
  openRadioNowPlayingSearchInBrowser,
  resolveRadioNowPlayingSearchQuery,
} from '@widgets/radio-player/radioNowPlayingSearch';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import styles from './RadioPlayerTrackSearchButton.module.css';

export interface RadioPlayerTrackSearchButtonProps {
  trackDisplay: string | null;
  artist?: string | null;
  title?: string | null;
}

export function RadioPlayerTrackSearchButton({
  trackDisplay,
  artist = null,
  title = null,
}: RadioPlayerTrackSearchButtonProps) {
  const radioCopy = useRadioCopy();
  const searchQuery = resolveRadioNowPlayingSearchQuery({
    display: trackDisplay,
    artist,
    title,
  });

  if (!searchQuery) {
    return null;
  }

  return (
    <button
      type="button"
      className={`${styles.findBtn} no-glass`}
      aria-label={formatRadioTrackSearchAria(radioCopy, searchQuery)}
      title={formatRadioTrackSearchTitle(radioCopy, searchQuery)}
      data-testid="radio-track-search-button"
      onClick={() => {
        openRadioNowPlayingSearchInBrowser(searchQuery);
      }}
    >
      <SiteIcon id="search" sizeRem={0.8} title="" />
    </button>
  );
}
