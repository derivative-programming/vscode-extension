# User Stories View - Data Flow Analysis

**Date**: October 2, 2025  
**File**: src/webviews/userStoriesView.js

## Summary

Both the **Details tab** (Stories tab) and the **Role Distribution tab** (Analytics tab) use the **same initial dataset** from ModelService, but they process and display it differently.

## Initial Data Loading (Server-Side)

### Source: ModelService → Extension → Webview

**Location**: Lines 546-615 in `showUserStoriesView()`

```javascript
function showUserStoriesView(context, modelService) {
    // Get the model data from ModelService (in-memory)
    const rootModel = modelService.getCurrentModel();
    
    // Get user story items from the first namespace
    const firstNamespace = rootModel.namespace[0];
    const userStoryItems = (firstNamespace.userStory || []).map(item => ({
        name: item.name || "",
        storyNumber: item.storyNumber || "",
        storyText: item.storyText || "",
        isIgnored: item.isIgnored || "false",
        isStoryProcessed: item.isStoryProcessed || "false"
    }));

    // Pass data to HTML template
    panel.webview.html = createHtmlContent(userStoryItems);
}
```

### Data Structure from Model
```json
{
  "namespace": [{
    "userStory": [
      {
        "name": "...",
        "storyNumber": "1",
        "storyText": "A [Role] wants to view a [DataObject]",
        "isIgnored": "false",
        "isStoryProcessed": "false"
      }
    ]
  }]
}
```

## HTML Generation (Server-Side Template)

**Function**: `createHtmlContent(userStoryItems, errorMessage)`  
**Lines**: 1114-2565

### Stories Tab Table (Lines 1592-1603)
```javascript
<tbody>
    ${userStoryItems.map((item, index) => 
        '<tr data-index="' + index + '">' +
        '<td>' + (item.storyNumber || '') + '</td>' +
        '<td>' + (item.storyText || '') + '</td>' +
        '<td><input type="checkbox" class="isIgnoredCheckbox" data-index="' + index + '"' + 
        (item.isIgnored === "true" ? ' checked' : '') + '></td>' +
        '</tr>'
    ).join('')}
</tbody>
```

**Columns**: Story Number, Story Text, Ignored checkbox  
**Data Source**: Direct from `userStoryItems` parameter (from ModelService)  
**Processing**: None - displays raw data

### Details Tab Table (Lines 1627-1637)
```javascript
<tbody>
    ${userStoryItems.map((item, index) => {
        const role = extractRoleFromUserStory(item.storyText) || 'Unknown';
        const action = extractActionFromUserStory(item.storyText);
        return '<tr data-index="' + index + '">' +
            '<td>' + (item.storyNumber || '') + '</td>' +
            '<td>' + (item.storyText || '') + '</td>' +
            '<td>' + role + '</td>' +
            '<td>' + action + '</td>' +
            '</tr>';
    }).join('')}
</tbody>
```

**Columns**: Story Number, Story Text, Role, Action  
**Data Source**: Same `userStoryItems` parameter (from ModelService)  
**Processing**: 
- Uses `extractRoleFromUserStory()` to parse role from story text
- Uses `extractActionFromUserStory()` to parse action from story text
- Server-side processing during HTML generation

### Analytics Tab (Lines 1643-1676)
```html
<div id="analytics-tab" class="tab-content">
    <div class="histogram-container">
        <div id="role-distribution-loading" class="loading">Loading role distribution...</div>
        <div id="role-distribution-visualization" class="histogram-viz hidden"></div>
        <div class="role-distribution-summary">
            <!-- Summary statistics -->
        </div>
    </div>
</div>
```

**Initial State**: Empty placeholder  
**Data Source**: Will extract from DOM table when rendered  
**Processing**: Client-side JavaScript when Analytics tab is clicked

## Client-Side Data Management (Webview JavaScript)

**IIFE Scope**: Lines 1713-2560

### Variable Declaration (Line 1713)
```javascript
let userStoryItems = [];
```

**Scope**: Within webview IIFE  
**Purpose**: Track story items for updates and analytics

### Initial Population from Table (Lines 2044-2063)
```javascript
// Initially store the table data for filtering (with safety check)
let tableData = [];
if (table && table.querySelector('tbody')) {
    tableData = Array.from(table.querySelectorAll('tbody tr')).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
            return {
                row: row,
                storyNumber: cells[0].textContent,
                storyText: cells[1].textContent,
                isIgnored: cells[2].querySelector('input') ? 
                    cells[2].querySelector('input').checked ? "true" : "false" : "false"
            };
        }
        return null;
    }).filter(item => item !== null);
    
    // Also populate userStoryItems for role distribution
    userStoryItems = tableData.map(item => ({
        storyNumber: item.storyNumber,
        storyText: item.storyText,
        isIgnored: item.isIgnored
    }));
}
```

**Strategy**: Extract data from DOM table (Stories tab)  
**Reason**: DOM is the single source of truth after initial page load

## Role Distribution Histogram Rendering

### Trigger: User clicks "Analytics" tab

**Function**: `switchTab('analytics')`  
**Lines**: 2224-2247

```javascript
function switchTab(tabName) {
    // ... tab switching logic ...
    
    // If switching to analytics tab, render histogram
    if (tabName === 'analytics') {
        renderRoleDistributionHistogram();
    }
}
```

### Data Extraction (Lines 1823-1838)
```javascript
function renderRoleDistributionHistogram() {
    // Get user story items FRESH from the table
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
    
    // Calculate distribution from current table data
    const distribution = calculateRoleDistribution(userStoryItems);
    // ... render histogram with D3.js ...
}
```

**Strategy**: Extract data from DOM every time histogram renders  
**Source**: Stories tab table (`#userStoriesTable`)  
**Processing**: 
1. Read story text from DOM
2. Call `calculateRoleDistribution()` which uses `extractRoleFromUserStory()`
3. Count occurrences of each role
4. Render D3.js histogram

### Role Extraction (Lines 1755-1798)
```javascript
function calculateRoleDistribution(userStoryItems) {
    const roleMap = new Map();
    
    userStoryItems.forEach(item => {
        // Skip ignored stories
        if (item.isIgnored === "true") {
            return;
        }
        
        // Extract role using the same helper function
        const role = extractRoleFromUserStory(item.storyText);
        
        // Skip stories without valid roles or with "Unknown" role
        if (!role || role === 'Unknown') {
            return;
        }
        
        // Count occurrences
        if (roleMap.has(role)) {
            roleMap.set(role, roleMap.get(role) + 1);
        } else {
            roleMap.set(role, 1);
        }
    });
    
    // Convert to array and sort by count descending
    return Array.from(roleMap.entries())
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count);
}
```

## Data Flow Comparison

### Stories Tab (Default View)
1. **ModelService** → Load from `app-dna.json` (in-memory)
2. **Extension** → Extract `userStory` array from first namespace
3. **createHtmlContent()** → Generate HTML table rows
4. **Webview** → Display table with raw data (Story Number, Story Text, Ignored)
5. **User Interaction** → Sort, filter, edit checkboxes (all DOM-based)

### Details Tab
1. **ModelService** → Same data source as Stories tab
2. **Extension** → Same extraction as Stories tab
3. **createHtmlContent()** → Generate HTML table rows WITH parsing
   - Calls `extractRoleFromUserStory()` during HTML generation
   - Calls `extractActionFromUserStory()` during HTML generation
4. **Webview** → Display table with parsed columns (Story Number, Story Text, Role, Action)
5. **User Interaction** → Sort, filter (all DOM-based)

### Analytics Tab (Role Distribution) - UPDATED Oct 2, 2025
1. **ModelService** → Same data source as other tabs
2. **Extension** → Same extraction (from first namespace)
3. **createHtmlContent()** → Calculate distribution during HTML generation (server-side)
   - Uses IIFE to process `userStoryItems` parameter
   - Calls `extractRoleFromUserStory()` to parse roles
   - Counts occurrences and sorts by count descending
   - Embeds as JSON in `data-role-distribution` attribute
4. **Webview Initial Load** → Data is pre-calculated and embedded
5. **User Clicks Analytics** → `switchTab('analytics')` triggers render
6. **renderRoleDistributionHistogram()** → Read from `data-role-distribution` attribute
7. **JSON.parse()** → Parse pre-calculated distribution data
8. **D3.js Rendering** → Create interactive histogram with color-coded bars
9. **(Optional) User Clicks Refresh** → Extract from DOM → Recalculate → Update attribute → Re-render

## Key Insights

### All Tabs Use Same Initial Data
✅ **Yes** - All tabs start with the same `userStoryItems` array from ModelService

### Data Processing Differences

| Tab | Processing Timing | Processing Location | Role Extraction |
|-----|------------------|-------------------|-----------------|
| **Stories** | None | N/A | No |
| **Details** | Server-side (HTML generation) | createHtmlContent() | Yes - during HTML generation |
| **Analytics** | Server-side (HTML generation) | createHtmlContent() IIFE | Yes - during HTML generation (updated Oct 2, 2025) |

### Why Analytics Uses Pre-Calculated Data (Updated Oct 2, 2025)

~~The Analytics tab extracts data from the DOM rather than using the original `userStoryItems` parameter because:~~ **[OUTDATED]**

**NEW APPROACH**: The Analytics tab now receives pre-calculated distribution data during HTML generation, similar to the Details tab:

1. **Server-Side Calculation**: Distribution is calculated once during HTML generation using the same `userStoryItems` from ModelService

2. **Embedded as JSON**: Pre-calculated data is embedded in the `data-role-distribution` attribute on the Analytics tab

3. **Fast Initial Render**: JSON parsing is faster than DOM traversal + text extraction + role parsing

4. **Refresh When Needed**: Refresh button allows manual recalculation from current DOM state when:
   - User edits (checkbox changes)
   - CSV imports
   - Story additions/deletions
   - Sorting/filtering

5. **Consistency**: Follows same pattern as Details tab (server-side processing during HTML generation)

## Data Synchronization Pattern

```
ModelService (Source of Truth)
    ↓
Extension: getCurrentModel()
    ↓
createHtmlContent(userStoryItems) ← Server-side template generation
    ↓
    ├── Stories Tab: userStoryItems.map() → Direct display
    ├── Details Tab: userStoryItems.map() → Parse role/action → Display
    └── Analytics Tab: IIFE calculates distribution → JSON.stringify() → data-role-distribution attribute
                ↓
            User clicks Analytics tab
                ↓
            renderRoleDistributionHistogram()
                ↓
            Read data-role-distribution attribute → JSON.parse()
                ↓
            D3.js histogram rendering
                ↓
            (Optional) User clicks Refresh button
                ↓
            Extract from Stories tab DOM → calculateRoleDistribution() → Update attribute → Re-render
```

## Conclusion (Updated Oct 2, 2025)

**All tabs build from the same ModelService dataset** with consistent server-side processing:

- **Stories tab**: Displays raw data during **server-side HTML generation** (no processing)
- **Details tab**: Builds its dataset during **server-side HTML generation** by parsing story text and embedding role/action columns in the initial HTML
- **Analytics tab**: Builds its dataset during **server-side HTML generation** by calculating role distribution and embedding as JSON in a data attribute (updated Oct 2, 2025)

### Architecture Benefits

1. **Consistency**: All tabs use server-side processing during HTML generation
2. **Performance**: Pre-calculated data is faster than on-demand DOM extraction
3. **Clarity**: Clear data flow from ModelService → createHtmlContent() → Webview
4. **Flexibility**: Refresh button allows manual updates when DOM state changes

The **Stories tab DOM** can act as a dynamic data source when needed (e.g., Refresh button), but initial data comes from ModelService through server-side template generation.
