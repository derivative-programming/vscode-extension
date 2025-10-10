# Sprint Planning Drag-and-Drop Implementation

**Date**: October 6, 2025  
**Feature**: Drag-and-drop functionality for assigning backlog stories to sprints

## Overview

Implemented drag-and-drop functionality in the Sprint Planning tab to allow users to drag stories from the backlog and drop them onto sprint cards for quick assignment.

## Problem Statement

The Sprint Planning tab had backlog items marked as `draggable="true"` and the UI structure in place, but the drag-and-drop event handlers were not implemented. Users had to manually assign stories to sprints via the Details tab dropdown, which was inefficient.

## Implementation

### 1. Event Handler Functions (`sprintManagement.js`)

Added drag-and-drop handler functions following the same pattern as the Board tab:

#### State Tracking
```javascript
let draggedStory = null;
let draggedStoryId = null;
```

#### Event Handlers
- **`handleBacklogDragStart(event)`** - Captures the story being dragged, sets drag data, adds visual feedback
- **`handleBacklogDragEnd(event)`** - Clears drag state, removes visual feedback
- **`handleSprintDragOver(event)`** - Prevents default to allow drop, adds visual feedback to sprint card
- **`handleSprintDragLeave(event)`** - Removes visual feedback when drag leaves sprint card
- **`handleSprintDrop(event)`** - Handles the drop, assigns story to sprint, triggers backend update

#### Setup Function
- **`setupSprintDragDrop()`** - Attaches event listeners to all backlog stories and sprint cards

### 2. Initialization (`userStoryDevView.js`)

Updated `renderSprintTab()` to call setup function after rendering:

```javascript
// Set up drag-and-drop for sprint planning
if (typeof setupSprintDragDrop === 'function') {
    setupSprintDragDrop();
}
```

### 3. Visual Feedback Styles (`userStoriesDevCommands.ts`)

Added CSS for drag-and-drop visual states:

#### Dragging Story
```css
.backlog-story.story-dragging {
    opacity: 0.5;
    cursor: grabbing;
}
```

#### Drop Target (Sprint Card)
```css
.sprint-card.sprint-drag-over {
    background: var(--vscode-list-hoverBackground);
    border: 2px dashed var(--vscode-focusBorder);
    box-shadow: 0 0 8px rgba(0, 122, 204, 0.3);
}
```

## User Experience

### How to Use

1. Navigate to the **Sprint Tab** → **Sprint Planning** sub-tab
2. In the **Backlog** section (right panel), click and drag any story card
3. Drag the story over a **Sprint Card** (left panel)
4. The sprint card will highlight with a dashed border
5. Release the mouse to drop the story onto the sprint
6. The story is automatically assigned and moved from backlog to sprint

### Visual Feedback

- **During Drag**: Story becomes semi-transparent with grabbing cursor
- **Over Drop Target**: Sprint card highlights with blue dashed border and glow
- **After Drop**: Story disappears from backlog, sprint stats update immediately

### Alternative Method

Users can still assign stories via:
- **Details Tab** → Select story → Choose sprint from "Assigned Sprint" dropdown → Save

## Technical Details

### Backend Integration

The implementation uses existing backend handlers:
- **`assignStoryToSprint`** - Updates `assignedSprint` field in `app-dna-user-story-dev.json`
- **`unassignStoryFromSprint`** - Removes `assignedSprint` field to move story back to backlog

### Data Flow

1. User drags story from backlog
2. User drops story on sprint card
3. Frontend calls `assignStoryToSprint(storyId, sprintId)`
4. Message sent to extension backend
5. Backend updates JSON file
6. Backend reloads data and sends update to webview
7. UI refreshes with updated story assignment

### Browser Compatibility

Uses HTML5 Drag and Drop API:
- `draggable` attribute on backlog stories
- `dragstart`, `dragend`, `dragover`, `dragleave`, `drop` events
- `dataTransfer` object for passing story ID

## Files Modified

1. **`src/webviews/userStoryDev/components/scripts/sprintManagement.js`**
   - Added drag-and-drop state variables
   - Added 5 event handler functions (~100 lines)
   - Added `setupSprintDragDrop()` initialization function
   - Updated exports

2. **`src/webviews/userStoryDev/userStoryDevView.js`**
   - Updated `renderSprintTab()` to call setup function

3. **`src/commands/userStoriesDevCommands.ts`**
   - Added `.story-dragging` CSS class for dragged stories
   - Added `.sprint-drag-over` CSS class for drop target feedback

## Testing Checklist

✓ Drag story from backlog to sprint  
✓ Sprint card highlights when story is dragged over it  
✓ Story is assigned to correct sprint on drop  
✓ Backlog count decreases after assignment  
✓ Sprint stats update (story count, points)  
✓ Visual feedback clears properly after drop  
✓ Drag and drop between different sprints  
✓ Filter backlog while dragging still works  
✓ Extension compiles successfully  

## Architecture Notes

- Follows same pattern as Board tab drag-and-drop for consistency
- Uses event delegation for efficient event handling
- Visual feedback uses VS Code theme variables for proper theming
- State is properly cleaned up after each drag operation
- Backend handlers were already in place, only frontend implementation needed

## Related Documentation

- User Story Dev View User Guide: Sprint Planning section
- Board Tab Drag-and-Drop: Similar implementation pattern
- HTML5 Drag and Drop API: Standard web API usage

## Future Enhancements

Possible improvements:
- Drag stories between sprints (currently requires unassign then reassign)
- Drag multiple selected stories at once
- Visual preview of story being dragged (ghost image)
- Drag stories directly from Details tab table to sprints
- Undo/redo for drag-and-drop operations
