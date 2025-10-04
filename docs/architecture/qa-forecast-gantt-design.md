# QA Forecast Gantt Chart - Design Document

**Created:** October 4, 2025  
**Component:** User Stories QA View - Forecast Tab  
**Purpose:** Predict when "Ready to Test" stories will be completed based on QA capacity

---

## Overview

The QA Forecast Gantt Chart helps teams plan and predict when stories in "Ready to Test" status will be completed, based on:
- Available QA resources (number of testers)
- Working hours per day
- Average time to test each story
- Story priority (ordered by story number)

---

## Configuration Model

### QA Configuration Data Structure
```json
{
  "qaConfig": {
    "avgTestTimeHours": 4,
    "qaResources": 2,
    "workingHours": [
      {
        "dayOfWeek": "Monday",
        "startTime": "09:00",
        "endTime": "17:00",
        "enabled": true
      },
      {
        "dayOfWeek": "Tuesday",
        "startTime": "09:00",
        "endTime": "17:00",
        "enabled": true
      },
      {
        "dayOfWeek": "Wednesday",
        "startTime": "09:00",
        "endTime": "17:00",
        "enabled": true
      },
      {
        "dayOfWeek": "Thursday",
        "startTime": "09:00",
        "endTime": "17:00",
        "enabled": true
      },
      {
        "dayOfWeek": "Friday",
        "startTime": "09:00",
        "endTime": "17:00",
        "enabled": true
      },
      {
        "dayOfWeek": "Saturday",
        "startTime": "09:00",
        "endTime": "17:00",
        "enabled": false
      },
      {
        "dayOfWeek": "Sunday",
        "startTime": "09:00",
        "endTime": "17:00",
        "enabled": false
      }
    ]
  }
}
```

### Configuration Storage
- Stored in: `app-dna-qa-config.json` (in same directory as model)
- Default values if file doesn't exist:
  - Average test time: 4 hours
  - QA resources: 2 testers
  - Working hours: Monday-Friday, 9:00 AM - 5:00 PM (8 hours/day)
  - Weekend: Disabled

---

## Scheduling Algorithm

### Input
1. **Stories to schedule**: All stories with `qaStatus === "ready-to-test"`
2. **Sorted by**: Story number (ascending)
3. **Configuration**: avgTestTimeHours, qaResources, workingHours
4. **Start time**: Current date/time (or next working period)

### Algorithm Logic

```javascript
function calculateQAForecast(readyToTestStories, qaConfig) {
    // 1. Sort stories by story number
    const sortedStories = readyToTestStories.sort((a, b) => {
        return parseInt(a.storyNumber) - parseInt(b.storyNumber);
    });
    
    // 2. Calculate available hours per day
    const availableHoursPerDay = {};
    qaConfig.workingHours.forEach(day => {
        if (day.enabled) {
            const start = parseTime(day.startTime);
            const end = parseTime(day.endTime);
            availableHoursPerDay[day.dayOfWeek] = end - start;
        }
    });
    
    // 3. Calculate total capacity per day
    // If 2 QA resources work 8 hours = 16 hours of testing capacity per day
    const dailyCapacity = {};
    Object.keys(availableHoursPerDay).forEach(day => {
        dailyCapacity[day] = availableHoursPerDay[day] * qaConfig.qaResources;
    });
    
    // 4. Schedule stories sequentially
    let currentDate = new Date();
    let remainingCapacityToday = getRemainingCapacityForDate(currentDate, qaConfig);
    
    const forecast = [];
    
    for (const story of sortedStories) {
        const testTimeNeeded = qaConfig.avgTestTimeHours;
        let timeRemaining = testTimeNeeded;
        let startDate = null;
        let endDate = null;
        
        // Schedule this story across available capacity
        while (timeRemaining > 0) {
            // Skip non-working days
            if (!isWorkingDay(currentDate, qaConfig)) {
                currentDate = getNextWorkingDay(currentDate, qaConfig);
                remainingCapacityToday = getRemainingCapacityForDate(currentDate, qaConfig);
                continue;
            }
            
            if (!startDate) {
                startDate = new Date(currentDate);
            }
            
            // Allocate capacity for this day
            const capacityUsed = Math.min(timeRemaining, remainingCapacityToday);
            timeRemaining -= capacityUsed;
            remainingCapacityToday -= capacityUsed;
            
            if (timeRemaining <= 0) {
                // Story completes today
                endDate = new Date(currentDate);
            } else if (remainingCapacityToday <= 0) {
                // Move to next working day
                currentDate = getNextWorkingDay(currentDate, qaConfig);
                remainingCapacityToday = getDailyCapacity(currentDate, qaConfig);
            }
        }
        
        forecast.push({
            storyId: story.storyId,
            storyNumber: story.storyNumber,
            storyText: story.storyText,
            startDate: startDate,
            endDate: endDate,
            duration: testTimeNeeded
        });
    }
    
    return forecast;
}
```

### Parallel Processing Logic

Since we have multiple QA resources, stories are processed in parallel:

**Example with 2 QA Resources, 8-hour days:**
- Total daily capacity: 16 hours
- If avgTestTime = 4 hours per story
- Can complete up to 4 stories per day (2 resources × 2 stories each)

**Scheduling:**
```
Day 1:
  Resource 1: US-001 (4h), US-003 (4h)
  Resource 2: US-002 (4h), US-004 (4h)
  
Day 2:
  Resource 1: US-005 (4h), US-007 (4h)
  Resource 2: US-006 (4h), US-008 (4h)
```

---

## UI Design

### Tab Structure

Add fourth tab: **"Forecast"**

Tab order:
1. Details
2. Board
3. Status Distribution
4. **Forecast** (NEW)

### Configuration Button

At top of Forecast tab:
```
┌────────────────────────────────────────────────────┐
│  [⚙️ Configure Forecast]        [🔄 Refresh]       │
└────────────────────────────────────────────────────┘
```

### Configuration Modal

```
┌─────────────────────────────────────────────────────┐
│  QA Forecast Configuration                     [×]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Testing Parameters                                 │
│  ┌───────────────────────────────────────────────┐ │
│  │ Average Test Time per Story:  [4] hours      │ │
│  │ Available QA Resources:       [2] testers    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Working Hours                                      │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☑ Monday      09:00  to  17:00               │ │
│  │ ☑ Tuesday     09:00  to  17:00               │ │
│  │ ☑ Wednesday   09:00  to  17:00               │ │
│  │ ☑ Thursday    09:00  to  17:00               │ │
│  │ ☑ Friday      09:00  to  17:00               │ │
│  │ ☐ Saturday    09:00  to  17:00               │ │
│  │ ☐ Sunday      09:00  to  17:00               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Summary                                            │
│  ┌───────────────────────────────────────────────┐ │
│  │ Working Days per Week: 5                      │ │
│  │ Hours per Day: 8                              │ │
│  │ Total Capacity per Day: 16 hours              │ │
│  │ Stories per Day: ~4                           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    [Cancel]  [Save Configuration]   │
└─────────────────────────────────────────────────────┘
```

### Gantt Chart Display

```
┌─────────────────────────────────────────────────────────────────┐
│  Stories to Test: 12  |  Estimated Completion: Oct 8, 2025      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              Oct 4        Oct 5        Oct 6        Oct 7       │
│              ├────────────┼────────────┼────────────┼──────     │
│                                                                  │
│  US-001      ████                                                │
│  US-002      ████                                                │
│  US-003           ████                                           │
│  US-004           ████                                           │
│  US-005                ████                                      │
│  US-006                ████                                      │
│  US-007                     ████                                 │
│  US-008                     ████                                 │
│  US-009                          ████                            │
│  US-010                          ████                            │
│  US-011                               ████                       │
│  US-012                               ████                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Hover tooltip:
┌─────────────────────────┐
│ US-001                  │
│ Start: Oct 4, 9:00 AM   │
│ End: Oct 4, 1:00 PM     │
│ Duration: 4 hours       │
└─────────────────────────┘
```

### Color Scheme

- Bar color: Blue (same as "Ready to Test" status)
- Hover: Slightly darker blue
- Today marker: Vertical red line
- Weekend/non-working days: Light gray background

### Legend/Summary Box

```
┌────────────────────────────────────┐
│  Forecast Summary                  │
├────────────────────────────────────┤
│  Stories to Test: 12               │
│  Total Test Time: 48 hours         │
│  Daily Capacity: 16 hours          │
│  Start Date: Oct 4, 2025           │
│  Completion Date: Oct 8, 2025      │
│  Working Days: 3                   │
└────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Configuration Storage (Backend)

**File: `src/commands/userStoriesQACommands.ts`**

Add message handlers:
```typescript
case 'loadQAConfig':
    // Load config from app-dna-qa-config.json
    // Return default if doesn't exist
    break;

case 'saveQAConfig':
    // Save config to app-dna-qa-config.json
    break;
```

### Phase 2: Configuration Modal (Frontend)

**File: `src/webviews/userStoriesQAView.js`**

Functions to add:
- `openConfigModal()` - Show configuration modal
- `closeConfigModal()` - Hide configuration modal
- `saveConfigModal()` - Save configuration and refresh forecast
- `updateConfigSummary()` - Update summary stats in modal

### Phase 3: Scheduling Algorithm (Frontend)

**File: `src/webviews/userStoriesQAView.js`**

Functions to add:
- `calculateQAForecast(readyStories, config)` - Main scheduling algorithm
- `isWorkingDay(date, config)` - Check if date is working day
- `getNextWorkingDay(date, config)` - Find next working day
- `getDailyCapacity(date, config)` - Get capacity for specific date
- `getRemainingCapacityForDate(date, config)` - Get remaining capacity for today

### Phase 4: Gantt Chart Rendering (Frontend)

**File: `src/webviews/userStoriesQAView.js`**

Functions to add:
- `renderForecastGantt()` - Main render function
- Uses D3.js (already included for other charts)
- Horizontal bars showing story timelines
- Date axis at top
- Story numbers on Y-axis
- Today marker
- Hover tooltips

### Phase 5: HTML/CSS

**File: `src/commands/userStoriesQACommands.ts`**

Add:
- Forecast tab content HTML
- Configuration modal HTML
- Gantt chart container
- CSS for Gantt bars, timeline, modal

---

## Data Flow

### Loading Forecast Tab
```
User clicks "Forecast" tab
    ↓
Load QA config (from app-dna-qa-config.json)
    ↓
Filter stories where qaStatus === "ready-to-test"
    ↓
Sort by story number
    ↓
Run calculateQAForecast(stories, config)
    ↓
Render Gantt chart with forecast data
    ↓
Display summary statistics
```

### Changing Configuration
```
User clicks "Configure Forecast" button
    ↓
Open configuration modal
    ↓
Load current config values into form
    ↓
User modifies values
    ↓
User clicks "Save Configuration"
    ↓
Validate inputs
    ↓
Save to app-dna-qa-config.json
    ↓
Close modal
    ↓
Recalculate forecast
    ↓
Re-render Gantt chart
```

---

## Edge Cases & Validation

### Configuration Validation

1. **Average Test Time**:
   - Must be > 0
   - Reasonable range: 0.5 - 40 hours
   - Warning if > 8 hours (spans multiple days)

2. **QA Resources**:
   - Must be >= 1
   - Reasonable range: 1 - 20
   - Warning if > 10 (unusually large team)

3. **Working Hours**:
   - Start time must be before end time
   - At least one day must be enabled
   - Time format: HH:MM (24-hour)
   - Reasonable hours: 1 - 24 hours per day

4. **At Least One Working Day**:
   - Error if all days disabled
   - Warning if < 3 days per week

### Forecast Edge Cases

1. **No Stories to Test**:
   - Show message: "No stories in 'Ready to Test' status"
   - Display empty Gantt chart

2. **Very Long Timeline**:
   - If forecast spans > 30 days, show warning
   - Suggest reviewing avg test time or adding resources

3. **Today is Not Working Day**:
   - Start forecast from next working day
   - Show message: "Forecast starts on [next working day]"

4. **Partial Day Capacity**:
   - If current time is 2 PM and work ends at 5 PM
   - Only 3 hours remaining today
   - Handle rollover to next day correctly

---

## Example Calculations

### Scenario 1: Simple Case
- **Stories**: 4 stories (US-001 to US-004)
- **Avg test time**: 4 hours
- **QA resources**: 2
- **Working hours**: Mon-Fri, 9 AM - 5 PM (8 hours)
- **Today**: Monday, Oct 4, 9 AM

**Calculation**:
- Daily capacity = 2 resources × 8 hours = 16 hours
- Stories per day = 16 / 4 = 4 stories
- All 4 stories complete on Monday

**Gantt**:
```
Mon Oct 4
├─────────┤
US-001 ████
US-002 ████
US-003 ████
US-004 ████
```

### Scenario 2: Multi-Day
- **Stories**: 12 stories
- **Avg test time**: 4 hours
- **QA resources**: 2
- **Working hours**: Mon-Fri, 9 AM - 5 PM (8 hours)
- **Today**: Thursday, Oct 4, 9 AM

**Calculation**:
- Daily capacity = 16 hours
- Stories per day = 4
- Days needed = 12 / 4 = 3 days
- Thu (4 stories), Fri (4 stories), Mon (4 stories)

**Gantt**:
```
Thu Oct 4  Fri Oct 5  Sat/Sun    Mon Oct 8
├────────┼────────┼──────────┼────────┤
US-001 ████
US-002 ████
US-003 ████
US-004 ████
US-005      ████
US-006      ████
US-007      ████
US-008      ████
US-009                       ████
US-010                       ████
US-011                       ████
US-012                       ████
```

### Scenario 3: Partial Day
- **Current time**: Thursday 2 PM
- **Work ends**: 5 PM
- **Remaining today**: 3 hours
- **Avg test time**: 4 hours

**Calculation**:
- Story US-001 starts Thu 2 PM
- Uses 3 hours today (Thu 2 PM - 5 PM)
- Needs 1 more hour
- Continues Fri 9 AM - 10 AM
- Completes Fri 10 AM

---

## Future Enhancements

### Phase 2 Features
1. **Per-Story Test Time**:
   - Override avg time for specific stories
   - Add field in modal or Details tab

2. **Priority Override**:
   - Drag to reorder stories in forecast
   - Manual prioritization

3. **Resource Assignment**:
   - Assign specific QA resources to stories
   - Show who's testing what

4. **Actual vs Forecast**:
   - Compare forecast to actual completion
   - Track accuracy over time

5. **Holidays**:
   - Mark specific dates as non-working
   - Company holidays, team vacations

6. **Working Hours Per Resource**:
   - Different schedules per QA resource
   - Part-time vs full-time

7. **Export Forecast**:
   - Export to CSV
   - Print/PDF
   - Share with team

---

## Testing Checklist

### Configuration Tests
- [ ] Save/load configuration
- [ ] Default configuration when file doesn't exist
- [ ] Validation: avg test time > 0
- [ ] Validation: QA resources >= 1
- [ ] Validation: at least one working day enabled
- [ ] Validation: start time < end time
- [ ] Summary updates when config changes

### Scheduling Tests
- [ ] Simple case: all stories fit in one day
- [ ] Multi-day case: stories span multiple days
- [ ] Weekend handling: skip Sat/Sun
- [ ] Partial day: handle remaining hours today
- [ ] No stories: show empty state
- [ ] Large number of stories: performance

### UI Tests
- [ ] Gantt chart renders correctly
- [ ] Bars aligned with dates
- [ ] Hover tooltips show correct data
- [ ] Today marker visible
- [ ] Summary stats accurate
- [ ] Config modal opens/closes
- [ ] Tab switching works

---

## Conclusion

This QA Forecast Gantt Chart provides practical capacity planning by:
- ✅ Showing when stories will be tested
- ✅ Identifying resource constraints
- ✅ Helping plan releases and commitments
- ✅ Visualizing QA workload
- ✅ Supporting data-driven decisions

The configuration is flexible and the algorithm is straightforward, making it easy to use and understand.

---

**Document Version:** 1.0  
**Ready for Implementation:** Yes  
**Estimated Effort:** 2-3 days
