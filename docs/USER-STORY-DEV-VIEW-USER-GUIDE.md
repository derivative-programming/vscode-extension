# User Story Dev View - User Guide

**Version**: 1.0  
**Last Updated**: October 5, 2025

A comprehensive guide to using the User Story Development Tracking feature in the AppDNA VS Code extension.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Details Tab](#details-tab)
4. [Analysis Tab](#analysis-tab)
5. [Board Tab](#board-tab)
6. [Sprint Tab](#sprint-tab)
7. [Forecast Tab](#forecast-tab)
8. [Tips & Best Practices](#tips--best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Introduction

The User Story Dev View provides a comprehensive development tracking system for managing user stories, tracking progress, organizing sprints, and forecasting project completion.

### Key Features

- **📋 Details Management**: Table view with full CRUD operations
- **📊 Analytics**: Charts and metrics for progress tracking
- **📌 Kanban Board**: Visual workflow management
- **🏃 Sprint Planning**: Agile sprint organization and burndown tracking
- **📅 Forecast Timeline**: Gantt chart with completion predictions

---

## Getting Started

### Opening the Dev View

1. Open a workspace containing an `app-dna.json` file
2. Open the `app-dna.json` file in the editor
3. Run command: **User Stories: Open Development View**
   - Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Type: "User Stories: Open Development View"
   - Press Enter

### Data Files

The Dev View uses two JSON files in your workspace:

1. **app-dna-user-story-dev.json** - Stores all user story data
2. **app-dna-user-story-dev-config.json** - Stores sprints and settings

These files are created automatically when you first save data.

---

## Details Tab

The Details tab provides a comprehensive table view of all user stories.

### Table Columns

| Column | Description | Editable |
|--------|-------------|----------|
| # | Story number | Yes |
| Priority | Critical/High/Medium/Low | Yes |
| Story | Story description | Yes |
| Acceptance Criteria | Success criteria | Yes |
| Points | Story points (Fibonacci) | Yes |
| Status | Current status | Yes |
| Developer | Assigned developer | Yes |
| Start Date | When work begins | Yes |
| Target Date | Planned completion | Yes |
| Actual End Date | When actually completed | Yes |
| Notes | Additional notes | Yes |
| Sprint | Assigned sprint | Yes |
| Tags | Comma-separated tags | Yes |

### Adding a New Story

1. Click **+ Add Story** button
2. Fill in the story details:
   - **Story Number**: Unique identifier (e.g., US-001)
   - **Priority**: Select from dropdown
   - **Story**: Describe the user story
   - **Acceptance Criteria**: Define success criteria
   - **Story Points**: Use Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) or "?"
   - **Status**: Select current status
   - **Developer**: Assign to team member
   - **Dates**: Set start, target, and completion dates
3. Click **Save**

### Editing a Story

**Method 1: Double-click**
- Double-click any row in the table
- Modal opens with all fields
- Make changes
- Click Save

**Method 2: Edit button**
- Select story checkbox
- Click "Edit Selected" button
- Same as Method 1

### Deleting Stories

**Single delete**:
1. Select story checkbox
2. Click "Delete Selected"
3. Confirm deletion

**Bulk delete**:
1. Select multiple story checkboxes
2. Click "Delete Selected"
3. Confirm bulk deletion

### Filtering

**By Priority**:
- Use "Filter by Priority" dropdown
- Select: All, Critical, High, Medium, Low

**By Status**:
- Use "Filter by Status" dropdown
- Select status to filter

**By Developer**:
- Use "Filter by Developer" dropdown
- Lists all developers in your stories

**By Text Search**:
- Type in search box
- Searches story text, acceptance criteria, and notes
- Real-time filtering

### Sorting

- Click any column header to sort
- First click: Ascending
- Second click: Descending
- Third click: Remove sort

### Bulk Operations

**Bulk Assign Developer**:
1. Select multiple stories
2. Click "Bulk Assign" dropdown
3. Select developer
4. All selected stories assigned

**Bulk Change Status**:
1. Select multiple stories
2. Click "Bulk Status" dropdown
3. Select new status
4. All selected stories updated

---

## Analysis Tab

The Analysis tab provides visual insights and metrics.

### Metrics Cards

Six key metrics displayed at top:

1. **Total Stories**: Total number of stories
2. **Completed**: Stories with status "Done"
3. **In Progress**: Active work items
4. **Blocked**: Stories needing attention
5. **Total Points**: Sum of all story points
6. **Velocity**: Average points per sprint

### Charts

**1. Story Count by Status** (Bar Chart)
- Shows distribution across all statuses
- Helps identify bottlenecks
- Click bars for details

**2. Priority Distribution** (Pie Chart)
- Visual breakdown by priority
- Percentages shown
- Hover for exact counts

**3. Story Points by Priority** (Bar Chart)
- Shows effort distribution
- Helps prioritize sprints
- Compare planned vs actual effort

**4. Velocity Trend** (Line Chart)
- Shows velocity over sprints
- Identifies trends (improving/declining)
- Helps forecast future capacity

**5. Cycle Time Analysis** (Bar Chart)
- Average days from start to completion
- By priority level
- Identifies slow-moving priorities

**6. Story Timeline** (Horizontal Bar Chart)
- Visual timeline of all stories
- Shows start date → target date → actual date
- Red = missed deadline, Green = on time

### Interpreting the Data

**High Blocked Count**: 
- Indicates blockers need resolution
- Check Sprint tab for details

**Declining Velocity**:
- Team capacity may be overextended
- Consider reducing sprint commitments

**Long Cycle Times**:
- Process inefficiencies
- Stories may be too large

---

## Board Tab

The Board tab provides a Kanban-style visual workflow.

### Columns

8 status columns:
1. **To Do** - Not started
2. **In Progress** - Active work
3. **In Review** - Code review or QA
4. **Done** - Completed
5. **Blocked** - Impediments
6. **On Hold** - Temporarily paused
7. **Deferred** - Postponed
8. **Archived** - Historical reference

### Story Cards

Each card shows:
- **Story Number** (e.g., US-001)
- **Priority Badge** (color-coded)
- **Story Text** (truncated)
- **Story Points** (bottom-left)
- **Developer** (bottom-right)
- **Sprint Assignment** (if applicable)

### Drag and Drop

1. **Click and hold** story card
2. **Drag** to different column
3. **Drop** to change status
4. Status automatically updates
5. Changes saved immediately

### Filtering Board

**Filter by Priority**:
- Dropdown shows only selected priority
- Useful for focusing on critical items

**Filter by Developer**:
- Shows only one developer's stories
- Helps individual planning

**Clear Filters**:
- Click "Clear All Filters" button
- Returns to full view

### Adding Stories from Board

1. Click **+ Add Story** in any column
2. Modal opens with status pre-filled
3. Fill in story details
4. Click Save
5. Story appears in that column

---

## Sprint Tab

The Sprint tab manages agile sprint planning and tracking.

### Two Sub-Tabs

1. **Sprint Planning**: Organize stories into sprints
2. **Burndown Chart**: Track sprint progress

---

### Sprint Planning Sub-Tab

#### Left Panel: Sprint List

**Sprint Cards** show:
- Sprint name and status badge
- Date range and duration
- Story count (completed/total)
- Total points
- Completion percentage
- Capacity bar (if set)
- Edit and Delete buttons

**Sprint Status Colors**:
- 🟢 **Active** (green border)
- 🔵 **Planned** (blue border)
- ⚪ **Completed** (gray border)

#### Right Panel: Backlog

Shows all **unassigned stories**:
- Each card is draggable
- Shows priority, story text, points
- Filter by priority or points
- Drag to sprint to assign

#### Creating a Sprint

1. Click **Create Sprint** button
2. Fill in sprint details:
   - **Sprint Name**: E.g., "Sprint 1 - Foundation"
   - **Start Date**: Sprint start
   - **End Date**: Sprint end (auto-calculated with presets)
   - **Status**: Planned/Active/Completed
   - **Capacity** (optional): Max story points
   - **Goal** (optional): Sprint objective
3. Use **Quick Presets** for duration:
   - 1 Week (7 days)
   - 2 Weeks (14 days) - *most common*
   - 3 Weeks (21 days)
   - 1 Month (30 days)
4. Click **Save**

#### Editing a Sprint

1. Click **Edit** button on sprint card
2. Modify fields
3. Click **Save**

#### Deleting a Sprint

1. Click **Delete** button on sprint card
2. **Warning**: Shows count of assigned stories
3. Stories will be **unassigned** (moved to backlog)
4. Click **Confirm Delete**

#### Assigning Stories to Sprint

**Method 1: Drag and Drop** (recommended)
1. Drag story card from backlog
2. Drop onto sprint card
3. Story automatically assigned

**Method 2: Details Tab**
1. Edit story in Details tab
2. Select sprint from "Assigned Sprint" dropdown
3. Save

#### Unassigning Stories

1. Click **X** button on story in sprint
2. Story moves back to backlog
3. assignedSprint field cleared

---

### Burndown Chart Sub-Tab

Track sprint progress visually.

#### Sprint Selector

- Dropdown lists all sprints
- Select sprint to analyze
- Active sprints shown first

#### Metrics Row

Four key metrics:
1. **Points Remaining**: Unfinished story points
2. **Days Remaining**: Until sprint end date
3. **Completion %**: Percentage of points completed
4. **Total Stories**: Count in sprint

#### Burndown Chart (D3.js)

**Lines**:
- **Dashed Gray Line**: Ideal burndown (linear)
- **Solid Blue Line**: Actual burndown (based on completed stories)
- **Yellow Dashed Line**: "Today" marker (active sprints only)

**Interpretation**:
- **Actual above ideal**: Behind schedule
- **Actual below ideal**: Ahead of schedule
- **Actual matches ideal**: On track

**Interactive Features**:
- **Hover** over dots for tooltip with details
- Shows day number, date, and points remaining
- Legend explains line types

#### Sprint Stories Table

Lists all stories in the sprint:
- Story number
- Priority
- Story text (truncated)
- Points
- Status

Click story number to view in Details tab.

---

## Forecast Tab

The Forecast tab predicts project completion using historical velocity.

### Components

1. **Timeline Controls** (top)
2. **Gantt Chart** (main area)
3. **Statistics Sidebar** (right)

---

### Timeline Controls

**Group By**:
- Status: Stories grouped by current status
- Priority: Grouped by priority level
- Developer: Grouped by assigned developer
- Sprint: Grouped by sprint assignment
- None: Flat list

**Show (Filter)**:
- All Stories
- Incomplete Only (To Do, In Progress, In Review)
- Completed Only (Done)
- Blocked
- Critical Priority

**Zoom**:
- 📅 **Day**: Daily granularity
- 📋 **Week**: Weekly view (default)
- 📊 **Month**: Monthly overview
- 🔄 **Reset**: Back to default week view

---

### Gantt Chart

Visual timeline showing when each story is scheduled.

**Story Bars**:
- **Color** indicates priority:
  - 🔴 Red: Critical
  - 🟠 Orange: High
  - 🔵 Blue: Medium
  - ⚫ Gray: Low
  - 🟢 Green: Completed
- **Length** shows duration (start → end)
- **Position** shows when work happens

**Labels**:
- **Left**: Story ID and text
- **On Bar**: Story points
- **Right**: Assigned developer

**Today Marker**:
- Yellow dashed vertical line
- Shows current date
- Only on active timeline

**Interactions**:
- **Hover** over bar for detailed tooltip:
  - Full story text
  - Priority, status, points, developer
  - Start date, end date, duration
- **Scroll** to see more stories
- **Zoom** to adjust time scale

---

### Statistics Sidebar

**Project Overview** (top metrics):
1. **Projected Completion**: Predicted end date
   - 🟢 Green border: Low risk (on track)
   - 🟡 Yellow border: Medium risk
   - 🔴 Red border: High risk (delayed)
2. **Remaining Hours**: Total work left
3. **Remaining Work Days**: Business days until done
4. **Team Velocity**: Average points per sprint

**Risk Assessment**:
Shows current risk level and factors:
- **Low Risk** (🟢): On track, no major issues
- **Medium Risk** (🟡): Some concerns, monitor closely
- **High Risk** (🔴): Likely delays, action needed

**Bottlenecks**:
Lists identified issues:
- Blocked stories count
- Overloaded developers (>40 points)
- Unassigned critical work

**Recommendations**:
Actionable suggestions:
- Unblock blocked stories
- Estimate unestimated stories
- Balance developer workload
- Mitigate risks

**Configuration Summary**:
Shows current forecast settings:
- Hours per Point
- Working Hours/Day
- Working Days/Week
- Exclude Weekends (Yes/No)

---

### Configuring Forecast

Click **Configure** button to adjust forecast settings.

#### Estimation Settings

**Hours per Story Point**:
- Default: 8 hours
- Range: 0.5 to 40 hours
- Typical: 4-16 hours per point
- Adjust based on team velocity

#### Working Schedule

**Working Hours per Day**:
- Default: 8 hours
- Range: 1-24 hours
- Account for meetings, breaks

**Working Days per Week**:
- Default: 5 days (Mon-Fri)
- Range: 1-7 days
- Adjust for part-time teams

**Exclude Weekends**:
- Default: Yes (checked)
- Unchecked: 7-day work week

#### Velocity Settings

**Manual Velocity Override**:
- Leave blank for auto-calculated velocity
- Enter custom value to override
- Useful for new teams or changing capacity

**Parallel Work Factor**:
- Default: 1.0 (serial work)
- 2.0 = 2 developers working in parallel
- Adjust based on team size and coordination

#### Holidays

**Add Holiday**:
1. Select date from picker
2. Click "Add Holiday"
3. Appears in list

**Quick Presets**:
- "US Holidays 2025": Adds federal holidays
- "Clear All": Removes all holidays

**Remove Holiday**:
- Click trash icon next to date

#### Advanced Settings

**Use actual completion dates**:
- Uses actualEndDate for velocity calculation
- More accurate if tracked consistently

**Account for blockers**:
- Includes blocked stories in risk assessment
- Default: Yes

**Confidence Level**:
- 50% (Optimistic): Best-case scenario
- 75% (Balanced): Realistic with buffer
- 90% (Conservative): Worst-case planning

#### Saving Configuration

1. Review all settings
2. Click **Save Configuration**
3. Forecast recalculates immediately
4. Settings persist to config file

**Reset to Defaults**:
- Click "Reset to Defaults" button
- Confirms before resetting

---

### Exporting

**Export PNG**:
- Click "Export PNG" button
- Downloads Gantt chart as SVG file
- Can be viewed in browsers or converted

**Export CSV**:
- Click "Export CSV" button
- Downloads schedule data as CSV
- Includes: Story ID, text, priority, status, points, developer, dates, duration
- Open in Excel or Google Sheets

---

## Tips & Best Practices

### Story Points

**Fibonacci Sequence**: Use 1, 2, 3, 5, 8, 13, 21
- 1-2: Very small, quick fixes
- 3-5: Small to medium features
- 8: Large feature, should be broken down
- 13+: Too large, definitely break down
- ?: Unknown, needs estimation

**Estimation Tips**:
- Estimate complexity, not hours
- Compare to previously completed stories
- Include testing and documentation time
- Re-estimate if scope changes

### Sprint Planning

**Sprint Duration**:
- 2 weeks is most common
- Shorter sprints for faster feedback
- Longer sprints for complex features

**Sprint Capacity**:
- Set realistic capacity based on historical velocity
- Account for holidays, meetings, support work
- Typically 70-80% of available hours

**Sprint Goal**:
- Write clear, achievable goal
- Goal should be valuable to stakeholders
- Use goal to guide daily priorities

### Workflow Best Practices

**Status Updates**:
- Update status daily
- Move to "Blocked" immediately when stuck
- Add notes explaining blockers

**Date Tracking**:
- Set startDate when work begins
- Set actualEndDate when truly done
- Use for accurate cycle time analysis

**Developer Assignment**:
- Assign before sprint starts
- Balance workload across team
- Avoid overloading individuals

### Data Quality

**Consistency**:
- Use consistent story number format (e.g., US-001, US-002)
- Use consistent developer names (avoid "John" vs "John Smith")
- Use consistent tag format (lowercase, hyphenated)

**Completeness**:
- Always set priority
- Estimate story points early
- Add acceptance criteria for clarity

**Regular Updates**:
- Update at least once per day
- Keep actual end dates accurate
- Add notes for future reference

---

## Troubleshooting

### Common Issues

**Issue**: "No data to display"
- **Cause**: Empty JSON file or no stories added
- **Solution**: Add stories using "+ Add Story" button

**Issue**: Charts not rendering
- **Cause**: No completed stories for velocity charts
- **Solution**: Mark some stories as "Done" with actualEndDate

**Issue**: Forecast shows "No velocity data"
- **Cause**: No completed stories to calculate velocity
- **Solution**: Complete at least 2-3 stories to establish velocity

**Issue**: Changes not saving
- **Cause**: File permissions or file watcher conflict
- **Solution**: Check file is not read-only, close other editors

**Issue**: Drag and drop not working
- **Cause**: JavaScript error or browser issue
- **Solution**: Reload view (close and reopen)

**Issue**: Burndown chart not showing actual line
- **Cause**: No stories completed with actualEndDate
- **Solution**: Set actualEndDate on completed stories

**Issue**: Gantt chart empty
- **Cause**: No estimated stories (all have "?" for points)
- **Solution**: Estimate story points for forecast

### Performance Issues

**Slow rendering with 500+ stories**:
- Use filters to reduce visible items
- Consider archiving old completed stories
- Split into multiple files if needed

**Charts slow to render**:
- D3.js charts can be slow with large datasets
- Use filters to focus on specific data
- Consider upgrading hardware

### Data Issues

**Duplicate story numbers**:
- Ensure unique story numbers
- Use format: PREFIX-NUMBER (US-001, US-002)

**Lost data after external edit**:
- Extension reloads automatically on file changes
- Unsaved changes in extension may be lost
- Commit to Git frequently

**Merge conflicts**:
- Use Git for version control
- Communicate with team about concurrent edits
- Manually resolve conflicts in JSON files

---

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| **Ctrl+S** / **Cmd+S** | Save current changes |
| **Escape** | Close modal/dialog |
| **Tab** | Navigate between fields |
| **Shift+Tab** | Navigate backwards |
| **Enter** | Submit form/confirm action |

### Details Tab

| Shortcut | Action |
|----------|--------|
| **Double-click** row | Edit story |
| **Ctrl+A** / **Cmd+A** | Select all (in table) |
| **Delete** | Delete selected (after selecting) |

### Modal Forms

| Shortcut | Action |
|----------|--------|
| **Tab** | Next field |
| **Shift+Tab** | Previous field |
| **Enter** | Save (if in text input) |
| **Escape** | Cancel/close |

### Chart Interactions

| Shortcut | Action |
|----------|--------|
| **Hover** | Show tooltip |
| **Click** | Select/filter (context-dependent) |
| **Scroll** | Pan timeline (Gantt chart) |

---

## Getting Help

### Documentation

- **Extension README**: Overview and setup
- **This User Guide**: Detailed feature walkthrough
- **Testing Guide**: For QA and developers
- **Architecture Docs**: Technical implementation details

### Support

If you encounter issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review console for errors (F12 in Extension Development Host)
3. Check GitHub Issues for similar problems
4. Create new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Console error messages

### Feature Requests

Have ideas for improvements?
- Create GitHub Issue with "enhancement" label
- Describe the feature and use case
- Explain expected behavior

---

## Changelog

### Version 1.0 (October 2025)

**Initial Release**:
- Details Tab with full CRUD operations
- Analysis Tab with 6 charts
- Kanban Board with drag-and-drop
- Sprint Planning with burndown charts
- Forecast Tab with Gantt chart timeline
- Comprehensive configuration system
- Export capabilities (PNG, CSV)

---

## Conclusion

The User Story Dev View provides a complete solution for agile development tracking. Explore each tab, experiment with features, and adapt the tool to your team's workflow.

**Happy tracking!** 🚀
