# Forecast Tab Dev Status Filter Fix

**Date**: October 5, 2025  
**Issue**: Forecast tab Gantt chart was using wrong field and not filtering correctly  
**Status**: ✅ FIXED

## Problem

The User Story Dev View Forecast tab was not showing the correct stories in the Gantt chart because:

1. **Wrong Field Usage**: Code was using `item.status` instead of `item.devStatus`
2. **No Status Filtering**: All statuses were being included instead of only forecastable ones
3. **Incorrect Color Mapping**: Colors didn't match the dev status definitions

## Required Behavior

The Forecast tab should show a Gantt chart with **only** user stories that have these dev statuses:

| Dev Status Value | Label | Color | Description |
|-----------------|-------|-------|-------------|
| `on-hold` | On Hold | `#858585` (gray) | Story is paused |
| `ready-for-dev` | Ready for Development | `#0078d4` (blue) | Story is ready to start |
| `in-progress` | In Progress | `#f39c12` (orange) | Actively being developed |
| `blocked` | Blocked | `#d73a49` (red) | Story is blocked |

Stories with these statuses should **NOT** appear in the forecast:
- `completed` - Development is done

## Solution

### 1. Updated Forecast Functions (`forecastFunctions.js`)

Created a constant for forecastable statuses and updated all functions:

```javascript
// Dev statuses to include in forecast (not yet completed)
const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked'];

// Get completed and incomplete stories (use devStatus field)
const completedStories = items.filter(item => item.devStatus === "completed");
const incompleteStories = items.filter(item => forecastableStatuses.includes(item.devStatus));
```

**Functions Updated**:
- `calculateDevelopmentForecast()` - Added forecastable status filter
- `calculateAverageVelocity()` - Changed to use `devStatus === "completed"`
- `calculateStorySchedules()` - Output field changed from `status` to `devStatus`
- `sortStoriesForScheduling()` - Changed to check `devStatus === "blocked"`
- `assessProjectRisk()` - Updated all filters to use `devStatus` and forecastable statuses
- `calculateSprintVelocities()` - Changed to use `devStatus === "completed"`
- `identifyBottlenecks()` - Updated all filters to use `devStatus` and forecastable statuses
- `generateRecommendations()` - Updated all filters to use `devStatus` and forecastable statuses

### 2. Updated Gantt Chart (`ganttChart.js`)

Updated filtering and display to use dev status:

```javascript
function filterSchedules(schedules, filter) {
    const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked'];
    
    switch (filter) {
        case "incomplete":
            return schedules.filter(s => forecastableStatuses.includes(s.devStatus));
        case "complete":
            return schedules.filter(s => s.devStatus === "completed");
        case "blocked":
            return schedules.filter(s => s.devStatus === "blocked");
        // ...
    }
}
```

**Color Scale Updated**:

```javascript
// Color scale by dev status
const devStatusColorScale = d3.scaleOrdinal()
    .domain(["on-hold", "ready-for-dev", "in-progress", "blocked", "completed"])
    .range(["#858585", "#0078d4", "#f39c12", "#d73a49", "#10b981"]);
```

**Additional Changes**:
- Updated tooltip to show "Dev Status" instead of "Status"
- Updated CSV export header to "Dev Status"
- Added `formatDevStatus()` helper function for proper label display
- Updated bar fill to use `devStatusColorScale`

## Files Modified

1. `src/webviews/userStoryDev/components/scripts/forecastFunctions.js`
   - 8 function updates
   - Added forecastable statuses constant
   - Changed all `status` references to `devStatus`

2. `src/webviews/userStoryDev/components/scripts/ganttChart.js`
   - Updated `filterSchedules()` function
   - Updated `renderGanttD3Chart()` color scales
   - Updated tooltip display
   - Updated CSV export
   - Added `formatDevStatus()` helper

## Testing Checklist

- [ ] Forecast tab displays Gantt chart when stories exist
- [ ] Only stories with forecastable dev statuses appear
- [ ] Stories with `completed` status are excluded
- [ ] Colors match dev status specification
- [ ] Tooltip shows "Dev Status" with proper label
- [ ] CSV export includes "Dev Status" column with formatted labels
- [ ] Blocked stories appear last in schedule
- [ ] Chart updates when dev status changes in Details tab

## Impact

### Before Fix
- Forecast was empty or showing wrong stories
- Used wrong field (`status` instead of `devStatus`)
- No filtering by appropriate dev statuses
- Colors didn't match dev status definitions

### After Fix
- Forecast shows correct stories in development phase
- Uses correct `devStatus` field throughout
- Filters to show only forecastable dev statuses
- Colors match dev status specification
- Clear separation between dev and QA workflows

## Related Documentation

- `docs/USER-STORY-DEV-VIEW-USER-GUIDE.md` - User guide for Dev View
- `docs/USER-STORY-DEV-VIEW-STATUS-REFERENCE.md` - Dev status definitions
- `src/webviews/userStoryDev/components/scripts/devStatusManagement.js` - Dev status constants

## Architecture Notes

The forecast tab is specifically designed for the **development team** to see:
1. What work is coming up (ready-for-dev, on-hold)
2. What work is in progress (in-progress)
3. What work is blocked (blocked)

It explicitly excludes completed stories because:
- `completed` - Already done, no need to forecast

This maintains a clear focus on remaining development work.
