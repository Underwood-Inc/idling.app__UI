/** Clarity `identify` requires strings; JWT user ids may still be numbers until re-login. */
export function clarityTextField(value: unknown, fallback: string): string {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}