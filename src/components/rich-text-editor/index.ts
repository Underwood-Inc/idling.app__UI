/**
 * Rich Text Editor with Smart Pill Support
 *
 * Easy-to-import alias for the composable rich input system.
 * Provides native input behavior with rich content rendering including
 * hashtags, mentions, URLs, emojis, and custom content types.
 */

// Re-export everything from the rich input system
export * from '../../lib/rich-input';

// Re-export the adapter for form integration
export { RichInputAdapter as RichTextEditor } from '../../app/components/submission-forms/shared-submission-form/components/RichInputAdapter';

// Convenience re-exports with better names
export {
  RichInputEngine as RichTextEngine,
  RichInput as RichTextInput,
  DefaultRenderer as RichTextRenderer,
  defaultRenderer as defaultRichTextRenderer,
  useRichInput as useRichTextEditor
} from '../../lib/rich-input';

// Type re-exports with better names
export type {
  RichInputAPI as RichTextAPI,
  RichInputConfig as RichTextConfig,
  RichInputEventHandlers as RichTextEventHandlers,
  RichInputProps as RichTextInputProps,
  RichInputRef as RichTextInputRef,
  RichInputState as RichTextState,
  RichContentToken as RichTextToken,
  UseRichInputOptions as UseRichTextEditorOptions,
  UseRichInputReturn as UseRichTextEditorReturn
} from '../../lib/rich-input';

// Additional convenience exports
export { React } from '../../lib/rich-input';
