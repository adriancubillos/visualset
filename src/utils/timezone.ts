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

/**
 * Convert UTC task time to proper Date object for calendar/gantt positioning
 * Ensures consistent timezone handling across all components
 */
export function convertTaskTimeForDisplay(scheduledAt: string, durationMin: number): { start: Date; end: Date } {
  // Convert UTC task time to GMT-5 for display consistency
  const taskStartUTC = new Date(scheduledAt);
  const { date: dateStr, time: timeStr } = formatDateTimeGMTMinus5(taskStartUTC);
  
  // Create proper GMT-5 date object preserving the original date
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // For calendar components, create local time dates (not UTC)
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Calculate end time
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  
  return { start, end };
}

/**
 * Convert UTC task time for GanttChart positioning (needs UTC for day comparison)
 */
export function convertTaskTimeForGantt(scheduledAt: string): Date {
  const taskStartUTC = new Date(scheduledAt);
  const { date: dateStr, time: timeStr } = formatDateTimeGMTMinus5(taskStartUTC);
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // For gantt positioning, use UTC dates for proper day comparison
  const start = new Date();
  start.setUTCFullYear(year, month - 1, day);
  start.setUTCHours(hours, minutes, 0, 0);
  
  return start;
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

