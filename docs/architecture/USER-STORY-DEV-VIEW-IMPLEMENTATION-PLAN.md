# User Story Dev View - Implementation Plan

**Date:** October 5, 2025  
**Status:** Ready to Begin  
**Estimated Effort:** 13-18 days

---

## Overview

This document provides a step-by-step implementation guide for the User Story Development View, following the modular architecture pattern established by the Report Detail View.

**Architecture Reference:** `docs/architecture/user-story-dev-view-architecture.md`

---

## Implementation Checklist

### ✅ Phase 0: Setup (COMPLETED)
- [x] Architecture document created
- [x] Directory structure created:
  - `src/webviews/userStoryDev/`
  - `src/webviews/userStoryDev/components/`
  - `src/webviews/userStoryDev/components/scripts/`
  - `src/webviews/userStoryDev/components/templates/`
  - `src/webviews/userStoryDev/helpers/`
  - `src/webviews/userStoryDev/styles/`

### ✅ Phase 1: Foundation (COMPLETED)

#### Step 1.1: Create Command File ✅
**File:** `src/commands/userStoriesDevCommands.ts`

**Tasks:**
- [x] Create command registration function `registerUserStoriesDevCommands()`
- [x] Implement panel tracking (`activePanels` Map)
- [x] Implement `showUserStoriesDev()` function
- [x] Load data from model service (user stories)
- [x] Load data from `app-dna-user-story-dev.json` (dev tracking data)
- [x] Load config from `app-dna-user-story-dev-config.json`
- [x] Merge data (stories + dev data) by story ID
- [x] Implement message handlers:
  - `saveDevChange` - Save single dev data change
  - `bulkUpdateDevStatus` - Bulk status update
  - `saveSprint` - Save sprint configuration
  - `saveForecastConfig` - Save forecast configuration
  - `exportCSV` - Export to CSV
  - `refresh` - Reload data
- [x] Create default config generator

**Pattern Followed:** `src/commands/userStoriesQACommands.ts`

#### Step 1.2: Create Main Webview Orchestrator ✅
**File:** `src/webviews/userStoryDev/userStoryDevView.js`

**Tasks:**
- [x] Acquire VS Code API
- [x] Initialize state variables (devData, devConfig, allItems, selectedItems)
- [x] Implement message handler (`window.addEventListener('message', ...)`)
- [x] Handle incoming messages:
  - `setDevData` - Load and display data
  - `setDevConfig` - Load configuration
  - `devChangeSaved` - Show save confirmation
  - `sprintSaved` - Update sprint list
  - `forecastConfigSaved` - Update forecast config
  - `switchToTab` - Tab switching support
- [x] Implement tab switching logic
- [x] Create placeholder render functions for all 5 tabs

**Pattern Followed:** `src/webviews/userStoriesQAView.js`

#### Step 1.3: Register Commands in Extension ✅
**File:** `src/commands/registerCommands.ts`

**Tasks:**
- [x] Import `registerUserStoriesDevCommands`
- [x] Call registration function with context and modelService
- [x] Add to subscriptions

#### Step 1.4: Add Command to package.json ✅
**File:** `package.json`

**Tasks:**
- [x] Add command contribution:
  ```json
  {
    "command": "appdna.userStoriesDev",
    "title": "User Stories Development",
    "icon": "$(code)"
  }
  ```

---

### ⏳ Phase 2: Details Tab (2-3 days)

#### Step 2.1: Create Details Tab Template
**File:** `src/webviews/userStoryDev/components/templates/detailsTabTemplate.js`

**Tasks:**
- [ ] Export `generateDetailsTab(items, config)` function
- [ ] Generate filter section HTML (6 filters)
- [ ] Generate action buttons (Select All, Deselect All, Bulk Actions, Export, Refresh)
- [ ] Generate table HTML with 13 columns:
  1. Checkbox
  2. Story Number
  3. Story Text
  4. Priority (dropdown)
  5. Story Points (dropdown - Fibonacci + ?)
  6. Assigned To (dropdown)
  7. Dev Status (dropdown - 8 statuses)
  8. Sprint (dropdown)
  9. Start Date
  10. Est. End Date
  11. Actual End Date
  12. Blocked Reason
  13. Dev Notes
- [ ] Add event listener attributes (`onchange`, `onclick`)
- [ ] Include sorting icons in headers

**Pattern to Follow:** QA View details tab rendering

#### Step 2.2: Create Filter Functions
**File:** `src/webviews/userStoryDev/components/scripts/filterFunctions.js`

**Tasks:**
- [ ] Export `applyFilters()` - Apply all active filters
- [ ] Export `clearFilters()` - Clear all filters
- [ ] Export `getFilteredItems()` - Get filtered item array
- [ ] Export `toggleFilterSection()` - Collapse/expand filters

#### Step 2.3: Create Dev Status Management
**File:** `src/webviews/userStoryDev/components/scripts/devStatusManagement.js`

**Tasks:**
- [ ] Export `handleDevStatusChange(storyId, newStatus)` - Handle status dropdown change
- [ ] Export `handleBulkStatusUpdate(storyIds, newStatus)` - Bulk update
- [ ] Export `validateStatusTransition(oldStatus, newStatus)` - Validate transitions
- [ ] Export `getStatusColor(status)` - Return color for status badges

**8 Dev Statuses:**
```javascript
const DEV_STATUSES = [
    { value: 'on-hold', label: 'On Hold', color: '#858585' },
    { value: 'ready-for-dev', label: 'Ready for Development', color: '#0078d4' },
    { value: 'in-progress', label: 'In Progress', color: '#107c10' },
    { value: 'blocked', label: 'Blocked', color: '#d13438' },
    { value: 'completed', label: 'Completed', color: '#00b7c3' },
    { value: 'ready-for-dev-env-deploy', label: 'Ready for Dev Env Deploy', color: '#17a2b8' },
    { value: 'deployed-to-dev', label: 'Deployed to Dev Env', color: '#6f42c1' },
    { value: 'ready-for-qa', label: 'Ready for QA', color: '#20c997' }
];
```

#### Step 2.4: Create Priority Management
**File:** `src/webviews/userStoryDev/components/scripts/priorityManagement.js`

**Tasks:**
- [ ] Export `handlePriorityChange(storyId, newPriority)`
- [ ] Export `handleBulkPriorityUpdate(storyIds, newPriority)`
- [ ] Export `sortByPriority(items)`
- [ ] Export `getPriorityColor(priority)` - Return badge color

**4 Priorities:** low, medium, high, critical

#### Step 2.5: Create Story Points Management
**File:** `src/webviews/userStoryDev/components/scripts/storyPointsManagement.js`

**Tasks:**
- [ ] Export `handleStoryPointsChange(storyId, newPoints)`
- [ ] Export `calculateTotalPoints(items)` - Sum all story points
- [ ] Export `calculateVelocity(sprints)` - Calculate velocity per sprint

**Fibonacci Scale:** ?, 1, 2, 3, 5, 8, 13, 21

#### Step 2.6: Create Assignment Management
**File:** `src/webviews/userStoryDev/components/scripts/assignmentManagement.js`

**Tasks:**
- [ ] Export `handleDeveloperAssignment(storyId, developerId)`
- [ ] Export `getAvailableDevelopers(config)` - Get developer list from config
- [ ] Export `handleBulkAssignment(storyIds, developerId)`

#### Step 2.7: Create Modal Functionality
**File:** `src/webviews/userStoryDev/components/scripts/modalFunctionality.js`

**Tasks:**
- [ ] Export `openStoryDetailModal(storyId)` - Open story detail popup
- [ ] Export `closeStoryDetailModal()` - Close modal
- [ ] Export `saveStoryDetails()` - Save from modal

#### Step 2.8: Create Story Detail Modal Template
**File:** `src/webviews/userStoryDev/components/templates/storyDetailModalTemplate.js`

**Tasks:**
- [ ] Export `generateStoryDetailModal(story, config)` function
- [ ] Generate modal HTML with:
  - Story information display
  - Dev status dropdown
  - Priority dropdown
  - Story points dropdown
  - Developer assignment dropdown
  - Sprint assignment dropdown
  - Dates (start, est. end, actual end)
  - Blocked reason textarea
  - Dev notes textarea
  - Page mapping display (read-only)
  - Save/Cancel buttons

#### Step 2.9: Integrate into Main View
**File:** `src/webviews/userStoryDev/userStoryDevView.js`

**Tasks:**
- [ ] Import all details tab functions
- [ ] Call `generateDetailsTab()` when rendering
- [ ] Set up event listeners for table interactions
- [ ] Implement save operations (call vscode.postMessage)

---

### ⏳ Phase 3: Kanban Board (2 days)

#### Step 3.1: Create Board Tab Template
**File:** `src/webviews/userStoryDev/components/templates/boardTabTemplate.js`

**Tasks:**
- [ ] Export `generateBoardTab(items, config)` function
- [ ] Generate 8-column Kanban layout:
  1. On Hold
  2. Ready for Dev
  3. In Progress
  4. Blocked
  5. Completed
  6. Ready for Dev Env Deploy
  7. Deployed to Dev
  8. Ready for QA
- [ ] Generate filter controls
- [ ] Generate card containers with drop zones

#### Step 3.2: Create Kanban Functions
**File:** `src/webviews/userStoryDev/components/scripts/kanbanFunctions.js`

**Tasks:**
- [ ] Export `renderKanbanBoard(items)` - Render all cards
- [ ] Export `createKanbanCard(story)` - Generate single card HTML with:
  - Story number
  - Story text (truncated)
  - Priority badge
  - Story points badge
  - Developer avatar/initials
- [ ] Export `handleDragStart(event, storyId)` - Set drag data
- [ ] Export `handleDrop(event, newStatus)` - Update status on drop
- [ ] Export `handleDragOver(event)` - Allow drop

#### Step 3.3: Integrate Board Tab
**File:** `src/webviews/userStoryDev/userStoryDevView.js`

**Tasks:**
- [ ] Import board functions
- [ ] Add board tab rendering
- [ ] Set up drag-and-drop event listeners
- [ ] Handle status change on card drop

---

### ⏳ Phase 4: Charts & Analysis (2-3 days)

#### Step 4.1: Create Analysis Tab Template
**File:** `src/webviews/userStoryDev/components/templates/analysisTabTemplate.js`

**Tasks:**
- [ ] Export `generateAnalysisTab()` function
- [ ] Generate chart controls (type toggle, filters)
- [ ] Generate containers for 4 charts:
  1. Status distribution (bar/pie toggle)
  2. Velocity chart (line)
  3. Cycle time histogram (bar)

#### Step 4.2: Create Chart Functions
**File:** `src/webviews/userStoryDev/components/scripts/chartFunctions.js`

**Tasks:**
- [ ] Export `renderStatusDistribution(items, chartType)` - Reuse from QA view
- [ ] Export `renderVelocityChart(sprints)` - D3.js line chart showing points per sprint
- [ ] Export `renderCycleTimeChart(items)` - D3.js histogram showing time from start to completion

**Note:** Require D3.js library for charts (already used in QA view)

#### Step 4.3: Create Velocity Calculator Helper
**File:** `src/webviews/userStoryDev/helpers/velocityCalculator.js`

**Tasks:**
- [ ] Export `calculateSprintVelocity(sprint, items)` - Points completed in sprint
- [ ] Export `calculateAverageVelocity(sprints, items)` - Average across sprints
- [ ] Export `predictCompletionDate(remainingPoints, avgVelocity)` - Forecast

#### Step 4.4: Create Cycle Time Calculator Helper
**File:** `src/webviews/userStoryDev/helpers/cycleTimeCalculator.js`

**Tasks:**
- [ ] Export `calculateCycleTime(story)` - Days from start to completion
- [ ] Export `getAverageCycleTime(items)` - Average across all completed stories
- [ ] Export `getCycleTimeByPriority(items)` - Group by priority level

---

### ⏳ Phase 5: Sprint Management (2 days)

#### Step 5.1: Create Sprint Tab Template
**File:** `src/webviews/userStoryDev/components/templates/sprintTabTemplate.js`

**Tasks:**
- [ ] Export `generateSprintTab(config, items)` function
- [ ] Generate two sub-tabs:
  - Sub-tab 1: Planning
  - Sub-tab 2: Burndown
- [ ] **Planning sub-tab:**
  - Sprint selector dropdown
  - New Sprint / Configure / Metrics buttons
  - Sprint configuration panel (name, dates, capacity, team)
  - Sprint metrics display
  - Story assignment controls
- [ ] **Burndown sub-tab:**
  - Sprint selector
  - D3.js burndown chart container
  - Chart controls

#### Step 5.2: Create Sprint Management Functions
**File:** `src/webviews/userStoryDev/components/scripts/sprintManagement.js`

**Tasks:**
- [ ] Export `createSprint(sprintData)` - Create new sprint
- [ ] Export `editSprint(sprintId, updates)` - Update sprint
- [ ] Export `deleteSprint(sprintId)` - Remove sprint
- [ ] Export `assignStoriesToSprint(storyIds, sprintId)` - Bulk assign
- [ ] Export `calculateSprintMetrics(sprint, items)` - Calculate:
  - Total stories
  - Committed points
  - Completed points
  - Remaining points
  - Days remaining
  - On track status

#### Step 5.3: Create Sprint Modal Template
**File:** `src/webviews/userStoryDev/components/templates/sprintModalTemplate.js`

**Tasks:**
- [ ] Export `generateSprintModal(sprint)` function
- [ ] Generate modal HTML with:
  - Sprint name input
  - Start date picker
  - End date picker
  - Capacity input
  - Team selection (multi-select developers)
  - Save/Cancel buttons

#### Step 5.4: Render Burndown Chart
**File:** `src/webviews/userStoryDev/components/scripts/chartFunctions.js`

**Tasks:**
- [ ] Export `renderBurndownChart(sprint, items)` - D3.js chart with:
  - Ideal burndown line (gray dashed)
  - Actual burndown line (blue solid)
  - X-axis: Days in sprint
  - Y-axis: Story points remaining
  - Interactive tooltips

---

### ⏳ Phase 6: Forecast Tab (2-3 days)

#### Step 6.1: Create Forecast Tab Template
**File:** `src/webviews/userStoryDev/components/templates/forecastTabTemplate.js`

**Tasks:**
- [ ] Export `generateForecastTab(items, config)` function
- [ ] Generate action buttons:
  - Configure Forecast
  - Refresh
  - Export CSV
- [ ] Generate forecast summary stats display
- [ ] Generate Gantt chart container
- [ ] Generate configuration modal HTML

#### Step 6.2: Create Forecast Functions
**File:** `src/webviews/userStoryDev/components/scripts/forecastFunctions.js`

**Tasks:**
- [ ] Export `calculateDevForecast(items, config)` - Main algorithm:
  ```javascript
  // 1. Filter: status !== 'ready-for-qa'
  // 2. Group & sort: sprinted (by sprint date, story #) + non-sprinted (by story #)
  // 3. Schedule to developers based on availability
  // 4. Calculate start/end times using working hours
  // 5. Return timeline array
  ```
- [ ] Export `renderForecastGanttChart(timeline)` - D3.js Gantt chart
- [ ] Export `getNextWorkingTime(date, workingHours)` - Skip non-working hours
- [ ] Export `addWorkingHours(startDate, hoursNeeded, workingHours)` - Add hours
- [ ] Export `updateForecastSummary(timeline)` - Update stats display
- [ ] Export `exportForecastCSV(timeline)` - Generate CSV data

#### Step 6.3: Create Forecast Config Modal
**File:** `src/webviews/userStoryDev/components/scripts/modalFunctionality.js`

**Tasks:**
- [ ] Export `openForecastConfigModal()` - Show modal, load config
- [ ] Export `closeForecastConfigModal()` - Hide modal
- [ ] Export `saveForecastConfig()` - Validate and save:
  ```javascript
  {
    hoursPerPoint: 4,
    defaultStoryPoints: 1,
    workingHours: {
      "0": { enabled: false },
      "1": { enabled: true, startHour: 9, endHour: 17 },
      // ... days 2-6
    }
  }
  ```

#### Step 6.4: Render Gantt Chart with D3.js
**File:** `src/webviews/userStoryDev/components/scripts/forecastFunctions.js`

**Tasks:**
- [ ] Implement `renderForecastGanttChart(timeline)`:
  - Create SVG container
  - Set up scales (time, stories)
  - Draw time axis (hour-by-hour)
  - Draw story bars (color by developer)
  - Add story labels
  - Add tooltips on hover
  - Add visual separator between sprinted/non-sprinted
  - Highlight non-working hours
  - Add current time marker

**Pattern:** Reuse QA forecast Gantt chart rendering logic

---

### ⏳ Phase 7: Polish & Testing (1-2 days)

#### Step 7.1: Create Styles
**File:** `src/webviews/userStoryDev/styles/devViewStyles.js`

**Tasks:**
- [ ] Export `generateStyles()` function returning CSS string
- [ ] Include styles for:
  - Table layout (fixed columns, scrolling)
  - Kanban board (8 columns, card styling)
  - Charts (containers, legends, tooltips)
  - Modals (overlay, form controls)
  - Filters (collapsible section)
  - Action buttons
  - Priority badges (4 colors)
  - Status badges (8 colors)
  - Spinner overlay

**Pattern:** Use VS Code CSS variables (`var(--vscode-*)`)

#### Step 7.2: Create Data Helpers
**File:** `src/webviews/userStoryDev/helpers/devDataHelper.js`

**Tasks:**
- [ ] Export `formatDate(dateString)` - Format YYYY-MM-DD
- [ ] Export `formatStoryPoints(points)` - Display with label
- [ ] Export `getPriorityColor(priority)` - Return CSS color
- [ ] Export `getStatusColor(status)` - Return CSS color
- [ ] Export `truncateText(text, maxLength)` - Truncate with ellipsis

#### Step 7.3: Create Config Loader Helper
**File:** `src/webviews/userStoryDev/helpers/configLoader.js`

**Tasks:**
- [ ] Export `getDeveloperList(config)` - Extract developers
- [ ] Export `getSprintList(config)` - Extract sprints
- [ ] Export `getActiveSprint(config)` - Find active sprint
- [ ] Export `getForecastConfig(config)` - Extract forecast settings

#### Step 7.4: Error Handling & Loading States

**Tasks:**
- [ ] Add try-catch blocks to all async operations
- [ ] Show spinner during data loading
- [ ] Show error messages for failed operations
- [ ] Add empty state messages ("No stories found")
- [ ] Add validation messages

#### Step 7.5: CSV Export

**Tasks:**
- [ ] Implement details tab CSV export (all columns)
- [ ] Implement forecast CSV export (timeline data)
- [ ] Use VS Code save dialog API

#### Step 7.6: Testing

**Tasks:**
- [ ] Test with empty data
- [ ] Test with large datasets (100+ stories)
- [ ] Test all CRUD operations (create, edit, delete)
- [ ] Test all filters and sorting
- [ ] Test drag-and-drop on board
- [ ] Test all charts render correctly
- [ ] Test sprint management
- [ ] Test forecast calculation
- [ ] Test bulk operations
- [ ] Test modal interactions
- [ ] Test data persistence (save/load)

---

## File Size Estimates

Based on Report Detail View pattern:

| File | Est. Lines | Purpose |
|------|------------|---------|
| `userStoriesDevCommands.ts` | ~800 | Extension command handler |
| `userStoryDevView.js` | ~500 | Main webview orchestrator |
| `detailsTabTemplate.js` | ~300 | Details tab HTML |
| `analysisTabTemplate.js` | ~250 | Analysis tab HTML |
| `boardTabTemplate.js` | ~200 | Kanban board HTML |
| `sprintTabTemplate.js` | ~250 | Sprint tab HTML |
| `forecastTabTemplate.js` | ~200 | Forecast tab HTML |
| `storyDetailModalTemplate.js` | ~200 | Story detail modal |
| `sprintModalTemplate.js` | ~150 | Sprint modal |
| `clientScriptTemplate.js` | ~600 | Event handlers & logic |
| `devStatusManagement.js` | ~150 | Status functions |
| `priorityManagement.js` | ~100 | Priority functions |
| `storyPointsManagement.js` | ~100 | Story points functions |
| `assignmentManagement.js` | ~100 | Assignment functions |
| `sprintManagement.js` | ~150 | Sprint CRUD |
| `forecastFunctions.js` | ~400 | Forecast calculation & Gantt |
| `kanbanFunctions.js` | ~200 | Board drag-drop |
| `chartFunctions.js` | ~400 | D3.js charts (4 types) |
| `filterFunctions.js` | ~150 | Filter logic |
| `modalFunctionality.js` | ~200 | Modal open/close/save |
| `domInitialization.js` | ~150 | Event setup |
| `uiEventHandlers.js` | ~150 | UI event handlers |
| `devDataHelper.js` | ~100 | Format/display helpers |
| `velocityCalculator.js` | ~80 | Velocity metrics |
| `cycleTimeCalculator.js` | ~60 | Cycle time metrics |
| `configLoader.js` | ~80 | Config utilities |
| `devViewStyles.js` | ~400 | All CSS |
| **TOTAL** | **~5,920** | |

---

## Key Dependencies

### TypeScript/Node.js (Extension Side)
- `vscode` - VS Code API
- `fs` - File system operations
- `path` - Path utilities
- Existing `ModelService` class

### JavaScript (Webview Side)
- `d3` - Charts (already included for QA view)
- VS Code Webview API
- Codicons (already included)

---

## Data Flow

```
User Action (Webview)
    ↓
vscode.postMessage({ command: '...', data: {...} })
    ↓
Extension Message Handler (userStoriesDevCommands.ts)
    ↓
Update Files:
    - app-dna-user-story-dev.json (user's workspace)
    - app-dna-user-story-dev-config.json (user's workspace)
    ↓
panel.webview.postMessage({ command: '...', data: {...} })
    ↓
Webview Message Handler (userStoryDevView.js)
    ↓
Update UI
```

---

## Next Steps

1. **Start with Phase 1** - Foundation (command registration, basic panel)
2. **Test incrementally** - After each phase, test functionality
3. **Reuse existing code** - Copy patterns from QA view and Report view
4. **Follow architecture** - Reference `user-story-dev-view-architecture.md`

---

## Notes

- **Do not create data files** - Users create `app-dna-user-story-dev.json` and `app-dna-user-story-dev-config.json` in their workspace
- **Bundle with webpack** - Extension uses webpack for production builds
- **Use CommonJS** - Webview scripts use `module.exports` pattern (see Report view)
- **VS Code API** - Only accessible from extension side, not webview
- **Message passing** - Only communication method between extension and webview

---

**Document Status:** Ready for Implementation  
**Next Action:** Begin Phase 1, Step 1.1 - Create `userStoriesDevCommands.ts`
