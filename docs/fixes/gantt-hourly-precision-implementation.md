# Dev View Gantt Chart - Hourly Precision Implementation

**Date**: October 5, 2025  
**Status**: ✅ Completed  
**Related**: User Story Dev View Forecast Tab

## Overview

Converted the User Story Dev View forecast Gantt chart from daily precision to hourly precision to match the QA View implementation and properly represent story point calculations (1 point = 4 hours by default).

## Problem Statement

The Dev View Gantt chart was using daily time precision while:
1. Story points are measured in 4-hour increments (1 point = 4 hours)
2. QA View already used hourly precision with better visual design
3. User requested Dev View to "look similar" to QA View
4. Hourly precision provides more accurate scheduling visualization

## Solution

Completely rewrote the Gantt chart rendering to use hourly precision with the following features:

### Visual Features

1. **Hourly Time Scale**
   - 30 pixels per hour (matches QA View)
   - Generates array of all hours in date range
   - Dynamic SVG width based on total hours

2. **Two-Level Headers**
   - **Day Headers**: Shows date labels (e.g., "Oct 05")
   - **Hour Headers**: Shows hour numbers (0-23)
   - Day headers group hours together for easy scanning

3. **Non-Working Hours Highlighting**
   - Highlights hours before 9am (gray background)
   - Highlights hours after 5pm (gray background)
   - Helps visualize actual working schedule

4. **Current Hour Marker**
   - Orange rectangle highlighting current hour
   - Orange vertical line for precision
   - Only displays when current time is in visible range

5. **Vertical Grid Lines**
   - One line per hour
   - Light opacity for subtle visual guidance
   - Improves readability of timeline

6. **Developer Color Coding**
   - Uses `d3.schemeCategory10` for consistent colors
   - Each developer gets unique color (like QA View testers)
   - Color legend built from unique developers in data

7. **Interactive Elements**
   - Click story bar → Opens story detail modal
   - Click Y-axis label → Opens story detail modal
   - Hover → Shows tooltip with full story details
   - Tooltips show duration in hours (not days)

### Scheduling Logic

1. **Working Hours Constraints**
   - Hours: 9am to 5pm (17:00)
   - Days: Monday to Friday
   - Skips weekends automatically
   - Stories scheduled only in working hours

2. **Schedule Calculation**
   ```javascript
   // New hourly-based functions
   getNextWorkingHour(date, config)
   calculateCompletionDateByHours(startDate, hoursNeeded, config)
   ```

3. **Story Duration**
   - Calculated as: `storyPoints × hoursPerPoint`
   - Default: 1 point = 4 hours
   - Duration shown in tooltip as hours (e.g., "16.0 hrs")

## Code Changes

### 1. ganttChart.js - renderGanttD3Chart()

**Before**: Daily precision with simple date axis
```javascript
const xScale = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([0, width]);

const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeDay.every(getTickInterval()))
    .tickFormat(d3.timeFormat("%b %d"));
```

**After**: Hourly precision with hour array
```javascript
// Generate array of all hours
const allHours = [];
const currentHour = new Date(startDate);
while (currentHour <= endDate) {
    allHours.push(new Date(currentHour));
    currentHour.setHours(currentHour.getHours() + 1);
}

const totalHours = allHours.length;
const totalWidth = totalHours * hourWidth; // 30px per hour

const xScale = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, totalWidth]);
```

**Key Changes**:
- Hourly array generation instead of date range
- Dynamic width calculation based on hours
- Two-level header rendering (days + hours)
- Non-working hours highlighting
- Current hour marker
- Vertical grid lines per hour
- Click handlers for modal opening
- Developer-based color coding

### 2. forecastFunctions.js - calculateStorySchedules()

**Before**: Daily precision with day-based calculations
```javascript
const daysNeeded = hoursNeeded / (config.workingHoursPerDay * config.parallelWorkFactor);
const storyEndDate = calculateCompletionDate(storyStartDate, daysNeeded, config);
```

**After**: Hourly precision with working hours logic
```javascript
const storyStartDate = getNextWorkingHour(new Date(currentDate), config);
const storyEndDate = calculateCompletionDateByHours(storyStartDate, hoursNeeded, config);
```

**New Helper Functions**:

1. **getNextWorkingHour()**: Finds next working hour
   - Skips weekends (Saturday=0, Sunday=6)
   - Jumps to 9am if before working hours
   - Jumps to next day 9am if after 5pm

2. **calculateCompletionDateByHours()**: Adds working hours
   - Adds hours one at a time
   - Skips non-working hours (before 9am, after 5pm)
   - Skips weekends
   - Returns exact completion time

## Visual Comparison

### Dev View (After)
```
Day Headers:  | Oct 05        | Oct 06        | Oct 07        |
Hour Headers: |9 10 11 12 1...|9 10 11 12 1...|9 10 11 12 1...|
Non-working:  [GRAY][  WORKING HOURS  ][GRAY]
Story 1:      [===============================]
Story 2:                [====================]
Current Hour: [ORANGE MARKER]
```

### QA View (Reference)
```
Day Headers:  | Oct 05        | Oct 06        | Oct 07        |
Hour Headers: |9 10 11 12 1...|9 10 11 12 1...|9 10 11 12 1...|
Non-working:  [GRAY][  WORKING HOURS  ][GRAY]
Test 1:       [===============================]
Test 2:                [====================]
Current Hour: [ORANGE MARKER]
```

## Configuration

### Gantt Chart Dimensions
```javascript
const margin = { top: 60, right: 40, bottom: 20, left: 150 };
const hourWidth = 30;  // 30px per hour
const rowHeight = 30;  // 30px per story
```

### Working Hours
```javascript
const WORK_START_HOUR = 9;   // 9am
const WORK_END_HOUR = 17;    // 5pm
const WORK_DAYS = [1,2,3,4,5]; // Mon-Fri
```

### Default Story Points
```javascript
config.hoursPerPoint = 4;  // 1 point = 4 hours
```

## Testing Scenarios

### Test 1: Single Day Story
- **Input**: 2 story points, start at 9am Monday
- **Expected**: 8 hours (9am-5pm Monday)
- **Result**: Story bar spans 8 hours in working hours

### Test 2: Multi-Day Story
- **Input**: 10 story points, start at 9am Monday
- **Expected**: 40 hours across 5 working days
- **Result**: Story bar spans Mon-Fri 9am-5pm

### Test 3: Weekend Handling
- **Input**: Story ends Friday 3pm
- **Expected**: Next story starts Monday 9am (skips weekend)
- **Result**: Gap in Gantt chart over weekend

### Test 4: Non-Working Hours
- **Input**: View range includes nights
- **Expected**: Gray background before 9am and after 5pm
- **Result**: Non-working hours clearly highlighted

### Test 5: Current Hour Marker
- **Input**: Current time is 2pm Tuesday
- **Expected**: Orange marker at 2pm Tuesday hour
- **Result**: Current hour highlighted with orange rectangle and line

### Test 6: Click Interaction
- **Input**: Click story bar or Y-axis label
- **Expected**: Story detail modal opens
- **Result**: Modal opens with story details

## Architecture Notes

### Why Hourly Precision?

1. **Story Point Granularity**: 1 point = 4 hours by default
2. **Accurate Forecasting**: Shows exact working hours needed
3. **Visual Consistency**: Matches QA View's design language
4. **Better Scheduling**: Respects working hours (9am-5pm)

### Design Decisions

1. **30px per hour**: Provides good balance between detail and screen space
2. **Two-level headers**: Easier to scan than single-level hourly headers
3. **Non-working hours**: Helps users understand actual working schedule
4. **Developer colors**: Consistent with QA View's tester colors
5. **Click to open modal**: Standard interaction pattern in the extension

### Performance Considerations

- SVG width grows with time range (30px × hours)
- Horizontal scrolling enabled for large ranges
- Could optimize by limiting visible hour range if performance issues arise
- Current implementation handles typical 1-4 week forecasts well

## Related Files

### Modified
- `src/webviews/userStoryDev/components/scripts/ganttChart.js`
- `src/webviews/userStoryDev/components/scripts/forecastFunctions.js`
- `copilot-command-history.txt`

### Referenced
- `src/webviews/userStoryDev/components/scripts/modalFunctionality.js` (openStoryDetailModal)
- `src/webviews/userStoriesQAView.js` (reference implementation)

## Future Enhancements

1. **Zoom Levels**: Add zoom to switch between hourly/daily/weekly views
2. **Resource Loading**: Show multiple developers working in parallel
3. **Dependencies**: Show arrows between dependent stories
4. **Critical Path**: Highlight critical path through project
5. **Milestone Markers**: Show sprint boundaries or release dates
6. **Drag & Drop**: Allow rescheduling by dragging story bars
7. **Export**: Save Gantt chart as PNG or PDF

## Conclusion

The Dev View Gantt chart now provides accurate hourly scheduling that:
- Matches story point calculations (1 point = 4 hours)
- Respects working hours (9am-5pm, Mon-Fri)
- Provides visual consistency with QA View
- Enables click-through to story details
- Shows current progress with hour marker

This creates a professional, accurate forecasting visualization for development teams.
