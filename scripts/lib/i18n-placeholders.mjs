import { BARE_URL_RE } from './site-landing-urls.mjs';

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/g;

/** @typedef {{ lead: boolean; trail: boolean }} PlaceholderSpacing */

/** @param {string} token @param {PlaceholderSpacing | undefined} spacing */
function formatPlaceholderToken(token, spacing) {
  if (!spacing) return token;
  return `${spacing.lead ? ' ' : ''}${token}${spacing.trail ? ' ' : ''}`;
}
const HTML_TAG_RE = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>/g;
const FORMAT_TOKEN_RE = /__[a-zA-Z][a-zA-Z0-9]*/g;
/** Matches the (destination) part of a Markdown link `[text](dest)` where dest is not a URL. */
const MARKDOWN_LINK_DEST_RE = /\]\((?!https?:\/\/)([^)]+)\)/g;

/** @param {string} text */
export function protectPlaceholders(text) {
  /** @type {string[]} */
  const tokens = [];
  /** @type {PlaceholderSpacing[]} */
  const spacing = [];
  const protectedText = text.replace(PLACEHOLDER_RE, (match, offset) => {
    const idx = tokens.length;
    tokens.push(match);
    spacing.push({
      lead: offset > 0 && /\s/.test(text.charAt(offset - 1)),
      trail: offset + match.length < text.length && /\s/.test(text.charAt(offset + match.length)),
    });
    return `__PH_${idx}__`;
  });
  return { protectedText, tokens, spacing };
}

/** LibreTranslate sometimes turns `__PH_0__` into spaced `PH 0` — restore both shapes. */
const BROKEN_PH_RE = /\s*PH\s+(\d+)\s*/g;

/** @param {string} text @param {string[]} tokens @param {PlaceholderSpacing[]} [spacing] */
export function restorePlaceholders(text, tokens, spacing = []) {
  /** @param {number} idx */
  const format = (idx) =>
    formatPlaceholderToken(tokens[idx] ?? `__PH_${idx}__`, spacing[idx]);

  let result = text
    .replace(/__PH_(\d+)__/g, (_m, idx) => format(Number(idx)))
    .replace(BROKEN_PH_RE, (_m, idx) => format(Number(idx)));

  for (let i = 0; i < tokens.length; i++) {
    if (!result.includes(tokens[i])) result = `${result}${format(i)}`;
  }
  return result;
}

/** @param {string} text */
export function protectHtmlTags(text) {
  /** @type {string[]} */
  const tokens = [];
  const protectedText = text.replace(HTML_TAG_RE, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `__HTML_${idx}__`;
  });
  return { protectedText, tokens };
}

/** LibreTranslate sometimes turns `__HTML_0__` into spaced `HTML 0`. */
const BROKEN_HTML_RE = /\s*HTML\s+(\d+)\s*/g;

/** @param {string} text @param {string[]} tokens */
export function restoreHtmlTags(text, tokens) {
  return text
    .replace(/__HTML_(\d+)__/g, (_m, idx) => tokens[Number(idx)] ?? _m)
    .replace(BROKEN_HTML_RE, (_m, idx) => tokens[Number(idx)] ?? _m);
}

/** @param {string} text */
export function protectBareUrls(text) {
  /** @type {string[]} */
  const tokens = [];
  const protectedText = text.replace(BARE_URL_RE, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `__URL_${idx}__`;
  });
  return { protectedText, tokens };
}

/** LibreTranslate sometimes turns `__URL_0__` into spaced `URL 0`. */
const BROKEN_URL_RE = /\s*URL\s+(\d+)\s*/gi;

/** @param {string} text @param {string[]} tokens */
export function restoreBareUrls(text, tokens) {
  return text
    .replace(/__URL_(\d+)__/g, (_m, idx) => tokens[Number(idx)] ?? _m)
    .replace(BROKEN_URL_RE, (_m, idx) => tokens[Number(idx)] ?? _m);
}

/** Protect the `(destination)` half of non-URL Markdown links so MT cannot translate page slugs. */
export function protectMarkdownLinkDests(text) {
  /** @type {string[]} */
  const tokens = [];
  const protectedText = text.replace(MARKDOWN_LINK_DEST_RE, (_match, dest) => {
    const idx = tokens.length;
    tokens.push(dest);
    return `](__LINKDEST_${idx}__)`;
  });
  return { protectedText, tokens };
}

const BROKEN_LINKDEST_RE = /\]\(\s*LINKDEST\s+(\d+)\s*\)/g;

/** @param {string} text @param {string[]} tokens */
export function restoreMarkdownLinkDests(text, tokens) {
  return text
    .replace(/\]\(__LINKDEST_(\d+)__\)/g, (_m, idx) => `](${tokens[Number(idx)] ?? _m})`)
    .replace(BROKEN_LINKDEST_RE, (_m, idx) => `](${tokens[Number(idx)] ?? _m})`);
}

/** @param {string} text */
export function protectFormatTokens(text) {
  /** @type {string[]} */
  const tokens = [];
  const protectedText = text.replace(FORMAT_TOKEN_RE, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `__FMT_${idx}__`;
  });
  return { protectedText, tokens };
}

const BROKEN_FMT_RE = /\s*FMT\s+(\d+)\s*/g;

/** @param {string} text @param {string[]} tokens */
export function restoreFormatTokens(text, tokens) {
  let result = text
    .replace(/__FMT_(\d+)__/g, (_m, idx) => tokens[Number(idx)] ?? _m)
    .replace(BROKEN_FMT_RE, (_m, idx) => tokens[Number(idx)] ?? _m);
  for (const token of tokens) {
    if (!result.includes(token)) result = `${result} ${token}`;
  }
  return result;
}

/** Protect `{placeholders}`, `__formatTokens`, Markdown link destinations, bare HTTP(S) URLs, and HTML tags before machine translation.
 *  Order matters: LINKDEST must run before URLs are tokenised so the https:// lookahead fires correctly. */
export function protectForMachineTranslation(text) {
  const { protectedText: afterFmt, tokens: fmtTokens } = protectFormatTokens(text);
  const {
    protectedText: afterPlaceholders,
    tokens: placeholderTokens,
    spacing: placeholderSpacing,
  } = protectPlaceholders(afterFmt);
  const { protectedText: afterLinkDests, tokens: linkDestTokens } = protectMarkdownLinkDests(afterPlaceholders);
  const { protectedText: afterUrls, tokens: urlTokens } = protectBareUrls(afterLinkDests);
  const { protectedText, tokens: htmlTokens } = protectHtmlTags(afterUrls);
  return {
    protectedText,
    placeholderTokens,
    placeholderSpacing,
    urlTokens,
    htmlTokens,
    fmtTokens,
    linkDestTokens,
  };
}

/** Restore in reverse order of protection. */
export function restoreFromMachineTranslation(
  text,
  placeholderTokens,
  htmlTokens,
  urlTokens = [],
  fmtTokens = [],
  linkDestTokens = [],
  placeholderSpacing = [],
) {
  return restoreMarkdownLinkDests(
    restoreFormatTokens(
      restorePlaceholders(
        restoreBareUrls(restoreHtmlTags(text, htmlTokens), urlTokens),
        placeholderTokens,
        placeholderSpacing,
      ),
      fmtTokens,
    ),
    linkDestTokens,
  );
}
