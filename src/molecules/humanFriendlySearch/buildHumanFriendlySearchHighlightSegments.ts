import type {
  HumanFriendlySearchHighlightSegment,
  HumanFriendlySearchQuery,
} from './humanFriendlySearch.types';

interface TextRange {
  start: number;
  end: number;
}

export function buildHumanFriendlySearchHighlightSegments(
  text: string,
  query: HumanFriendlySearchQuery
): HumanFriendlySearchHighlightSegment[] {
  if (!text || !query.terms.length) {
    return [{ text, matched: false }];
  }

  const matchValues = query.terms.map((term) => term.value).filter(Boolean);
  const ranges = collectMatchRanges(text, matchValues);

  if (ranges.length === 0) {
    return [{ text, matched: false }];
  }

  const segments: HumanFriendlySearchHighlightSegment[] = [];
  let cursor = 0;

  ranges.forEach(({ start, end }) => {
    if (cursor < start) {
      segments.push({ text: text.slice(cursor, start), matched: false });
    }

    segments.push({ text: text.slice(start, end), matched: true });
    cursor = end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matched: false });
  }

  return segments;
}

function collectMatchRanges(text: string, terms: string[]): TextRange[] {
  const lowerText = text.toLowerCase();
  const ranges: TextRange[] = [];

  terms.forEach((term) => {
    let index = lowerText.indexOf(term);
    while (index !== -1) {
      ranges.push({ start: index, end: index + term.length });
      index = lowerText.indexOf(term, index + term.length);
    }
  });

  return mergeRanges(ranges.sort((left, right) => left.start - right.start));
}

function mergeRanges(ranges: TextRange[]): TextRange[] {
  if (ranges.length === 0) {
    return [];
  }

  const merged: TextRange[] = [ranges[0]];

  for (let index = 1; index < ranges.length; index += 1) {
    const current = ranges[index];
    const previous = merged[merged.length - 1];

    if (current.start <= previous.end) {
      previous.end = Math.max(previous.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}
