# Configurable Working Hours Implementation

**Date**: October 10, 2025  
**Feature**: Per-day configurable working hours with custom start/end times

## Overview

Implemented a flexible working hours configuration system that replaces the hardcoded "9am-5pm, Monday-Friday" model with a per-day configuration table allowing users to:
- Enable/disable specific days of the week
- Set custom start and end times for each day
- Automatically calculate hours per day
- View and edit working hours in a professional table interface

## Changes Made

### 1. New File: `workingHoursHelper.js`

**Location**: `src/webviews/userStoryDev/components/utils/workingHoursHelper.js`  
**Lines**: ~250 lines

**Key Functions**:
- `parseTimeToHour(timeStr)` - Convert "HH:MM AM/PM" to 24-hour decimal
- `parseTime(timeStr)` - Parse time string to { hour, minute } object
- `formatHourToTime(hour, minute)` - Convert 24-hour to "HH:MM AM/PM"
- `calculateHoursBetween(startTime, endTime)` - Calculate hours between two times
- `getWorkingHoursForDay(config, dayOfWeek)` - Get working hours config for specific day
- `isWithinWorkingHours(date, config)` - Check if date/time is within working hours
- `getNextWorkingDateTime(date, config)` - Find next working date/time
- `calculateWeeklyWorkingHours(config)` - Total hours per week
- `calculateAverageWorkingHoursPerDay(config)` - Average hours per enabled day

### 2. Updated: `configValidator.js`

**Changes**:
- Added `workingHours` array to default configuration with 7 days (Monday-Sunday)
- Each day has: `day`, `enabled`, `startTime`, `endTime`, `hours`
- Default: Monday-Friday 09:00 AM - 05:00 PM (8.0 hours each), weekends disabled
- Maintained legacy fields (`workingHoursPerDay`, `workingDaysPerWeek`, `excludeWeekends`) for backward compatibility

**Default Configuration**:
```javascript
workingHours: [
    { day: "Monday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
    { day: "Tuesday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
    { day: "Wednesday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
    { day: "Thursday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
    { day: "Friday", enabled: true, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
    { day: "Saturday", enabled: false, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 },
    { day: "Sunday", enabled: false, startTime: "09:00 AM", endTime: "05:00 PM", hours: 8.0 }
]
```

### 3. Updated: `forecastConfigModalTemplate.js`

**Changes**:
- Replaced simple "Working Hours per Day" input with comprehensive working hours table
- Removed "Working Days per Week" and "Exclude Weekends" controls (now handled by per-day config)
- Added `generateWorkingHoursRows()` function to build table HTML
- Added `convertTo24Hour()` helper for HTML time input compatibility

**New UI Features**:
- Table with 7 rows (one per day of week)
- Enabled checkbox for each day
- Time input fields (HTML5 time picker) for start/end times
- Calculated hours display (auto-updates)
- Disabled styling for non-working days

### 4. Updated: `forecastConfigManagement.js`

**Changes**:
- Added `collectWorkingHoursFromTable()` - Extracts working hours data from table
- Added `convert24HourTo12Hour()` - Converts time format for storage
- Added `calculateAverageFromWorkingHours()` - Calculates average for legacy field
- Added `updateWorkingHoursRow()` - Enables/disables time inputs when checkbox changes
- Added `updateWorkingHoursCalculation()` - Recalculates hours when times change
- Modified `saveForecastConfig()` to save working hours array and populate legacy fields

**Data Flow**:
1. User edits table (checkboxes, time inputs)
2. JavaScript updates calculated hours display in real-time
3. On save, collects all data from table
4. Saves new `workingHours` array
5. Populates legacy fields for backward compatibility

### 5. Updated: `forecastFunctions.js`

**Changes**:
- Modified `getNextWorkingHour()` to use new `getNextWorkingDateTime()` helper
- Modified `calculateCompletionDateByHours()` to use `getWorkingHoursForDay()` helper
- Both functions maintain fallback logic for legacy 9am-5pm if helper not available
- Functions now respect per-day working hours configuration

**Logic**:
- Check if day is enabled before processing
- Use day-specific start/end times instead of hardcoded 9/17
- Skip disabled days entirely
- Handle overnight transitions correctly

### 6. Updated: `userStoriesDevCommands.ts`

**Changes**:
- Added `workingHoursHelper` to script URIs
- Added script tag to load working hours helper before other scripts
- Added CSS styles for working hours table:
  - `.working-hours-table-container` - Container styling
  - `.working-hours-table` - Table layout
  - `.working-hours-enabled-checkbox` - Checkbox styling
  - `.working-hours-time-input` - Time input styling
  - `.working-hours-display` - Hours display styling
  - `.disabled-row` - Styling for disabled days

## User Interface

### Working Hours Table Layout

```
┌─────────┬───────────┬────────────┬──────────┬───────┐
│ Enabled │ Day       │ Start Time │ End Time │ Hours │
├─────────┼───────────┼────────────┼──────────┼───────┤
│ [✓]     │ Monday    │ [09:00 AM] │[05:00 PM]│  8.0  │
│ [✓]     │ Tuesday   │ [09:00 AM] │[05:00 PM]│  8.0  │
│ [✓]     │ Wednesday │ [09:00 AM] │[05:00 PM]│  8.0  │
│ [✓]     │ Thursday  │ [09:00 AM] │[05:00 PM]│  8.0  │
│ [✓]     │ Friday    │ [09:00 AM] │[05:00 PM]│  8.0  │
│ [ ]     │ Saturday  │ [09:00 AM] │[05:00 PM]│  8.0  │ (disabled)
│ [ ]     │ Sunday    │ [09:00 AM] │[05:00 PM]│  8.0  │ (disabled)
└─────────┴───────────┴────────────┴──────────┴───────┘
```

### Interactive Features

1. **Enable/Disable Days**: Click checkbox to enable/disable a day
2. **Custom Times**: Click time input to use HTML5 time picker
3. **Auto-Calculation**: Hours automatically update when times change
4. **Visual Feedback**: Disabled rows appear faded and time inputs are disabled
5. **Real-time Updates**: Changes reflected immediately in UI

## Backward Compatibility

The implementation maintains backward compatibility by:
1. Keeping legacy fields in configuration (`workingHoursPerDay`, `workingDaysPerWeek`, `excludeWeekends`)
2. Auto-populating legacy fields from new `workingHours` array on save
3. Fallback logic in forecast functions if helper not available
4. Default configuration matches old behavior (Mon-Fri, 9am-5pm)

## Benefits

### Flexibility
- Support for non-standard work schedules (4-day weeks, 10-hour days, etc.)
- Different hours on different days (e.g., half-day Fridays)
- Easy to configure holidays by disabling specific days

### Accuracy
- More precise forecasting for teams with non-standard schedules
- Better alignment with actual work patterns
- Improved Gantt chart timeline accuracy

### User Experience
- Visual table interface is intuitive and easy to understand
- Real-time feedback with auto-calculated hours
- Professional VS Code-themed design

## Testing Recommendations

1. **Default Configuration**: Verify Monday-Friday 9am-5pm works as expected
2. **Custom Schedule**: Test 4-day week (Mon-Thu)
3. **Variable Hours**: Test different hours per day (e.g., 6am-2pm Mon-Fri)
4. **Edge Cases**: Test all days disabled, only weekends enabled
5. **Time Validation**: Test invalid time ranges (end before start)
6. **Forecast Accuracy**: Verify completion dates match working hours
7. **Gantt Chart**: Verify timeline respects new working hours
8. **Save/Load**: Verify configuration persists correctly

## Future Enhancements (Optional)

1. **Holidays Integration**: Auto-disable days marked as holidays
2. **Time Zones**: Support for different time zones
3. **Breaks**: Account for lunch breaks or other non-working periods
4. **Templates**: Pre-defined schedules (Standard, 4-Day Week, Shift Work, etc.)
5. **Copy Week**: Copy one week's schedule to multiple weeks
6. **Validation**: Warn if total weekly hours is unusually low/high

## Files Modified

1. **New**: `src/webviews/userStoryDev/components/utils/workingHoursHelper.js` (~250 lines)
2. **Modified**: `src/webviews/userStoryDev/components/utils/configValidator.js` (+9 lines)
3. **Modified**: `src/webviews/userStoryDev/components/templates/forecastConfigModalTemplate.js` (+90 lines)
4. **Modified**: `src/webviews/userStoryDev/components/scripts/forecastConfigManagement.js` (+120 lines)
5. **Modified**: `src/webviews/userStoryDev/components/scripts/forecastFunctions.js` (+30 lines modified)
6. **Modified**: `src/commands/userStoriesDevCommands.ts` (+85 lines CSS, +2 lines script loading)

**Total**: 1 new file, 5 modified files, ~580 net new lines

## Summary

This implementation provides a comprehensive, flexible working hours configuration system that maintains backward compatibility while enabling precise control over work schedules. The UI is professional, intuitive, and integrates seamlessly with the existing forecast and Gantt chart functionality.

**Status**: ✅ Implementation complete, no compilation errors
