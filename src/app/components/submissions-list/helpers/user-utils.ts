/**
 * Helper function to extract user IDs from author filter values
 */
export function extractUserIdsFromAuthorFilters(authors: string[]): number[] {
  return authors
    .map((author) => {
      // Handle different author formats:
      // 1. Plain username: "shaun_beatty"
      // 2. Combined format: "shaun_beatty|122"
      // 3. User ID only: "122"

      if (author.includes('|')) {
        const parts = author.split('|');
        const userIdPart = parts[1];
        const userId = parseInt(userIdPart);
        return !isNaN(userId) ? userId : null;
      } else if (/^\d+$/.test(author)) {
        // Pure user ID
        const userId = parseInt(author);
        return !isNaN(userId) ? userId : null;
      } else {
        // Plain username - we can't resolve to user ID here
        // This would need a database lookup, which we should handle elsewhere
        return null;
      }
    })
    .filter((id): id is number => id !== null);
}
