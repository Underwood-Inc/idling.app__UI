export interface IrpDropdownConfig {
  shell: HTMLElement;
  anchor: HTMLElement;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
  openShellClass: string;
  widthForTrigger: (triggerRect: DOMRect) => number;
}

export interface IrpDropdownHandle {
  panel: HTMLElement;
  trigger: HTMLButtonElement;
  anchor: HTMLElement;
  setOpen: (open: boolean) => void;
  position: () => void;
  reparent: () => void;
}

export interface RadioNowPlayingApiResponse {
  station?: string;
  streamTitle?: string | null;
  artist?: string | null;
  title?: string | null;
  display?: string | null;
  supportsTrackMetadata?: boolean;
}

export interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}
