import { TextExtractor } from '@lib/utils/text-extraction';
import { useMemo } from 'react';

export function useValueExtraction(value: string) {
  // Memoize extracted values to prevent unnecessary re-renders
  const existingHashtags = useMemo(
    () => TextExtractor.extractHashtags(value),
    [value]
  );

  const existingUserIds = useMemo(
    () => TextExtractor.extractUserIds(value),
    [value]
  );

  const existingMentions = useMemo(
    () => TextExtractor.extractUserMentions(value),
    [value]
  );

  const existingUrls = useMemo(() => TextExtractor.extractUrls(value), [value]);

  return {
    existingHashtags,
    existingUserIds,
    existingMentions,
    existingUrls
  };
}
