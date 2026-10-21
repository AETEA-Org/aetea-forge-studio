import { formatDistanceToNow, isToday, isThisWeek, differenceInWeeks } from "date-fns";

/**
 * Converts a UTC date string from the backend to a Date object in the user's local timezone.
 * The backend sends dates in UTC format. This function ensures proper parsing and conversion.
 * 
 * @param utcDateString - ISO 8601 date string in UTC from backend (e.g., "2024-01-15T10:30:00" or "2024-01-15T10:30:00Z")
 * @returns Date object representing the UTC time converted to the user's local timezone
 */
export function parseUTCDate(utcDateString: string): Date {
  // If the string doesn't have timezone info, assume it's UTC
  // If it does have 'Z' or timezone offset, Date will parse it correctly
  if (!utcDateString.includes('Z') && !utcDateString.match(/[+-]\d{2}:\d{2}$/)) {
    // Append 'Z' to indicate UTC if not present
    // This ensures the Date constructor treats it as UTC
    utcDateString = utcDateString + 'Z';
  }
  
  // Parse as UTC - JavaScript Date will automatically convert to local timezone
  const date = new Date(utcDateString);
  
  // Validate the date is valid
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${utcDateString}`);
    return new Date(); // Return current date as fallback
  }
  
  return date;
}

/**
 * Formats a UTC date string as "time ago" in the user's local timezone.
 * This is a drop-in replacement for formatDistanceToNow with UTC date strings.
 * 
 * @param utcDateString - ISO 8601 date string in UTC from backend
 * @param options - Options for formatDistanceToNow (e.g., { addSuffix: true })
 * @returns Formatted string like "2 hours ago" or "3 days ago"
 */
export function formatDistanceFromUTC(
  utcDateString: string, 
  options?: { addSuffix?: boolean }
): string {
  const localDate = parseUTCDate(utcDateString);
  return formatDistanceToNow(localDate, options);
}

/**
 * A very short "time ago": `now`, `2m`, `4h`, `3d`, `2w`, `5mo`, `1y`.
 *
 * For surfaces with no room for words. The canvas chat node can be dragged down
 * to 320px, where "about 2 minutes ago" squeezes the message actions off their
 * own row — the words have to give way, not the buttons.
 *
 * @param utcDateString - ISO 8601 date string in UTC from backend
 */
export function formatDistanceCompactFromUTC(utcDateString: string): string {
  const then = parseUTCDate(utcDateString).getTime();
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "now";

  // Floor, not round, and every unit derived from seconds rather than from the
  // unit above it. Rounding each step off an already-rounded step compounds:
  // 59.5 minutes became 60, which became "1h". Flooring also matches what
  // people read into these — "1h" means an hour has passed, not nearly.
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(seconds / 86400);
  if (days < 7) return `${days}d`;

  if (days < 30) return `${Math.floor(days / 7)}w`;

  const months = Math.floor(days / 30);
  // `mo`, not `m`: `m` is already minutes above.
  if (months < 12) return `${months}mo`;

  return `${Math.floor(days / 365)}y`;
}

/**
 * Checks if a UTC date string represents today in the user's local timezone.
 * 
 * @param utcDateString - ISO 8601 date string in UTC from backend
 * @returns true if the date is today in the user's local timezone
 */
export function isUTCDateToday(utcDateString: string): boolean {
  const localDate = parseUTCDate(utcDateString);
  return isToday(localDate);
}

/**
 * Checks if a UTC date string is within this week in the user's local timezone.
 * 
 * @param utcDateString - ISO 8601 date string in UTC from backend
 * @returns true if the date is this week (but not today) in the user's local timezone
 */
export function isUTCDateThisWeek(utcDateString: string): boolean {
  const localDate = parseUTCDate(utcDateString);
  return isThisWeek(localDate) && !isToday(localDate);
}

/**
 * Calculates the difference in weeks between a UTC date and now in the user's local timezone.
 * 
 * @param utcDateString - ISO 8601 date string in UTC from backend
 * @returns Number of weeks since the date
 */
export function weeksSinceUTC(utcDateString: string): number {
  const localDate = parseUTCDate(utcDateString);
  return differenceInWeeks(new Date(), localDate);
}
