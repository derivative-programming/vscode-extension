// Description: Row selection and bulk action functions
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Handle individual row checkbox selection
 * @param {string} storyId - Story ID
 * @param {boolean} isChecked - Whether checkbox is checked
 */
function handleRowSelection(storyId, isChecked) {
    if (!selectedItems) {
        selectedItems = new Set();
    }
    
    if (isChecked) {
        selectedItems.add(storyId);
    } else {
        selectedItems.delete(storyId);
    }
    
    // Update select all checkbox state
    updateSelectAllCheckbox();
    
    // Enable/disable bulk action buttons
    updateBulkActionButtons();
}

/**
 * Handle "Select All" checkbox
 * @param {boolean} isChecked - Whether checkbox is checked
 */
function handleSelectAll(isChecked) {
    if (!selectedItems) {
        selectedItems = new Set();
    }
    
    // Get currently visible items (respecting filters)
    const visibleItems = getFilteredItems();
    
    if (isChecked) {
        // Add all visible items to selection
        visibleItems.forEach(item => {
            selectedItems.add(item.storyId);
        });
    } else {
        // Remove all visible items from selection
        visibleItems.forEach(item => {
            selectedItems.delete(item.storyId);
        });
    }
    
    // Update all row checkboxes
    updateAllRowCheckboxes();
    
    // Enable/disable bulk action buttons
    updateBulkActionButtons();
}

/**
 * Select all rows (programmatically)
 */
function selectAllRows() {
    handleSelectAll(true);
}

/**
 * Deselect all rows (programmatically)
 */
function deselectAllRows() {
    handleSelectAll(false);
}

/**
 * Update the state of the "Select All" checkbox
 */
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllCheckbox) {
        return;
    }
    
    const visibleItems = getFilteredItems();
    if (visibleItems.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }
    
    const visibleSelectedCount = visibleItems.filter(item => 
        selectedItems.has(item.storyId)
    ).length;
    
    if (visibleSelectedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (visibleSelectedCount === visibleItems.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

/**
 * Update all row checkboxes to match selectedItems set
 */
function updateAllRowCheckboxes() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
        const storyId = checkbox.dataset.storyId;
        checkbox.checked = selectedItems.has(storyId);
    });
}

/**
 * Enable or disable bulk action buttons based on selection
 */
function updateBulkActionButtons() {
    const bulkButtons = [
        'bulkStatusBtn',
        'bulkPriorityBtn',
        'bulkAssignmentBtn',
        'bulkSprintBtn'
    ];
    
    const hasSelection = selectedItems && selectedItems.size > 0;
    
    bulkButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = !hasSelection;
        }
    });
}

/**
 * Get array of selected story IDs
 * @returns {Array<string>} Array of selected story IDs
 */
function getSelectedStoryIds() {
    return Array.from(selectedItems);
}

/**
 * Get array of selected story items
 * @returns {Array<Object>} Array of selected story objects
 */
function getSelectedStoryItems() {
    if (!allItems || !selectedItems || selectedItems.size === 0) {
        return [];
    }
    
    return allItems.filter(item => selectedItems.has(item.storyId));
}

/**
 * Clear all selections
 */
function clearSelection() {
    if (selectedItems) {
        selectedItems.clear();
    }
    updateAllRowCheckboxes();
    updateSelectAllCheckbox();
    updateBulkActionButtons();
}

/**
 * Handle sort column click
 * @param {string} columnKey - Column key to sort by
 */
function handleSort(columnKey) {
    // Determine new sort state
    let descending = false;
    if (currentSortState && currentSortState.column === columnKey) {
        // Toggle direction if same column
        descending = !currentSortState.descending;
    }
    
    // Update global sort state
    currentSortState = { column: columnKey, descending: descending };
    
    // Send sort request to extension
    vscode.postMessage({
        command: 'sortDevTable',
        column: columnKey,
        descending: descending
    });
}

/**
 * Refresh data from extension
 */
function refreshData() {
    showSpinner();
    vscode.postMessage({ command: 'refresh' });
}

/**
 * Export current view to CSV
 */
function exportToCSV() {
    console.log('[UserStoryDev] Download CSV button clicked');
    vscode.postMessage({
        command: 'downloadCsv'
    });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleRowSelection,
        handleSelectAll,
        selectAllRows,
        deselectAllRows,
        updateSelectAllCheckbox,
        updateAllRowCheckboxes,
        updateBulkActionButtons,
        getSelectedStoryIds,
        getSelectedStoryItems,
        clearSelection,
        handleSort,
        refreshData,
        exportToCSV
    };
}
