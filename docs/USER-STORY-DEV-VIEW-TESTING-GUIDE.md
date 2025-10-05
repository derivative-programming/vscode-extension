# User Story Dev View - Testing Guide

**Last Updated**: October 5, 2025

This guide provides comprehensive testing procedures for the User Story Dev View feature.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup for Testing](#setup-for-testing)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Manual Testing Procedures](#manual-testing-procedures)
6. [Edge Case Testing](#edge-case-testing)
7. [Performance Testing](#performance-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Known Issues](#known-issues)

---

## Prerequisites

- VS Code installed (version 1.85+)
- Extension compiled without errors
- Test workspace with `app-dna.json` file
- Node.js and npm installed for running test scripts

---

## Setup for Testing

### 1. Prepare Test Data

Create test data files in your workspace:

**app-dna-user-story-dev.json** (sample with 10 stories):
```json
{
  "items": [
    {
      "storyNumber": "US-001",
      "priority": "Critical",
      "story": "User login functionality",
      "acceptanceCriteria": "Users can log in with email and password",
      "storyPoints": "5",
      "status": "Done",
      "developer": "Alice Johnson",
      "startDate": "2025-09-01",
      "targetDate": "2025-09-05",
      "actualEndDate": "2025-09-04",
      "notes": "Implemented OAuth integration",
      "assignedSprint": "sprint-1",
      "tags": "authentication, security"
    },
    {
      "storyNumber": "US-002",
      "priority": "High",
      "story": "Dashboard overview page",
      "acceptanceCriteria": "Display key metrics and charts",
      "storyPoints": "8",
      "status": "In Progress",
      "developer": "Bob Smith",
      "startDate": "2025-09-05",
      "targetDate": "2025-09-12",
      "actualEndDate": "",
      "notes": "",
      "assignedSprint": "sprint-1",
      "tags": "ui, dashboard"
    }
    // Add 8 more stories with varying data
  ]
}
```

**app-dna-user-story-dev-config.json**:
```json
{
  "sprints": [
    {
      "sprintId": "sprint-1",
      "sprintName": "Sprint 1 - Foundation",
      "startDate": "2025-09-01",
      "endDate": "2025-09-14",
      "status": "active",
      "capacity": 50,
      "goal": "Build authentication and dashboard foundation"
    }
  ],
  "forecastConfig": {
    "hoursPerPoint": 8,
    "workingHoursPerDay": 8,
    "workingDaysPerWeek": 5,
    "excludeWeekends": true,
    "holidays": ["2025-12-25", "2025-01-01"],
    "velocityOverride": null,
    "parallelWorkFactor": 1.0
  }
}
```

### 2. Launch Extension in Debug Mode

1. Open VS Code in the extension workspace
2. Press **F5** to start debugging
3. In the Extension Development Host, open a workspace with test data
4. Open an `app-dna.json` file
5. Run command: **User Stories: Open Development View**

---

## Unit Testing

### Helper Functions Testing

**Test `devDataHelpers.js` functions**:

```javascript
// Test parseStoryPoints
console.assert(parseStoryPoints("5") === 5, "Parse valid number");
console.assert(parseStoryPoints("?") === 0, "Parse question mark");
console.assert(parseStoryPoints(null) === 0, "Parse null");

// Test calculateTotalPoints
const items = [
  { storyPoints: "5" },
  { storyPoints: "8" },
  { storyPoints: "?" }
];
console.assert(calculateTotalPoints(items) === 13, "Calculate total points");

// Test date functions
console.assert(isValidDate("2025-09-01"), "Valid date");
console.assert(!isValidDate("invalid"), "Invalid date");

// Test sorting
const sortedByPriority = sortByPriority([
  { priority: "Low" },
  { priority: "Critical" },
  { priority: "High" }
]);
console.assert(sortedByPriority[0].priority === "Critical", "Sort by priority");
```

### Configuration Validation Testing

**Test `configValidator.js` functions**:

```javascript
// Test valid config
const validConfig = {
  sprints: [],
  forecastConfig: getDefaultForecastConfig()
};
const result = validateDevConfig(validConfig);
console.assert(result.isValid === true, "Valid config passes");

// Test invalid sprint
const invalidSprint = {
  sprintId: "sprint-1",
  startDate: "2025-09-01",
  endDate: "2025-08-30" // End before start
};
const sprintErrors = validateSprint(invalidSprint);
console.assert(sprintErrors.length > 0, "Invalid sprint detected");

// Test config normalization
const partialConfig = { sprints: [] };
const normalized = normalizeDevConfig(partialConfig);
console.assert(normalized.forecastConfig !== undefined, "Config normalized");
```

### Chart Function Testing

**Test chart data calculations**:

```javascript
// Test velocity calculation
const completedStories = [
  { status: "Done", storyPoints: "5" },
  { status: "Done", storyPoints: "8" },
  { status: "Done", storyPoints: "3" }
];
const velocity = calculateAverageVelocity(completedStories, {});
console.assert(velocity > 0, "Velocity calculated");

// Test burndown data
const sprint = {
  startDate: "2025-09-01",
  endDate: "2025-09-14"
};
const burndownData = calculateBurndownData(sprint, completedStories);
console.assert(Array.isArray(burndownData), "Burndown data is array");
console.assert(burndownData.length === 14, "14 days of data");
```

---

## Integration Testing

### Tab Switching

**Test Case**: Verify all tabs render correctly when switching

**Steps**:
1. Open Dev View
2. Click on each tab: Details, Analysis, Board, Sprint, Forecast
3. Verify content loads without errors
4. Switch back to Details tab
5. Verify state is preserved

**Expected**: All tabs render correctly, no console errors, state preserved

### Data Persistence

**Test Case**: Verify changes are saved to files

**Steps**:
1. In Details tab, edit a story (change priority)
2. Click Save
3. Close and reopen Dev View
4. Verify change persisted
5. Check JSON file directly

**Expected**: Changes saved to `app-dna-user-story-dev.json`

### File Watching

**Test Case**: Verify external file changes are detected

**Steps**:
1. Open Dev View
2. Externally edit `app-dna-user-story-dev.json` (change a story)
3. Save the file
4. Observe Dev View updates

**Expected**: Dev View shows notification and reloads data

### Sprint CRUD Operations

**Test Case**: Create, edit, delete sprints

**Steps**:
1. Go to Sprint tab
2. Click "Create Sprint"
3. Fill in details: name, dates, capacity
4. Click Save
5. Verify sprint appears in list
6. Edit sprint (change name)
7. Delete sprint (confirm dialog)
8. Verify sprint removed and stories unassigned

**Expected**: All operations work, data persists, UI updates

### Drag and Drop

**Test Case**: Drag stories between Kanban columns

**Steps**:
1. Go to Board tab
2. Drag a story from "To Do" to "In Progress"
3. Verify status changes
4. Verify change persists after refresh

**Expected**: Drag drop works, status updates, persists

---

## Manual Testing Procedures

### Details Tab

**Test Checklist**:
- [ ] Table renders with all columns
- [ ] Filters work (priority, status, developer)
- [ ] Search filters stories by text
- [ ] Sort by column works (ascending/descending)
- [ ] Edit story modal opens
- [ ] Save story updates data
- [ ] Delete story removes item
- [ ] Bulk operations work (delete, assign)
- [ ] Add new story creates item
- [ ] Story points validation (only numbers/?)
- [ ] Date pickers work correctly
- [ ] Tags field accepts multiple values

### Analysis Tab

**Test Checklist**:
- [ ] 6 metric cards display correct values
- [ ] Bar chart renders with story count by status
- [ ] Pie chart shows priority distribution
- [ ] Velocity chart shows sprint velocities
- [ ] Cycle time chart shows average days
- [ ] Timeline chart shows story timeline
- [ ] Charts update when data changes
- [ ] No errors in console
- [ ] Charts are responsive to window resize
- [ ] Hover tooltips work on all charts

### Board Tab

**Test Checklist**:
- [ ] 8 columns render (To Do → Done, Blocked)
- [ ] Story cards show all details
- [ ] Drag and drop between columns works
- [ ] Status updates on drop
- [ ] Add story button works
- [ ] Filter by priority works
- [ ] Filter by developer works
- [ ] Cards are visually appealing
- [ ] Blocked column highlighted
- [ ] Story counts accurate per column

### Sprint Tab

**Test Checklist**:
- [ ] Sprint list displays all sprints
- [ ] Backlog shows unassigned stories
- [ ] Create sprint modal works
- [ ] Sprint status badges correct colors
- [ ] Capacity bar shows progress
- [ ] Edit sprint works
- [ ] Delete sprint confirmation works
- [ ] Assign story to sprint works
- [ ] Unassign story works
- [ ] Burndown sub-tab renders
- [ ] Burndown chart shows ideal vs actual
- [ ] Sprint metrics accurate
- [ ] Today marker on active sprints

### Forecast Tab

**Test Checklist**:
- [ ] Gantt chart renders with all stories
- [ ] Timeline controls work (group, filter, zoom)
- [ ] Story bars color-coded by priority
- [ ] Today marker displays
- [ ] Hover tooltips show story details
- [ ] Forecast metrics display
- [ ] Risk assessment calculates
- [ ] Bottlenecks identified
- [ ] Recommendations generated
- [ ] Config modal opens
- [ ] Save config persists settings
- [ ] Holiday picker works
- [ ] US 2025 holidays preset works
- [ ] Export PNG/CSV works

---

## Edge Case Testing

### Empty Data Sets

**Test Case**: View with no stories

**Steps**:
1. Open Dev View with empty `items` array
2. Check all tabs

**Expected**:
- Details: Empty state message
- Analysis: "No data" message
- Board: Empty columns with "No stories" message
- Sprint: Can create sprints, backlog empty
- Forecast: "No stories to forecast" message

### Single Story

**Test Case**: View with exactly 1 story

**Steps**:
1. Open Dev View with 1 story
2. Test all operations

**Expected**: All features work with single story

### Large Data Set

**Test Case**: View with 500+ stories

**Steps**:
1. Generate 500 stories programmatically
2. Open Dev View
3. Test performance

**Expected**:
- Initial render < 2 seconds
- Smooth scrolling
- Filters respond < 500ms
- Charts render < 3 seconds

### Missing Fields

**Test Case**: Stories with null/undefined fields

**Steps**:
1. Create story with missing fields:
   ```json
   {
     "storyNumber": "US-999",
     "story": "Test story",
     "storyPoints": null,
     "developer": undefined
   }
   ```
2. Open Dev View
3. Verify graceful handling

**Expected**: No crashes, defaults applied, "?" for missing points

### Invalid Dates

**Test Case**: Stories with invalid date values

**Steps**:
1. Set `startDate` to "invalid-date"
2. Open Dev View

**Expected**: Shows "Invalid Date" or empty, no crash

### Concurrent Edits

**Test Case**: Multiple users editing same file

**Steps**:
1. Open Dev View
2. Externally edit file (simulate another user)
3. Make change in Dev View
4. Try to save

**Expected**: Conflict detection, warn user of external changes

### Special Characters

**Test Case**: Story text with special characters

**Steps**:
1. Create story with: `<script>alert('XSS')</script>`
2. Create story with emojis: "🚀 Launch feature"
3. Create story with quotes: `She said "Hello"`

**Expected**: Characters properly escaped, no XSS, displays correctly

### Sprint Overlaps

**Test Case**: Create overlapping sprints

**Steps**:
1. Create Sprint 1: Sep 1-14
2. Create Sprint 2: Sep 10-24 (overlaps)

**Expected**: Allowed (warning optional), both sprints functional

---

## Performance Testing

### Rendering Performance

**Test Large Dataset**:
```javascript
// Generate 500 stories
const stories = Array.from({ length: 500 }, (_, i) => ({
  storyNumber: `US-${i + 1}`,
  priority: ["Critical", "High", "Medium", "Low"][i % 4],
  story: `Test story ${i + 1}`,
  storyPoints: String((i % 13) + 1),
  status: ["To Do", "In Progress", "In Review", "Done"][i % 4],
  developer: `Dev ${(i % 5) + 1}`
}));

// Measure render time
console.time("Render Details Tab");
renderDetailsTab();
console.timeEnd("Render Details Tab");
// Expected: < 2000ms

console.time("Render Board Tab");
renderBoardTab();
console.timeEnd("Render Board Tab");
// Expected: < 3000ms

console.time("Render Analysis Tab");
renderAnalysisTab();
console.timeEnd("Render Analysis Tab");
// Expected: < 4000ms (charts are slower)
```

### Memory Usage

**Steps**:
1. Open Chrome DevTools (in Extension Development Host)
2. Go to Memory tab
3. Take heap snapshot
4. Interact with Dev View (switch tabs, create stories)
5. Take another heap snapshot
6. Compare memory growth

**Expected**: Memory growth < 50MB for normal operations

### Chart Rendering

**Test**:
```javascript
// Measure D3.js chart render time
console.time("Render Bar Chart");
renderStoryCountByStatus(items);
console.timeEnd("Render Bar Chart");
// Expected: < 500ms

console.time("Render Gantt Chart");
renderGanttChart(items, forecast, config);
console.timeEnd("Render Gantt Chart");
// Expected: < 2000ms for 100 stories
```

---

## Accessibility Testing

### Keyboard Navigation

**Test Checklist**:
- [ ] Tab key navigates through interactive elements
- [ ] Enter key activates buttons
- [ ] Escape key closes modals
- [ ] Arrow keys navigate within dropdowns
- [ ] Focus indicators visible
- [ ] Tab order is logical

### Screen Reader Support

**Test with NVDA/JAWS**:
- [ ] Tab names announced
- [ ] Button purposes clear
- [ ] Form labels associated with inputs
- [ ] Table headers announced
- [ ] Chart data accessible (alt text or table fallback)
- [ ] Error messages announced

### Color Contrast

**Test**:
1. Use browser dev tools contrast checker
2. Verify all text meets WCAG AA standards (4.5:1 ratio)
3. Test with high contrast themes
4. Test with color blindness simulators

**Expected**: All text readable, charts use patterns in addition to color

### Focus Management

**Test**:
1. Open modal
2. Verify focus moves to modal
3. Tab within modal
4. Close modal
5. Verify focus returns to trigger element

**Expected**: Focus properly managed, no focus traps

---

## Known Issues

### Current Limitations

1. **No undo/redo**: Changes are immediately saved
   - Workaround: Manual Git commits for versioning

2. **No real-time collaboration**: Concurrent edits may conflict
   - Workaround: File watcher notifies of external changes

3. **Large datasets (1000+)**: Performance degrades
   - Workaround: Use filters to reduce visible items

4. **Export formats limited**: Only SVG/CSV export
   - Workaround: Use browser screenshot for other formats

5. **No offline mode**: Requires file system access
   - Workaround: Ensure files are accessible

### Browser Compatibility

- **Tested**: VS Code Webview (Chromium-based)
- **Not tested**: Other browsers
- **Dependencies**: D3.js v7 requires modern JavaScript support

---

## Testing Report Template

Use this template to document test results:

```markdown
## Test Report: [Feature Name]

**Date**: [Date]
**Tester**: [Name]
**Environment**: VS Code v[X.Y.Z], Extension v[X.Y.Z]

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| [Test 1]  | ✅ Pass | [Details] |
| [Test 2]  | ❌ Fail | [Bug details, steps to reproduce] |
| [Test 3]  | ⚠️ Partial | [What works, what doesn't] |

### Bugs Found

1. **[Bug Title]**
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
     1. [Step 1]
     2. [Step 2]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
   - Screenshots: [If applicable]

### Performance Metrics

- Initial load time: [X]ms
- Tab switch time: [X]ms
- Chart render time: [X]ms
- Memory usage: [X]MB

### Recommendations

- [Improvement suggestion 1]
- [Improvement suggestion 2]
```

---

## Automated Testing (Future)

### Unit Test Framework

Consider adding Jest or Mocha for automated unit testing:

```javascript
// Example test structure
describe('devDataHelpers', () => {
  test('parseStoryPoints handles valid numbers', () => {
    expect(parseStoryPoints("5")).toBe(5);
  });
  
  test('parseStoryPoints handles question marks', () => {
    expect(parseStoryPoints("?")).toBe(0);
  });
  
  test('calculateTotalPoints sums correctly', () => {
    const items = [
      { storyPoints: "5" },
      { storyPoints: "8" }
    ];
    expect(calculateTotalPoints(items)).toBe(13);
  });
});
```

### E2E Testing

Consider Playwright or Cypress for end-to-end testing of VS Code extensions.

---

## Conclusion

This testing guide provides comprehensive coverage of all features. For any bugs found, please document using the template above and add to the project's issue tracker.

**Next Steps**:
1. Complete manual testing of all test cases
2. Document any bugs found
3. Address critical/high priority issues
4. Consider implementing automated testing
5. Perform regression testing after bug fixes
