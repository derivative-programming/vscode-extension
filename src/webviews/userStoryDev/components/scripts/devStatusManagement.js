// Description: Development status management functions
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Development statuses
 */
const DEV_STATUSES = [
    { value: 'on-hold', label: 'On Hold', color: '#858585' },
    { value: 'ready-for-dev', label: 'Ready for Development', color: '#3794ff' },
    { value: 'in-progress', label: 'In Progress', color: '#ff9f40' },
    { value: 'blocked', label: 'Blocked', color: '#ff4040' },
    { value: 'completed', label: 'Completed', color: '#2ea043' }
];

/**
 * Handle single dev status change
 * @param {string} storyId - Story ID
 * @param {string} newStatus - New status value
 */
function handleDevStatusChange(storyId, newStatus) {
    if (!storyId) {
        return;
    }
    
    // Find the item
    const item = allItems.find(i => i.storyId === storyId);
    if (!item) {
        console.error('Item not found:', storyId);
        return;
    }
    
    // Update local state immediately for responsive UI
    item.devStatus = newStatus;
    
    // Auto-set start date if moving to in-progress and no start date
    if (newStatus === 'in-progress' && !item.startDate) {
        item.startDate = new Date().toISOString().split('T')[0];
    }
    
    // Auto-set actual end date if moving to completed and no end date
    if (newStatus === 'completed' && !item.actualEndDate) {
        item.actualEndDate = new Date().toISOString().split('T')[0];
    }
    
    // Send update to extension
    vscode.postMessage({
        command: 'saveDevChange',
        storyId: storyId,
        changes: {
            devStatus: newStatus,
            startDate: item.startDate,
            actualEndDate: item.actualEndDate
        }
    });
}

/**
 * Handle bulk dev status update
 * @param {Array<string>} storyIds - Array of story IDs
 * @param {string} newStatus - New status value
 */
function handleBulkStatusUpdate(storyIds, newStatus) {
    if (!storyIds || storyIds.length === 0) {
        return;
    }
    
    // Update local state
    storyIds.forEach(storyId => {
        const item = allItems.find(i => i.storyId === storyId);
        if (item) {
            item.devStatus = newStatus;
            
            // Auto-set dates
            if (newStatus === 'in-progress' && !item.startDate) {
                item.startDate = new Date().toISOString().split('T')[0];
            }
            if (newStatus === 'completed' && !item.actualEndDate) {
                item.actualEndDate = new Date().toISOString().split('T')[0];
            }
        }
    });
    
    // Send bulk update to extension
    vscode.postMessage({
        command: 'bulkUpdateDevStatus',
        storyIds: storyIds,
        newStatus: newStatus
    });
    
    // Re-render table to show changes
    const filteredItems = getFilteredItems();
    renderTable(filteredItems, devConfig, currentSortState);
    
    // Clear selection after bulk operation
    clearSelection();
}

/**
 * Get status display label
 * @param {string} statusValue - Status value
 * @returns {string} Display label
 */
function getStatusLabel(statusValue) {
    const status = DEV_STATUSES.find(s => s.value === statusValue);
    return status ? status.label : statusValue || '(Not Set)';
}

/**
 * Get status color
 * @param {string} statusValue - Status value
 * @returns {string} Color hex code
 */
function getStatusColor(statusValue) {
    const status = DEV_STATUSES.find(s => s.value === statusValue);
    return status ? status.color : '#858585';
}

/**
 * Get status badge HTML
 * @param {string} statusValue - Status value
 * @returns {string} HTML for status badge
 */
function getStatusBadgeHTML(statusValue) {
    const color = getStatusColor(statusValue);
    const label = getStatusLabel(statusValue);
    return `<span class="status-badge" style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 0.85em;">${label}</span>`;
}

/**
 * Validate status transition (optional - for future use)
 * @param {string} oldStatus - Current status
 * @param {string} newStatus - New status
 * @returns {Object} { valid: boolean, message: string }
 */
function validateStatusTransition(oldStatus, newStatus) {
    // Currently all transitions are allowed
    // Can add workflow rules here in the future
    return { valid: true, message: '' };
}

/**
 * Get items by status
 * @param {string} statusValue - Status value
 * @returns {Array} Items with the specified status
 */
function getItemsByStatus(statusValue) {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => item.devStatus === statusValue);
}

/**
 * Get status counts
 * @returns {Object} Object with status values as keys and counts as values
 */
function getStatusCounts() {
    if (!allItems) {
        return {};
    }
    
    const counts = {};
    DEV_STATUSES.forEach(status => {
        counts[status.value] = allItems.filter(item => item.devStatus === status.value).length;
    });
    
    return counts;
}

/**
 * Open bulk status update modal
 */
function openBulkStatusModal() {
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
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h2>Bulk Status Update</h2>
            <p>Update status for ${selectedIds.length} selected user ${selectedIds.length === 1 ? 'story' : 'stories'}:</p>
            <div class="form-group">
                <label for="bulkStatusSelect">New Status:</label>
                <select id="bulkStatusSelect" class="form-control">
                    ${DEV_STATUSES.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
                </select>
            </div>
            <div class="modal-actions">
                <button onclick="applyBulkStatus()" class="primary-button">
                    <i class="codicon codicon-check"></i> Apply
                </button>
                <button onclick="closeBulkStatusModal()" class="secondary-button">
                    <i class="codicon codicon-close"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus the select
    setTimeout(() => {
        document.getElementById('bulkStatusSelect')?.focus();
    }, 100);
}

/**
 * Close bulk status modal
 */
function closeBulkStatusModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

/**
 * Apply bulk status update
 */
function applyBulkStatus() {
    const select = document.getElementById('bulkStatusSelect');
    if (!select) {
        return;
    }
    
    const newStatus = select.value;
    const selectedIds = getSelectedStoryIds();
    
    handleBulkStatusUpdate(selectedIds, newStatus);
    closeBulkStatusModal();
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEV_STATUSES,
        handleDevStatusChange,
        handleBulkStatusUpdate,
        getStatusLabel,
        getStatusColor,
        getStatusBadgeHTML,
        validateStatusTransition,
        getItemsByStatus,
        getStatusCounts,
        openBulkStatusModal,
        closeBulkStatusModal,
        applyBulkStatus
    };
}
