/**
 * @example console.log(tagRegex.test('this is a message with an #epic tag')) => true
 * @example console.log('this is a message with an #epic tag'.match(tagRegex)) => '#epic'
 */
export const tagRegex = /#([^\s#]\w+)/gim;

/**
 * Validates that a tag is properly formatted with # prefix and valid characters
 * @param tag - The tag to validate
 * @returns boolean - true if valid, false otherwise
 */
export function isValidTag(tag: string): boolean {
  if (!tag || typeof tag !== 'string') return false;

  // Must start with # and have at least one character after
  if (!tag.startsWith('#')) return false;

  // Remove # and check the rest
  const tagContent = tag.slice(1);
  if (tagContent.length === 0) return false;

  // Only allow alphanumeric, hyphens, and underscores (no spaces)
  return /^[a-zA-Z0-9_-]+$/.test(tagContent);
}

/**
 * Normalizes a tag by ensuring it has # prefix and is lowercase
 * @param tag - The tag to normalize
 * @returns string - normalized tag or empty string if invalid
 */
export function normalizeTag(tag: string): string {
  if (!tag || typeof tag !== 'string') return '';

  const trimmed = tag.trim();
  if (!trimmed) return '';

  // Add # if missing
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

  // Validate and return lowercase
  if (isValidTag(withHash)) {
    return withHash.toLowerCase();
  }

  return '';
}

/**
 * Extracts tags from text content (title or description)
 * @param text - The text to extract tags from
 * @returns string[] - array of normalized tags
 */
export function extractTagsFromText(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  const matches = text.match(tagRegex);
  if (!matches) return [];

  return matches
    .map((tag) => normalizeTag(tag))
    .filter((tag) => tag.length > 0);
}

/**
 * Parses a comma-separated string of tags and normalizes them
 * @param tagsString - Comma-separated tags like "tag1, #tag2, tag3"
 * @returns string[] - array of normalized tags with # prefix
 */
export function parseTagsInput(tagsString: string): string[] {
  if (!tagsString || typeof tagsString !== 'string') return [];

  return tagsString
    .split(',')
    .map((tag) => normalizeTag(tag.trim()))
    .filter((tag) => tag.length > 0);
}

/**
 * Validates a tags input string and returns errors if any
 * @param tagsString - The tags input to validate
 * @returns string[] - array of error messages, empty if valid
 */
export function validateTagsInput(tagsString: string): string[] {
  const errors: string[] = [];

  if (!tagsString || typeof tagsString !== 'string') {
    return errors; // Empty is valid
  }

  const rawTags = tagsString
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (rawTags.length === 0) return errors;

  for (const rawTag of rawTags) {
    if (!rawTag.startsWith('#')) {
      errors.push(`Tag "${rawTag}" must start with # (e.g., #${rawTag})`);
    } else if (!isValidTag(rawTag)) {
      errors.push(
        `Tag "${rawTag}" contains invalid characters. Use only letters, numbers, hyphens, and underscores.`
      );
    }
  }

  return errors;
}
