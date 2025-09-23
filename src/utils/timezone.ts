// Centralized timezone configuration for the entire application
// This can be configured to use browser timezone or a fixed timezone

// Configuration options
const FALLBACK_TIMEZONE_OFFSET_HOURS = -5; // GMT-5 as fallback if browser detection fails
const FALLBACK_TIMEZONE_NAME = 'GMT-5';

/**
 * Check if the user has selected to use browser timezone from localStorage
 */
function shouldUseBrowserTimezone(): boolean {
  // Check if we're running in the browser (not during SSR)
  if (typeof window === 'undefined') {
    return true; // Default to browser timezone during SSR
  }

  const savedSetting = localStorage.getItem('useBrowserTimezone');
  if (savedSetting !== null) {
    return JSON.parse(savedSetting);
  }
  return true; // Default to browser timezone
}

/**
 * Get the browser's timezone offset in hours
 * Returns negative values for timezones ahead of UTC (e.g., -5 for EST/CDT)
 */
export function getBrowserTimezoneOffset(): number {
  const offsetMinutes = new Date().getTimezoneOffset();
  return -offsetMinutes / 60; // Convert to hours and invert sign
}

/**
 * Get the browser's timezone name/identifier
 */
export function getBrowserTimezoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
}

/**
 * Get the current display timezone offset in hours
 * This is the single source of truth for timezone configuration
 */
export function getDisplayTimezoneOffset(): number {
  if (shouldUseBrowserTimezone()) {
    return getBrowserTimezoneOffset();
  }
  return FALLBACK_TIMEZONE_OFFSET_HOURS;
}

/**
 * Get the display timezone name for UI display
 */
export function getDisplayTimezoneName(): string {
  if (shouldUseBrowserTimezone()) {
    const browserTz = getBrowserTimezoneName();
    const offset = getBrowserTimezoneOffset();
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    return `${browserTz} (GMT${offsetStr})`;
  }
  return FALLBACK_TIMEZONE_NAME;
}

/**
 * Convert a UTC Date object to the configured display timezone
 */
export function toDisplayTimezone(date: Date): Date {
  const offsetHours = getDisplayTimezoneOffset();
  const utcTime = date.getTime();
  const displayTime = utcTime + offsetHours * 60 * 60 * 1000;
  return new Date(displayTime);
}

/**
 * Create a Date object representing the start of a day in the display timezone
 */
export function createDisplayTimezoneDate(year: number, month: number, day: number): Date {
  const offsetHours = getDisplayTimezoneOffset();
  const displayDate = new Date();
  const offsetMs = offsetHours * 60 * 60 * 1000;
  displayDate.setTime(Date.UTC(year, month, day) - offsetMs);

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
  const offsetHours = getDisplayTimezoneOffset();
  const date = new Date();
  date.setUTCFullYear(year);
  date.setUTCMonth(month - 1);
  date.setUTCDate(day);
  date.setUTCHours(hours - offsetHours);
  date.setUTCMinutes(minutes);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);
  return date;
}

/**
 * Format a UTC Date object for display in the configured display timezone
 */
export function formatDateTimeForDisplay(date: Date): { date: string; time: string } {
  const offsetHours = getDisplayTimezoneOffset();
  const displayTime = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);

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
 * Parse date and time strings as display timezone and return UTC Date
 */
export function parseDisplayTimezoneDateTime(dateStr: string, timeStr: string): Date {
  const offsetHours = getDisplayTimezoneOffset();
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  const utcDate = new Date();
  utcDate.setUTCFullYear(year);
  utcDate.setUTCMonth(month - 1);
  utcDate.setUTCDate(day);
  utcDate.setUTCHours(hours - offsetHours);
  utcDate.setUTCMinutes(minutes);
  utcDate.setUTCSeconds(0);
  utcDate.setUTCMilliseconds(0);

  return utcDate;
}

/**
 * Convert UTC task time to proper Date object for calendar/gantt positioning
 */
export function convertTaskTimeForDisplay(scheduledAt: string, durationMin: number): { start: Date; end: Date } {
  const taskStartUTC = new Date(scheduledAt);
  const { date: dateStr, time: timeStr } = formatDateTimeForDisplay(taskStartUTC);

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  return { start, end };
}

/**
 * Convert drag position to proper UTC time for API submission
 */
export function convertDragPositionToUTC(dayStart: Date, minutesFromStart: number): string {
  const offsetHours = getDisplayTimezoneOffset();
  const snappedMinutes = Math.round(minutesFromStart / 30) * 30;
  const hours = Math.floor(snappedMinutes / 60);
  const minutes = snappedMinutes % 60;

  const year = dayStart.getUTCFullYear();
  const month = dayStart.getUTCMonth();
  const day = dayStart.getUTCDate();

  const displayTime = new Date();
  displayTime.setUTCFullYear(year, month, day);
  displayTime.setUTCHours(hours - offsetHours, minutes, 0, 0);

  return displayTime.toISOString();
}

/**
 * Adjust drag position for timezone difference
 */
export function adjustDragPositionForTimezone(minutesFromStart: number): number {
  if (shouldUseBrowserTimezone()) {
    return minutesFromStart; // No adjustment needed when using browser timezone
  }

  const systemOffsetMinutes = new Date().getTimezoneOffset();
  const configuredOffsetMinutes = -getDisplayTimezoneOffset() * 60;
  const adjustmentMinutes = configuredOffsetMinutes - systemOffsetMinutes;

  return minutesFromStart - adjustmentMinutes;
}

// Legacy functions for backward compatibility
export function toGMTMinus5(date: Date): Date {
  return toDisplayTimezone(date);
}

export function createGMTMinus5Date(year: number, month: number, day: number, hours: number, minutes: number): Date {
  return createDisplayTimezoneDateTime(year, month, day, hours, minutes);
}

export function formatDateTimeGMTMinus5(date: Date): { date: string; time: string } {
  return formatDateTimeForDisplay(date);
}

export function parseGMTMinus5DateTime(dateStr: string, timeStr: string): Date {
  return parseDisplayTimezoneDateTime(dateStr, timeStr);
}

// Debug function to show current timezone configuration
export function getTimezoneDebugInfo(): {
  usingBrowserTimezone: boolean;
  browserTimezone: string;
  browserOffset: number;
  displayTimezone: string;
  displayOffset: number;
} {
  return {
    usingBrowserTimezone: shouldUseBrowserTimezone(),
    browserTimezone: getBrowserTimezoneName(),
    browserOffset: getBrowserTimezoneOffset(),
    displayTimezone: getDisplayTimezoneName(),
    displayOffset: getDisplayTimezoneOffset(),
  };
}
