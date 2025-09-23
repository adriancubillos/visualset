// Centralized timezone configuration for the entire application
// Change this value to update the display timezone globally
const DISPLAY_TIMEZONE_OFFSET_HOURS = -5; // GMT-5 offset in hours
const DISPLAY_TIMEZONE_NAME = 'GMT-5'; // For display/logging purposes

/**
 * Get the current display timezone offset in hours
 * This is the single source of truth for timezone configuration
 */
export function getDisplayTimezoneOffset(): number {
  return DISPLAY_TIMEZONE_OFFSET_HOURS;
}

/**
 * Get the display timezone name for UI display
 */
export function getDisplayTimezoneName(): string {
  return DISPLAY_TIMEZONE_NAME;
}

/**
 * Convert a UTC Date object to the configured display timezone
 */
export function toDisplayTimezone(date: Date): Date {
  // Create a new date that represents the same moment in display timezone
  const utcTime = date.getTime();
  const displayTime = utcTime + DISPLAY_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
  return new Date(displayTime);
}

/**
 * Create a Date object representing the start of a day in the display timezone
 * This ensures consistent date generation for views and comparisons
 */
export function createDisplayTimezoneDate(year: number, month: number, day: number): Date {
  // Create a date at midnight in the display timezone, then convert to local date object
  // This avoids timezone conversion issues when creating Date objects
  const displayDate = new Date();
  const offsetMs = DISPLAY_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
  displayDate.setTime(Date.UTC(year, month, day) - offsetMs);

  // Return a local date that represents the start of the day in display timezone
  const localDate = new Date(displayDate.getUTCFullYear(), displayDate.getUTCMonth(), displayDate.getUTCDate());
  return localDate;
}

/**
 * Get the current date/time in the display timezone
 */
export function getCurrentDisplayTimezoneDate(): Date {
  return toDisplayTimezone(new Date());
}

/**
 * Convert a date to the start of day in display timezone
 * Useful for view generation and date comparisons
 */
export function toDisplayTimezoneStartOfDay(date: Date): Date {
  const displayDate = toDisplayTimezone(date);
  return new Date(displayDate.getFullYear(), displayDate.getMonth(), displayDate.getDate());
}

/**
 * Create a Date object from date/time components in display timezone
 */
export function createDisplayTimezoneDateTime(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): Date {
  // Create date in display timezone
  const date = new Date();
  date.setUTCFullYear(year);
  date.setUTCMonth(month - 1); // Month is 0-indexed
  date.setUTCDate(day);
  date.setUTCHours(hours - DISPLAY_TIMEZONE_OFFSET_HOURS); // Convert display timezone to UTC
  date.setUTCMinutes(minutes);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);
  return date;
}

// Legacy functions - kept for backward compatibility but use display timezone functions
/**
 * @deprecated Use toDisplayTimezone() instead
 */
export function toGMTMinus5(date: Date): Date {
  return toDisplayTimezone(date);
}

/**
 * @deprecated Use createDisplayTimezoneDateTime() instead
 */
export function createGMTMinus5Date(year: number, month: number, day: number, hours: number, minutes: number): Date {
  return createDisplayTimezoneDateTime(year, month, day, hours, minutes);
}

/**
 * Format a UTC Date object for display in the configured display timezone
 */
export function formatDateTimeForDisplay(date: Date): { date: string; time: string } {
  // Convert UTC date to display timezone
  const displayTime = new Date(date.getTime() + DISPLAY_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);

  // Use UTC methods to avoid local timezone interference
  const year = displayTime.getUTCFullYear();
  const month = String(displayTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(displayTime.getUTCDate()).padStart(2, '0');
  const hours = String(displayTime.getUTCHours()).padStart(2, '0');
  const minutes = String(displayTime.getUTCMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

/**
 * @deprecated Use formatDateTimeForDisplay() instead
 */
export function formatDateTimeGMTMinus5(date: Date): { date: string; time: string } {
  return formatDateTimeForDisplay(date);
}

/**
 * Parse date and time strings as display timezone and return UTC Date
 */
export function parseDisplayTimezoneDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Create UTC date by converting from display timezone
  const utcDate = new Date();
  utcDate.setUTCFullYear(year);
  utcDate.setUTCMonth(month - 1); // Month is 0-indexed
  utcDate.setUTCDate(day);
  utcDate.setUTCHours(hours - DISPLAY_TIMEZONE_OFFSET_HOURS); // Convert display timezone to UTC
  utcDate.setUTCMinutes(minutes);
  utcDate.setUTCSeconds(0);
  utcDate.setUTCMilliseconds(0);

  return utcDate;
}

/**
 * @deprecated Use parseDisplayTimezoneDateTime() instead
 */
export function parseGMTMinus5DateTime(dateStr: string, timeStr: string): Date {
  return parseDisplayTimezoneDateTime(dateStr, timeStr);
}

/**
 * Convert UTC task time to proper Date object for calendar/gantt positioning
 * Ensures consistent timezone handling across all components
 */
export function convertTaskTimeForDisplay(scheduledAt: string, durationMin: number): { start: Date; end: Date } {
  // Convert UTC task time to display timezone for consistency
  const taskStartUTC = new Date(scheduledAt);
  const { date: dateStr, time: timeStr } = formatDateTimeForDisplay(taskStartUTC);

  // Create proper display timezone date object preserving the original date
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // For calendar components, create local time dates (not UTC)
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // Calculate end time
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  return { start, end };
}

/**
 * Convert drag position to proper UTC time for API submission
 * Takes minutes from day start and converts to UTC timestamp with 30-minute snapping
 */
export function convertDragPositionToUTC(dayStart: Date, minutesFromStart: number): string {
  // Snap to 30-minute increments for better UX
  const snappedMinutes = Math.round(minutesFromStart / 30) * 30;

  // Convert snapped minutes to hours and minutes
  const hours = Math.floor(snappedMinutes / 60);
  const minutes = snappedMinutes % 60;

  // Create GMT-5 date using the same date as dayStart
  const year = dayStart.getUTCFullYear();
  const month = dayStart.getUTCMonth();
  const day = dayStart.getUTCDate();

  // Create the time in GMT-5 (treating hours/minutes as GMT-5 time)
  const gmtMinus5Time = new Date();
  gmtMinus5Time.setUTCFullYear(year, month, day);
  gmtMinus5Time.setUTCHours(hours + 5, minutes, 0, 0); // Add 5 hours to convert GMT-5 to UTC

  return gmtMinus5Time.toISOString();
}

/**
 * Adjust drag position for timezone difference between display and conversion
 * Timeline displays local time (EDT = GMT-4) but convertDragPositionToUTC assumes GMT-5
 * This function compensates for the 1-hour difference
 */
export function adjustDragPositionForTimezone(minutesFromStart: number): number {
  // Get system timezone offset in minutes
  const systemOffsetMinutes = new Date().getTimezoneOffset();

  // GMT-5 offset is +300 minutes (5 hours ahead of GMT)
  const gmt5OffsetMinutes = 300;

  // Calculate adjustment needed
  const adjustmentMinutes = gmt5OffsetMinutes - systemOffsetMinutes;

  return minutesFromStart - adjustmentMinutes;
}
