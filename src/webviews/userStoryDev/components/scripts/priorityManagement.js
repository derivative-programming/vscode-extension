// Description: Priority management functions
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Priority levels
 */
const PRIORITY_LEVELS = [
    { value: 'low', label: 'Low', color: '#3794ff', sortOrder: 1 },
    { value: 'medium', label: 'Medium', color: '#ff9f40', sortOrder: 2 },
    { value: 'high', label: 'High', color: '#ff6b6b', sortOrder: 3 },
    { value: 'critical', label: 'Critical', color: '#ff4040', sortOrder: 4 }
];

/**
 * Handle single priority change
 * @param {string} storyId - Story ID
 * @param {string} newPriority - New priority value
 */
function handlePriorityChange(storyId, newPriority) {
    if (!storyId) {
        return;
    }
    
    // Find the item
    const item = allItems.find(i => i.storyId === storyId);
    if (!item) {
        console.error('Item not found:', storyId);
        return;
    }
    
    // Update local state
    item.priority = newPriority;
    
    // Build complete dev record and send to extension
    const devRecord = buildDevRecord(item);
    vscode.postMessage({
        command: 'saveDevChange',
        data: devRecord
    });
}

/**
 * Handle bulk priority update
 * @param {Array<string>} storyIds - Array of story IDs
 * @param {string} newPriority - New priority value
 */
function handleBulkPriorityUpdate(storyIds, newPriority) {
    if (!storyIds || storyIds.length === 0) {
        return;
    }
    
    // Update local state
    storyIds.forEach(storyId => {
        const item = allItems.find(i => i.storyId === storyId);
        if (item) {
            item.priority = newPriority;
        }
    });
    
    // Send bulk update to extension
    vscode.postMessage({
        command: 'bulkUpdatePriority',
        storyIds: storyIds,
        newPriority: newPriority
    });
    
    // Re-render table
    const filteredItems = getFilteredItems();
    renderTable(filteredItems, devConfig, currentSortState);
    
    // Clear selection
    clearSelection();
}

/**
 * Get priority label
 * @param {string} priorityValue - Priority value
 * @returns {string} Display label
 */
function getPriorityLabel(priorityValue) {
    const priority = PRIORITY_LEVELS.find(p => p.value === priorityValue);
    return priority ? priority.label : priorityValue || '(Not Set)';
}

/**
 * Get priority color
 * @param {string} priorityValue - Priority value
 * @returns {string} Color hex code
 */
function getPriorityColor(priorityValue) {
    const priority = PRIORITY_LEVELS.find(p => p.value === priorityValue);
    return priority ? priority.color : '#858585';
}

/**
 * Get priority badge HTML
 * @param {string} priorityValue - Priority value
 * @returns {string} HTML for priority badge
 */
function getPriorityBadgeHTML(priorityValue) {
    const color = getPriorityColor(priorityValue);
    const label = getPriorityLabel(priorityValue);
    return `<span class="priority-badge" style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 0.85em;">${label}</span>`;
}

/**
 * Sort items by priority (high to low)
 * @param {Array} items - Items to sort
 * @returns {Array} Sorted items
 */
function sortByPriority(items) {
    if (!items || items.length === 0) {
        return items;
    }
    
    return items.slice().sort((a, b) => {
        const aPriority = PRIORITY_LEVELS.find(p => p.value === a.priority);
        const bPriority = PRIORITY_LEVELS.find(p => p.value === b.priority);
        
        const aOrder = aPriority ? aPriority.sortOrder : 0;
        const bOrder = bPriority ? bPriority.sortOrder : 0;
        
        // Higher priority first (descending)
        return bOrder - aOrder;
    });
}

/**
 * Get items by priority
 * @param {string} priorityValue - Priority value
 * @returns {Array} Items with the specified priority
 */
function getItemsByPriority(priorityValue) {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => item.priority === priorityValue);
}

/**
 * Get priority counts
 * @returns {Object} Object with priority values as keys and counts as values
 */
function getPriorityCounts() {
    if (!allItems) {
        return {};
    }
    
    const counts = {};
    PRIORITY_LEVELS.forEach(priority => {
        counts[priority.value] = allItems.filter(item => item.priority === priority.value).length;
    });
    
    return counts;
}

/**
 * Open bulk priority update modal
 */
function openBulkPriorityModal() {
    const selectedIds = getSelectedStoryIds();
    if (selectedIds.length === 0) {
        vscode.postMessage({
            command: 'showMessage',
            type: 'warning',
            message: 'Please select at least one user story'
        });
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
        <div class="modal-content" style="background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 20px; max-width: 400px; width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <h2 style="margin-top: 0; color: var(--vscode-foreground); font-size: 18px; font-weight: 600;">Bulk Priority Update</h2>
            <p style="color: var(--vscode-descriptionForeground); margin: 10px 0 20px 0;">Update priority for ${selectedIds.length} selected user ${selectedIds.length === 1 ? 'story' : 'stories'}:</p>
            <div class="form-group" style="margin-bottom: 20px;">
                <label for="bulkPrioritySelect" style="display: block; margin-bottom: 6px; color: var(--vscode-foreground); font-weight: 500;">New Priority:</label>
                <select id="bulkPrioritySelect" class="form-control" style="width: 100%; padding: 6px 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px;">
                    ${PRIORITY_LEVELS.map(p => `<option value="${p.value}">${p.label}</option>`).join('')}
                </select>
            </div>
            <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="applyBulkPriority()" class="primary-button" style="padding: 6px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <i class="codicon codicon-check"></i> Apply
                </button>
                <button onclick="closeBulkPriorityModal()" class="secondary-button" style="padding: 6px 16px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <i class="codicon codicon-close"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus the select
    setTimeout(() => {
        document.getElementById('bulkPrioritySelect')?.focus();
    }, 100);
}

/**
 * Close bulk priority modal
 */
function closeBulkPriorityModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

/**
 * Apply bulk priority update
 */
function applyBulkPriority() {
    const select = document.getElementById('bulkPrioritySelect');
    if (!select) {
        return;
    }
    
    const newPriority = select.value;
    const selectedIds = getSelectedStoryIds();
    
    handleBulkPriorityUpdate(selectedIds, newPriority);
    closeBulkPriorityModal();
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PRIORITY_LEVELS,
        handlePriorityChange,
        handleBulkPriorityUpdate,
        getPriorityLabel,
        getPriorityColor,
        getPriorityBadgeHTML,
        sortByPriority,
        getItemsByPriority,
        getPriorityCounts,
        openBulkPriorityModal,
        closeBulkPriorityModal,
        applyBulkPriority
    };
}
