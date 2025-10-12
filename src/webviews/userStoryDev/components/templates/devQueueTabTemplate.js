// Description: Dev Queue Tab Template - drag-and-drop story ordering interface
// Created: October 12, 2025
// Last Modified: October 12, 2025

/**
 * Generate the Dev Queue Tab HTML
 * @param {Array} items - Array of all story items
 * @param {Object} config - Configuration object with developers, sprints, etc.
 * @returns {string} HTML string for the Dev Queue tab
 */
function generateDevQueueTab(items, config) {
    // Filter to incomplete stories only (not completed)
    const incompleteItems = items.filter(item => {
        return item.devStatus !== 'completed' && !item.isIgnored;
    });

    // Sort by queue position
    const sortedItems = sortByQueuePosition(incompleteItems);

    return `
        <div class="dev-queue-container">
            <div class="dev-queue-header">
                <h3>Development Queue</h3>
                <p class="dev-queue-description">
                    <span class="codicon codicon-info"></span>
                    Set the order in which user stories should be developed. 
                    Drag and drop items to reorder the queue. 
                    The queue position controls the display order in the Board tab swim lanes.
                    Click an item to view or edit its details.
                </p>
            </div>

            <div class="dev-queue-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Items:</span>
                    <span class="stat-value">${sortedItems.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">On Hold:</span>
                    <span class="stat-value">${sortedItems.filter(i => i.devStatus === 'on-hold').length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Ready:</span>
                    <span class="stat-value">${sortedItems.filter(i => i.devStatus === 'ready-for-dev').length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">In Progress:</span>
                    <span class="stat-value">${sortedItems.filter(i => i.devStatus === 'in-progress').length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Blocked:</span>
                    <span class="stat-value">${sortedItems.filter(i => i.devStatus === 'blocked').length}</span>
                </div>
            </div>

            <div class="dev-queue-actions">
                <button onclick="calculateQueueByDataObjectRank()" class="icon-button" title="Calculate queue positions based on data object hierarchy rank">
                    <span class="codicon codicon-symbol-class"></span>
                    Calculate Queue Position
                </button>
                <button onclick="autoSequenceQueue()" class="icon-button" title="Auto-sequence positions (10, 20, 30...)">
                    <span class="codicon codicon-list-ordered"></span>
                    Auto-Sequence
                </button>
                <button onclick="resetQueuePositions()" class="icon-button" title="Reset all positions to story numbers">
                    <span class="codicon codicon-debug-restart"></span>
                    Reset to Story Numbers
                </button>
            </div>

            <div class="dev-queue-list" id="devQueueList">
                ${generateDevQueueItems(sortedItems)}
            </div>
        </div>
    `;
}

/**
 * Generate individual queue items
 * @param {Array} items - Sorted array of incomplete items
 * @returns {string} HTML string for queue items
 */
function generateDevQueueItems(items) {
    if (items.length === 0) {
        return `
            <div class="empty-queue-message">
                <span class="codicon codicon-check-all"></span>
                <p>All stories are completed!</p>
            </div>
        `;
    }

    return items.map((item, index) => {
        const queuePosition = item.developmentQueuePosition !== undefined ? 
                              item.developmentQueuePosition : 
                              item.storyNumber;
        
        const statusClass = `status-${item.devStatus || 'on-hold'}`;
        const priorityClass = `priority-${item.priority || 'medium'}`;
        
        // Get status label
        const statusLabels = {
            'on-hold': 'On Hold',
            'ready-for-dev': 'Ready for Dev',
            'in-progress': 'In Progress',
            'blocked': 'Blocked'
        };
        const statusLabel = statusLabels[item.devStatus] || 'On Hold';

        // Get priority label
        const priorityLabels = {
            'critical': 'Critical',
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low'
        };
        const priorityLabel = priorityLabels[item.priority] || 'Medium';

        return `
            <div class="dev-queue-item ${statusClass}" 
                 draggable="true" 
                 data-story-id="${item.storyId}"
                 data-queue-position="${queuePosition}"
                 data-array-index="${index}">
                <div class="queue-item-handle">
                    <span class="codicon codicon-gripper"></span>
                </div>
                <div class="queue-item-content" onclick="openStoryModal('${item.storyId}')">
                    <div class="queue-item-header">
                        <span class="queue-item-position">#${queuePosition}</span>
                        <span class="queue-item-story-number">Story ${item.storyNumber}</span>
                        <span class="queue-item-status ${statusClass}">${statusLabel}</span>
                        <span class="queue-item-priority ${priorityClass}">${priorityLabel}</span>
                    </div>
                    <div class="queue-item-text">${item.storyText || 'No description'}</div>
                    <div class="queue-item-footer">
                        ${item.assignedTo ? `<span class="queue-item-assigned"><span class="codicon codicon-person"></span> ${item.assignedTo}</span>` : ''}
                        ${item.storyPoints && item.storyPoints !== '?' ? `<span class="queue-item-points"><span class="codicon codicon-pulse"></span> ${item.storyPoints} pts</span>` : ''}
                        ${item.sprintId ? `<span class="queue-item-sprint"><span class="codicon codicon-calendar"></span> Sprint</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Refresh the Dev Queue list with current data
 */
function refreshDevQueueList() {
    const listContainer = document.getElementById('devQueueList');
    if (!listContainer) {
        return;
    }

    // Filter to incomplete stories
    const incompleteItems = allItems.filter(item => {
        return item.devStatus !== 'completed' && !item.isIgnored;
    });

    // Sort by queue position
    const sortedItems = sortByQueuePosition(incompleteItems);

    // Update the list
    listContainer.innerHTML = generateDevQueueItems(sortedItems);

    // Reinitialize drag and drop
    initializeDevQueueDragDrop();

    // Update stats
    updateDevQueueStats(sortedItems);
}

/**
 * Update the statistics display
 */
function updateDevQueueStats(items) {
    const statsContainer = document.querySelector('.dev-queue-stats');
    if (!statsContainer) {
        return;
    }

    const statValues = statsContainer.querySelectorAll('.stat-value');
    if (statValues.length >= 5) {
        statValues[0].textContent = items.length; // Total
        statValues[1].textContent = items.filter(i => i.devStatus === 'on-hold').length;
        statValues[2].textContent = items.filter(i => i.devStatus === 'ready-for-dev').length;
        statValues[3].textContent = items.filter(i => i.devStatus === 'in-progress').length;
        statValues[4].textContent = items.filter(i => i.devStatus === 'blocked').length;
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateDevQueueTab,
        generateDevQueueItems,
        refreshDevQueueList,
        updateDevQueueStats
    };
}
