import type { RadioNowPlayingInfo } from './radioPlayer.types';

export interface RadioMediaSessionArtwork {
  src: string;
  sizes: string;
  type: string;
}

export interface RadioMediaSessionMetadataInput {
  stationName: string;
  stationBlurb: string | null;
  nowPlaying: RadioNowPlayingInfo;
}

export interface RadioMediaSessionMetadataView {
  title: string;
  artist: string;
  album: string;
  artwork: RadioMediaSessionArtwork[];
}

export const RADIO_MEDIA_SESSION_ARTWORK: RadioMediaSessionArtwork[] = [
  {
    src: '/android-chrome-192x192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/android-chrome-512x512.png',
    sizes: '512x512',
    type: 'image/png',
  },
  {
    src: '/apple-touch-icon.png',
    sizes: '180x180',
    type: 'image/png',
  },
];

export function buildRadioMediaSessionMetadata({
  stationName,
  stationBlurb,
  nowPlaying,
}: RadioMediaSessionMetadataInput): RadioMediaSessionMetadataView {
  const trackTitle = nowPlaying.title?.trim() || null;
  const trackArtist = nowPlaying.artist?.trim() || null;
  const streamTitle = nowPlaying.streamTitle?.trim() || nowPlaying.display?.trim() || null;

  const title = trackTitle ?? streamTitle ?? stationName;
  const artist = trackArtist ?? (trackTitle || streamTitle ? stationName : stationBlurb ?? 'Idling Radio');
  const album = stationName;

  return {
    title,
    artist,
    album,
    artwork: RADIO_MEDIA_SESSION_ARTWORK,
  };
}

export function isRadioMediaSessionSupported(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export interface RadioMediaSessionActionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
}

export function syncRadioMediaSessionMetadata(metadata: RadioMediaSessionMetadataView): void {
  if (!isRadioMediaSessionSupported()) {
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    artwork: metadata.artwork,
  });
}

export function syncRadioMediaSessionPlaybackState(isPlaying: boolean): void {
  if (!isRadioMediaSessionSupported()) {
    return;
  }

  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

export function registerRadioMediaSessionHandlers(
  handlers: RadioMediaSessionActionHandlers
): () => void {
  if (!isRadioMediaSessionSupported()) {
    return () => undefined;
  }

  const mediaSession = navigator.mediaSession;

  mediaSession.setActionHandler('play', handlers.onPlay);
  mediaSession.setActionHandler('pause', handlers.onPause);
  mediaSession.setActionHandler('previoustrack', handlers.onPreviousTrack);
  mediaSession.setActionHandler('nexttrack', handlers.onNextTrack);
  mediaSession.setActionHandler('stop', handlers.onPause);
  mediaSession.setActionHandler('seekbackward', null);
  mediaSession.setActionHandler('seekforward', null);
  mediaSession.setActionHandler('seekto', null);

  return () => {
    mediaSession.setActionHandler('play', null);
    mediaSession.setActionHandler('pause', null);
    mediaSession.setActionHandler('previoustrack', null);
    mediaSession.setActionHandler('nexttrack', null);
    mediaSession.setActionHandler('stop', null);
    mediaSession.setActionHandler('seekbackward', null);
    mediaSession.setActionHandler('seekforward', null);
    mediaSession.setActionHandler('seekto', null);
    mediaSession.playbackState = 'none';
    mediaSession.metadata = null;
  };
}
