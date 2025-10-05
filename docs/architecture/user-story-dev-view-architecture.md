# User Story Development View - Architecture Document

**Date:** October 5, 2025  
**Status:** Planning / Design  
**Reference Architecture:** Report Detail View (modular structure)

---

## Executive Summary

The User Story Development View will track development progress for user stories, following the **modular architecture pattern** demonstrated by the Report Detail View, NOT the tab structure of Report Details.

**Key Clarifications:**
- ✅ Use Report Detail View's **file structure pattern** (modular organization)
- ❌ Do NOT use Report Detail View's **tab content** (Settings/Columns/Buttons/Params)
- ✅ Dev View has its own tabs: Details, Analysis, Board, Sprint, Forecast
- ✅ Separate configuration file for dev-specific settings
- ✅ No automatic QA view updates

---

## File Structure (Following Report View Pattern)

```
src/webviews/userStoryDev/
├── userStoryDevView.js (~500 lines) - Main orchestrator
│   ├── Panel lifecycle management
│   ├── Message passing coordination
│   ├── Data loading from model + dev file
│   └── Save operations
│
├── components/
│   ├── devViewGenerator.js (~100 lines)
│   │   └── Orchestrates HTML generation from templates
│   │
│   ├── scripts/
│   │   ├── devStatusManagement.js
│   │   │   ├── handleDevStatusChange()
│   │   │   ├── handleBulkStatusUpdate()
│   │   │   └── validateStatusTransition()
│   │   │
│   │   ├── priorityManagement.js
│   │   │   ├── handlePriorityChange()
│   │   │   ├── handleBulkPriorityUpdate()
│   │   │   └── sortByPriority()
│   │   │
│   │   ├── storyPointsManagement.js
│   │   │   ├── handleStoryPointsChange()
│   │   │   ├── calculateTotalPoints()
│   │   │   └── calculateVelocity()
│   │   │
│   │   ├── assignmentManagement.js
│   │   │   ├── handleDeveloperAssignment()
│   │   │   ├── getAvailableDevelopers()
│   │   │   └── handleBulkAssignment()
│   │   │
│   │   ├── sprintManagement.js
│   │   │   ├── createSprint()
│   │   │   ├── editSprint()
│   │   │   ├── deleteSprint()
│   │   │   ├── assignStoriesToSprint()
│   │   │   └── calculateSprintMetrics()
│   │   │
│   │   ├── forecastFunctions.js
│   │   │   ├── calculateDevForecast()
│   │   │   ├── renderForecastGanttChart()
│   │   │   ├── getNextWorkingTime()
│   │   │   ├── addWorkingHours()
│   │   │   ├── updateForecastSummary()
│   │   │   └── exportForecastCSV()
│   │   │
│   │   ├── kanbanFunctions.js
│   │   │   ├── renderKanbanBoard()
│   │   │   ├── handleDragStart()
│   │   │   ├── handleDrop()
│   │   │   └── createKanbanCard()
│   │   │
│   │   ├── chartFunctions.js
│   │   │   ├── renderStatusDistribution()
│   │   │   ├── renderVelocityChart()
│   │   │   ├── renderBurndownChart()
│   │   │   └── renderCycleTimeChart()
│   │   │
│   │   ├── filterFunctions.js
│   │   │   ├── applyFilters()
│   │   │   ├── clearFilters()
│   │   │   └── getFilteredItems()
│   │   │
│   │   ├── modalFunctionality.js
│   │   │   ├── openStoryDetailModal()
│   │   │   ├── closeStoryDetailModal()
│   │   │   ├── saveStoryDetails()
│   │   │   ├── openSprintModal()
│   │   │   ├── saveSprintConfig()
│   │   │   ├── openForecastConfigModal()
│   │   │   └── saveForecastConfig()
│   │   │
│   │   ├── domInitialization.js
│   │   │   ├── initializeEventListeners()
│   │   │   ├── setupTabSwitching()
│   │   │   ├── setupFilterListeners()
│   │   │   └── setupBulkActionListeners()
│   │   │
│   │   └── uiEventHandlers.js
│   │       ├── handleRowClick()
│   │       ├── handleCheckboxChange()
│   │       ├── handleRefresh()
│   │       └── handleExport()
│   │
│   └── templates/
│       ├── mainTemplate.js (~400 lines)
│       │   └── Overall HTML structure with 4 tabs
│       │
│       ├── detailsTabTemplate.js (~300 lines)
│       │   ├── Filter section
│       │   ├── Bulk actions toolbar
│       │   ├── Development tracking table
│       │   └── Record info footer
│       │
│       ├── analysisTabTemplate.js (~250 lines)
│       │   ├── Summary statistics
│       │   ├── Chart type toggle
│       │   ├── Chart container
│       │   └── Chart controls
│       │
│       ├── boardTabTemplate.js (~200 lines)
│       │   ├── 8-column Kanban board
│       │   ├── Board filters
│       │   └── Card containers
│       │
│       ├── sprintTabTemplate.js (~250 lines)
│       │   ├── Sprint list/selector
│       │   ├── Sprint configuration panel
│       │   ├── Sprint metrics
│       │   └── Burndown chart container
│       │
│       ├── forecastTabTemplate.js (~200 lines)
│       │   ├── Forecast action buttons
│       │   ├── Forecast summary stats
│       │   ├── Gantt chart container
│       │   └── Forecast configuration modal
│       │
│       ├── storyDetailModalTemplate.js (~200 lines)
│       │   ├── Story information
│       │   ├── Dev status controls
│       │   ├── Assignment controls
│       │   ├── Page mapping display
│       │   └── Modal actions
│       │
│       ├── sprintModalTemplate.js (~150 lines)
│       │   ├── Sprint configuration form
│       │   ├── Date range picker
│       │   ├── Capacity settings
│       │   └── Story assignment
│       │
│       └── clientScriptTemplate.js (~600 lines)
│           ├── Message handlers
│           ├── Tab switching logic
│           ├── Filter/sort handlers
│           ├── Drag-drop handlers
│           └── Save functions
│
├── helpers/
│   ├── devDataHelper.js (~100 lines)
│   │   ├── formatDate()
│   │   ├── formatStoryPoints()
│   │   ├── getPriorityColor()
│   │   └── getStatusColor()
│   │
│   ├── velocityCalculator.js (~80 lines)
│   │   ├── calculateSprintVelocity()
│   │   ├── calculateAverageVelocity()
│   │   └── predictCompletionDate()
│   │
│   ├── cycleTimeCalculator.js (~60 lines)
│   │   ├── calculateCycleTime()
│   │   ├── getAverageCycleTime()
│   │   └── getCycleTimeByPriority()
│   │
│   └── configLoader.js (~80 lines)
│       ├── loadDevConfig()
│       ├── saveDevConfig()
│       ├── getDeveloperList()
│       └── getSprintList()
│
└── styles/
    └── devViewStyles.js (~500 lines)
        ├── Base styles
        ├── Tab styles
        ├── Table styles
        ├── Kanban styles
        ├── Chart styles
        └── Modal styles
```

**Total Estimated Lines:** ~4,000 lines across ~30 files  
**Average File Size:** ~130 lines per file  
**Maximum File Size:** ~600 lines (clientScriptTemplate.js)

---

## Data Files

### **1. Development Tracking Data**
**File:** `app-dna-user-story-dev.json`

```json
{
  "devData": [
    {
      "storyId": "US001",
      "devStatus": "in-progress",
      "priority": "high",
      "storyPoints": "5",
      "assignedTo": "Developer 1",
      "sprint": "Sprint 3",
      "startDate": "2025-10-01",
      "estimatedEndDate": "2025-10-05",
      "actualEndDate": "",
      "blockedReason": "",
      "devNotes": "Working on page integration"
    }
  ]
}
```

**Fields:**
- `storyId` - Reference to story in main model (e.g., "US001")
- `devStatus` - One of 8 status values
- `priority` - "low" | "medium" | "high" | "critical"
- `storyPoints` - "?" | "1" | "2" | "3" | "5" | "8" | "13" | "21" (Fibonacci)
- `assignedTo` - Developer name from config
- `sprint` - Sprint name from config
- `startDate` - When development started (YYYY-MM-DD)
- `estimatedEndDate` - Estimated completion (YYYY-MM-DD)
- `actualEndDate` - Actual completion (YYYY-MM-DD, set when status = "completed")
- `blockedReason` - Optional text (NOT required even when blocked)
- `devNotes` - Developer notes

### **2. Development Configuration**
**File:** `app-dna-user-story-dev-config.json`

```json
{
  "developers": [
    {
      "id": "dev1",
      "name": "Developer 1",
      "email": "dev1@example.com",
      "active": true
    },
    {
      "id": "dev2",
      "name": "Developer 2",
      "email": "dev2@example.com",
      "active": true
    }
  ],
  "sprints": [
    {
      "sprintId": "sprint1",
      "sprintNumber": 1,
      "sprintName": "Sprint 1",
      "startDate": "2025-09-15",
      "endDate": "2025-09-28",
      "capacity": 40,
      "committedPoints": 35,
      "active": false
    },
    {
      "sprintId": "sprint2",
      "sprintNumber": 2,
      "sprintName": "Sprint 2",
      "startDate": "2025-09-29",
      "endDate": "2025-10-12",
      "capacity": 40,
      "committedPoints": 38,
      "active": true
    }
  ],
  "forecastConfig": {
    "hoursPerPoint": 4,
    "defaultStoryPoints": 1,
    "workingHours": {
      "0": { "enabled": false },
      "1": { "enabled": true, "startHour": 9, "endHour": 17 },
      "2": { "enabled": true, "startHour": 9, "endHour": 17 },
      "3": { "enabled": true, "startHour": 9, "endHour": 17 },
      "4": { "enabled": true, "startHour": 9, "endHour": 17 },
      "5": { "enabled": true, "startHour": 9, "endHour": 17 },
      "6": { "enabled": false }
    }
  },
  "settings": {
    "defaultSprintLength": 14,
    "defaultCapacity": 40,
    "storyPointScale": "fibonacci",
    "trackCycleTime": true
  }
}
```

**Separation Benefits:**
- ✅ Config changes don't affect dev data
- ✅ Can version control separately
- ✅ Easy to backup/restore
- ✅ Clear ownership (config = admin, data = developers)

---

## Status Workflow

### **8 Development Statuses:**

```javascript
const DEV_STATUSES = [
    { 
        value: 'on-hold', 
        label: 'On Hold', 
        color: '#858585',
        description: 'Story is paused'
    },
    { 
        value: 'ready-for-dev', 
        label: 'Ready for Development', 
        color: '#0078d4',
        description: 'Story is ready to start'
    },
    { 
        value: 'in-progress', 
        label: 'In Progress', 
        color: '#f39c12',
        description: 'Actively being developed'
    },
    { 
        value: 'blocked', 
        label: 'Blocked', 
        color: '#d73a49',
        description: 'Story is blocked (reason optional)'
    },
    { 
        value: 'completed', 
        label: 'Completed', 
        color: '#28a745',
        description: 'Development complete'
    },
    { 
        value: 'ready-for-dev-env', 
        label: 'Ready for Dev Env Deployment', 
        color: '#17a2b8',
        description: 'Ready to deploy to dev environment'
    },
    { 
        value: 'deployed-to-dev', 
        label: 'Deployed to Dev Env', 
        color: '#6f42c1',
        description: 'Deployed and running in dev'
    },
    { 
        value: 'ready-for-qa', 
        label: 'Ready for QA', 
        color: '#20c997',
        description: 'Ready for QA testing'
    }
];
```

### **Status Transitions:**

```
┌─────────────┐
│  On Hold    │◄─────────────┐
└──────┬──────┘              │
       │                     │
       ▼                     │
┌─────────────┐              │
│Ready for Dev│              │
└──────┬──────┘              │
       │                     │
       ▼                     │
┌─────────────┐    ┌─────────┴────┐
│ In Progress │───►│   Blocked    │
└──────┬──────┘    └──────────────┘
       │
       ▼
┌─────────────┐
│  Completed  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Ready for Dev│
│Env Deploy   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Deployed to  │
│   Dev Env   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Ready for QA │ (Does NOT auto-update QA view)
└─────────────┘
```

**Key Rules:**
- ⚠️ Status = "blocked" → blockedReason is OPTIONAL (not required)
- ⚠️ Status = "ready-for-qa" → Does NOT automatically update QA view
- ✅ Status = "completed" → Sets actualEndDate automatically
- ✅ Status = "in-progress" → Sets startDate if empty

---

## Story Points Configuration

### **Fibonacci Scale with Unknown:**

```javascript
const STORY_POINTS_OPTIONS = [
    { value: '?', label: '? (Unknown)', description: 'Story not yet estimated' },
    { value: '1', label: '1 point', description: 'Trivial task' },
    { value: '2', label: '2 points', description: 'Simple task' },
    { value: '3', label: '3 points', description: 'Small task' },
    { value: '5', label: '5 points', description: 'Medium task' },
    { value: '8', label: '8 points', description: 'Large task' },
    { value: '13', label: '13 points', description: 'Very large task' },
    { value: '21', label: '21 points', description: 'Epic (should split)' }
];
```

**Rendering:**
```html
<select class="story-points-select">
    <option value="?">? (Unknown)</option>
    <option value="1">1 point</option>
    <option value="2">2 points</option>
    <option value="3">3 points</option>
    <option value="5">5 points</option>
    <option value="8">8 points</option>
    <option value="13">13 points</option>
    <option value="21">21 points</option>
</select>
```

**Calculations:**
- Stories with "?" are excluded from velocity calculations
- Stories with "?" are marked in reports/charts
- Velocity = Sum of completed story points / number of sprints

---

## Tab Designs

### **Tab 1: Details (Development Tracking)**

**Table Columns:**
1. ☑️ Select
2. 🔢 Story Number
3. 📝 Story Text
4. 🎯 Priority (dropdown)
5. 📊 Story Points (dropdown with Fibonacci + ?)
6. 👤 Assigned To (dropdown from config)
7. 🚦 Dev Status (dropdown, 8 values)
8. 🏃 Sprint (dropdown from config)
9. 📅 Start Date
10. 📅 Est. End Date
11. 📅 Actual End Date
12. 🚫 Blocked Reason (optional textarea)
13. 📝 Dev Notes

**Filters:**
- Story Number (text)
- Story Text (text)
- Priority (dropdown)
- Dev Status (dropdown)
- Assigned To (dropdown)
- Sprint (dropdown)

**Bulk Actions:**
- Update Status
- Set Priority
- Assign Developer
- Assign Sprint
- Set Story Points

---

### **Tab 2: Analysis (Metrics & Charts)**

**Summary Stats:**
- 📊 Total Stories: 45
- ✅ Completed: 28
- 🏃 In Progress: 8
- 🚫 Blocked: 2
- 📈 Average Velocity: 32 pts/sprint
- ⏱️ Average Cycle Time: 5.2 days

**Charts:**
1. **Status Distribution** (bar/pie) - Like QA view
2. **Velocity Chart** (line chart) - Points per sprint over time
3. **Burndown Chart** (line chart) - Current sprint remaining points
4. **Cycle Time Distribution** (histogram) - Distribution of completion times
5. **Priority Distribution** (pie chart) - Stories by priority

---

### **Tab 3: Board (8-Column Kanban)**

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ On Hold  │ Ready    │   In     │ Blocked  │Completed │ Ready    │ Deployed │ Ready    │
│          │ for Dev  │ Progress │          │          │ for Dev  │ to Dev   │ for QA   │
│          │          │          │          │          │ Env      │ Env      │          │
│ (0)      │ (5)      │ (8)      │ (2)      │ (28)     │ (1)      │ (0)      │ (1)      │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│          │          │          │          │          │          │          │          │
│          │ [Card]   │ [Card]   │ [Card]   │ [Card]   │ [Card]   │          │ [Card]   │
│          │ US-001   │ US-003   │ US-005   │ US-002   │ US-004   │          │ US-006   │
│          │ ⚡High   │ 🔶Medium │ 🔴Blocked│ ✅Done   │ 🚀Deploy │          │ 🧪Test   │
│          │ 5 pts    │ 8 pts    │ 3 pts    │ 5 pts    │ 13 pts   │          │ 5 pts    │
│          │ Dev1     │ Dev2     │ Dev1     │ Dev2     │ Dev1     │          │ Dev2     │
│          │          │          │          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Card Features:**
- Priority badge (colored)
- Story points badge
- Developer initials/avatar
- Drag-and-drop
- Click to open detail modal
- Visual blocked indicator

**Note:** Status change to "ready-for-qa" does NOT update QA view

---

### **Tab 4: Sprint (Sprint Planning & Burndown)**

**Sub-tabs within Sprint Tab:**
1. Planning - Sprint configuration and story assignment
2. Burndown - Sprint burndown chart

---

#### **Sub-tab 4.1: Planning**

**Sprint Selector:**
```
┌─────────────────────────────────────────┐
│ Active Sprint: Sprint 2 (Oct 1-14)     │▼│
└─────────────────────────────────────────┘
[+ New Sprint] [⚙ Configure] [📊 Metrics]
```

**Sprint Configuration Panel:**
```
┌─────────────────────────────────────────┐
│ Sprint Configuration                    │
├─────────────────────────────────────────┤
│ Sprint Name: [Sprint 2.............]   │
│ Start Date:  [2025-10-01] 📅           │
│ End Date:    [2025-10-14] 📅           │
│ Capacity:    [40] points               │
│ Committed:   35 points                  │
│ Remaining:   22 points                  │
│ Team:        [Developer 1, Developer 2] │
│                                         │
│ [Save] [Cancel]                         │
└─────────────────────────────────────────┘
```

**Sprint Metrics:**
- 📊 Total Stories: 12
- 📈 Committed Points: 35
- ⏱️ Completed Points: 13
- 📉 Remaining Points: 22
- 🎯 On Track: Yes/No
- 📅 Days Remaining: 9

**Story Assignment to Sprint:**
- Drag stories from backlog
- Assign via modal
- Bulk assign selected stories

---

#### **Sub-tab 4.2: Burndown**

**Sprint Burndown Chart:**
```
Points
 40│    ●───Ideal
   │    │╲
 30│    │ ╲
   │    │  ●───Actual
 20│    │   ╲
   │    │    ●
 10│    │     ╲
   │    │      ●
  0│────┴───────●────
   Day 1  5   10  14
```

**Burndown Features:**
- Ideal burndown line (gray dashed)
- Actual burndown line (blue solid)
- On-track indicator
- Scope change markers (if stories added/removed)
- Interactive tooltips showing:
  - Date
  - Points remaining
  - Points completed that day
  - Stories completed

---

### **Tab 5: Forecast (Development Gantt Chart)**

**Purpose:** Visual timeline of story development similar to QA forecast tab

**Action Buttons:**
- [⚙ Configure Forecast] - Set work schedule and parameters
- [🔄 Refresh] - Recalculate timeline
- [📥 Export CSV] - Export timeline data

**Forecast Configuration Modal:**
```
┌─────────────────────────────────────────┐
│ Development Timeline Configuration      │
├─────────────────────────────────────────┤
│ Hours per Story Point:                  │
│ [4.0] hours/point (default: 4)          │
│                                         │
│ Default Story Points: 1 (fixed)         │
│ (Applied to stories with no estimate)   │
│                                         │
│ Developer Capacity:                     │
│ [2] developers                          │
│                                         │
│ Working Hours (per day):                │
│ ┌─────────┬─────┬────────┬────────┬────┤
│ │ Day     │ On  │ Start  │ End    │Hrs │
│ ├─────────┼─────┼────────┼────────┼────┤
│ │ Monday  │ ☑   │ 09:00  │ 17:00  │ 8  │
│ │ Tuesday │ ☑   │ 09:00  │ 17:00  │ 8  │
│ │ Wed     │ ☑   │ 09:00  │ 17:00  │ 8  │
│ │ Thursday│ ☑   │ 09:00  │ 17:00  │ 8  │
│ │ Friday  │ ☑   │ 09:00  │ 17:00  │ 8  │
│ │ Saturday│ ☐   │ 09:00  │ 17:00  │ 0  │
│ │ Sunday  │ ☐   │ 09:00  │ 17:00  │ 0  │
│ └─────────┴─────┴────────┴────────┴────┘
│                                         │
│ Working Days: 5 | Hours/Week: 40        │
│ Daily Capacity: 8 hrs                   │
│ Stories per Day: ~2.0                   │
│                                         │
│ [Save] [Cancel]                         │
└─────────────────────────────────────────┘
```

**Forecast Summary Stats:**
```
┌─────────────────────────────────────────┐
│ Development Forecast Summary            │
├─────────────────────────────────────────┤
│ 🎯 Stories to Develop: 15               │
│ 📊 Total Story Points: 62               │
│ ⏱️ Estimated Dev Time: 248 hours       │
│ 📅 Estimated Completion: Oct 28, 2025   │
│ 👥 Developer Utilization: 85%          │
└─────────────────────────────────────────┘
```

**Development Forecast Gantt Chart** (D3.js, hour-by-hour like QA):

Visual similar to QA forecast but for development:

```
Story  │ Oct 1 ────────┬────── Oct 2 ────────┬────── Oct 3 ────────┐
Number │ 09 10 11 12 13 14 15 16 17│09 10 11 12 13 14 15 16 17│...
───────┼──────────────────────────────────────────────────────────
US-001 │ [D1═══════════════════════]                              │
       │                            │                             │
US-002 │ [D2════════════════════════════════════════════]         │
       │                            │                             │
US-003 │                            │ [D1════════════════════]    │
       │                            │                             │
US-004 │                            │        [D2═══════════════...│
       │                            │                             │
```

**Gantt Chart Features:**

1. **Story Selection Logic:**
   - **Included:** Stories in active development only:
     - `on-hold` - Story is paused
     - `ready-for-dev` - Story is ready to start
     - `in-progress` - Actively being developed
     - `blocked` - Story is blocked (reason optional)
   - **Excluded:** Completed, deployed, and QA-ready stories (no longer in development)
   - **Grouping:**
     - Group 1: Stories with sprint assigned (shown first)
       - Sorted by sprint start date, then story number
     - Group 2: Stories without sprint (shown after)
       - Sorted by story number
   - **Default Story Points:** Stories with no estimate default to 1 point
   - **Hours Calculation:** Story points × hours per point (default 4 hours)

2. **Time Scale:**
   - Hour-by-hour precision (like QA view)
   - Day headers showing date
   - Hour markers (00-23)
   - Vertical grid lines per hour
   - Current time marker (orange vertical line)

3. **Story Bars:**
   - Color-coded by developer
   - Show story number in bar
   - Width = estimated time based on story points × hours per point
   - Developer initial/avatar on bar (D1, D2, etc.)
   - Sprint identifier badge (for stories in sprints)

4. **Visual Indicators:**
   - Non-working hours (shaded background)
   - Weekend days (darker shade)
   - Current sprint boundary (highlighted region)
   - Visual separator between sprinted and non-sprinted stories

5. **Interactive Features:**
   - Hover tooltip shows:
     - Story number & text
     - Story points
     - Sprint (if assigned)
     - Estimated dev time
     - Assigned developer
     - Start date/time
     - End date/time
     - Priority badge
   - Click story bar to open detail modal
   - Zoom controls (day/week/month view)
   - Horizontal scroll for long timelines

6. **Filtering:**
   - Filter by sprint
   - Filter by developer
   - Filter by priority
   - Show only specific statuses

**Forecast Calculation Algorithm:**

```javascript
// Development forecast calculation
function calculateDevForecast(stories, config) {
    // 1. Get stories that are NOT ready-for-qa
    const devStories = stories.filter(s => 
        s.devStatus !== 'ready-for-qa' &&
        s.storyPoints !== '?' &&
        !s.isIgnored
    );
    
    // 2. Group and sort stories
    // Group 1: Stories with sprint (sorted by sprint start date, then story number)
    const withSprint = devStories
        .filter(s => s.sprintId)
        .sort((a, b) => {
            const sprintA = config.sprints.find(sp => sp.id === a.sprintId);
            const sprintB = config.sprints.find(sp => sp.id === b.sprintId);
            const dateCompare = new Date(sprintA.startDate) - new Date(sprintB.startDate);
            if (dateCompare !== 0) return dateCompare;
            return parseInt(a.storyNumber) - parseInt(b.storyNumber);
        });
    
    // Group 2: Stories without sprint (sorted by story number)
    const withoutSprint = devStories
        .filter(s => !s.sprintId)
        .sort((a, b) => parseInt(a.storyNumber) - parseInt(b.storyNumber));
    
    // Combine: sprinted stories first, then non-sprinted
    const sortedStories = [...withSprint, ...withoutSprint];
    
    // 3. Initialize developers with current time
    const developers = [];
    for (let i = 0; i < config.devCapacity; i++) {
        developers.push({
            index: i,
            name: config.developers[i]?.name || `Developer ${i + 1}`,
            availableAt: new Date()
        });
    }
    
    // 4. Schedule each story
    const timeline = [];
    sortedStories.forEach(story => {
        // Find earliest available developer
        developers.sort((a, b) => a.availableAt - b.availableAt);
        const dev = developers[0];
        
        // Calculate start (next working time after dev available)
        const startDate = getNextWorkingTime(dev.availableAt, config.workingHours);
        
        // Calculate end (add story points * hours per point of working time)
        // Default to 1 story point if not set
        const storyPoints = parseInt(story.storyPoints) || 1;
        const hoursPerPoint = config.hoursPerPoint || 4; // Default 4 hours
        const storyHours = storyPoints * hoursPerPoint;
        const endDate = addWorkingHours(startDate, storyHours, config.workingHours);
        
        timeline.push({
            storyId: story.storyId,
            storyNumber: story.storyNumber,
            storyText: story.storyText,
            storyPoints: storyPoints,
            priority: story.priority,
            sprintId: story.sprintId || null,
            developer: dev.name,
            developerIndex: dev.index,
            startDate: startDate,
            endDate: endDate,
            durationHours: storyHours
        });
        
        // Update developer availability
        dev.availableAt = new Date(endDate);
    });
    
    return timeline;
}
```

**Forecast CSV Export Format:**
```csv
Story Number,Story Text,Priority,Story Points,Developer,Start Date,End Date,Duration (hours)
US-001,User login page,high,5,Developer 1,2025-10-01 09:00,2025-10-02 13:00,20
US-002,Dashboard report,medium,8,Developer 2,2025-10-01 09:00,2025-10-03 11:00,32
...
```

---

## Key Differences from Report Detail View

| Aspect | Report Detail View | User Story Dev View |
|--------|-------------------|---------------------|
| **File Structure** | ✅ Use as pattern | ✅ Follow modular pattern |
| **Tab Content** | Settings/Columns/Buttons/Params | Details/Analysis/Board/Sprint/Forecast |
| **Data Source** | Single report object | Stories + dev data + config |
| **Configuration** | Part of schema | Separate config file |
| **Modals** | Column/Button/Param editing | Story/Sprint/Forecast config |
| **Charts** | None | Status, Velocity, Burndown, Gantt |
| **Drag-Drop** | None | Kanban board |

**Key Takeaway:** Use Report View's **architecture pattern** but with **completely different content**

---

## Message Passing API

### **Extension → Webview**

```javascript
// Load initial data
{
    command: 'setDevData',
    data: {
        items: [...],
        totalRecords: 45,
        sortColumn: 'storyNumber',
        sortDescending: false
    }
}

// Load configuration
{
    command: 'setDevConfig',
    config: {
        developers: [...],
        sprints: [...],
        settings: {...}
    }
}

// Save confirmation
{
    command: 'devChangeSaved',
    success: true
}

// Sprint saved
{
    command: 'sprintSaved',
    success: true,
    sprint: {...}
}

// Forecast config saved
{
    command: 'forecastConfigSaved',
    success: true,
    config: {...}
}
```

### **Webview → Extension**

```javascript
// Save dev change
{
    command: 'saveDevChange',
    data: {
        storyId: 'US001',
        devStatus: 'in-progress',
        priority: 'high',
        storyPoints: '5',
        assignedTo: 'Developer 1',
        sprint: 'Sprint 2',
        startDate: '2025-10-01',
        estimatedEndDate: '2025-10-05',
        actualEndDate: '',
        blockedReason: '',
        devNotes: '...'
    }
}

// Bulk update
{
    command: 'bulkUpdateDevStatus',
    data: {
        storyIds: ['US001', 'US002'],
        devStatus: 'ready-for-dev'
    }
}

// Save sprint
{
    command: 'saveSprint',
    sprint: {
        sprintId: 'sprint2',
        sprintName: 'Sprint 2',
        startDate: '2025-10-01',
        endDate: '2025-10-14',
        capacity: 40
    }
}

// Save forecast config
{
    command: 'saveForecastConfig',
    config: {
        hoursPerPoint: 4,
        defaultStoryPoints: 1,
        workingHours: {...}
    }
}

// Request refresh
{
    command: 'refresh'
}
```

---

## Implementation Phases

### **Phase 1: Foundation** (2-3 days)
- [ ] Create file structure (directories + empty files)
- [ ] Implement main orchestrator (userStoryDevView.js)
- [ ] Create data file structure (dev.json + config.json)
- [ ] Implement config loader helper
- [ ] Basic message passing

### **Phase 2: Details Tab** (2-3 days)
- [ ] Details tab template
- [ ] Table rendering with 13 columns
- [ ] Filtering system
- [ ] Sorting system
- [ ] Bulk actions
- [ ] Save operations

### **Phase 3: Kanban Board** (2 days)
- [ ] Board tab template
- [ ] 8-column layout
- [ ] Card rendering
- [ ] Drag-and-drop
- [ ] Story detail modal

### **Phase 4: Charts & Analysis** (2-3 days)
- [ ] Analysis tab template
- [ ] Status distribution chart (reuse from QA)
- [ ] Velocity chart (new)
- [ ] Cycle time histogram (new)

### **Phase 5: Sprint Management** (2 days)
- [ ] Sprint tab template
- [ ] Sprint CRUD operations
- [ ] Sprint configuration panel
- [ ] Sprint burndown chart
- [ ] Story assignment to sprints

### **Phase 6: Forecast Tab** (2-3 days)
- [ ] Forecast tab template
- [ ] Forecast configuration modal
- [ ] Forecast calculation algorithm
- [ ] D3.js Gantt chart rendering
- [ ] Forecast summary stats
- [ ] CSV export

### **Phase 7: Polish & Testing** (1-2 days)
- [ ] Styles refinement
- [ ] Error handling
- [ ] Loading states
- [ ] CSV export
- [ ] Testing

**Total: 13-18 days**

---

## Configuration Management

### **Developer Management:**

```javascript
// Add developer (via Sprint tab config button)
function addDeveloper(name, email) {
    vscode.postMessage({
        command: 'addDeveloper',
        developer: { name, email, active: true }
    });
}

// Developer list is in config file
// NOT in main model
```

### **Sprint Management:**

```javascript
// Create sprint (via Sprint tab)
function createSprint(sprintData) {
    vscode.postMessage({
        command: 'createSprint',
        sprint: {
            sprintNumber: nextNumber,
            sprintName: sprintData.name,
            startDate: sprintData.startDate,
            endDate: sprintData.endDate,
            capacity: sprintData.capacity,
            active: true
        }
    });
}
```

---

## No Automatic QA Integration

**Important:** Status change to "ready-for-qa" does NOT:
- ❌ Update QA view automatically
- ❌ Set QA status to "ready-to-test"
- ❌ Create QA record

**Why?**
- Separation of concerns
- Dev and QA are different workflows
- QA team controls QA view
- Manual handoff preserves control

**Manual Process:**
1. Developer sets status to "ready-for-qa"
2. QA team sees story in Dev view (can filter)
3. QA team manually updates QA view when ready to test
4. This preserves QA team's workflow control

---

## Summary

### **Architecture Pattern:**
✅ Follow Report Detail View's **modular file structure**  
❌ Do NOT copy Report Detail View's **tab content**

### **Key Files:**
- `app-dna-user-story-dev.json` - Development tracking data
- `app-dna-user-story-dev-config.json` - Developers + Sprints + Settings

### **Key Features:**
- 5 tabs: Details, Analysis, Board, Sprint, Forecast
- 8 development statuses
- Fibonacci story points + "?" for unknown
- Blocked reason is OPTIONAL
- No automatic QA view updates
- Sprint management with burndown tracking
- Development forecast Gantt chart (separate tab)
- Velocity and cycle time tracking

### **Estimated Effort:**
13-18 days for complete implementation

---

**Document Version:** 1.0  
**Status:** Ready for Review  
**Next Steps:**
1. Review and approve architecture
2. Create initial file structure
3. Begin Phase 1 implementation
