// Description: Story points management functions
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Story points options (Fibonacci sequence + ?)
 */
const STORY_POINTS_OPTIONS = ['?', '1', '2', '3', '5', '8', '13', '21'];

/**
 * Handle single story points change
 * @param {string} storyId - Story ID
 * @param {string} newPoints - New story points value
 */
function handleStoryPointsChange(storyId, newPoints) {
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
    item.storyPoints = newPoints;
    
    // Recalculate estimated end date if points changed and we have a start date
    if (item.startDate && newPoints && newPoints !== '?') {
        const estimatedEndDate = calculateEstimatedEndDate(
            item.startDate,
            parseInt(newPoints),
            devConfig
        );
        item.estimatedEndDate = estimatedEndDate;
    }
    
    // Build complete dev record and send to extension
    const devRecord = buildDevRecord(item);
    vscode.postMessage({
        command: 'saveDevChange',
        data: devRecord
    });
}

/**
 * Calculate total story points for given items
 * @param {Array} items - Items to calculate
 * @returns {number} Total story points (excluding '?' and empty)
 */
function calculateTotalPoints(items) {
    if (!items || items.length === 0) {
        return 0;
    }
    
    return items.reduce((total, item) => {
        const points = item.storyPoints;
        if (points && points !== '?' && !isNaN(points)) {
            return total + parseInt(points);
        }
        return total;
    }, 0);
}

/**
 * Calculate estimated end date based on story points
 * @param {string} startDate - Start date (ISO format)
 * @param {number} storyPoints - Number of story points
 * @param {Object} config - Dev configuration
 * @returns {string} Estimated end date (ISO format)
 */
function calculateEstimatedEndDate(startDate, storyPoints, config) {
    if (!startDate || !storyPoints || !config) {
        return '';
    }
    
    const hoursPerPoint = config.hoursPerPoint || 4;
    const totalHours = storyPoints * hoursPerPoint;
    
    // Get working hours per day from config (default 8)
    const workingHours = config.workingHours || { start: 9, end: 17 };
    const hoursPerDay = (workingHours.end - workingHours.start) || 8;
    
    // Calculate working days needed
    const daysNeeded = Math.ceil(totalHours / hoursPerDay);
    
    // Add working days to start date
    const start = new Date(startDate);
    let workingDaysAdded = 0;
    let currentDate = new Date(start);
    
    while (workingDaysAdded < daysNeeded) {
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDaysAdded++;
        }
    }
    
    return currentDate.toISOString().split('T')[0];
}

/**
 * Calculate velocity (average story points per sprint)
 * @param {Array} sprints - Array of sprint objects with completed stories
 * @returns {number} Average story points per sprint
 */
function calculateVelocity(sprints) {
    if (!sprints || sprints.length === 0) {
        return 0;
    }
    
    const completedSprints = sprints.filter(sprint => sprint.status === 'completed');
    if (completedSprints.length === 0) {
        return 0;
    }
    
    const totalPoints = completedSprints.reduce((sum, sprint) => {
        return sum + (sprint.completedPoints || 0);
    }, 0);
    
    return Math.round(totalPoints / completedSprints.length);
}

/**
 * Get story points distribution
 * @returns {Object} Object with points as keys and counts as values
 */
function getStoryPointsDistribution() {
    if (!allItems) {
        return {};
    }
    
    const distribution = {};
    STORY_POINTS_OPTIONS.forEach(points => {
        distribution[points] = allItems.filter(item => item.storyPoints === points).length;
    });
    
    return distribution;
}

/**
 * Get items with unknown story points ('?' or empty)
 * @returns {Array} Items without valid story points
 */
function getItemsWithoutPoints() {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => !item.storyPoints || item.storyPoints === '?');
}

/**
 * Get items by story points
 * @param {string} points - Story points value
 * @returns {Array} Items with the specified points
 */
function getItemsByStoryPoints(points) {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => item.storyPoints === points);
}

/**
 * Convert story points to hours
 * @param {string|number} storyPoints - Story points value
 * @param {Object} config - Dev configuration
 * @returns {number} Estimated hours
 */
function storyPointsToHours(storyPoints, config) {
    if (!storyPoints || storyPoints === '?') {
        return 0;
    }
    
    const points = parseInt(storyPoints);
    if (isNaN(points)) {
        return 0;
    }
    
    const hoursPerPoint = config?.hoursPerPoint || 4;
    return points * hoursPerPoint;
}

/**
 * Format story points for display
 * @param {string} points - Story points value
 * @returns {string} Formatted display string
 */
function formatStoryPoints(points) {
    if (!points) {
        return '(Not Set)';
    }
    if (points === '?') {
        return '? (Unknown)';
    }
    return points + ' points';
}

/**
 * Handle bulk story points update
 * @param {Array<string>} storyIds - Array of story IDs
 * @param {string} newPoints - New story points value
 */
function handleBulkStoryPointsUpdate(storyIds, newPoints) {
    if (!storyIds || storyIds.length === 0) {
        return;
    }
    
    // Update local state
    storyIds.forEach(storyId => {
        const item = allItems.find(i => i.storyId === storyId);
        if (item) {
            item.storyPoints = newPoints;
            
            // Recalculate estimated end date if we have a start date
            if (item.startDate && newPoints && newPoints !== '?') {
                const estimatedEndDate = calculateEstimatedEndDate(
                    item.startDate,
                    parseInt(newPoints),
                    devConfig
                );
                item.estimatedEndDate = estimatedEndDate;
            }
        }
    });
    
    // Send bulk update to extension
    vscode.postMessage({
        command: 'bulkUpdateStoryPoints',
        storyIds: storyIds,
        newPoints: newPoints
    });
    
    // Re-render table
    const filteredItems = getFilteredItems();
    renderTable(filteredItems, devConfig, currentSortState);
    
    // Clear selection
    clearSelection();
}

/**
 * Open bulk story points update modal
 */
function openBulkStoryPointsModal() {
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
            <h2 style="margin-top: 0; color: var(--vscode-foreground); font-size: 18px; font-weight: 600;">Bulk Story Points Update</h2>
            <p style="color: var(--vscode-descriptionForeground); margin: 10px 0 20px 0;">Update story points for ${selectedIds.length} selected user ${selectedIds.length === 1 ? 'story' : 'stories'}:</p>
            <div class="form-group" style="margin-bottom: 20px;">
                <label for="bulkStoryPointsSelect" style="display: block; margin-bottom: 6px; color: var(--vscode-foreground); font-weight: 500;">Story Points:</label>
                <select id="bulkStoryPointsSelect" class="form-control" style="width: 100%; padding: 6px 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px;">
                    ${STORY_POINTS_OPTIONS.map(points => `<option value="${points}">${points === '?' ? '? (Not Estimated)' : points + ' points'}</option>`).join('')}
                </select>
            </div>
            <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="applyBulkStoryPoints()" class="primary-button" style="padding: 6px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <i class="codicon codicon-check"></i> Apply
                </button>
                <button onclick="closeBulkStoryPointsModal()" class="secondary-button" style="padding: 6px 16px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <i class="codicon codicon-close"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus the select
    setTimeout(() => {
        document.getElementById('bulkStoryPointsSelect')?.focus();
    }, 100);
}

/**
 * Close bulk story points modal
 */
function closeBulkStoryPointsModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

/**
 * Apply bulk story points update
 */
function applyBulkStoryPoints() {
    const select = document.getElementById('bulkStoryPointsSelect');
    if (!select) {
        return;
    }
    
    const newPoints = select.value;
    const selectedIds = getSelectedStoryIds();
    
    handleBulkStoryPointsUpdate(selectedIds, newPoints);
    closeBulkStoryPointsModal();
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STORY_POINTS_OPTIONS,
        handleStoryPointsChange,
        handleBulkStoryPointsUpdate,
        openBulkStoryPointsModal,
        closeBulkStoryPointsModal,
        applyBulkStoryPoints,
        calculateTotalPoints,
        calculateEstimatedEndDate,
        calculateVelocity,
        getStoryPointsDistribution,
        getItemsWithoutPoints,
        getItemsByStoryPoints,
        storyPointsToHours,
        formatStoryPoints
    };
}
