import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  differenceInYears
} from 'date-fns';

export const formatLastUpdated = (timestamp: number) => {
  const nowMs = Date.now();
  const now = new Date(nowMs);
  const past = new Date(timestamp);

  if (timestamp > nowMs) return '0s ago';

  // Calculate differences using date-fns for calendar accuracy
  // Work from largest to smallest units, adding what we've accounted for to the past date
  const years = differenceInYears(now, past);
  let workingDate = years > 0 ? addYears(past, years) : past;

  const months = differenceInMonths(now, workingDate);
  workingDate = months > 0 ? addMonths(workingDate, months) : workingDate;

  const weeks = differenceInWeeks(now, workingDate);
  workingDate = weeks > 0 ? addWeeks(workingDate, weeks) : workingDate;

  const days = differenceInDays(now, workingDate);
  workingDate = days > 0 ? addDays(workingDate, days) : workingDate;

  const hours = differenceInHours(now, workingDate);
  workingDate = hours > 0 ? addHours(workingDate, hours) : workingDate;

  const minutes = differenceInMinutes(now, workingDate);
  workingDate = minutes > 0 ? addMinutes(workingDate, minutes) : workingDate;

  const seconds = differenceInSeconds(now, workingDate);

  const parts: string[] = [];
  if (years) parts.push(`${years}y`);
  if (months) parts.push(`${months}mo`);
  if (weeks) parts.push(`${weeks}w`);
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);

  // For cleaner display, show only the most significant units
  // If we have years, show years + months
  // If we have months, show months + weeks
  // If we have weeks, show weeks + days
  // Otherwise show all remaining units
  let displayParts: string[];
  if (years > 0) {
    displayParts = parts.slice(0, 2); // years + months
  } else if (months > 0) {
    displayParts = parts.slice(0, 2); // months + weeks
  } else if (weeks > 0) {
    displayParts = parts.slice(0, 2); // weeks + days
  } else {
    displayParts = parts; // show all for smaller units
  }

  return displayParts.join(' ') + ' ago';
};
