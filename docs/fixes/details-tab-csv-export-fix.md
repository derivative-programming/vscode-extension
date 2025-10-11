# Details Tab CSV Export Fix

**Date**: October 11, 2025  
**Issue**: CSV export columns and values didn't match the Details Tab table  
**Status**: ✅ Fixed

---

## Problem Description

The CSV export functionality in the Details Tab had several issues:

### Issues Identified:

1. **Wrong Columns**
   - CSV had: `storyNumber, storyText, devStatus, priority, assignedTo, sprint, storyPoints, estimatedHours, actualHours`
   - Should have: All 12 visible table columns (excluding checkbox)

2. **Missing Columns**
   - Missing: `Start Date`, `Est. End Date`, `Actual End Date`, `Blocked Reason`, `Dev Notes`

3. **Wrong Values**
   - Exported internal IDs instead of display labels
   - Examples:
     - `on-hold` instead of `On Hold`
     - `ready-for-dev` instead of `Ready for Development`
     - `critical` instead of `Critical`

4. **Extra Columns**
   - Included `estimatedHours` and `actualHours` which aren't displayed in the table

5. **Column Order**
   - Didn't match the table's display order

6. **Wrong Data Lookup Key** ⚠️ **CRITICAL BUG**
   - CSV export was looking up dev data using `story.storyId`
   - Dev data is actually keyed by `story.name`
   - This caused all dev data fields to show as empty even when data existed

---

## Solution Implemented

### 1. **Updated CSV Headers**

**Before**:
```csv
storyNumber,storyText,devStatus,priority,assignedTo,sprint,storyPoints,estimatedHours,actualHours
```

**After**:
```csv
Story #,Story Text,Priority,Points,Assigned To,Dev Status,Sprint,Start Date,Est. End Date,Actual End Date,Blocked Reason,Dev Notes
```

### 2. **Added Value Mapping Functions**

Created helper functions to convert internal IDs to display labels:

```typescript
// Helper function to convert devStatus ID to display label
const getDevStatusLabel = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        'on-hold': 'On Hold',
        'ready-for-dev': 'Ready for Development',
        'in-progress': 'In Progress',
        'blocked': 'Blocked',
        'completed': 'Completed'
    };
    return statusMap[status] || status || '';
};

// Helper function to convert priority ID to display label
const getPriorityLabel = (priority: string): string => {
    const priorityMap: { [key: string]: string } = {
        'critical': 'Critical',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
    };
    return priorityMap[priority] || priority || '';
};
```

### 3. **Improved CSV Escaping**

Added proper CSV escaping function:

```typescript
// Helper function to escape CSV values
const escapeCsvValue = (value: string): string => {
    if (!value) {
        return '';
    }
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};
```

### 4. **Added Story Filtering**

Now only exports processed, non-ignored stories:

```typescript
// Only export processed stories that aren't ignored
if (story.isStoryProcessed !== "true" || story.isIgnored === "true") {
    return;
}
```

### 5. **Corrected Column Order and Values**

CSV now matches the table exactly:

| # | CSV Column | Table Column | Value Type |
|---|------------|--------------|------------|
| 1 | Story # | Story # | Text |
| 2 | Story Text | Story Text | Text (escaped) |
| 3 | Priority | Priority | Display label (Critical/High/Medium/Low) |
| 4 | Points | Points | Text (?, 1, 2, 3, 5, 8, 13, 21) |
| 5 | Assigned To | Assigned To | Developer name |
| 6 | Dev Status | Dev Status | Display label (On Hold/Ready for Development/etc.) |
| 7 | Sprint | Sprint | Sprint name (from config) |
| 8 | Start Date | Start Date | YYYY-MM-DD |
| 9 | Est. End Date | Est. End Date | YYYY-MM-DD |
| 10 | Actual End Date | Actual End Date | YYYY-MM-DD |
| 11 | Blocked Reason | Blocked Reason | Text (escaped) |
| 12 | Dev Notes | Dev Notes | Text (escaped) |

---

## Changes Made

### File Modified:
- `src/commands/userStoriesDevCommands.ts`

### Lines Changed:
- Lines 1023-1129 (CSV export case handler)

### Key Changes:
1. ✅ Added `getDevStatusLabel()` function
2. ✅ Added `getPriorityLabel()` function
3. ✅ Added `formatDate()` function
4. ✅ Added `escapeCsvValue()` function
5. ✅ Updated CSV headers to match table columns
6. ✅ Changed column order to match table
7. ✅ Added filtering for processed/non-ignored stories
8. ✅ Removed `estimatedHours` and `actualHours` columns
9. ✅ Added `startDate`, `estEndDate`, `actualEndDate`, `blockedReason`, `devNotes` columns
10. ✅ Applied proper CSV escaping to all text fields
11. ✅ **FIXED CRITICAL BUG**: Changed data lookup to use `story.name` instead of `story.storyId`

---

## Testing Checklist

- [ ] Export CSV with no stories
- [ ] Export CSV with 1 story
- [ ] Export CSV with 10+ stories
- [ ] Verify all 12 columns are present
- [ ] Verify column order matches table
- [ ] Verify Priority shows display labels (Critical, High, Medium, Low)
- [ ] Verify Dev Status shows display labels (On Hold, Ready for Development, etc.)
- [ ] Verify Sprint shows sprint names (not IDs)
- [ ] Verify dates are formatted correctly
- [ ] Verify text fields with commas are properly escaped
- [ ] Verify text fields with quotes are properly escaped
- [ ] Verify text fields with newlines are properly escaped
- [ ] Verify empty values are handled correctly
- [ ] Verify only processed, non-ignored stories are exported
- [ ] Open exported CSV in Excel/Sheets to verify formatting

---

## Example Output

**Before** (Wrong):
```csv
storyNumber,storyText,devStatus,priority,assignedTo,sprint,storyPoints,estimatedHours,actualHours
US-001,"User login",in-progress,high,Alice,sprint-1,5,40,35
US-002,"Dashboard view",ready-for-dev,medium,Bob,sprint-1,8,,
```

**After** (Correct):
```csv
Story #,Story Text,Priority,Points,Assigned To,Dev Status,Sprint,Start Date,Est. End Date,Actual End Date,Blocked Reason,Dev Notes
US-001,User login,High,5,Alice,In Progress,Sprint 1,2025-10-01,2025-10-05,2025-10-04,,OAuth integration complete
US-002,Dashboard view,Medium,8,Bob,Ready for Development,Sprint 1,,,,,
```

---

## Impact

### ✅ Benefits:
- CSV now matches what users see in the table
- Display labels are human-readable
- All relevant columns are included
- Proper CSV escaping prevents formatting issues
- Only exports relevant stories

### ⚠️ Breaking Changes:
- **Column headers changed** - Any scripts parsing the old CSV format will need updates
- **Column order changed** - Scripts relying on column position need updates
- **Values changed** - Scripts expecting IDs (e.g., `on-hold`) will need to handle labels (e.g., `On Hold`)

### 📋 Migration Notes:
If you have scripts or tools that parse the old CSV format:

1. **Update column references**:
   - Old: `storyNumber` → New: `Story #`
   - Old: `devStatus` → New: `Dev Status`
   - Old: `priority` → New: `Priority`

2. **Handle display labels**:
   - Map `On Hold` back to `on-hold` if needed
   - Map `Critical` back to `critical` if needed

3. **Use new columns**:
   - Access date columns: `Start Date`, `Est. End Date`, `Actual End Date`
   - Access text columns: `Blocked Reason`, `Dev Notes`

---

## Related Files

- `src/commands/userStoriesDevCommands.ts` - Main file with CSV export logic
- `src/webviews/userStoryDev/components/scripts/tableRenderer.js` - Table column definitions
- `docs/USER-STORY-DEV-VIEW-STATUS-REFERENCE.md` - Status and priority value mappings
- `docs/reviews/user-story-dev-details-tab-review.md` - Detailed review of Details Tab

---

## Future Enhancements

Consider adding:
1. **Export filtered data only** - Option to export only visible (filtered) rows
2. **Export selected rows only** - Option to export only checked rows
3. **Custom column selection** - Let users choose which columns to export
4. **Multiple format support** - JSON, Excel, etc.
5. **Include summary statistics** - Add total counts, averages, etc.
6. **Include chart data** - Export data used in charts

---

**Fix Completed**: October 11, 2025  
**Tested By**: Pending  
**Approved By**: Pending
