/**
 * React hook for easier rich input usage
 * Provides a simple API for working with rich inputs
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RichInputRef } from '../components/RichInput';
import type { RichInputConfig, RichInputState } from '../types';

export interface UseRichInputOptions extends RichInputConfig {
  initialValue?: string;
  onChange?: (value: string) => void;
  onStateChange?: (state: RichInputState) => void;
}

export interface UseRichInputReturn {
  value: string;
  state: RichInputState | null;
  ref: React.RefObject<RichInputRef>;

  // Convenience methods
  setValue: (value: string) => void;
  insertText: (text: string) => void;
  clear: () => void;
  focus: () => void;
  blur: () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;

  // State queries
  isEmpty: boolean;
  isFocused: boolean;
  hasSelection: boolean;
  selectedText: string;
}

export function useRichInput(
  options: UseRichInputOptions = {}
): UseRichInputReturn {
  const ref = useRef<RichInputRef>(null);
  const [value, setValue] = useState(options.initialValue || '');
  const [state, setState] = useState<RichInputState | null>(null);

  // Ensure initial value is set
  useEffect(() => {
    if (options.initialValue && ref.current) {
      ref.current.setState({ rawText: options.initialValue });
    }
  }, [options.initialValue]);

  // Handle value changes
  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      options.onChange?.(newValue);
    },
    [options]
  );

  // Handle state changes
  const handleStateChange = useCallback(
    (newState: RichInputState) => {
      setState(newState);
      options.onStateChange?.(newState);
    },
    [options]
  );

  // Convenience methods
  const setValueMethod = useCallback((newValue: string) => {
    ref.current?.setState({ rawText: newValue });
  }, []);

  const insertText = useCallback((text: string) => {
    ref.current?.insertText(text);
  }, []);

  const clear = useCallback(() => {
    ref.current?.clear();
  }, []);

  const focus = useCallback(() => {
    ref.current?.focus();
  }, []);

  const blur = useCallback(() => {
    ref.current?.blur();
  }, []);

  const undo = useCallback(() => {
    ref.current?.undo();
  }, []);

  const redo = useCallback(() => {
    ref.current?.redo();
  }, []);

  const selectAll = useCallback(() => {
    ref.current?.selectAll();
  }, []);

  // Computed properties
  const isEmpty = state ? state.rawText.length === 0 : true;
  const isFocused = state?.isFocused ?? false;
  const hasSelection = state
    ? state.selection.start.index !== state.selection.end.index
    : false;
  const selectedText = state
    ? state.rawText.slice(
        Math.min(state.selection.start.index, state.selection.end.index),
        Math.max(state.selection.start.index, state.selection.end.index)
      )
    : '';

  return {
    value,
    state,
    ref,
    setValue: setValueMethod,
    insertText,
    clear,
    focus,
    blur,
    undo,
    redo,
    selectAll,
    isEmpty,
    isFocused,
    hasSelection,
    selectedText
  };
}
