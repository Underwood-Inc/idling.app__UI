export interface WindowControlsOverlay {
  visible: boolean;
  getTitlebarAreaRect(): DOMRect;
  addEventListener(type: 'geometrychange', listener: () => void): void;
  removeEventListener(type: 'geometrychange', listener: () => void): void;
}

export interface NavigatorWithWindowControlsOverlay extends Navigator {
  windowControlsOverlay?: WindowControlsOverlay;
}
