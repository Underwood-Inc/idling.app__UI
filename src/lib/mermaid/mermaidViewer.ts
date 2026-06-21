/**
 * Interactive Mermaid diagram viewer (pan/zoom controls).
 * Ported from static/js/mermaid-viewer.js for use in the Next.js app.
 */

import { fitDiagramToViewport } from './mermaidViewerFit';
import type {
  MermaidContentBox,
  MermaidDiagramElement,
  MermaidViewerState,
} from './mermaidViewer.types';

interface ControlButtonConfig {
  icon: string;
  title: string;
  action: () => void;
}

const FULLSCREEN_Z_INDEX = '10001';
const VIEWPORT_PADDING = 24;
const MAX_VIEWER_SCALE = 5;

function detectDiagramType(diagram: HTMLElement): string {
  const content = diagram.textContent ?? diagram.innerHTML;

  if (content.includes('graph') || content.includes('flowchart')) return 'flowchart';
  if (content.includes('sequenceDiagram')) return 'sequence';
  if (content.includes('classDiagram')) return 'class';
  if (content.includes('stateDiagram')) return 'state';
  if (content.includes('erDiagram')) return 'er';
  if (content.includes('gantt')) return 'gantt';
  if (content.includes('journey')) return 'journey';
  if (content.includes('gitGraph')) return 'git';
  if (content.includes('C4Context')) return 'c4';

  return 'diagram';
}

function createContainer(diagram: HTMLElement): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mermaid-container';
  container.setAttribute('data-mermaid-interactive', 'true');

  const diagramType = detectDiagramType(diagram);
  container.setAttribute('data-diagram-type', diagramType);

  diagram.parentNode?.insertBefore(container, diagram);
  container.appendChild(diagram);

  return container;
}

function getSvgUserUnitScale(svg: SVGSVGElement): number {
  const viewBox = svg.viewBox?.baseVal;
  const rect = svg.getBoundingClientRect();

  if (!viewBox || viewBox.width <= 0 || rect.width <= 0) {
    return 1;
  }

  return rect.width / viewBox.width;
}

function readContentBox(svg: SVGSVGElement): MermaidContentBox {
  const graphicRoot = svg.querySelector('g');
  const measureTarget = (graphicRoot ?? svg) as SVGGraphicsElement;
  const bbox = measureTarget.getBBox();
  const padding = 12;
  const unitScale = getSvgUserUnitScale(svg);

  if (bbox.width > 0 && bbox.height > 0) {
    return {
      x: (bbox.x - padding) * unitScale,
      y: (bbox.y - padding) * unitScale,
      width: (bbox.width + padding * 2) * unitScale,
      height: (bbox.height + padding * 2) * unitScale,
    };
  }

  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return {
      x: viewBox.x * unitScale,
      y: viewBox.y * unitScale,
      width: viewBox.width * unitScale,
      height: viewBox.height * unitScale,
    };
  }

  const rect = svg.getBoundingClientRect();
  return {
    x: 0,
    y: 0,
    width: Math.max(rect.width, 320),
    height: Math.max(rect.height, 240),
  };
}

function prepareInteractiveSvg(svg: SVGSVGElement): void {
  svg.style.overflow = 'visible';
  svg.style.maxWidth = 'none';
  svg.style.width = 'auto';
  svg.style.height = 'auto';
  svg.style.transformOrigin = '0 0';
  svg.setAttribute('overflow', 'visible');
  svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
}

function getViewportSize(container: HTMLElement): { width: number; height: number } {
  const bounds = container.getBoundingClientRect();
  return {
    width: Math.max(bounds.width, container.clientWidth, 320),
    height: Math.max(bounds.height, container.clientHeight, 360),
  };
}

function applyTransform(
  diagram: MermaidDiagramElement,
  state: MermaidViewerState,
  animate = false,
): void {
  diagram._viewerState = state;
  const svg = diagram.querySelector('svg');

  if (!svg) return;

  svg.style.transformOrigin = '0 0';
  svg.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;

  if (animate) {
    svg.style.transition = 'transform 0.3s ease';
    window.setTimeout(() => {
      svg.style.transition = '';
    }, 300);
    return;
  }

  svg.style.transition = '';
}

function refitDiagramView(
  diagram: MermaidDiagramElement,
  container: HTMLElement,
  options: { allowUpscale?: boolean; persistAsInitial?: boolean; animate?: boolean } = {},
): MermaidViewerState {
  const svg = diagram.querySelector('svg');
  if (!svg) {
    return diagram._viewerState ?? { scale: 1, translateX: 0, translateY: 0 };
  }

  const contentBox = readContentBox(svg);
  diagram._contentBox = contentBox;

  const viewport = getViewportSize(container);
  const isFullscreen = container.classList.contains('mermaid-fullscreen');
  const nextState = fitDiagramToViewport({
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    contentBox,
    padding: VIEWPORT_PADDING,
    allowUpscale: options.allowUpscale ?? true,
    maxScale: MAX_VIEWER_SCALE,
  });

  applyTransform(diagram, nextState, options.animate ?? false);

  if (options.persistAsInitial ?? !isFullscreen) {
    diagram._initialViewerState = { ...nextState };
    diagram._embeddedViewerState = { ...nextState };
  }

  return nextState;
}

function getContainerPoint(container: HTMLElement, event: MouseEvent | WheelEvent): { x: number; y: number } {
  const rect = container.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function zoomIn(diagram: MermaidDiagramElement): void {
  const state = diagram._viewerState ?? { scale: 1, translateX: 0, translateY: 0 };
  state.scale = Math.min(MAX_VIEWER_SCALE, state.scale * 1.2);
  applyTransform(diagram, state, true);
}

function zoomOut(diagram: MermaidDiagramElement): void {
  const state = diagram._viewerState ?? { scale: 1, translateX: 0, translateY: 0 };
  state.scale = Math.max(0.1, state.scale / 1.2);
  applyTransform(diagram, state, true);
}

function resetView(diagram: MermaidDiagramElement): void {
  const container = diagram._viewerContainer;
  if (!container) return;

  if (container.classList.contains('mermaid-fullscreen')) {
    refitDiagramView(diagram, container, { allowUpscale: true, animate: true });
    return;
  }

  const embedded = diagram._embeddedViewerState ?? diagram._initialViewerState;
  if (embedded) {
    applyTransform(diagram, { ...embedded }, true);
    return;
  }

  refitDiagramView(diagram, container, { persistAsInitial: true, animate: true });
}

function mountFullscreenContainer(container: HTMLElement, diagram: MermaidDiagramElement): void {
  if (container.classList.contains('mermaid-fullscreen')) return;

  if (diagram._viewerState) {
    diagram._embeddedViewerState = { ...diagram._viewerState };
  }

  const placeholder = document.createComment('mermaid-fullscreen-anchor');
  container.parentNode?.insertBefore(placeholder, container);
  diagram._fullscreenPlaceholder = placeholder;

  document.body.appendChild(container);
  container.classList.add('mermaid-fullscreen');
  container.style.zIndex = FULLSCREEN_Z_INDEX;
  document.body.style.overflow = 'hidden';
  container.focus();

  window.requestAnimationFrame(() => {
    refitDiagramView(diagram, container, { allowUpscale: true, animate: true });
  });
}

function unmountFullscreenContainer(container: HTMLElement, diagram: MermaidDiagramElement): void {
  if (!container.classList.contains('mermaid-fullscreen')) return;

  container.classList.remove('mermaid-fullscreen');
  container.style.zIndex = '';

  const placeholder = diagram._fullscreenPlaceholder;
  if (placeholder?.parentNode) {
    placeholder.parentNode.insertBefore(container, placeholder);
    placeholder.remove();
  }

  diagram._fullscreenPlaceholder = undefined;
  document.body.style.overflow = '';

  window.requestAnimationFrame(() => {
    refitDiagramView(diagram, container, { persistAsInitial: true, animate: true });
  });
}

function toggleFullscreen(container: HTMLElement, diagram: MermaidDiagramElement): void {
  if (container.classList.contains('mermaid-fullscreen')) {
    unmountFullscreenContainer(container, diagram);
  } else {
    mountFullscreenContainer(container, diagram);
  }
}

function addControls(container: HTMLElement, diagram: MermaidDiagramElement): void {
  const controls = document.createElement('div');
  controls.className = 'mermaid-controls';

  const buttons: ControlButtonConfig[] = [
    { icon: '+', title: 'Zoom In', action: () => zoomIn(diagram) },
    { icon: '-', title: 'Zoom Out', action: () => zoomOut(diagram) },
    { icon: '⌂', title: 'Reset View', action: () => resetView(diagram) },
    { icon: '⛶', title: 'Fullscreen', action: () => toggleFullscreen(container, diagram) },
  ];

  buttons.forEach(({ icon, title, action }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mermaid-control-btn no-glass';
    button.innerHTML = icon;
    button.title = title;
    button.onclick = action;
    controls.appendChild(button);
  });

  container.appendChild(controls);
}

function addInfoOverlay(container: HTMLElement, diagram: HTMLElement): void {
  const info = document.createElement('div');
  info.className = 'mermaid-info';

  const svg = diagram.querySelector('svg');
  if (svg) {
    const contentBox = readContentBox(svg);
    const nodes = svg.querySelectorAll('.node, .actor, .state, .class').length;
    const edges = svg.querySelectorAll('.edgePath, .messageLine, .transition').length;

    info.innerHTML = `
      Nodes: ${nodes} • Edges: ${edges} •
      Size: ${Math.round(contentBox.width)}×${Math.round(contentBox.height)}px<br>
      Scroll to zoom • Drag to pan • Press F for fullscreen
    `;
  } else {
    info.innerHTML = 'Scroll to zoom • Drag to pan • Press F for fullscreen';
  }

  container.appendChild(info);
}

function addKeyboardShortcuts(container: HTMLElement, diagram: MermaidDiagramElement): void {
  container.addEventListener('keydown', (event) => {
    if (event.target !== container && !container.contains(event.target as Node)) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'f':
        event.preventDefault();
        toggleFullscreen(container, diagram);
        break;
      case '+':
      case '=':
        event.preventDefault();
        zoomIn(diagram);
        break;
      case '-':
        event.preventDefault();
        zoomOut(diagram);
        break;
      case '0':
        event.preventDefault();
        resetView(diagram);
        break;
      case 'escape':
        if (container.classList.contains('mermaid-fullscreen')) {
          unmountFullscreenContainer(container, diagram);
        }
        break;
      default:
        break;
    }
  });

  container.setAttribute('tabindex', '0');
}

function scheduleInitialRefit(
  diagram: MermaidDiagramElement,
  container: HTMLElement,
  syncPanState: () => void,
): void {
  const runRefit = () => {
    if (container.clientWidth < 1 || container.clientHeight < 1) {
      return;
    }

    refitDiagramView(diagram, container, { allowUpscale: true, persistAsInitial: true });
    syncPanState();
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(runRefit);
  });

  diagram._resizeObserver?.disconnect();
  const resizeObserver = new ResizeObserver(() => {
    runRefit();
  });
  resizeObserver.observe(container);
  diagram._resizeObserver = resizeObserver;

  diagram._viewerAbort?.signal.addEventListener('abort', () => {
    resizeObserver.disconnect();
  });
}

function enhancePanZoom(diagram: MermaidDiagramElement, container: HTMLElement): void {
  const svg = diagram.querySelector('svg');
  if (!svg) return;

  diagram._viewerAbort?.abort();
  diagram._resizeObserver?.disconnect();

  const abortController = new AbortController();
  diagram._viewerAbort = abortController;
  const listenerOptions = { signal: abortController.signal } as const;

  prepareInteractiveSvg(svg);
  diagram._viewerContainer = container;

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;

  const syncPanState = () => {
    const state = diagram._viewerState;
    if (!state) return;
    scale = state.scale;
    translateX = state.translateX;
    translateY = state.translateY;
  };

  const syncState = () => {
    diagram._viewerState = { scale, translateX, translateY };
    applyTransform(diagram, diagram._viewerState, false);
  };

  refitDiagramView(diagram, container, { allowUpscale: true, persistAsInitial: true });
  syncPanState();
  scheduleInitialRefit(diagram, container, syncPanState);

  container.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const point = getContainerPoint(container, event);
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(MAX_VIEWER_SCALE, scale * scaleFactor));

      if (newScale === scale) return;

      translateX = point.x - ((point.x - translateX) * newScale) / scale;
      translateY = point.y - ((point.y - translateY) * newScale) / scale;
      scale = newScale;
      syncState();
    },
    { passive: false, signal: abortController.signal },
  );

  container.addEventListener(
    'mousedown',
    (event) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest('.mermaid-controls') || target.closest('.mermaid-info')) return;

      isDragging = true;
      const point = getContainerPoint(container, event);
      dragStartX = point.x;
      dragStartY = point.y;
      dragOriginX = translateX;
      dragOriginY = translateY;
      container.style.cursor = 'grabbing';
      event.preventDefault();
    },
    listenerOptions,
  );

  const onMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;
    const point = getContainerPoint(container, event);
    translateX = dragOriginX + (point.x - dragStartX);
    translateY = dragOriginY + (point.y - dragStartY);
    syncState();
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = 'grab';
  };

  document.addEventListener('mousemove', onMouseMove, listenerOptions);
  document.addEventListener('mouseup', onMouseUp, listenerOptions);

  container.style.cursor = 'grab';

  const onResize = () => {
    if (container.clientWidth < 1 || container.clientHeight < 1) {
      return;
    }

    if (container.classList.contains('mermaid-fullscreen')) {
      refitDiagramView(diagram, container, { allowUpscale: true });
      syncPanState();
      return;
    }

    refitDiagramView(diagram, container, { allowUpscale: true, persistAsInitial: true });
    syncPanState();
  };

  window.addEventListener('resize', onResize, listenerOptions);
}

export function enhanceMermaidDiagram(diagram: HTMLElement): void {
  if (diagram.hasAttribute('data-enhanced')) return;

  diagram.setAttribute('data-enhanced', 'true');

  let container = diagram.closest('.mermaid-container');
  if (!container) {
    container = createContainer(diagram);
  } else {
    container.setAttribute('data-mermaid-interactive', 'true');
  }

  const diagramElement = diagram as MermaidDiagramElement;

  addControls(container, diagramElement);
  addInfoOverlay(container, diagram);
  addKeyboardShortcuts(container, diagramElement);
  enhancePanZoom(diagramElement, container);
}

export function enhanceMermaidDiagrams(root: ParentNode = document): void {
  root.querySelectorAll('.mermaid').forEach((diagram) => {
    enhanceMermaidDiagram(diagram as HTMLElement);
  });
}

export type { MermaidContentBox, MermaidDiagramElement, MermaidViewerState } from './mermaidViewer.types';
