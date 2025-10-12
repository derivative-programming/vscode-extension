# Dev Queue Tab - Implementation Documentation

**Created:** October 12, 2025  
**Feature:** Visual drag-and-drop queue management for user stories  
**Location:** Between Details and Analysis tabs

## Overview

The Dev Queue tab provides a visual, interactive interface for managing the order in which incomplete user stories should be developed. Users can drag and drop story cards to reorder the queue, with automatic resequencing of all affected items.

## Key Features

1. **Visual Queue Display**
   - Shows all incomplete user stories (excludes completed status)
   - Cards display story number, queue position, status, priority, and text
   - Color-coded status and priority badges
   - Additional metadata: assigned developer, story points, sprint

2. **Drag-and-Drop Reordering**
   - HTML5 drag-and-drop API implementation
   - Visual feedback during drag (opacity, scale transform)
   - Drop target highlighting
   - Smooth animations and transitions

3. **Auto-Resequencing**
   - Uses increments of 10 (10, 20, 30...) for flexibility
   - Allows future insertions between items
   - Batch updates minimize file I/O

4. **Quick Actions**
   - **Auto-Sequence**: Renumber all items 10, 20, 30...
   - **Reset to Story Numbers**: Clear all custom positions
   - Click any item to open detailed story modal

5. **Statistics Dashboard**
   - Total items in queue
   - Breakdown by status (On Hold, Ready, In Progress, Blocked)
   - Real-time updates after reordering

6. **Empty State**
   - Celebratory message when all stories completed
   - Icon and text indicating success

## Architecture

### Files Created

#### 1. `devQueueTabTemplate.js` (190 lines)
**Location:** `src/webviews/userStoryDev/components/templates/`

**Exports:**
- `generateDevQueueTab(items, config)` - Main template generator
- `generateDevQueueItems(items)` - Individual card renderer
- `refreshDevQueueList()` - Refresh after changes
- `updateDevQueueStats(items)` - Update counters

**Structure:**
```javascript
generateDevQueueTab()
├── Header (title + description)
├── Statistics (status counters)
├── Actions (Auto-Sequence, Reset buttons)
└── Queue List (draggable cards)

generateDevQueueItems()
├── Empty state (if no items)
└── Card per item
    ├── Drag handle (gripper icon)
    └── Content (click to open modal)
        ├── Header (position, story#, status, priority)
        ├── Story text
        └── Footer (assignee, points, sprint)
```

#### 2. `devQueueDragDrop.js` (225 lines)
**Location:** `src/webviews/userStoryDev/components/scripts/`

**Exports:**
- `initializeDevQueueDragDrop()` - Setup event listeners
- `reorderQueue(fromIndex, toIndex)` - Handle drop and resequence
- `autoSequenceQueue()` - Auto-number button handler
- `resetQueuePositions()` - Reset button handler
- `openStoryModal(storyId)` - Click handler for cards

**Drag Events:**
1. `dragstart` - Set dragged element, add .dragging class
2. `dragover` - Prevent default, set dropEffect
3. `dragenter` - Add .drag-over class to drop target
4. `dragleave` - Remove .drag-over class
5. `drop` - Call reorderQueue(), prevent default
6. `dragend` - Cleanup classes, reset state

### Files Modified

#### 1. `userStoriesDevCommands.ts`

**Tab Structure Changes:**
```typescript
// Added tab button (between Details and Analysis)
<button class="tab" onclick="switchTab('devQueue')">Dev Queue</button>

// Added tab content area
<div id="devQueueTab" class="tab-content">...</div>
```

**Script Integration:**
```typescript
// Added to scriptUris
devQueueTabTemplate: panel.webview.asWebviewUri(...)
devQueueDragDrop: panel.webview.asWebviewUri(...)

// Added script tags
<script src="${scriptUris.devQueueTabTemplate}"></script>
<script src="${scriptUris.devQueueDragDrop}"></script>
```

**CSS Styles Added (200+ lines):**
- `.dev-queue-container` - Main container
- `.dev-queue-header` - Title and description area
- `.dev-queue-description` - Info box with icon
- `.dev-queue-stats` - Statistics dashboard
- `.dev-queue-actions` - Button container
- `.dev-queue-list` - Card list container
- `.dev-queue-item` - Individual card (draggable)
- `.queue-item-handle` - Drag handle with gripper
- `.queue-item-content` - Clickable content area
- `.queue-item-*` - Header, text, footer elements
- `.dragging` - Visual feedback during drag
- `.drag-over` - Drop target highlighting
- `.empty-queue-message` - Empty state

**Message Handler:**
```typescript
case 'batchUpdateQueuePositions':
    // Receives array: [{ storyId, developmentQueuePosition }, ...]
    // Loads existing dev data
    // Updates each story's position
    // Creates new records if needed
    // Saves to app-dna-user-story-dev.json
    // Sends success confirmation
```

#### 2. `userStoryDevView.js`

**Tab Switching:**
```javascript
// Added case to switchTab() function
case 'devQueue':
    renderDevQueueTab();
    break;
```

**Render Function:**
```javascript
function renderDevQueueTab() {
    const devQueueTab = document.getElementById('devQueueTab');
    devQueueTab.innerHTML = generateDevQueueTab(allItems, devConfig);
    initializeDevQueueDragDrop();
}
```

## User Workflow

### Standard Reordering
1. Open User Stories Development view
2. Click "Dev Queue" tab (2nd tab)
3. See list of incomplete stories sorted by queue position
4. Click and drag any story card
5. Drop at desired position
6. System automatically:
   - Removes from old position
   - Inserts at new position
   - Renumbers all items (10, 20, 30...)
   - Saves to JSON file
   - Refreshes display
   - Updates Board tab

### Auto-Sequence
1. Click "Auto-Sequence" button
2. All items renumbered 10, 20, 30...
3. Maintains current order
4. Creates even spacing for future insertions

### Reset Positions
1. Click "Reset to Story Numbers" button
2. Confirm dialog appears
3. All custom positions cleared
4. Stories revert to story number ordering
5. `developmentQueuePosition` removed from JSON

### View Story Details
1. Click anywhere on a story card (except drag handle)
2. Story detail modal opens
3. Edit any field
4. Save changes
5. Queue refreshes with updated data

## Data Flow

### Loading Queue
1. User switches to Dev Queue tab
2. `switchTab('devQueue')` called
3. `renderDevQueueTab()` executes
4. `generateDevQueueTab(allItems, devConfig)` called
5. Filters to incomplete items (devStatus !== 'completed')
6. Sorts by `developmentQueuePosition` (or story number)
7. Generates HTML with draggable cards
8. `initializeDevQueueDragDrop()` attaches event listeners

### Reordering Items
1. User drags item from index A to index B
2. `handleDrop()` called
3. `reorderQueue(A, B)` executes:
   - Filters incomplete items
   - Sorts by current positions
   - Removes item from index A
   - Inserts at index B
   - Renumbers all: (index + 1) * 10
4. Builds array of updates: `[{ storyId, developmentQueuePosition }, ...]`
5. Posts message to extension: `vscode.postMessage({ command: 'batchUpdateQueuePositions', data: updates })`
6. Extension handler:
   - Loads `app-dna-user-story-dev.json`
   - Updates each story's position
   - Saves file
   - Sends confirmation
7. Webview refreshes:
   - `refreshDevQueueList()` called
   - Regenerates cards with new positions
   - Reinitializes drag-and-drop
   - Updates statistics

### Batch Update Handler (Extension Side)
```typescript
case 'batchUpdateQueuePositions':
    const updates = message.data;
    // Load existing dev data
    let existingData = JSON.parse(fs.readFileSync(devFilePath));
    
    // Update each story
    updates.forEach(update => {
        const index = existingData.devData.findIndex(d => d.storyId === update.storyId);
        if (index >= 0) {
            existingData.devData[index].developmentQueuePosition = update.developmentQueuePosition;
        } else {
            // Create new record with defaults
            existingData.devData.push({
                storyId: update.storyId,
                developmentQueuePosition: update.developmentQueuePosition,
                devStatus: 'on-hold',
                priority: 'medium',
                storyPoints: '?',
                // ... other defaults
            });
        }
    });
    
    // Save file
    await saveDevData(existingData.devData, devFilePath);
    
    // Confirm success
    panel.webview.postMessage({ command: 'devChangeSaved', success: true });
```

## Integration Points

### With Details Tab
- Both use same `allItems` data source
- Changes in Details Tab reflected in Dev Queue
- Both save to same JSON file structure

### With Board Tab
- Queue position controls swim lane ordering
- `refreshBoard()` called after reordering
- Both use `sortByQueuePosition()` function

### With Story Modal
- Click handler: `openStoryModal(storyId)`
- Uses existing `showStoryDetailModal()` function
- Modal edits update `allItems` in real-time
- Dev Queue auto-refreshes on modal close

### With Data Files
- Reads: `app-dna-user-story-dev.json`
- Writes: Updates `developmentQueuePosition` property
- Preserves all other properties
- Creates new records if story not in dev data yet

## Styling Details

### Color Scheme
**Status Badges:**
- On Hold: Warning yellow background
- Ready for Dev: Blue background, white text
- In Progress: Green background, white text  
- Blocked: Red background, white text

**Priority Badges:**
- Critical: Red background, white text
- High: Orange background, white text
- Medium: Yellow background, black text
- Low: Blue background, white text

### Visual Feedback
- Hover: Background lightens, border highlights, subtle shadow
- Dragging: 50% opacity, 98% scale
- Drop Target: Thick focus border, active selection background

### Layout
- Cards: Full width with flex layout
- Handle: Left-aligned, 8px padding
- Content: Flex-grow, 12px padding
- Header: Horizontal badges with 8px gaps
- Footer: Metadata icons with 4px icon-text gaps

## Performance Considerations

### Optimization Strategies
1. **Batch Updates**: Single file write for all position changes
2. **Increments of 10**: Reduces frequency of full resequencing
3. **Filtered Rendering**: Only shows incomplete stories
4. **Event Delegation**: Could be improved for large lists
5. **DOM Refresh**: Full regeneration vs. incremental updates

### Potential Improvements
- Virtual scrolling for 100+ items
- Debounced drag updates
- Incremental DOM updates instead of full refresh
- Web Worker for sorting large datasets
- IndexedDB cache for offline capability

## Testing Checklist

### Functional Tests
- [ ] Tab appears between Details and Analysis
- [ ] Shows incomplete stories only
- [ ] Completed stories excluded
- [ ] Drag-and-drop reorders items
- [ ] Positions update in JSON file
- [ ] Board tab reflects new order
- [ ] Click opens story modal
- [ ] Auto-Sequence button works
- [ ] Reset button clears positions
- [ ] Stats update correctly
- [ ] Empty state when all completed

### Edge Cases
- [ ] Single item in queue
- [ ] All items same status
- [ ] Drag item to same position (no-op)
- [ ] Missing queue positions (falls back to story number)
- [ ] New story without dev data
- [ ] File save errors handled
- [ ] Concurrent edits from multiple tabs

### Browser Compatibility
- [ ] Chrome/Edge (Chromium-based)
- [ ] Drag-and-drop API support
- [ ] CSS custom properties (VS Code theme)
- [ ] Flexbox layout
- [ ] Grid layout (stats dashboard)

## Future Enhancements

### Planned Features
1. **Keyboard Navigation**
   - Arrow keys to navigate items
   - Ctrl+Up/Down to move items
   - Enter to open modal

2. **Multi-Select**
   - Shift-click to select range
   - Ctrl-click to toggle selection
   - Drag multiple items together

3. **Filtering**
   - Filter by status, priority, assignee
   - Search by story text
   - Show/hide completed toggle

4. **Grouping**
   - Group by sprint
   - Group by priority
   - Collapsible groups

5. **Context Menu**
   - Right-click for quick actions
   - Move to Top/Bottom
   - Change status/priority
   - Assign developer

### Technical Debt
- Consider virtual scrolling implementation
- Evaluate incremental DOM updates
- Add loading states for large lists
- Implement optimistic UI updates
- Add undo/redo capability

## Troubleshooting

### Cards Won't Drag
- Check browser drag-and-drop API support
- Verify `draggable="true"` attribute
- Check console for JavaScript errors
- Ensure event listeners attached

### Positions Not Saving
- Check extension console logs
- Verify file path is correct
- Check file permissions
- Look for JSON parse errors
- Verify `buildDevRecord()` includes position

### Board Tab Not Updating
- Check if `refreshBoard()` function exists
- Verify Board tab uses `sortByQueuePosition()`
- Check `groupItemsByStatus()` sorting logic
- Ensure `allItems` is shared reference

### Empty Queue When Items Exist
- Check filter logic (completed vs. incomplete)
- Verify `devStatus` values are correct
- Check `isIgnored` flag values
- Look for rendering errors in console

## References

- Main Implementation: This document
- Queue Position Property: `docs/architecture/kanban-queue-position-implementation.md`
- Details Column: `docs/architecture/queue-position-column-implementation.md`
- User Story Dev View: `docs/features/user-story-development-view.md`
- Command History: `copilot-command-history.txt` (October 12, 2025)
