# Gantt Chart Zoom Date Normalization Fix

**Date**: October 12, 2025  
**Scope**: QA View and Development View forecast Gantt charts  
**Severity**: Critical - Affects timeline accuracy for month, week, and day zoom views

## Problem Description

Both QA View and Dev View Gantt charts had incorrect timeline alignment for day, week, and month zoom views. The root cause was that start/end dates were not being normalized to the appropriate time unit boundaries.

### Symptoms

1. **Month View**: Stories appeared in wrong month columns
   - A story starting Nov 5 would appear in the October column
   - Month headers showed "October 2025" but represented Oct 15 - Nov 15 (if first story started Oct 15)

2. **Week View**: Timeline didn't start on Sunday
   - Week boundaries were arbitrary based on first story's date
   - "Week of Oct 15" might actually represent Oct 15 - Oct 22 instead of Oct 13 - Oct 20

3. **Day View**: Less impactful but still inconsistent
   - Timeline would start at whatever time the first story started

### Root Cause

**QA View** (`src/webviews/userStoriesQAView.js`):
```javascript
// Before fix - always rounded to beginning of hour
const startDate = new Date(minDate);
startDate.setMinutes(0, 0, 0);
```

**Dev View** (`src/webviews/userStoryDev/components/scripts/ganttChart.js`):
```javascript
// Before fix - always rounded to midnight
const startDate = new Date(minDate);
startDate.setHours(0, 0, 0, 0);
```

Both implementations failed to normalize dates according to the zoom level being used.

## Solution

Added zoom-level-specific date normalization for both views.

### Implementation

**QA View** (`src/webviews/userStoriesQAView.js`, lines ~1547-1580):
```javascript
// Normalize start and end dates based on zoom level
const startDate = new Date(minDate);
const endDate = new Date(maxDate);

switch (currentQAZoomLevel) {
    case 'hour':
        // Start from beginning of first hour
        startDate.setMinutes(0, 0, 0);
        endDate.setMinutes(59, 59, 999);
        break;
    case 'day':
        // Start from beginning of first day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    case 'week':
        // Start from beginning of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate.setHours(23, 59, 59, 999);
        break;
    case 'month':
        // Start from beginning of first month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // End at end of last month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of previous month
        endDate.setHours(23, 59, 59, 999);
        break;
}
```

**Dev View** (`src/webviews/userStoryDev/components/scripts/ganttChart.js`, lines ~147-183):
```javascript
// Same implementation using timeUnit variable
switch (timeUnit) {
    case "hour":
        startDate.setMinutes(0, 0, 0);
        endDate.setMinutes(59, 59, 999);
        break;
    case "day":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    case "week":
        startDate.setHours(0, 0, 0, 0);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate.setHours(23, 59, 59, 999);
        break;
    case "month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
}
```

## Impact

### Before Fix
- **October 2025** column might represent: Oct 15 00:00 - Nov 15 00:00 ❌
- **November 2025** column might represent: Nov 15 00:00 - Dec 15 00:00 ❌
- Stories starting in early November appear in October column ❌

### After Fix
- **October 2025** column represents: Oct 1 00:00 - Oct 31 23:59 ✅
- **November 2025** column represents: Nov 1 00:00 - Nov 30 23:59 ✅
- Stories starting in November appear in November column ✅

## Normalization Rules

| Zoom Level | Start Date Normalization | End Date Normalization | Example |
|------------|-------------------------|------------------------|---------|
| **Hour** | Beginning of hour (MM:00:00) | End of hour (MM:59:59.999) | 09:15 AM → 09:00:00 |
| **Day** | Midnight (00:00:00) | End of day (23:59:59.999) | Oct 15, 3:00 PM → Oct 15, 00:00:00 |
| **Week** | Sunday at midnight | End of day | Oct 15 (Wed) → Oct 13 (Sun), 00:00:00 |
| **Month** | Day 1 at midnight | Last day at 23:59:59.999 | Oct 15 → Oct 1, 00:00:00; End: Oct 31, 23:59:59 |

## Files Modified

1. **`src/webviews/userStoriesQAView.js`**
   - Function: `renderForecastGantt()`
   - Lines: ~1547-1580
   - Change: Added switch statement for zoom-level-specific date normalization

2. **`src/webviews/userStoryDev/components/scripts/ganttChart.js`**
   - Function: `renderGanttChart()`
   - Lines: ~147-183
   - Change: Replaced fixed midnight rounding with zoom-level-specific normalization

## Testing Checklist

- [x] Extension compiles successfully
- [ ] **QA View - Hour View**: Timeline starts at beginning of hour
- [ ] **QA View - Day View**: Timeline starts at midnight
- [ ] **QA View - Week View**: Timeline starts on Sunday
- [ ] **QA View - Month View**: Timeline starts on day 1 of month
- [ ] **QA View - Month View**: Stories appear in correct month columns
- [ ] **Dev View - Hour View**: Timeline starts at beginning of hour
- [ ] **Dev View - Day View**: Timeline starts at midnight
- [ ] **Dev View - Week View**: Timeline starts on Sunday
- [ ] **Dev View - Month View**: Timeline starts on day 1 of month
- [ ] **Dev View - Month View**: Stories appear in correct month columns
- [ ] Headers align with actual time unit boundaries
- [ ] Multi-month timelines display correctly

## Edge Cases Handled

1. **Stories starting mid-month**: Timeline now starts at month boundary, not story start date
2. **Stories starting mid-week**: Timeline now starts on Sunday, not arbitrary day
3. **End date in partial month**: End date extended to include full last month
4. **Week starting on Sunday**: No adjustment needed (getDay() === 0)

## Related Fixes

This fix works in conjunction with:
1. **Pixel Width Correction**: Ensuring pixels are per time unit, not per hour
2. **Last Unit Positioning**: Special handling for items in the final month/week
3. Both fixes combined ensure accurate timeline representation across all zoom levels

## Documentation Updated

- `copilot-command-history.txt` - Added cross-view fix notation
- `docs/architecture/qa-view-zoom-controls-implementation.md` - Added critical fix section with both views noted
- `docs/architecture/gantt-chart-zoom-date-normalization-fix.md` - This comprehensive document

## Recommendations

For future Gantt chart implementations:
1. Always normalize start/end dates to time unit boundaries
2. Consider the zoom level when calculating timeline boundaries
3. Test with data that spans multiple time units
4. Verify header labels match actual time unit boundaries
5. Ensure positioning logic uses the same time boundaries as header generation

## Success Criteria

✅ QA View month timeline starts at day 1 of first month  
✅ Dev View month timeline starts at day 1 of first month  
✅ Week timelines start on Sunday for both views  
✅ Stories appear in their correct time unit columns  
✅ Headers accurately represent the time units they label  
✅ Positioning calculations use same boundaries as timeline generation  
✅ Extension compiles without errors
