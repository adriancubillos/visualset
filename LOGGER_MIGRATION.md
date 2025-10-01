# Logger Migration Guide

This guide explains how to migrate all `console.error` calls to the centralized logger.

## Quick Start

### Automated Migration (Recommended)

Run the migration script:

```bash
./migrate-to-logger.sh
```

This will:
- ✅ Find all files with `console.error` calls
- ✅ Add `import { logger } from '@/utils/logger';` if not present
- ✅ Replace `console.error()` with `logger.error()`
- ✅ Skip the logger implementation file itself
- ✅ Provide a summary of changes

### Before Running

**Create a backup or commit your current changes:**

```bash
git add .
git commit -m "Checkpoint before logger migration"
```

### After Running

**Review the changes:**

```bash
git diff
```

**Test the application:**

```bash
npm run dev
```

**Commit the migration:**

```bash
git add .
git commit -m "Migrate console.error to centralized logger"
```

## Manual Migration

If you prefer to migrate files manually, follow this pattern:

### 1. Add Logger Import

At the top of the file (after other imports):

```typescript
import { logger } from '@/utils/logger';
```

### 2. Replace console.error Calls

**Before:**
```typescript
console.error('Error fetching data:', error);
```

**After:**
```typescript
logger.error('Error fetching data', error);
```

**Before:**
```typescript
console.error('Failed to fetch items');
```

**After:**
```typescript
logger.apiError('Fetch items', '/api/items', 'Failed to fetch');
```

### 3. Choose the Right Logger Method

- **`logger.error(message, error)`** - General errors
- **`logger.apiError(operation, endpoint, error)`** - API/HTTP errors
- **`logger.dbError(operation, table, error)`** - Database errors
- **`logger.warn(message, data)`** - Warnings
- **`logger.info(message, data)`** - Info messages
- **`logger.debug(message, data)`** - Debug messages (dev only)

## Current Status

### ✅ Already Migrated:
- API routes (schedule, machines, operators, items, projects)
- Main pages (tasks, machines, operators)
- Form pages (task new/edit, items new, machines edit)
- Components (ScheduleCalendar - partial)
- Utils (colorValidation)

### 📝 Remaining Files (~26):

**High Priority:**
- `/app/items/page.tsx`
- `/app/projects/page.tsx`
- `/app/operators/[id]/page.tsx`
- `/app/tasks/[id]/page.tsx`
- `/app/items/[id]/page.tsx`
- `/app/page.tsx` (Dashboard)

**Medium Priority:**
- Form pages (items/edit, projects/new, operators/edit, etc.)
- Detail pages

**Low Priority:**
- Remaining API routes
- Utility functions
- Hooks

## Logger Configuration

The logger is configured in `/src/utils/logger.ts`:

```typescript
const config: LoggerConfig = {
  enableConsole: true,
  enableRemote: false, // Enable for production monitoring
  minLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
};
```

### Environment-Based Logging

- **Development**: All log levels (debug, info, warn, error)
- **Production**: Info, warn, and error only

### Future Enhancements

The logger is ready for:
- Remote logging services (Sentry, LogRocket, etc.)
- Custom formatting
- Log aggregation
- Error tracking

## Troubleshooting

### Script Issues

If the script fails:

1. **Check file permissions:**
   ```bash
   chmod +x migrate-to-logger.sh
   ```

2. **Run with bash explicitly:**
   ```bash
   bash migrate-to-logger.sh
   ```

3. **Check for sed compatibility:**
   - macOS: May need `gsed` (install via `brew install gnu-sed`)
   - Linux: Should work with standard `sed`

### Manual Fixes

If the script doesn't catch everything:

```bash
# Find remaining console.error calls
grep -r "console.error" src --include="*.ts" --include="*.tsx"
```

## Benefits

✅ **Consistent logging** across the entire application  
✅ **Better debugging** with timestamps and log levels  
✅ **Production-ready** for remote monitoring  
✅ **Environment-aware** logging  
✅ **Centralized control** - change behavior in one place  
✅ **Type-safe** with TypeScript  

## Questions?

Check the logger implementation: `/src/utils/logger.ts`
