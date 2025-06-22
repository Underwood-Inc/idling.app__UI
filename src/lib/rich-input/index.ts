/**
 * Composable Rich Input System
 *
 * A completely implementation-agnostic, composable rich input system
 * that can be reused anywhere with full native input behavior
 */

import React from 'react';
import type {
  RichContentParser,
  RichContentToken,
  RichInputPosition,
  RichInputRenderer,
  RichInputSelection,
  RichInputState
} from './types';

// Core types and interfaces
export type {
  RichContentParser,
  RichContentToken,
  RichContentTokenType,
  RichInputAPI,
  RichInputComponent,
  RichInputConfig,
  RichInputEventHandlers,
  RichInputHistoryEntry,
  RichInputPosition,
  RichInputRange,
  RichInputRenderer,
  RichInputSelection,
  RichInputState
} from './types';

// Core engine
export { RichInputEngine } from './core/RichInputEngine';

// Main React component and related types
export {
  RichInput,
  type RichInputProps,
  type RichInputRef
} from './components/RichInput';

// Sub-components (avoid naming conflicts with types)
export { RichInputContent } from './components/RichInputContent';
export { RichInputCursor } from './components/RichInputCursor';
export { RichInputSelection as RichInputSelectionComponent } from './components/RichInputSelection';

// Hooks
export { useKeyboardHandlers } from './hooks/useKeyboardHandlers';
export { useMouseHandlers } from './hooks/useMouseHandlers';
export {
  useRichInput,
  type UseRichInputOptions,
  type UseRichInputReturn
} from './hooks/useRichInput';

// Utilities (excluding types that are already exported above)
export {
  calculateClickPosition,
  calculateClickPositionFromRenderedContent,
  calculateCursorCoordinates,
  calculateCursorFromRenderedContent,
  calculateSelectionCoordinates,
  createPositionFromIndex,
  findTextNodeAndOffset,
  getTextIndexFromDOMPosition,
  snapToPillBoundary
} from './utils/coordinateCalculations';
export {
  getAccurateCharWidth,
  getVisualTextForToken,
  measureTokenWidthAccurate
} from './utils/measurementHelpers';

// Renderers
export { DefaultRenderer, defaultRenderer } from './renderers/DefaultRenderer';

// Convenience functions for creating custom parsers
export const createCustomParser = (
  name: string,
  priority: number,
  parseFunction: (text: string) => RichContentToken[]
): RichContentParser => ({
  name,
  priority,
  parse: parseFunction
});

// Convenience function for creating custom renderers
export const createCustomRenderer = (
  tokenRenderer?: (
    token: RichContentToken,
    index: number,
    state: RichInputState
  ) => React.ReactNode,
  cursorRenderer?: (
    position: RichInputPosition,
    state: RichInputState
  ) => React.ReactNode,
  selectionRenderer?: (
    selection: RichInputSelection,
    state: RichInputState
  ) => React.ReactNode,
  placeholderRenderer?: (
    placeholder: string,
    state: RichInputState
  ) => React.ReactNode
): RichInputRenderer => {
  const { defaultRenderer } = require('./renderers/DefaultRenderer');

  return {
    renderToken:
      tokenRenderer || defaultRenderer.renderToken.bind(defaultRenderer),
    renderCursor:
      cursorRenderer || defaultRenderer.renderCursor.bind(defaultRenderer),
    renderSelection:
      selectionRenderer ||
      defaultRenderer.renderSelection.bind(defaultRenderer),
    renderPlaceholder:
      placeholderRenderer ||
      defaultRenderer.renderPlaceholder.bind(defaultRenderer)
  };
};

// Re-export React for convenience
export { React };
