// Description: Developer and sprint assignment management functions
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Handle single developer assignment
 * @param {string} storyId - Story ID
 * @param {string} developerId - Developer name/ID
 */
function handleDeveloperAssignment(storyId, developerId) {
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
    item.assignedTo = developerId;
    
    // Build complete dev record and send to extension
    const devRecord = buildDevRecord(item);
    vscode.postMessage({
        command: 'saveDevChange',
        data: devRecord
    });
}

/**
 * Handle bulk developer assignment
 * @param {Array<string>} storyIds - Array of story IDs
 * @param {string} developerId - Developer name/ID
 */
function handleBulkAssignment(storyIds, developerId) {
    if (!storyIds || storyIds.length === 0) {
        return;
    }
    
    // Update local state
    storyIds.forEach(storyId => {
        const item = allItems.find(i => i.storyId === storyId);
        if (item) {
            item.assignedTo = developerId;
        }
    });
    
    // Send bulk update to extension
    vscode.postMessage({
        command: 'bulkUpdateAssignment',
        storyIds: storyIds,
        developerId: developerId
    });
    
    // Re-render table
    const filteredItems = getFilteredItems();
    renderTable(filteredItems, devConfig, currentSortState);
    
    // Clear selection
    clearSelection();
}

/**
 * Get available developers from config
 * @param {Object} config - Dev configuration
 * @returns {Array} Array of developer objects
 */
function getAvailableDevelopers(config) {
    if (!config || !config.developers) {
        return [];
    }
    return config.developers.filter(dev => dev.active !== false);
}

/**
 * Get items assigned to a developer
 * @param {string} developerId - Developer name/ID
 * @returns {Array} Items assigned to the developer
 */
function getItemsByDeveloper(developerId) {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => item.assignedTo === developerId);
}

/**
 * Get unassigned items
 * @returns {Array} Items without developer assignment
 */
function getUnassignedItems() {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => !item.assignedTo);
}

/**
 * Get developer workload (total story points)
 * @param {string} developerId - Developer name/ID
 * @returns {number} Total story points assigned to developer
 */
function getDeveloperWorkload(developerId) {
    const items = getItemsByDeveloper(developerId);
    return calculateTotalPoints(items);
}

/**
 * Get all developer workloads
 * @param {Object} config - Dev configuration
 * @returns {Array} Array of { developer, workload, itemCount }
 */
function getAllDeveloperWorkloads(config) {
    const developers = getAvailableDevelopers(config);
    
    return developers.map(dev => {
        const items = getItemsByDeveloper(dev.name);
        return {
            developer: dev.name,
            workload: calculateTotalPoints(items),
            itemCount: items.length
        };
    }).sort((a, b) => b.workload - a.workload); // Sort by workload descending
}

/**
 * Handle single sprint assignment
 * @param {string} storyId - Story ID
 * @param {string} sprintId - Sprint ID
 */
function handleSprintAssignment(storyId, sprintId) {
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
    item.sprint = sprintId;
    
    // Build complete dev record and send to extension
    const devRecord = buildDevRecord(item);
    vscode.postMessage({
        command: 'saveDevChange',
        data: devRecord
    });
}

/**
 * Handle bulk sprint assignment
 * @param {Array<string>} storyIds - Array of story IDs
 * @param {string} sprintId - Sprint ID
 */
function handleBulkSprintAssignment(storyIds, sprintId) {
    if (!storyIds || storyIds.length === 0) {
        return;
    }
    
    // Update local state
    storyIds.forEach(storyId => {
        const item = allItems.find(i => i.storyId === storyId);
        if (item) {
            item.sprint = sprintId;
        }
    });
    
    // Send bulk update to extension
    vscode.postMessage({
        command: 'bulkUpdateSprint',
        storyIds: storyIds,
        sprintId: sprintId
    });
    
    // Re-render table
    const filteredItems = getFilteredItems();
    renderTable(filteredItems, devConfig, currentSortState);
    
    // Clear selection
    clearSelection();
}

/**
 * Get items in a sprint
 * @param {string} sprintId - Sprint ID
 * @returns {Array} Items in the sprint
 */
function getItemsBySprint(sprintId) {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => item.sprint === sprintId);
}

/**
 * Get items without sprint assignment (backlog)
 * @returns {Array} Items not assigned to any sprint
 */
function getBacklogItems() {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => !item.sprint);
}

/**
 * Get sprint workload (total story points in sprint)
 * @param {string} sprintId - Sprint ID
 * @returns {number} Total story points in sprint
 */
function getSprintWorkload(sprintId) {
    const items = getItemsBySprint(sprintId);
    return calculateTotalPoints(items);
}

/**
 * Open bulk assignment modal
 */
function openBulkAssignmentModal() {
    const selectedIds = getSelectedStoryIds();
    if (selectedIds.length === 0) {
        vscode.postMessage({
            command: 'showMessage',
            type: 'warning',
            message: 'Please select at least one user story'
        });
        return;
    }
    
    const developers = getAvailableDevelopers(devConfig);
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h2>Bulk Developer Assignment</h2>
            <p>Assign ${selectedIds.length} selected user ${selectedIds.length === 1 ? 'story' : 'stories'} to:</p>
            <div class="form-group">
                <label for="bulkAssignmentSelect">Developer:</label>
                <select id="bulkAssignmentSelect" class="form-control">
                    <option value="">(Unassigned)</option>
                    ${developers.map(dev => `<option value="${dev.name}">${dev.name}</option>`).join('')}
                </select>
            </div>
            <div class="modal-actions">
                <button onclick="applyBulkAssignment()" class="primary-button">
                    <i class="codicon codicon-check"></i> Assign
                </button>
                <button onclick="closeBulkAssignmentModal()" class="secondary-button">
                    <i class="codicon codicon-close"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus the select
    setTimeout(() => {
        document.getElementById('bulkAssignmentSelect')?.focus();
    }, 100);
}

/**
 * Close bulk assignment modal
 */
function closeBulkAssignmentModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

/**
 * Apply bulk assignment
 */
function applyBulkAssignment() {
    const select = document.getElementById('bulkAssignmentSelect');
    if (!select) {
        return;
    }
    
    const developerId = select.value;
    const selectedIds = getSelectedStoryIds();
    
    handleBulkAssignment(selectedIds, developerId);
    closeBulkAssignmentModal();
}

/**
 * Open bulk sprint assignment modal
 */
function openBulkSprintModal() {
    const selectedIds = getSelectedStoryIds();
    if (selectedIds.length === 0) {
        vscode.postMessage({
            command: 'showMessage',
            type: 'warning',
            message: 'Please select at least one user story'
        });
        return;
    }
    
    const sprints = devConfig?.sprints || [];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h2>Bulk Sprint Assignment</h2>
            <p>Assign ${selectedIds.length} selected user ${selectedIds.length === 1 ? 'story' : 'stories'} to:</p>
            <div class="form-group">
                <label for="bulkSprintSelect">Sprint:</label>
                <select id="bulkSprintSelect" class="form-control">
                    <option value="">(No Sprint / Backlog)</option>
                    ${sprints.map(sprint => `<option value="${sprint.sprintId}">${sprint.sprintName}</option>`).join('')}
                </select>
            </div>
            <div class="modal-actions">
                <button onclick="applyBulkSprintAssignment()" class="primary-button">
                    <i class="codicon codicon-check"></i> Assign
                </button>
                <button onclick="closeBulkSprintModal()" class="secondary-button">
                    <i class="codicon codicon-close"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus the select
    setTimeout(() => {
        document.getElementById('bulkSprintSelect')?.focus();
    }, 100);
}

/**
 * Close bulk sprint modal
 */
function closeBulkSprintModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

/**
 * Apply bulk sprint assignment
 */
function applyBulkSprintAssignment() {
    const select = document.getElementById('bulkSprintSelect');
    if (!select) {
        return;
    }
    
    const sprintId = select.value;
    const selectedIds = getSelectedStoryIds();
    
    handleBulkSprintAssignment(selectedIds, sprintId);
    closeBulkSprintModal();
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleDeveloperAssignment,
        handleBulkAssignment,
        getAvailableDevelopers,
        getItemsByDeveloper,
        getUnassignedItems,
        getDeveloperWorkload,
        getAllDeveloperWorkloads,
        handleSprintAssignment,
        handleBulkSprintAssignment,
        getItemsBySprint,
        getBacklogItems,
        getSprintWorkload,
        openBulkAssignmentModal,
        closeBulkAssignmentModal,
        applyBulkAssignment,
        openBulkSprintModal,
        closeBulkSprintModal,
        applyBulkSprintAssignment
    };
}
