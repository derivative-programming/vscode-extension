# QA View Forecast Gantt Chart Zoom Controls

**Created**: January 2025  
**Last Modified**: January 2025

## Overview

This document describes the implementation of zoom controls for the QA View forecast Gantt chart, providing users with the ability to view the timeline at different granularities (hourly, daily, weekly, monthly).

## Purpose

The zoom controls allow users to:
- **Hour View**: See detailed hourly breakdown (40px per hour)
- **Day View**: View daily timeline at a glance (10px per hour)
- **Week View**: Compact weekly overview (2px per hour)
- **Month View**: High-level monthly timeline (0.5px per hour)
- **Reset**: Return to default hour view

This feature improves usability for both short-term detailed planning and long-term overview analysis.

## Architecture

### Components

1. **HTML Structure** (`src/commands/userStoriesQACommands.ts`)
   - Timeline controls container with 5 zoom buttons
   - Located between Project Overview and Gantt container
   - Uses VS Code codicons for visual consistency

2. **CSS Styles** (`src/commands/userStoriesQACommands.ts`)
   - `.timeline-controls`: Container layout with flexbox
   - `.timeline-btn`: Button styling with hover effects
   - `.timeline-control-label`: Label with icon and text
   - Secondary button theme for consistency with VS Code UI

3. **JavaScript Logic** (`src/webviews/userStoriesQAView.js`)
   - `currentQAZoomLevel`: State variable tracking current zoom level
   - `zoomQAGanttChart(zoomLevel)`: Function to change zoom level
   - Dynamic hourWidth calculation in `renderForecastGantt()`

### Data Flow

```
User clicks zoom button
    ↓
zoomQAGanttChart(zoomLevel) called
    ↓
currentQAZoomLevel updated
    ↓
calculateAndRenderForecast() triggered
    ↓
renderForecastGantt() reads currentQAZoomLevel
    ↓
hourWidth calculated based on zoom level
    ↓
Gantt chart re-rendered with new scale
```

## Implementation Details

### Zoom Levels and Display Format

| Zoom Level | Pixel Width per Unit | Time Unit | Header Display | Use Case |
|------------|---------------------|-----------|----------------|----------|
| `hour` (default) | 40px per hour | Hours | Day headers (top) + Hour labels (bottom) | Detailed hourly view for immediate planning |
| `day` | 50px per day | Days | Single header row (date only) | Daily overview for short-term planning |
| `week` | 80px per week | Weeks | Single header row (week of date) | Weekly view for sprint/iteration planning |
| `month` | 100px per month | Months | Single header row (month year) | High-level timeline for project planning |
| `reset` | 40px per hour | Hours | Same as hour view | Returns to hour view |

**Important Design Pattern**: 
- **Hour View**: Shows TWO header rows (day groupings + individual hour labels)
- **Other Views**: Shows ONE header row (only the date/week/month label - NO hour numbers)

### HTML Structure

```html
<div class="timeline-controls">
    <div class="timeline-controls-left"></div>
    <div class="timeline-controls-right">
        <label class="timeline-control-label">
            <span class="codicon codicon-calendar"></span>
            Zoom:
        </label>
        <button class="timeline-btn" onclick="zoomQAGanttChart('hour')" title="Hour view">
            <span class="codicon codicon-watch"></span>
        </button>
        <button class="timeline-btn" onclick="zoomQAGanttChart('day')" title="Day view">
            <span class="codicon codicon-dash"></span>
        </button>
        <button class="timeline-btn" onclick="zoomQAGanttChart('week')" title="Week view">
            <span class="codicon codicon-menu"></span>
        </button>
        <button class="timeline-btn" onclick="zoomQAGanttChart('month')" title="Month view">
            <span class="codicon codicon-three-bars"></span>
        </button>
        <button class="timeline-btn" onclick="zoomQAGanttChart('reset')" title="Reset zoom">
            <span class="codicon codicon-screen-normal"></span>
        </button>
    </div>
</div>
```

### JavaScript Implementation

```javascript
// State variable
let currentQAZoomLevel = 'hour';

// Zoom function
function zoomQAGanttChart(zoomLevel) {
    console.log('[zoomQAGanttChart] Zoom level:', zoomLevel);
    currentQAZoomLevel = zoomLevel === 'reset' ? 'hour' : zoomLevel;
    calculateAndRenderForecast();
}

// In renderForecastGantt() function - Dynamic pixel width per time unit
let hourWidth; // Note: Despite name, represents pixels per TIME UNIT
switch (currentQAZoomLevel) {
    case 'hour':
        hourWidth = 40; // 40px per hour
        break;
    case 'day':
        hourWidth = 50; // 50px per day
        break;
    case 'week':
        hourWidth = 80; // 80px per week
        break;
    case 'month':
        hourWidth = 100; // 100px per month
        break;
    default:
        hourWidth = 40;
}

// Generate time units based on zoom level
switch (currentQAZoomLevel) {
    case 'hour':
        // Generate hours
        while (currentTime <= endDate) {
            allHoursUnfiltered.push(new Date(currentTime));
            currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
        }
        break;
    case 'day':
        // Generate days
        while (currentTime <= endDate) {
            allHoursUnfiltered.push(new Date(currentTime));
            currentTime.setDate(currentTime.getDate() + 1);
        }
        break;
    case 'week':
        // Generate weeks (7 days)
        while (currentTime <= endDate) {
            allHoursUnfiltered.push(new Date(currentTime));
            currentTime.setDate(currentTime.getDate() + 7);
        }
        break;
    case 'month':
        // Generate months
        while (currentTime <= endDate) {
            allHoursUnfiltered.push(new Date(currentTime));
            currentTime.setMonth(currentTime.getMonth() + 1);
        }
        break;
}

// Conditional header rendering based on zoom level
if (currentQAZoomLevel === 'hour') {
    // Show day headers (top) + hour labels (bottom)
    // ... day grouping logic ...
    // ... hour label rendering ...
} else {
    // Show single header row only (no hour labels)
    let formatString = currentQAZoomLevel === 'day' ? "%b %d" 
                     : currentQAZoomLevel === 'week' ? "Week of %b %d"
                     : "%B %Y";
    // ... single header rendering ...
}
```

## Files Modified

### `src/commands/userStoriesQACommands.ts`

**Added HTML** (after line 1964):
- Timeline controls container with 5 zoom buttons
- Icons using codicons (watch, dash, menu, three-bars, screen-normal)

**Added CSS** (after line 1586):
- `.timeline-controls` - Container styling with flexbox layout
- `.timeline-controls-left` / `.timeline-controls-right` - Layout sections
- `.timeline-control-label` - Label styling with icon
- `.timeline-btn` - Button styling with hover effects

### `src/webviews/userStoriesQAView.js`

**Added at top** (after line 22):
- `let currentQAZoomLevel = 'hour';` - State variable

**Added function** (after line 1517):
- `zoomQAGanttChart(zoomLevel)` - Zoom control function

**Modified `renderForecastGantt()`** (line 1557):
- Replaced static `hourWidth = 30` with dynamic switch statement
- Added time unit generation based on zoom level (hours/days/weeks/months)
- Implemented conditional header rendering (dual headers for hour view, single header for others)
- Updated positioning logic to handle different time units
- Added console logging for zoom level debugging

## Pattern Source

This implementation follows the same pattern as the User Story Development View zoom controls:
- **Reference Files**:
  - `src/webviews/userStoryDev/components/templates/forecastTabTemplate.js`
  - `src/webviews/userStoryDev/components/scripts/ganttChart.js`
  - `src/commands/userStoriesDevCommands.ts`

## Known Issues & Fixes

### Fix (2025-10-12): Pixel Width Correction
**Issue**: Initial implementation incorrectly set pixel widths as "per hour" for all zoom levels.
- Day view was 10px per hour (too narrow for date labels)
- Week view was 2px per hour  
- Month view was 0.5px per hour

**Solution**: Corrected to "per time unit" matching Dev View pattern:
- Day: 50px per day
- Week: 80px per week
- Month: 100px per month

### Fix (2025-10-12): Month/Week View Last Unit Positioning
**Issue**: Items in the final month or week of the timeline were not positioned correctly - the positioning logic would break early when `!nextUnit` was true without calculating the position for items in that last time unit.

**Solution**: Added special handling for the last time unit in week/month views:
- Calculate unit duration dynamically (7 days for week, actual month length for month)
- Use fractional position within that last unit
- Cap fraction at 1.0 to prevent overflow

### Fix (2025-10-12): Start/End Date Normalization (CRITICAL)
**Issue**: Timeline generation was starting from the exact time of the first item (e.g., Oct 15, 9:00 AM), which caused:
- Month headers showing "October 2025" but representing Oct 15 - Nov 15 instead of full October
- Time units incrementing incorrectly (Oct 15 → Nov 15 → Dec 15 instead of Oct 1 → Nov 1 → Dec 1)
- Items positioned incorrectly because the month boundaries didn't match the timeline units

**Solution**: Normalize startDate and endDate based on zoom level:
- **Hour view**: Start at beginning of hour (keep minutes/seconds at 0)
- **Day view**: Start at midnight (00:00:00)
- **Week view**: Start at Sunday midnight (beginning of week)
- **Month view**: Start at day 1 of month, end at last day of month
- Ensures timeline units align with natural time boundaries

## Testing

### Manual Testing Steps

1. Launch extension in debug mode (F5)
2. Open a user story in QA View
3. Navigate to Forecast tab
4. Verify timeline controls appear between Project Overview and Gantt chart
5. Click each zoom button and verify:
   - Hour: Detailed hourly view (wide bars)
   - Day: Compact daily view (medium bars, date labels readable)
   - Week: Very compact weekly view (thin bars)
   - Month: High-level monthly view (bars spread across correct months)
   - Reset: Returns to hour view
6. Verify Gantt chart maintains all data and colors during zoom
7. Check that scroll bars adjust appropriately for width changes
8. **Verify items in last month/week display correctly** (not clustered in first column)

### Expected Behavior

- Clicking a zoom button immediately re-renders the Gantt chart
- Chart maintains all task data, colors, and labels
- Width adjusts proportionally to zoom level
- Scroll bars appear/disappear as needed
- Zoom state persists during the webview session
- Console logs show zoom level changes

## Design Decisions

### Icon Selection
- **Hour**: `codicon-watch` (time-focused)
- **Day**: `codicon-dash` (horizontal line representing day)
- **Week**: `codicon-menu` (multiple lines representing week)
- **Month**: `codicon-three-bars` (multiple bars representing month)
- **Reset**: `codicon-screen-normal` (return to default)

### Pixel Width Values
- Based on Dev View implementation
- Provides meaningful visual differences between zoom levels
- Ensures readability at all zoom levels
- Optimized for typical QA forecast timelines

### Layout
- Positioned between Project Overview and Gantt chart
- Right-aligned buttons for consistency with Dev View
- Left section empty but available for future controls
- Consistent styling with VS Code secondary buttons

## Future Enhancements

Potential improvements:
1. **Active State Indicator**: Highlight currently selected zoom level
2. **Zoom Persistence**: Save zoom preference to workspace state
3. **Keyboard Shortcuts**: Add hotkeys for zoom levels
4. **Custom Zoom**: Allow users to input custom pixel width
5. **Zoom Animation**: Smooth transition between zoom levels
6. **Zoom Presets**: Save/load custom zoom configurations

## Related Documentation

- **Project Overview**: `docs/architecture/qa-project-overview-implementation.md`
- **Dev View Zoom**: Dev View forecast tab implementation (source pattern)
- **Gantt Chart Rendering**: QA forecast Gantt chart D3.js implementation

## Notes

- Zoom controls are client-side only (no server-side storage)
- Zoom level resets when webview is reloaded
- Compatible with non-working hours filtering
- Works with all QA configuration settings
- Does not affect forecast calculations, only visualization
