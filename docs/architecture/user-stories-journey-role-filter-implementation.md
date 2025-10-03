# User Stories Journey View - Role Required Filter Implementation

**Created:** October 3, 2025  
**Status:** Planning Phase  
**Priority:** HIGH

## Overview

Implement a checkbox-based role filter for the User Stories Journey View, matching the functionality from the Page List View. The filter will be added to both the **User Stories** tab and the **Page Usage** tab.

## Current State Analysis

### Page List View Reference Implementation

**File:** `src/webviews/pageListView.js` + `src/commands/pageListCommands.ts`

**Key Components:**

1. **Data Structure:**
   ```javascript
   // Track unique values for filter dropdowns
   let filterOptions = {
       rolesRequired: []
   };
   
   // Track selected roles for filtering (Set for efficient lookup)
   let selectedRoles = new Set();
   ```

2. **HTML Structure (per tab):**
   ```html
   <div class="filter-row">
       <div class="filter-group filter-group-roles">
           <label>Role Required:</label>
           <div id="filterRoleRequired" class="role-filter-checkboxes"></div>
       </div>
   </div>
   ```

3. **CSS Styling:**
   ```css
   .filter-group-roles {
       flex: 1 1 100%;
       max-width: 100%;
   }
   .role-filter-checkboxes {
       display: flex;
       flex-wrap: wrap;
       gap: 12px;
       padding: 8px 0;
   }
   .role-checkbox-item {
       display: flex;
       align-items: center;
       gap: 6px;
       font-size: 12px;
       cursor: pointer;
       min-width: 120px;
   }
   .role-checkbox-item input[type="checkbox"] {
       margin: 0;
       cursor: pointer;
   }
   .role-checkbox-item label {
       cursor: pointer;
       color: var(--vscode-editor-foreground);
       user-select: none;
   }
   ```

4. **JavaScript Logic:**
   ```javascript
   // Extract unique roles from data
   function extractFilterOptions() {
       const rolesRequired = new Set();
       allItems.forEach(item => {
           if (item.roleRequired) {
               rolesRequired.add(item.roleRequired);
           }
       });
       filterOptions.rolesRequired = Array.from(rolesRequired).sort();
   }
   
   // Populate checkboxes (all checked by default)
   function populateFilterDropdowns() {
       selectedRoles.clear();
       filterOptions.rolesRequired.forEach(role => {
           const roleItem = document.createElement('div');
           roleItem.className = 'role-checkbox-item';
           
           const checkbox = document.createElement('input');
           checkbox.type = 'checkbox';
           checkbox.id = 'role-' + role + '-' + suffix;
           checkbox.value = role;
           checkbox.checked = true; // All checked by default
           checkbox.addEventListener('change', handleRoleFilterChange);
           
           const label = document.createElement('label');
           label.htmlFor = 'role-' + role + '-' + suffix;
           label.textContent = role;
           
           roleItem.appendChild(checkbox);
           roleItem.appendChild(label);
           roleRequiredContainer.appendChild(roleItem);
       });
       
       // Add all roles to selected roles (all selected by default)
       filterOptions.rolesRequired.forEach(role => {
           selectedRoles.add(role);
       });
   }
   
   // Handle checkbox changes
   function handleRoleFilterChange(event) {
       const checkbox = event.target;
       const role = checkbox.value;
       
       if (checkbox.checked) {
           selectedRoles.add(role);
       } else {
           selectedRoles.delete(role);
       }
       
       applyFilters();
   }
   
   // Apply filtering logic
   function applyFilters() {
       let filteredItems = allItems.filter(item => {
           // ... other filters ...
           const matchesRoleRequired = selectedRoles.size === 0 || selectedRoles.has(item.roleRequired);
           return matchesName && ... && matchesRoleRequired;
       });
       // ... render filtered items ...
   }
   
   // Clear filters - reset all checkboxes
   function clearFilters() {
       selectedRoles.clear();
       const roleCheckboxes = document.querySelectorAll('.role-checkbox-item input[type="checkbox"]');
       roleCheckboxes.forEach(checkbox => {
           checkbox.checked = false;
       });
       // ... reset other filters and show all items ...
   }
   ```

### User Stories Journey View Current State

**File:** `src/webviews/userStoriesJourneyView.js` + `src/commands/userStoriesJourneyCommands.ts`

**Current Tabs:**
1. **User Stories** - Shows story mappings with `pageRole` field
2. **Journey Analytics** - Visualizations (no filtering needed)
3. **Page Usage** - Shows page usage with `roleRequired` field

**Current Filter Structure (User Stories tab only):**
```javascript
function applyFilters() {
    const storyNumberFilter = document.getElementById('filterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('filterStoryText')?.value.toLowerCase() || '';
    const pageFilter = document.getElementById('filterPage')?.value.toLowerCase() || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        const matchesPage = !pageFilter || (item.page || '').toLowerCase().includes(pageFilter);
        
        return matchesStoryNumber && matchesStoryText && matchesPage;
    });
    // ... render ...
}
```

**Data Available:**
- User Stories tab: `item.pageRole` (already displayed in column)
- Page Usage tab: `page.roleRequired` (already displayed in column)

## Implementation Plan

### Phase 1: Add Data Structures (userStoriesJourneyView.js)

**Location:** Top of file after existing state variables

```javascript
// Keep track of unique values for filter dropdowns
let filterOptions = {
    rolesRequired: []
};

// Keep track of selected roles for filtering (Set for efficient lookup)
let selectedRoles = new Set();
```

### Phase 2: Add Filter Extraction Logic

**New Function:** After `clearFilters()`

```javascript
// Extract unique roles from data for filter checkboxes
function extractFilterOptions() {
    const rolesRequired = new Set();
    
    // Add "Public" for items without roles
    rolesRequired.add('Public');
    
    allItems.forEach(item => {
        const role = item.pageRole || 'Public';
        rolesRequired.add(role);
    });
    
    filterOptions.rolesRequired = Array.from(rolesRequired).sort();
}

// Populate role filter checkboxes
function populateRoleFilterCheckboxes() {
    const roleRequiredContainer = document.getElementById('filterRoleRequired');
    if (!roleRequiredContainer) return;
    
    // Clear existing checkboxes
    roleRequiredContainer.innerHTML = '';
    
    // Start with all roles selected
    selectedRoles.clear();
    
    filterOptions.rolesRequired.forEach(role => {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'role-' + role;
        checkbox.value = role;
        checkbox.checked = true; // Check all by default
        checkbox.addEventListener('change', handleRoleFilterChange);
        
        const label = document.createElement('label');
        label.htmlFor = 'role-' + role;
        label.textContent = role;
        
        roleItem.appendChild(checkbox);
        roleItem.appendChild(label);
        roleRequiredContainer.appendChild(roleItem);
        
        // Add to selected roles
        selectedRoles.add(role);
    });
}

// Handle role filter checkbox change
function handleRoleFilterChange(event) {
    const checkbox = event.target;
    const role = checkbox.value;
    
    if (checkbox.checked) {
        selectedRoles.add(role);
    } else {
        selectedRoles.delete(role);
    }
    
    // Apply filters with new role selection
    applyFilters();
}
```

### Phase 3: Update applyFilters() Function

**Modify:** Add role filtering logic

```javascript
function applyFilters() {
    const storyNumberFilter = document.getElementById('filterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('filterStoryText')?.value.toLowerCase() || '';
    const pageFilter = document.getElementById('filterPage')?.value.toLowerCase() || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        const matchesPage = !pageFilter || (item.page || '').toLowerCase().includes(pageFilter);
        
        // Check if item's role is in the selected roles set
        const itemRole = item.pageRole || 'Public';
        const matchesRoleRequired = selectedRoles.size === 0 || selectedRoles.has(itemRole);
        
        return matchesStoryNumber && matchesStoryText && matchesPage && matchesRoleRequired;
    });
    
    // Update userStoriesJourneyData with filtered results
    userStoriesJourneyData.items = filteredItems;
    userStoriesJourneyData.totalRecords = filteredItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}
```

### Phase 4: Update clearFilters() Function

**Modify:** Reset role checkboxes

```javascript
function clearFilters() {
    document.getElementById('filterStoryNumber').value = '';
    document.getElementById('filterStoryText').value = '';
    document.getElementById('filterPage').value = '';
    
    // Clear role checkboxes and reset selected roles
    selectedRoles.clear();
    const roleCheckboxes = document.querySelectorAll('.role-checkbox-item input[type="checkbox"]');
    roleCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset to show all items
    userStoriesJourneyData.items = allItems.slice();
    userStoriesJourneyData.totalRecords = allItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}
```

### Phase 5: Update Message Handler

**Modify:** Call extraction and population functions when data loads

```javascript
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'loadUserStoriesJourneyData':
            // ... existing code ...
            allItems = userStoriesJourneyData.items.slice();
            
            // NEW: Extract and populate role filters
            extractFilterOptions();
            populateRoleFilterCheckboxes();
            
            renderTable();
            renderRecordInfo();
            hideSpinner();
            break;
        // ... other cases ...
    }
});
```

### Phase 6: Add HTML Structure (userStoriesJourneyCommands.ts)

**Location:** In the filter section of User Stories tab

**Before (line ~2833):**
```html
<div class="filter-row">
    <div class="filter-group">
        <label>Story Number:</label>
        <input type="text" id="filterStoryNumber" placeholder="Filter by story number...">
    </div>
    <div class="filter-group">
        <label>Story Text:</label>
        <input type="text" id="filterStoryText" placeholder="Filter by story text...">
    </div>
    <div class="filter-group">
        <label>Page:</label>
        <input type="text" id="filterPage" placeholder="Filter by page...">
    </div>
</div>
<div class="filter-actions">
    <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
</div>
```

**After:**
```html
<div class="filter-row">
    <div class="filter-group">
        <label>Story Number:</label>
        <input type="text" id="filterStoryNumber" placeholder="Filter by story number...">
    </div>
    <div class="filter-group">
        <label>Story Text:</label>
        <input type="text" id="filterStoryText" placeholder="Filter by story text...">
    </div>
    <div class="filter-group">
        <label>Page:</label>
        <input type="text" id="filterPage" placeholder="Filter by page...">
    </div>
</div>
<div class="filter-row">
    <div class="filter-group filter-group-roles">
        <label>Role Required:</label>
        <div id="filterRoleRequired" class="role-filter-checkboxes"></div>
    </div>
</div>
<div class="filter-actions">
    <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
</div>
```

### Phase 7: Add CSS Styling (userStoriesJourneyCommands.ts)

**Location:** In the `<style>` section

**Add after existing filter styles:**
```css
.filter-group-roles {
    flex: 1 1 100%;
    max-width: 100%;
}
.role-filter-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 8px 0;
}
.role-checkbox-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    cursor: pointer;
    min-width: 120px;
}
.role-checkbox-item input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
}
.role-checkbox-item label {
    cursor: pointer;
    color: var(--vscode-editor-foreground);
    user-select: none;
}
```

### Phase 8: Page Usage Tab Implementation

The Page Usage tab needs similar filtering but uses `page.roleRequired` instead of `item.pageRole`.

**New Variables (top of file):**
```javascript
// Page Usage tab filtering
let pageUsageAllItems = [];
let pageUsageSelectedRoles = new Set();
let pageUsageFilterOptions = {
    rolesRequired: []
};
```

**New Functions:**
```javascript
// Extract roles for Page Usage tab
function extractPageUsageFilterOptions() {
    const rolesRequired = new Set();
    rolesRequired.add('Public');
    
    pageUsageAllItems.forEach(page => {
        const role = page.roleRequired || 'Public';
        rolesRequired.add(role);
    });
    
    pageUsageFilterOptions.rolesRequired = Array.from(rolesRequired).sort();
}

// Populate Page Usage role filter checkboxes
function populatePageUsageRoleFilterCheckboxes() {
    const roleRequiredContainer = document.getElementById('filterRoleRequiredPageUsage');
    if (!roleRequiredContainer) return;
    
    roleRequiredContainer.innerHTML = '';
    pageUsageSelectedRoles.clear();
    
    pageUsageFilterOptions.rolesRequired.forEach(role => {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'role-page-usage-' + role;
        checkbox.value = role;
        checkbox.checked = true;
        checkbox.addEventListener('change', handlePageUsageRoleFilterChange);
        
        const label = document.createElement('label');
        label.htmlFor = 'role-page-usage-' + role;
        label.textContent = role;
        
        roleItem.appendChild(checkbox);
        roleItem.appendChild(label);
        roleRequiredContainer.appendChild(roleItem);
        
        pageUsageSelectedRoles.add(role);
    });
}

// Handle Page Usage role filter changes
function handlePageUsageRoleFilterChange(event) {
    const checkbox = event.target;
    const role = checkbox.value;
    
    if (checkbox.checked) {
        pageUsageSelectedRoles.add(role);
    } else {
        pageUsageSelectedRoles.delete(role);
    }
    
    renderPageUsageTable();
}
```

**Modify renderPageUsageTable():**
```javascript
function renderPageUsageTable() {
    // ... existing code ...
    
    // Apply role filtering
    let displayPages = pageUsageData.pages.filter(page => {
        const pageRole = page.roleRequired || 'Public';
        return pageUsageSelectedRoles.size === 0 || pageUsageSelectedRoles.has(pageRole);
    });
    
    // ... rest of rendering logic with displayPages instead of pageUsageData.pages ...
}
```

**HTML for Page Usage Tab:**
Add similar filter structure to the Page Usage tab's filter section with `id="filterRoleRequiredPageUsage"`.

## Testing Checklist

### User Stories Tab
- [ ] Role checkboxes appear after data loads
- [ ] All roles checked by default
- [ ] Unchecking a role filters out stories with that role
- [ ] Checking a role shows stories with that role
- [ ] "Public" option filters pages with no role
- [ ] Multiple role selection shows union of results
- [ ] Clear All button unchecks all role filters
- [ ] Sorting works with filtered data
- [ ] CSV export respects filters

### Page Usage Tab
- [ ] Role checkboxes appear after data loads
- [ ] Filtering works independently from User Stories tab
- [ ] All filtering behaviors match User Stories tab
- [ ] No interference with complexity treemap
- [ ] No interference with histogram

### Cross-Tab Behavior
- [ ] Switching tabs preserves filter state
- [ ] Each tab maintains independent role selections
- [ ] No console errors during tab switching

## Benefits

1. **Consistency:** Matches Page List View UX pattern
2. **Efficiency:** Users can focus on specific roles
3. **Usability:** Multiple role selection with visual checkboxes
4. **Performance:** Set-based filtering is O(1) lookup
5. **Accessibility:** Clear visual feedback of active filters

## Edge Cases

1. **No Roles in Data:** Show only "Public" checkbox
2. **All Checkboxes Unchecked:** Show no results (consistent with "show none")
3. **New Data Load:** Reset to all roles selected
4. **Missing Role Field:** Treat as "Public"

## Files Modified

1. `src/webviews/userStoriesJourneyView.js` (~100 lines added/modified)
2. `src/commands/userStoriesJourneyCommands.ts` (~50 lines CSS + ~30 lines HTML)

## Estimated Implementation Time

- Phase 1-7 (User Stories tab): **45 minutes**
- Phase 8 (Page Usage tab): **30 minutes**
- Testing: **30 minutes**
- Documentation: **15 minutes**

**Total: ~2 hours**

## Future Enhancements

1. "Select All" / "Deselect All" buttons
2. Role count badges (e.g., "Admin (15)")
3. Color-coded role indicators
4. Save filter preferences across sessions
