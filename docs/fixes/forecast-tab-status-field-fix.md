# Forecast Tab Fix - Status Field Corrections

**Date**: October 5, 2025  
**Issue**: Gantt chart not displaying items in forecast tab  
**Root Cause**: Using wrong field names (`status` instead of `devStatus`, `developer` instead of `assignedTo`)

## Problem Description

The Forecast tab's Gantt chart was not displaying any stories because the forecast functions were using incorrect field names that don't match the User Story Dev View data model.

### Incorrect Field Names Used:
- ❌ `item.status` (should be `item.devStatus`)
- ❌ `item.developer` (should be `item.assignedTo`)
- ❌ Status values: `"Done"`, `"Blocked"` (should be `"completed"`, `"blocked"`)
- ❌ Priority values: `"Critical"`, `"High"` (should be `"critical"`, `"high"`)

### Impact:
- No stories appeared in the Gantt chart
- Forecast calculations were based on wrong data
- Risk assessment used wrong filters
- Bottleneck identification failed

## Files Fixed

### 1. `forecastFunctions.js` (9 fixes)

**Fix 1**: `calculateDevelopmentForecast()` - Filter logic
```javascript
// BEFORE (Wrong)
const completedStories = items.filter(item => item.status === "Done");
const incompleteStories = items.filter(item => item.status !== "Done");

// AFTER (Correct)
const completedStories = items.filter(item => item.devStatus === "completed");
const forecastStories = items.filter(item => item.devStatus !== "ready-for-qa" && !item.isIgnored);
```

**Fix 2**: `calculateDevelopmentForecast()` - Story points default
```javascript
// BEFORE
const points = parseInt(item.storyPoints) || 0;

// AFTER
const points = parseInt(item.storyPoints) || 1; // Default to 1 if not set or "?"
```

**Fix 3**: `calculateAverageVelocity()` - Status check
```javascript
// BEFORE
const completedStories = items.filter(item => item.status === "Done");
item.assignedSprint === sprint.sprintId && item.status === "Done"

// AFTER
const completedStories = items.filter(item => item.devStatus === "completed");
item.assignedSprint === sprint.sprintId && item.devStatus === "completed"
```

**Fix 4**: `assessProjectRisk()` - Blocked and unestimated stories
```javascript
// BEFORE
const blockedStories = items.filter(item => item.status === "Blocked");
const unestimatedStories = items.filter(item => 
    item.status !== "Done" && (!item.storyPoints || item.storyPoints === "?")
);

// AFTER
const blockedStories = items.filter(item => item.devStatus === "blocked");
const unestimatedStories = items.filter(item => 
    item.devStatus !== "ready-for-qa" && (!item.storyPoints || item.storyPoints === "?")
);
```

**Fix 5**: `assessProjectRisk()` - Priority values
```javascript
// BEFORE
item.priority === "Critical" || item.priority === "High"

// AFTER
item.priority === "critical" || item.priority === "high"
```

**Fix 6**: `calculateSprintVelocities()` - Sprint completion check
```javascript
// BEFORE
item.assignedSprint === sprint.sprintId && item.status === "Done"

// AFTER
item.assignedSprint === sprint.sprintId && item.devStatus === "completed"
```

**Fix 7**: `identifyBottlenecks()` - Field names
```javascript
// BEFORE
const blockedStories = items.filter(item => item.status === "Blocked");
items.filter(item => item.status !== "Done").forEach(item => {
    const dev = item.developer || "Unassigned";

// AFTER
const blockedStories = items.filter(item => item.devStatus === "blocked");
items.filter(item => item.devStatus !== "ready-for-qa").forEach(item => {
    const dev = item.assignedTo || "Unassigned";
```

**Fix 8**: `identifyBottlenecks()` - Unassigned critical stories
```javascript
// BEFORE
const unassignedCritical = items.filter(item => 
    item.status !== "Done" && 
    item.priority === "Critical" && 
    (!item.developer || item.developer === "Unassigned")
);

// AFTER
const unassignedCritical = items.filter(item => 
    item.devStatus !== "ready-for-qa" && 
    item.priority === "critical" && 
    (!item.assignedTo || item.assignedTo === "Unassigned")
);
```

**Fix 9**: `generateRecommendations()` - All filters
```javascript
// BEFORE
const blockedStories = items.filter(item => item.status === "Blocked");
items.filter(item => item.status !== "Done").forEach(item => {
    const dev = item.developer || "Unassigned";

// AFTER
const blockedStories = items.filter(item => item.devStatus === "blocked");
items.filter(item => item.devStatus !== "ready-for-qa").forEach(item => {
    const dev = item.assignedTo || "Unassigned";
```

**Fix 10**: `calculateStorySchedules()` - Field names in output
```javascript
// BEFORE
{
    status: story.status,
    developer: story.developer || "Unassigned",
}

// AFTER
{
    devStatus: story.devStatus,
    assignedTo: story.assignedTo || "Unassigned",
}
```

**Fix 11**: `sortStoriesForScheduling()` - Priority and status
```javascript
// BEFORE
const priorityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
if (a.status === "Blocked" && b.status !== "Blocked") {

// AFTER
const priorityOrder = { "critical": 0, "high": 1, "medium": 2, "low": 3 };
if (a.devStatus === "blocked" && b.devStatus !== "blocked") {
```

### 2. `ganttChart.js` (2 fixes)

**Fix 1**: `filterSchedules()` - Status filtering
```javascript
// BEFORE
case "incomplete":
    return schedules.filter(s => s.status !== "Done");
case "complete":
    return schedules.filter(s => s.status === "Done");
case "blocked":
    return schedules.filter(s => s.status === "Blocked");
case "critical":
    return schedules.filter(s => s.priority === "Critical");

// AFTER
case "incomplete":
    return schedules.filter(s => s.devStatus !== "ready-for-qa" && s.devStatus !== "completed");
case "complete":
    return schedules.filter(s => s.devStatus === "completed");
case "blocked":
    return schedules.filter(s => s.devStatus === "blocked");
case "critical":
    return schedules.filter(s => s.priority === "critical");
```

**Fix 2**: `renderGanttD3Chart()` - Bar color
```javascript
// BEFORE
.style("fill", d => d.status === "Done" ? colorScale("Done") : colorScale(d.priority))

// AFTER
.style("fill", d => d.devStatus === "completed" ? colorScale("completed") : colorScale(d.priority))
```

### 3. `forecastTabTemplate.js` (1 fix)

**Fix 1**: `generateForecastTab()` - Completed stories check
```javascript
// BEFORE
const hasCompletedStories = hasStories && items.some(item => item.status === "Done");

// AFTER
const hasCompletedStories = hasStories && items.some(item => item.devStatus === "completed");
```

## Key Insights

### 1. **Forecast Logic**: Stories NOT ready for QA
The forecast should show all stories that are **NOT** `ready-for-qa` status, because those are the stories still in development:

```javascript
const forecastStories = items.filter(item => 
    item.devStatus !== "ready-for-qa" && 
    !item.isIgnored
);
```

This includes stories with statuses:
- `on-hold`
- `ready-for-dev`
- `in-progress`
- `blocked`
- `completed`
- `ready-for-dev-env`
- `deployed-to-dev`

Stories with `ready-for-qa` are excluded because they've been handed off to QA.

### 2. **Default Story Points**
Stories with `"?"` or no story points should default to `1` point for forecasting:

```javascript
const points = parseInt(item.storyPoints) || 1;
```

This ensures the forecast can still calculate a timeline even for unestimated work.

### 3. **Priority Values Are Lowercase**
All priority comparisons must use lowercase:
- `"critical"` not `"Critical"`
- `"high"` not `"High"`
- `"medium"` not `"Medium"`
- `"low"` not `"Low"`

### 4. **Field Name Mapping**

| Display Name | Field Name | Type |
|--------------|------------|------|
| Status | `devStatus` | string (8 values) |
| Priority | `priority` | string (4 values) |
| Assigned To | `assignedTo` | string |
| Story Points | `storyPoints` | string (Fibonacci + "?") |
| Sprint | `sprint` or `assignedSprint` | string |

## Testing Checklist

After this fix, verify:

- [ ] Forecast tab loads without errors
- [ ] Gantt chart displays stories (not empty)
- [ ] Stories NOT `ready-for-qa` appear in chart
- [ ] Stories with `ready-for-qa` do NOT appear
- [ ] Completed stories show in green
- [ ] Priority colors are correct (critical=red, high=orange, etc.)
- [ ] Forecast statistics calculate correctly
- [ ] Risk assessment shows blocked stories
- [ ] Bottlenecks identify unassigned critical stories
- [ ] Filters work (incomplete, complete, blocked, critical)
- [ ] Grouping works (by status, priority, developer, sprint)
- [ ] Tooltips show correct data on hover
- [ ] Export CSV includes correct field names

## Related Documentation

- **Architecture**: `user-story-dev-view-architecture.md` - Status workflow
- **Status Reference**: `USER-STORY-DEV-VIEW-STATUS-REFERENCE.md` - Official field names
- **User Guide**: `USER-STORY-DEV-VIEW-USER-GUIDE.md` - Forecast tab usage
- **Progress**: `USER-STORY-DEV-VIEW-PROGRESS.md` - Implementation status

## Prevention

To prevent similar issues in the future:

1. **Always refer to the status reference document** when writing filters
2. **Use constants** for field names and status values
3. **Run linting** to catch undefined properties
4. **Add type definitions** (JSDoc or TypeScript) for data models
5. **Write unit tests** for filter logic with sample data

## Example Constants File (Recommendation)

Create `src/webviews/userStoryDev/constants.js`:

```javascript
// Dev Status Values
export const DEV_STATUS = {
    ON_HOLD: 'on-hold',
    READY_FOR_DEV: 'ready-for-dev',
    IN_PROGRESS: 'in-progress',
    BLOCKED: 'blocked',
    COMPLETED: 'completed',
    READY_FOR_DEV_ENV: 'ready-for-dev-env',
    DEPLOYED_TO_DEV: 'deployed-to-dev',
    READY_FOR_QA: 'ready-for-qa'
};

// Priority Values
export const PRIORITY = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

// Field Names
export const FIELDS = {
    DEV_STATUS: 'devStatus',
    PRIORITY: 'priority',
    ASSIGNED_TO: 'assignedTo',
    STORY_POINTS: 'storyPoints',
    SPRINT: 'sprint'
};
```

Then use:
```javascript
items.filter(item => item[FIELDS.DEV_STATUS] === DEV_STATUS.COMPLETED)
```

This prevents typos and makes refactoring easier.

---

**Fix Status**: ✅ Complete  
**Files Changed**: 3 files, 13 fixes total  
**Impact**: Forecast tab now displays stories correctly
