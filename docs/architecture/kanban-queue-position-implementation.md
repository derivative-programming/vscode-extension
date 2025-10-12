# Kanban Board Queue Position Implementation

**Date**: October 12, 2025  
**Feature**: User Story Development View - Board Tab  
**Property Added**: `developmentQueuePosition`

---

## Overview

Added a new `developmentQueuePosition` property to the development data to provide explicit control over the ordering of stories within Kanban board columns.

---

## Problem Statement

Previously, stories within Kanban board columns (swim lanes) were displayed in the order they were received from the extension, which was sorted by `storyNumber` by default. This didn't provide users with flexibility to prioritize or reorder stories within a status independently of their story number.

---

## Solution

Added `developmentQueuePosition` property that:
1. **Defaults to story number** - Maintains backward compatibility
2. **Controls board ordering** - Stories sort by this value within each column
3. **Can be manually adjusted** - Future UI can allow users to set custom positions
4. **Persists in dev data** - Stored in `app-dna-user-story-dev.json`

---

## Implementation Details

### 1. Data Structure Change

**File**: `app-dna-user-story-dev.json`

Added new property to each item in `devData` array:

```json
{
  "devData": [
    {
      "storyId": "guid",
      "devStatus": "in-progress",
      "priority": "high",
      "storyPoints": "5",
      "assignedTo": "Developer Name",
      "sprintId": "sprint1",
      "startDate": "2025-10-01",
      "estimatedEndDate": "2025-10-05",
      "actualEndDate": "",
      "blockedReason": "",
      "devNotes": "",
      "developmentQueuePosition": 5  // NEW PROPERTY - defaults to storyNumber
    }
  ]
}
```

### 2. Extension-Side Loading

**File**: `src/commands/userStoriesDevCommands.ts`

**Changes in `loadUserStoriesDevData()` function** (around line 178):

```typescript
// Parse storyNumber as integer for developmentQueuePosition default
const storyNumberInt = typeof storyNumber === 'number' ? storyNumber : 
                       (storyNumber === '' ? 0 : parseInt(storyNumber) || 0);

combinedData.push({
    storyId: storyId,
    storyNumber: storyNumber,
    storyText: story.storyText || '',
    devStatus: existingDev?.devStatus || 'on-hold',
    priority: existingDev?.priority || 'medium',
    storyPoints: existingDev?.storyPoints || '?',
    assignedTo: existingDev?.assignedTo || '',
    sprintId: existingDev?.sprintId || '',
    startDate: existingDev?.startDate || '',
    estimatedEndDate: existingDev?.estimatedEndDate || '',
    actualEndDate: existingDev?.actualEndDate || '',
    blockedReason: existingDev?.blockedReason || '',
    devNotes: existingDev?.devNotes || '',
    developmentQueuePosition: existingDev?.developmentQueuePosition !== undefined ? 
                              existingDev.developmentQueuePosition : storyNumberInt,  // NEW
    devFilePath: devFilePath,
    mappedPages: pageDetails,
    selected: false
});
```

**Logic**:
- If `developmentQueuePosition` exists in saved dev data, use it
- Otherwise, default to the story number (parsed as integer)
- This ensures backward compatibility with existing data

### 3. Extension-Side Saving

**File**: `src/commands/userStoriesDevCommands.ts`

**Changes in `saveDevChange` message handler** (around line 477):

```typescript
const devRecord = {
    storyId: devData.storyId,
    devStatus: devData.devStatus,
    priority: devData.priority,
    storyPoints: devData.storyPoints,
    assignedTo: devData.assignedTo,
    sprintId: devData.sprintId,
    startDate: devData.startDate,
    estimatedEndDate: devData.estimatedEndDate,
    actualEndDate: devData.actualEndDate,
    blockedReason: devData.blockedReason,
    devNotes: devData.devNotes,
    developmentQueuePosition: devData.developmentQueuePosition  // NEW
};
```

**Logic**:
- When saving story changes, include `developmentQueuePosition` in the saved record
- This ensures the property persists across sessions

### 4. Webview-Side Sorting

**File**: `src/webviews/userStoryDev/components/scripts/kanbanFunctions.js`

**Changes in `groupItemsByStatus()` function** (around line 80):

```javascript
function groupItemsByStatus(items) {
    const grouped = {
        'on-hold': [],
        'ready-for-dev': [],
        'in-progress': [],
        'blocked': [],
        'completed': []
    };
    
    items.forEach(item => {
        const status = item.devStatus || 'ready-for-dev';
        if (grouped[status]) {
            grouped[status].push(item);
        }
    });
    
    // Sort each group by developmentQueuePosition (ascending)
    Object.keys(grouped).forEach(status => {
        grouped[status].sort((a, b) => {
            const posA = a.developmentQueuePosition !== undefined ? 
                         a.developmentQueuePosition : 
                         (typeof a.storyNumber === 'number' ? a.storyNumber : parseInt(a.storyNumber) || 0);
            const posB = b.developmentQueuePosition !== undefined ? 
                         b.developmentQueuePosition : 
                         (typeof b.storyNumber === 'number' ? b.storyNumber : parseInt(b.storyNumber) || 0);
            return posA - posB;
        });
    });
    
    return grouped;
}
```

**Logic**:
- After grouping items by status, sort each group
- Sort by `developmentQueuePosition` if it exists
- Fall back to `storyNumber` if position not set (backward compatibility)
- Lower values appear at the top of each column

---

## Behavior

### Default Behavior (No Manual Changes)
When first loaded or for stories without a saved `developmentQueuePosition`:

**On Hold Column:**
- Story #1 (top)
- Story #3
- Story #7

**In Progress Column:**
- Story #2 (top)
- Story #5
- Story #12

### After Manual Adjustment (Future Feature)
Users will be able to adjust `developmentQueuePosition` independently:

**In Progress Column:**
- Story #12 (position: 1) ← Manually bumped to top
- Story #2 (position: 2)
- Story #5 (position: 5)

---

## Backward Compatibility

✅ **Fully backward compatible**:
- Existing `app-dna-user-story-dev.json` files without this property will work
- Property defaults to story number if not present
- No breaking changes to existing data
- No migration required

---

## Future Enhancements

### Phase 1: Manual Reordering UI ✅ IMPLEMENTED
Add UI controls to adjust `developmentQueuePosition`:

**✅ Option C - IMPLEMENTED**: Details Tab column
- ✅ Added "Dev Queue Position" column to Details table (between Priority and Points)
- ✅ Inline editing via number input field
- ✅ Changes automatically apply to board
- ✅ Tooltip explains purpose: "Lower values appear first in Board view columns"
- ✅ Sortable column for organizing by queue position

**Option A - Future**: Context menu on Kanban cards
- Right-click card → "Move to Top"
- Right-click card → "Move Up/Down"
- Right-click card → "Set Position..."

**Option B - Future**: Drag-to-reorder within column
- Drag card up/down within same column
- Automatically updates position values
- Updates JSON file

### Phase 2: Auto-Positioning Strategies
Smart defaults for position assignment:

**Priority-based**:
- Critical: positions 1-99
- High: positions 100-199
- Medium: positions 200-299
- Low: positions 300-399

**Sprint-based**:
- Current sprint stories: lower positions (higher priority)
- Backlog stories: higher positions

**Age-based**:
- Older stories get lower positions
- Prevents stories from languishing

### Phase 3: Bulk Operations
Allow bulk position updates:
- Select multiple stories
- "Move to top of queue"
- "Resequence selected" (auto-number)

---

## Testing Scenarios

### Test 1: New Installation
1. Open User Stories Dev view
2. Switch to Board tab
3. **Expected**: Stories sorted by story number in each column

### Test 2: Existing Data (No Position)
1. Have existing `app-dna-user-story-dev.json` without `developmentQueuePosition`
2. Open Dev view and Board tab
3. **Expected**: Stories sorted by story number (falls back to default)

### Test 3: Mixed Data
1. Some stories have `developmentQueuePosition`, others don't
2. Open Board tab
3. **Expected**: Stories with position use that value, others use story number

### Test 4: Manual Position Edit (Future)
1. Manually edit JSON file, set story #10 position to 1
2. Set story #2 position to 10
3. Reload
4. **Expected**: Story #10 appears first, story #2 appears later

### Test 5: Save Persistence
1. Edit story details in modal or inline
2. Save changes
3. Check `app-dna-user-story-dev.json`
4. **Expected**: `developmentQueuePosition` is present in saved record

---

## Technical Notes

### Data Type
- **Type**: `number` (integer)
- **Range**: 0 to Number.MAX_SAFE_INTEGER
- **Default**: Equal to `storyNumber` (parsed as integer)

### Sorting Algorithm
- **Method**: Numeric ascending sort
- **Comparison**: Standard JavaScript numeric comparison (`posA - posB`)
- **Stability**: Stable sort (items with equal position maintain relative order)

### Performance
- **Impact**: Negligible
- **Complexity**: O(n log n) per column (JavaScript Array.sort)
- **Scale**: Efficient for typical board sizes (< 100 stories per column)

---

## Files Modified

1. ✅ `src/commands/userStoriesDevCommands.ts`
   - Added property to `loadUserStoriesDevData()` function
   - Added property to `saveDevChange` handler
   - Added script URI for `queuePositionManagement.js`
   - Added script tag in HTML generation

2. ✅ `src/webviews/userStoryDev/components/scripts/kanbanFunctions.js`
   - Updated `groupItemsByStatus()` to sort by position

3. ✅ `src/webviews/userStoryDev/components/scripts/tableRenderer.js`
   - Added column definition for `developmentQueuePosition`
   - Added case in `createTableRow()` to render queue position input
   - Created `createQueuePositionInput()` function

4. ✅ `src/webviews/userStoryDev/components/scripts/queuePositionManagement.js` (NEW FILE)
   - Created `handleQueuePositionChange()` function
   - Created `getQueuePositionDisplay()` helper
   - Created `sortByQueuePosition()` utility

5. ✅ `docs/features/user-story-development-view.md`
   - Updated data structure documentation
   - Updated Board Tab description
   - Updated Details Tab column list

6. ✅ `docs/architecture/kanban-queue-position-implementation.md` (this file)
   - Complete implementation documentation

---

## Related Documentation

- Main feature doc: `docs/features/user-story-development-view.md`
- Architecture overview: `USER-STORY-DEV-VIEW-REVIEW.md`
- Schema: `app-dna.schema.json` (may need update if validated)

---

## Conclusion

The `developmentQueuePosition` property provides a foundation for flexible story ordering on the Kanban board while maintaining backward compatibility. The default behavior (sorting by story number) remains unchanged for existing users, but the infrastructure is now in place for future manual reordering features.

**Status**: ✅ Implementation Complete  
**Testing**: ⏳ Requires manual testing  
**UI for Manual Adjustment**: 🔮 Future enhancement

---

*Last Updated: October 12, 2025*
