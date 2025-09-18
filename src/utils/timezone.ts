// Timezone utility functions for consistent GMT-5 handling
const GMT_MINUS_5_OFFSET_HOURS = -5; // GMT-5 offset in hours

/**
 * Convert a UTC Date object to GMT-5 timezone for display
 */
export function toGMTMinus5(date: Date): Date {
  // Create a new date that represents the same moment in GMT-5
  const utcTime = date.getTime();
  const gmt5Time = utcTime + (GMT_MINUS_5_OFFSET_HOURS * 60 * 60 * 1000);
  return new Date(gmt5Time);
}

/**
 * Create a Date object from date/time components in GMT-5
 */
export function createGMTMinus5Date(year: number, month: number, day: number, hours: number, minutes: number): Date {
  // Create date in GMT-5
  const date = new Date();
  date.setUTCFullYear(year);
  date.setUTCMonth(month - 1); // Month is 0-indexed
  date.setUTCDate(day);
  date.setUTCHours(hours + 5); // Add 5 hours to convert GMT-5 to UTC
  date.setUTCMinutes(minutes);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);
  return date;
}

/**
 * Format a UTC Date object for display in GMT-5 timezone
 */
export function formatDateTimeGMTMinus5(date: Date): { date: string; time: string } {
  // Convert UTC date to GMT-5 by subtracting 5 hours
  const gmt5Time = new Date(date.getTime() - (5 * 60 * 60 * 1000));
  
  // Use UTC methods to avoid local timezone interference
  const year = gmt5Time.getUTCFullYear();
  const month = String(gmt5Time.getUTCMonth() + 1).padStart(2, '0');
  const day = String(gmt5Time.getUTCDate()).padStart(2, '0');
  const hours = String(gmt5Time.getUTCHours()).padStart(2, '0');
  const minutes = String(gmt5Time.getUTCMinutes()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

/**
 * Parse date and time strings as GMT-5 and return UTC Date
 */
export function parseGMTMinus5DateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create UTC date by adding 5 hours to GMT-5 input
  const utcDate = new Date();
  utcDate.setUTCFullYear(year);
  utcDate.setUTCMonth(month - 1); // Month is 0-indexed
  utcDate.setUTCDate(day);
  utcDate.setUTCHours(hours + 5); // Convert GMT-5 to UTC by adding 5 hours
  utcDate.setUTCMinutes(minutes);
  utcDate.setUTCSeconds(0);
  utcDate.setUTCMilliseconds(0);
  
  return utcDate;
}
