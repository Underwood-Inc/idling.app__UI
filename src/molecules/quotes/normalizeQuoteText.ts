export const QUOTE_TEXT_MIN_LENGTH = 12;
export const QUOTE_TEXT_MAX_LENGTH = 320;

export function normalizeQuoteText(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}