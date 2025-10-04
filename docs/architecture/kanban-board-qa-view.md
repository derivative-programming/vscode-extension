# Kanban Board - User Stories QA View

**Created:** October 4, 2025  
**Component:** User Stories QA View - Board Tab  
**Files Modified:**
- `src/commands/userStoriesQACommands.ts`
- `src/webviews/userStoriesQAView.js`

---

## Overview

The Kanban Board view provides a visual, drag-and-drop interface for managing user story QA status. It displays stories as cards organized into columns (swim lanes) based on their QA status, allowing users to easily move stories through the testing workflow.

---

## Architecture

### Tab Structure

The QA View now has **three tabs**:
1. **Details** - Traditional table view with bulk operations
2. **Board** - Kanban board with drag-and-drop (NEW)
3. **Status Distribution** - Visual analytics with charts

### Swim Lanes (Columns)

Five columns represent the QA workflow states:

| Column | Status Value | Color | Description |
|--------|-------------|-------|-------------|
| Pending | `pending` | Gray (#858585) | Not yet ready for testing |
| Ready to Test | `ready-to-test` | Blue (#0078d4) | Ready for QA to begin |
| Started | `started` | Orange (#f39c12) | Testing in progress |
| Success | `success` | Green (#28a745) | Testing passed |
| Failure | `failure` | Red (#d73a49) | Testing failed |

### Card Structure

Each Kanban card displays:
```
┌──────────────────────────────┐
│ Story Number (e.g., US-001)  │ ← Blue link color
│                              │
│ Story Text (truncated to    │ ← Normal text, max 3 lines
│ 3 lines with ellipsis)       │
│                              │
│ [📝 Notes] [📅 2025-10-04]  │ ← Footer (optional)
└──────────────────────────────┘
```

**Footer Elements (conditional):**
- **Notes Icon**: Shows if `qaNotes` is not empty (with tooltip showing full notes)
- **Date**: Shows `dateVerified` if status is Success or Failure

---

## User Interactions

### Drag and Drop

**Starting a Drag:**
1. User clicks and holds on a card
2. Card gets `.dragging` class (opacity 0.5, slight rotation)
3. Browser initiates drag operation

**During Drag:**
1. As cursor moves over columns, they get `.drag-over` class (highlight effect)
2. Cursor shows "move" icon
3. Card preview follows cursor

**Completing a Drop:**
1. User releases card over target column
2. Card status updates to column's status
3. If status is Success/Failure, `dateVerified` is auto-set to today
4. Card moves to new column
5. Column counts update
6. Change saved to `app-dna-user-story-qa.json`

**Visual Feedback:**
- Source column: Card becomes semi-transparent while dragging
- Target column: Dashed border highlight when dragging over
- Card: Subtle lift and shadow on hover

### Filtering

**Independent Filters:**
The Board tab has its own filter section (separate from Details tab):
- Story Number (case-insensitive partial match)
- Story Text (case-insensitive partial match)

**Filter Behavior:**
- Filters apply in real-time (on input/change events)
- Only matching cards are displayed in columns
- Column counts reflect filtered results
- Clear All button resets both filters

---

## Implementation Details

### HTML Structure

```html
<div id="board-tab" class="tab-content">
    <!-- Filter Section -->
    <div class="filter-section">
        <div class="filter-header" onclick="toggleBoardFilterSection()">
            <span class="codicon codicon-chevron-down" id="boardFilterChevron"></span>
            <span>Filters</span>
        </div>
        <div class="filter-content" id="boardFilterContent">
            <input type="text" id="boardFilterStoryNumber" />
            <input type="text" id="boardFilterStoryText" />
            <button onclick="clearBoardFilters()">Clear All</button>
        </div>
    </div>
    
    <!-- Kanban Board -->
    <div class="kanban-board">
        <div class="kanban-column" data-status="pending">
            <div class="kanban-column-header">
                <span class="kanban-column-title">Pending</span>
                <span class="kanban-column-count" id="count-pending">0</span>
            </div>
            <div class="kanban-column-content" id="column-pending" data-status="pending">
                <!-- Cards inserted here -->
            </div>
        </div>
        <!-- 4 more columns... -->
    </div>
</div>
```

### JavaScript Functions

#### Rendering Functions

**`renderKanbanBoard()`**
```javascript
// 1. Apply filters to allItems
// 2. Group filtered items by qaStatus
// 3. For each column:
//    - Update count badge
//    - Clear existing cards
//    - Create and append cards for that status
```

**`createKanbanCard(item)`**
```javascript
// Creates a card DOM element with:
// - Story number
// - Story text (truncated)
// - Footer with notes/date indicators
// - Drag event listeners
// - Returns card element
```

#### Drag & Drop Handlers

**`handleDragStart(e)`**
- Add `.dragging` class to card
- Set `dataTransfer` with story ID
- Log drag start

**`handleDragEnd(e)`**
- Remove `.dragging` class from card
- Remove `.drag-over` from all columns
- Clean up visual states

**`handleDragOver(e)`**
- Prevent default (allow drop)
- Add `.drag-over` class to column
- Set drop effect to 'move'

**`handleDragLeave(e)`**
- Remove `.drag-over` class from column
- Check if actually leaving (not just entering child)

**`handleDrop(e)`**
- Get story ID from `dataTransfer`
- Get new status from column's `data-status` attribute
- Find item in `allItems` and update status
- Set `dateVerified` if status is success/failure
- Re-render board
- Send `saveQAChange` message to extension

#### Filter Functions

**`applyBoardFilters()`**
- Called on filter input change
- Triggers `renderKanbanBoard()` which applies filters

**`clearBoardFilters()`**
- Clears both filter inputs
- Triggers `renderKanbanBoard()`

**`toggleBoardFilterSection()`**
- Toggles filter section collapse/expand
- Rotates chevron icon

---

## CSS Styling

### Layout
```css
.kanban-board {
    display: flex;              /* Horizontal columns */
    gap: 15px;                  /* Space between columns */
    overflow-x: auto;           /* Scroll if needed */
    min-height: 500px;          /* Minimum board height */
}

.kanban-column {
    flex: 1;                    /* Equal width columns */
    min-width: 250px;           /* Minimum column width */
    display: flex;
    flex-direction: column;     /* Vertical stacking */
}
```

### Column Styling
```css
.kanban-column-header {
    padding: 12px;
    background: var(--vscode-list-hoverBackground);
    border-bottom: 1px solid var(--vscode-panel-border);
    position: sticky;           /* Stays visible on scroll */
    top: 0;
    z-index: 1;
}

/* Status-specific colored border */
.kanban-column[data-status="success"] .kanban-column-header {
    border-left: 3px solid #28a745;
}
```

### Card Styling
```css
.kanban-card {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    cursor: move;
    transition: all 0.2s ease;
}

.kanban-card:hover {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);    /* Lift on hover */
}

.kanban-card.dragging {
    opacity: 0.5;                   /* Semi-transparent */
    transform: rotate(2deg);        /* Slight rotation */
}
```

### Drag States
```css
.kanban-column-content.drag-over {
    background: var(--vscode-list-dropBackground);
    border: 2px dashed var(--vscode-focusBorder);
}
```

---

## Data Flow

### On Page Load
```
Extension loads data
    ↓
Posts 'setUserStoriesQAData' message
    ↓
Webview receives data
    ↓
Updates allItems and userStoriesQAData
    ↓
If board tab is active, calls renderKanbanBoard()
```

### On Card Drop
```
User drops card in new column
    ↓
handleDrop() gets story ID and new status
    ↓
Updates item.qaStatus in allItems
    ↓
Sets item.dateVerified if success/failure
    ↓
Calls renderKanbanBoard() (immediate UI update)
    ↓
Posts 'saveQAChange' message to extension
    ↓
Extension saves to app-dna-user-story-qa.json
```

### On Filter Change
```
User types in filter input
    ↓
Input event triggers applyBoardFilters()
    ↓
Calls renderKanbanBoard()
    ↓
renderKanbanBoard() filters allItems
    ↓
Groups filtered items by status
    ↓
Renders only matching cards
```

---

## Integration with Existing Features

### Shared Data Model
- Uses same `allItems` array as Details tab
- Uses same `userStoriesQAData` object
- Changes in Board tab affect Details tab and vice versa

### Consistent Save Mechanism
- Uses same `saveQAChange` message format
- Extension handles save identically for both tabs
- No duplicate code or separate save paths

### Tab Switching
- `switchTab()` detects Board tab activation
- Calls `renderKanbanBoard()` on first view
- Subsequent switches just show/hide content (no re-render needed)

### Filter Independence
- Board filters: `boardFilterStoryNumber`, `boardFilterStoryText`
- Details filters: `filterStoryNumber`, `filterStoryText`, `filterQAStatus`
- Separate filter states prevent confusion

---

## Performance Considerations

### Efficient Rendering
- Only renders visible tab content
- Cards created on-demand (not all in memory)
- DOM manipulation minimized (clear + append, not individual updates)

### Drag Performance
- Uses native HTML5 drag-and-drop API (browser-optimized)
- CSS transitions for smooth animations
- No JavaScript-based position tracking

### Memory Usage
- Reuses same data arrays (`allItems`)
- Cards are DOM elements (garbage collected when removed)
- No large data duplication

---

## Accessibility Considerations

### Current State
- ✅ Cards are keyboard-focusable (draggable elements)
- ✅ Visual feedback on hover/drag
- ⚠️ No keyboard-based card movement (mouse/touch only)
- ⚠️ Screen readers may not announce status changes

### Future Improvements
- Add keyboard shortcuts (e.g., Arrow keys + Enter to move cards)
- Add ARIA labels for columns and cards
- Announce status changes to screen readers
- Add focus management after drop

---

## Browser Compatibility

### HTML5 Drag and Drop API
- ✅ Supported in all modern browsers
- ✅ Works in VS Code webviews (Electron/Chromium)
- ✅ Touch support varies (may need polyfill for mobile)

### CSS Features
- ✅ Flexbox (widely supported)
- ✅ CSS Grid (not used here, but could be)
- ✅ CSS Variables (VS Code theming)
- ✅ Transitions and transforms

---

## Testing Recommendations

### Functional Tests
- [ ] Cards display correct story number and text
- [ ] Cards appear in correct columns based on status
- [ ] Drag and drop moves cards between columns
- [ ] Status updates after drop
- [ ] dateVerified sets correctly for success/failure
- [ ] Changes save to QA file
- [ ] Filters hide/show appropriate cards
- [ ] Column counts update correctly
- [ ] Footer shows notes/date indicators appropriately

### Edge Cases
- [ ] Empty board (no stories)
- [ ] Single column with many cards (scrolling)
- [ ] Very long story text (truncation)
- [ ] Dropping card on same column (no change)
- [ ] Rapid drag-drop operations
- [ ] Filter with no matches (empty columns)

### Visual Tests
- [ ] Hover effects work on cards
- [ ] Drag visual feedback appears
- [ ] Drop target highlighting works
- [ ] Color-coded column borders visible
- [ ] Responsive layout on narrow windows
- [ ] Theme variables resolve correctly

---

## Known Limitations

1. **No Keyboard Navigation**: Cards can only be moved via mouse drag-drop
2. **No Card Editing**: Must switch to Details tab to edit notes
3. **No Multi-Select**: Can't drag multiple cards at once
4. **No Undo**: Dropped cards can't be quickly undone (must drag back)
5. **No Card Search**: Must use filters (no inline search)

---

## Future Enhancements

### Near Term
1. **Card Click to Edit**: Modal/sidebar to edit notes without switching tabs
2. **Keyboard Support**: Arrow keys + Enter to move cards
3. **Visual Polish**: Add subtle animations on card movement
4. **Empty State**: Show helpful message when board is empty

### Long Term
1. **Swimlane Customization**: Allow users to show/hide columns
2. **Card Sorting**: Sort cards within columns (by number, date, etc.)
3. **Multi-Select**: Drag multiple cards at once
4. **Card Details Preview**: Hover popup showing full story details
5. **Drag Between Tabs**: Drag from Board to Details view
6. **Export Board**: PNG snapshot of current board state

---

## Code Maintenance

### Adding New Statuses
To add a new QA status:

1. **Update HTML** (userStoriesQACommands.ts):
   ```html
   <div class="kanban-column" data-status="new-status">
       <div class="kanban-column-header">
           <span class="kanban-column-title">New Status</span>
           <span class="kanban-column-count" id="count-new-status">0</span>
       </div>
       <div class="kanban-column-content" id="column-new-status" data-status="new-status">
       </div>
   </div>
   ```

2. **Update CSS** (userStoriesQACommands.ts):
   ```css
   .kanban-column[data-status="new-status"] .kanban-column-header {
       border-left: 3px solid #COLOR;
   }
   ```

3. **Update JavaScript** (userStoriesQAView.js):
   ```javascript
   const statusGroups = {
       'pending': [],
       'ready-to-test': [],
       'started': [],
       'success': [],
       'failure': [],
       'new-status': []  // Add here
   };
   ```

4. **Update Color Function** (if needed):
   ```javascript
   function getQAStatusColor(value) {
       const colors = {
           // ... existing colors
           'new-status': '#HEXCOLOR'
       };
       return colors[value] || '#858585';
   }
   ```

### Modifying Card Layout
Card structure is defined in `createKanbanCard()`. Modify this function to:
- Add new fields to cards
- Change card styling
- Add additional indicators
- Modify truncation behavior

---

## Conclusion

The Kanban Board view provides an intuitive, visual way to manage QA status for user stories. It complements the existing Details and Analysis tabs by offering a workflow-focused interface that makes status progression clear and easy to manage through drag-and-drop interactions.

**Key Benefits:**
- ✅ Visual workflow representation
- ✅ Fast status updates via drag-drop
- ✅ At-a-glance overview of QA progress
- ✅ Consistent with modern project management tools
- ✅ Minimal code footprint (reuses existing data structures)

---

**Document Version:** 1.0  
**Last Updated:** October 4, 2025
