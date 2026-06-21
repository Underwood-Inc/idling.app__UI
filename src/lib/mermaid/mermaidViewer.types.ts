export interface MermaidViewerState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface MermaidContentBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MermaidDiagramElement extends HTMLElement {
  _viewerState?: MermaidViewerState;
  _initialViewerState?: MermaidViewerState;
  _embeddedViewerState?: MermaidViewerState;
  _contentBox?: MermaidContentBox;
  _viewerContainer?: HTMLElement;
  _fullscreenPlaceholder?: Comment;
  _viewerAbort?: AbortController;
  _resizeObserver?: ResizeObserver;
}
