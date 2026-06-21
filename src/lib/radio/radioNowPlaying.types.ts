export interface RadioNowPlaying {
  station: string;
  streamTitle: string | null;
  artist: string | null;
  title: string | null;
  display: string | null;
  supportsTrackMetadata: boolean;
}

export interface SplitArtistTitleResult {
  artist: string | null;
  title: string | null;
}
