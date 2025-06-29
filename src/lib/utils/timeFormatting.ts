/**
 * Format seconds into human-readable time strings
 * Used for rate limiting and quota error messages
 */

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)} second${Math.ceil(seconds) !== 1 ? 's' : ''}`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  if (seconds < 86400) {
    const hours = Math.ceil(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.ceil(seconds / 86400);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  }
  
  if (seconds < 86400) {
    const hours = Math.ceil(seconds / 3600);
    const remainingMinutes = Math.ceil((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.ceil(seconds / 86400);
  const remainingHours = Math.ceil((seconds % 86400) / 3600);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatQuotaResetTime(resetTimestamp: number): string {
  const now = Date.now();
  const secondsUntilReset = Math.max(0, Math.ceil((resetTimestamp - now) / 1000));
  
  if (secondsUntilReset === 0) {
    return 'now';
  }
  
  return formatRetryAfter(secondsUntilReset);
} 