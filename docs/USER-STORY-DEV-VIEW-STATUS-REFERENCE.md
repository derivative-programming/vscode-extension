# User Story Dev View - Status Reference

**Last Updated**: October 5, 2025

## Official Development Status Values

The User Story Development View uses **5 development statuses** that track the development lifecycle.

### Status Values (Field: `devStatus`)

| Value | Label | Color | Description |
|-------|-------|-------|-------------|
| `on-hold` | On Hold | `#858585` (Gray) | Story is paused or not prioritized |
| `ready-for-dev` | Ready for Development | `#0078d4` (Blue) | Story is ready to start development |
| `in-progress` | In Progress | `#f39c12` (Orange) | Actively being developed |
| `blocked` | Blocked | `#d73a49` (Red) | Story is blocked (reason optional) |
| `completed` | Completed | `#28a745` (Green) | Development complete |

### Priority Values (Field: `priority`)

| Value | Label | Use Case |
|-------|-------|----------|
| `critical` | Critical | Must be done immediately, blocking other work |
| `high` | High | Important, should be done soon |
| `medium` | Medium | Normal priority, standard workflow |
| `low` | Low | Nice to have, can be deferred |

### Story Points (Field: `storyPoints`)

Fibonacci sequence for estimation complexity:
- `?` - Unknown (not yet estimated)
- `1` - Trivial task (< 2 hours)
- `2` - Simple task (2-4 hours)
- `3` - Small task (4-8 hours)
- `5` - Medium task (1-2 days)
- `8` - Large task (2-3 days)
- `13` - Very large task (3-5 days, consider splitting)
- `21` - Epic (> 1 week, should be split into smaller stories)

## Data Model Fields

### Core Fields

```json
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
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `storyId` | string | Yes | Unique story identifier (e.g., "US001") |
| `devStatus` | string | Yes | One of 8 status values |
| `priority` | string | Yes | One of: critical, high, medium, low |
| `storyPoints` | string | Yes | Fibonacci or "?" |
| `assignedTo` | string | No | Developer name from config |
| `sprint` | string | No | Sprint name from config |
| `startDate` | string | No | YYYY-MM-DD (auto-set when status → in-progress) |
| `estimatedEndDate` | string | No | YYYY-MM-DD |
| `actualEndDate` | string | No | YYYY-MM-DD (auto-set when status → completed) |
| `blockedReason` | string | No | Optional explanation (NOT required even when blocked) |
| `devNotes` | string | No | Developer notes and comments |

## Status Workflow

### Normal Flow

```
on-hold → ready-for-dev → in-progress → completed
```

### With Blocking

```
in-progress → blocked → in-progress → completed
```

### Status Transition Rules

1. **Auto-date Management**:
   - Status changes to `in-progress` → Sets `startDate` if empty
   - Status changes to `completed` → Sets `actualEndDate` to current date

2. **Optional Fields**:
   - `blockedReason` is **NOT required** even when status is `blocked`
   - Allows quick status changes without mandatory explanations

## Kanban Board Columns

The Board tab displays 5 columns matching the 5 statuses:

1. **On Hold** - Gray column
2. **Ready for Development** - Blue column
3. **In Progress** - Orange column
4. **Blocked** - Red column
5. **Completed** - Green column

### Drag-and-Drop

- Dragging a story card to a different column automatically updates its `devStatus`
- Color of the card matches the priority color, not the status color
- Blocked stories have a red border + icon overlay

## Filtering and Reporting

### Common Filters

- **By Status**: Any of the 8 status values
- **By Priority**: critical, high, medium, low
- **By Story Points**: ?, 1, 2, 3, 5, 8, 13, 21
- **By Developer**: Any developer from config
- **By Sprint**: Any sprint from config
- **By Blocked**: Only stories with status = `blocked`

### Metrics Calculations

**Completed Stories Count**:
```javascript
items.filter(item => item.devStatus === 'completed').length
```

**In Progress Count**:
```javascript
items.filter(item => item.devStatus === 'in-progress').length
```

**Blocked Count**:
```javascript
items.filter(item => item.devStatus === 'blocked').length
```

**Velocity** (Average points per sprint):
```javascript
completedItems = items.filter(item => 
  item.devStatus === 'completed' && 
  item.storyPoints !== '?' &&
  item.actualEndDate
);
totalPoints = sum(completedItems.storyPoints);
velocity = totalPoints / numberOfSprints;
```

## API Message Commands

### Update Dev Status

```javascript
vscode.postMessage({
  command: 'saveDevChange',
  data: {
    storyId: 'US001',
    devStatus: 'in-progress',  // Use these 8 values only
    priority: 'high',
    storyPoints: '5',
    // ... other fields
  }
});
```

### Bulk Status Update

```javascript
vscode.postMessage({
  command: 'bulkUpdateDevStatus',
  data: {
    storyIds: ['US001', 'US002'],
    devStatus: 'ready-for-dev'  // Use these 8 values only
  }
});
```

## Common Mistakes to Avoid

❌ **WRONG** - Using incorrect status values:
```json
{ "devStatus": "To Do" }        // Wrong!
{ "devStatus": "In Review" }    // Wrong!
{ "devStatus": "Done" }         // Wrong!
{ "devStatus": "Deferred" }     // Wrong!
{ "devStatus": "Archived" }     // Wrong!
```

✅ **CORRECT** - Use official status values:
```json
{ "devStatus": "ready-for-dev" }   // Correct
{ "devStatus": "in-progress" }     // Correct
{ "devStatus": "completed" }       // Correct
{ "devStatus": "on-hold" }         // Correct
```

❌ **WRONG** - Using mixed case for priority:
```json
{ "priority": "High" }      // Wrong!
{ "priority": "CRITICAL" }  // Wrong!
```

✅ **CORRECT** - Use lowercase:
```json
{ "priority": "high" }      // Correct
{ "priority": "critical" }  // Correct
```

## References

- **Architecture**: See `user-story-dev-view-architecture.md` for complete status workflow diagram
- **User Guide**: See `USER-STORY-DEV-VIEW-USER-GUIDE.md` for end-user documentation
- **Testing**: See `USER-STORY-DEV-VIEW-TESTING-GUIDE.md` for test scenarios
- **Schema**: See `app-dna.schema.json` for field definitions

---

**Document Version**: 1.0  
**Applies To**: User Story Dev View v1.0+
