# Timezone Configuration

## Current Setup

The application is currently configured to display all times in **GMT-5** timezone.

## How to Change Display Timezone

To change the display timezone for the entire application:

1. Open `/src/utils/timezone.ts`
2. Update these two constants at the top of the file:

```typescript
// Change this value to your desired timezone offset
const DISPLAY_TIMEZONE_OFFSET_HOURS = -5; // Currently GMT-5

// Update the display name for UI purposes
const DISPLAY_TIMEZONE_NAME = 'GMT-5'; // Currently GMT-5
```

### Examples for Different Timezones:

```typescript
// For GMT-3 (Brazil):
const DISPLAY_TIMEZONE_OFFSET_HOURS = -3;
const DISPLAY_TIMEZONE_NAME = 'GMT-3';

// For GMT+1 (Central Europe):
const DISPLAY_TIMEZONE_OFFSET_HOURS = 1;
const DISPLAY_TIMEZONE_NAME = 'GMT+1';

// For GMT+8 (Singapore/China):
const DISPLAY_TIMEZONE_OFFSET_HOURS = 8;
const DISPLAY_TIMEZONE_NAME = 'GMT+8';

// For UTC/GMT:
const DISPLAY_TIMEZONE_OFFSET_HOURS = 0;
const DISPLAY_TIMEZONE_NAME = 'UTC';
```

## What Gets Updated Automatically

When you change these constants, the following will automatically use the new timezone:

- ✅ All task display times in Gantt charts
- ✅ All task display times in calendars
- ✅ Task creation and editing forms
- ✅ Date range calculations for day/week/month views
- ✅ Task positioning in timeline views
- ✅ All date formatting throughout the application

## Database Storage

**Important**: The database continues to store all times in UTC. Only the **display** of times changes. This ensures:

- Data consistency across different deployments
- Easy timezone changes without data migration
- Proper handling of daylight saving time transitions
- No data corruption when changing display timezones

## Functions Available

### Current (Centralized) Functions:

- `toDisplayTimezone(date)` - Convert UTC to display timezone
- `formatDateTimeForDisplay(date)` - Format date/time for display
- `getCurrentDisplayTimezoneDate()` - Get current time in display timezone
- `toDisplayTimezoneStartOfDay(date)` - Get start of day in display timezone
- `getDisplayTimezoneOffset()` - Get current offset in hours
- `getDisplayTimezoneName()` - Get timezone name for UI

### Legacy Functions (Still Work):

- `formatDateTimeGMTMinus5()` - Redirects to `formatDateTimeForDisplay()`
- `parseGMTMinus5DateTime()` - Redirects to `parseDisplayTimezoneDateTime()`
- `toGMTMinus5()` - Redirects to `toDisplayTimezone()`

## Migration Notes

The legacy GMT-5 specific functions are still available for backward compatibility, but new code should use the centralized display timezone functions.
