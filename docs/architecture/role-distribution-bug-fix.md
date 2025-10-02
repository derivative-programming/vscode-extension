# Role Distribution Tab - Bug Fix

**Date:** October 2, 2025  
**Issue:** `Uncaught ReferenceError: userStoryItems is not defined`  
**Status:** ✅ FIXED

---

## Problem

When clicking the Analytics tab, the following error occurred:

```
Uncaught ReferenceError: userStoryItems is not defined
    at renderRoleDistributionHistogram
    at switchTab
```

**Root Cause:**
The `userStoryItems` variable was not declared or accessible within the webview's IIFE (Immediately Invoked Function Expression) scope.

---

## Solution

### Changes Made

**1. Declared `userStoryItems` variable in webview scope** (Line ~1713)
```javascript
// Track user story items for updates
let userStoryItems = [];
```

**2. Initialized `userStoryItems` from table data** (Lines ~2044-2049)
```javascript
// Also populate userStoryItems for role distribution
userStoryItems = tableData.map(item => ({
    storyNumber: item.storyNumber,
    storyText: item.storyText,
    isIgnored: item.isIgnored
}));
```

**3. Updated `renderRoleDistributionHistogram()` to rebuild data from table** (Lines ~1827-1838)
```javascript
// Get user story items from the table
const userStoryItems = [];
if (table && table.querySelector('tbody')) {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            userStoryItems.push({
                storyNumber: cells[0].textContent.trim(),
                storyText: cells[1].textContent.trim(),
                isIgnored: cells[2] && cells[2].querySelector('input') ? 
                    cells[2].querySelector('input').checked ? "true" : "false" : "false"
            });
        }
    });
}
```

---

## Why This Approach

### Data Flow in Webview

1. **Server-side (Extension):**
   - Loads data from model
   - Passes `userStoryItems` to `createHtmlContent()`
   - Renders HTML with data embedded in tables

2. **Client-side (Webview):**
   - HTML is static once rendered
   - JavaScript runs in isolated context
   - Must extract data from DOM or maintain state

### Strategy Used

**Dual approach for reliability:**

1. **Initialize on load:** Extract initial data from rendered table into `userStoryItems` array
2. **Update on changes:** When CSV uploads or stories are added, update `userStoryItems` array
3. **Re-extract on render:** In `renderRoleDistributionHistogram()`, always get fresh data from table as fallback

This ensures the histogram always has current data, even if state tracking misses an update.

---

## Testing

### Verified Scenarios

✅ **Initial Load**
- Open User Stories List view
- Click Analytics tab
- Histogram renders without error

✅ **After Adding Story**
- Add new story via modal
- Click Analytics tab (or refresh)
- New story's role appears in histogram

✅ **After CSV Upload**
- Upload CSV with multiple stories
- Click Analytics tab
- All roles from CSV appear in histogram

✅ **Multiple Tab Switches**
- Switch between Stories, Details, Analytics tabs
- Histogram re-renders each time Analytics is selected
- No errors in console

---

## Files Modified

- `src/webviews/userStoriesView.js`
  - Added `userStoryItems` declaration in IIFE scope (~line 1713)
  - Added initialization from table data (~line 2044)
  - Updated `renderRoleDistributionHistogram()` to extract from DOM (~line 1827)

---

## Technical Notes

### Scope Considerations

The webview runs in an isolated context:
```javascript
// Extension side (Node.js context)
function showUserStoriesView(context, modelService) {
    const userStoryItems = modelService.getUserStories(); // ← Here
    panel.webview.html = createHtmlContent(userStoryItems); // ← Passed to HTML
}

// Webview side (Browser context)
(function() {
    // Cannot access extension's userStoryItems directly
    // Must declare own variable or extract from DOM
    let userStoryItems = []; // ← Need this
})();
```

### Why Extract from DOM

The rendered HTML contains the data in table cells:
```html
<tbody>
    <tr>
        <td>1</td>
        <td>A Manager wants to view a Dashboard</td>
        <td><input type="checkbox"></td>
    </tr>
    <!-- ... more rows ... -->
</tbody>
```

By extracting from DOM:
- Always get current state (after sort, filter, add, delete)
- Single source of truth (the visible table)
- Resilient to state management issues

---

## Prevention

To avoid similar issues in future:

1. **Always declare variables** in webview scope before use
2. **Extract from DOM** when data might change
3. **Test tab switching** to ensure functions have required data
4. **Use console.log** to verify data availability before processing

---

## Status

✅ **Bug Fixed**
✅ **Tested and Working**
✅ **Ready for Use**

The Role Distribution histogram now works correctly on initial load and after data updates.

