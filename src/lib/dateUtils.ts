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
