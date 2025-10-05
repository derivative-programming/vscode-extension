// Description: Filter functions for Details Tab
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Apply all active filters to the items
 * @returns {Array} Filtered items
 */
function applyFilters() {
    if (!allItems || allItems.length === 0) {
        return [];
    }
    
    // Get filter values
    const storyNumberFilter = document.getElementById('filterStoryNumber')?.value.toLowerCase().trim() || '';
    const storyTextFilter = document.getElementById('filterStoryText')?.value.toLowerCase().trim() || '';
    const devStatusFilter = document.getElementById('filterDevStatus')?.value || '';
    const priorityFilter = document.getElementById('filterPriority')?.value || '';
    const assignedToFilter = document.getElementById('filterAssignedTo')?.value || '';
    const sprintFilter = document.getElementById('filterSprint')?.value || '';
    
    // Filter items
    const filteredItems = allItems.filter(item => {
        // Story Number filter
        if (storyNumberFilter && !item.storyNumber?.toLowerCase().includes(storyNumberFilter)) {
            return false;
        }
        
        // Story Text filter
        if (storyTextFilter && !item.storyText?.toLowerCase().includes(storyTextFilter)) {
            return false;
        }
        
        // Dev Status filter
        if (devStatusFilter && item.devStatus !== devStatusFilter) {
            return false;
        }
        
        // Priority filter
        if (priorityFilter && item.priority !== priorityFilter) {
            return false;
        }
        
        // Assigned To filter
        if (assignedToFilter && item.assignedTo !== assignedToFilter) {
            return false;
        }
        
        // Sprint filter
        if (sprintFilter && item.sprint !== sprintFilter) {
            return false;
        }
        
        return true;
    });
    
    // Re-render the table with filtered items
    if (typeof renderTable === 'function') {
        renderTable(filteredItems, devConfig, currentSortState);
        updateRecordInfo(filteredItems.length, allItems.length);
    }
    
    return filteredItems;
}

/**
 * Clear all filters and show all items
 */
function clearFilters() {
    // Clear all filter inputs
    const filterInputs = [
        'filterStoryNumber',
        'filterStoryText',
        'filterDevStatus',
        'filterPriority',
        'filterAssignedTo',
        'filterSprint'
    ];
    
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'SELECT') {
                element.selectedIndex = 0;
            } else {
                element.value = '';
            }
        }
    });
    
    // Re-render with all items
    if (typeof renderTable === 'function' && allItems) {
        renderTable(allItems, devConfig, currentSortState);
        updateRecordInfo(allItems.length, allItems.length);
    }
}

/**
 * Get currently filtered items (without re-rendering)
 * @returns {Array} Filtered items
 */
function getFilteredItems() {
    if (!allItems || allItems.length === 0) {
        return [];
    }
    
    // Get filter values
    const storyNumberFilter = document.getElementById('filterStoryNumber')?.value.toLowerCase().trim() || '';
    const storyTextFilter = document.getElementById('filterStoryText')?.value.toLowerCase().trim() || '';
    const devStatusFilter = document.getElementById('filterDevStatus')?.value || '';
    const priorityFilter = document.getElementById('filterPriority')?.value || '';
    const assignedToFilter = document.getElementById('filterAssignedTo')?.value || '';
    const sprintFilter = document.getElementById('filterSprint')?.value || '';
    
    // Return all items if no filters are active
    if (!storyNumberFilter && !storyTextFilter && !devStatusFilter && 
        !priorityFilter && !assignedToFilter && !sprintFilter) {
        return allItems;
    }
    
    // Filter items
    return allItems.filter(item => {
        if (storyNumberFilter && !item.storyNumber?.toLowerCase().includes(storyNumberFilter)) {
            return false;
        }
        if (storyTextFilter && !item.storyText?.toLowerCase().includes(storyTextFilter)) {
            return false;
        }
        if (devStatusFilter && item.devStatus !== devStatusFilter) {
            return false;
        }
        if (priorityFilter && item.priority !== priorityFilter) {
            return false;
        }
        if (assignedToFilter && item.assignedTo !== assignedToFilter) {
            return false;
        }
        if (sprintFilter && item.sprint !== sprintFilter) {
            return false;
        }
        return true;
    });
}

/**
 * Toggle filter section expand/collapse
 */
function toggleFilterSection() {
    const filterContent = document.getElementById('filterContent');
    const chevron = document.getElementById('filterChevron');
    
    if (!filterContent || !chevron) {
        return;
    }
    
    const isExpanded = filterContent.style.display !== 'none';
    
    if (isExpanded) {
        filterContent.style.display = 'none';
        chevron.classList.remove('codicon-chevron-down');
        chevron.classList.add('codicon-chevron-right');
    } else {
        filterContent.style.display = 'block';
        chevron.classList.remove('codicon-chevron-right');
        chevron.classList.add('codicon-chevron-down');
    }
}

/**
 * Update the record info display
 * @param {number} filteredCount - Number of filtered items
 * @param {number} totalCount - Total number of items
 */
function updateRecordInfo(filteredCount, totalCount) {
    const recordInfo = document.getElementById('recordInfo');
    if (!recordInfo) {
        return;
    }
    
    if (filteredCount === totalCount) {
        recordInfo.textContent = `Showing ${totalCount} user stories`;
    } else {
        recordInfo.textContent = `Showing ${filteredCount} of ${totalCount} user stories (filtered)`;
    }
}

/**
 * Check if any filters are active
 * @returns {boolean} True if any filter has a value
 */
function hasActiveFilters() {
    const storyNumberFilter = document.getElementById('filterStoryNumber')?.value.trim() || '';
    const storyTextFilter = document.getElementById('filterStoryText')?.value.trim() || '';
    const devStatusFilter = document.getElementById('filterDevStatus')?.value || '';
    const priorityFilter = document.getElementById('filterPriority')?.value || '';
    const assignedToFilter = document.getElementById('filterAssignedTo')?.value || '';
    const sprintFilter = document.getElementById('filterSprint')?.value || '';
    
    return !!(storyNumberFilter || storyTextFilter || devStatusFilter || 
              priorityFilter || assignedToFilter || sprintFilter);
}

/**
 * Set up event listeners for filter inputs (auto-apply on change)
 */
function setupFilterEventListeners() {
    const textInputs = ['filterStoryNumber', 'filterStoryText'];
    
    // Auto-apply on text input changes
    textInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                applyFilters();
            });
        }
    });
    
    // Auto-apply on dropdown changes
    const dropdowns = [
        'filterDevStatus',
        'filterPriority',
        'filterAssignedTo',
        'filterSprint'
    ];
    
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', () => {
                applyFilters();
            });
        }
    });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyFilters,
        clearFilters,
        getFilteredItems,
        toggleFilterSection,
        updateRecordInfo,
        hasActiveFilters,
        setupFilterEventListeners
    };
}
