// Description: Template generator for Kanban Board Tab
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Generate the HTML for the Board Tab (Kanban view)
 * @param {Array} items - Array of user story dev items
 * @param {Object} config - Dev configuration
 * @returns {string} HTML string for the board tab
 */
function generateBoardTab(items, config) {
    return `
        <div class="board-container">
            <!-- Board Header with Filters and Controls -->
            <div class="board-header">
                <div class="board-title">
                    <h3>Development Board</h3>
                    <span class="board-subtitle">${items ? items.length : 0} total stories</span>
                </div>
                <div class="board-controls">
                    <div class="board-filter-group">
                        <label for="boardFilterDeveloper">Filter by Developer:</label>
                        <select id="boardFilterDeveloper" onchange="filterBoard()">
                            <option value="">All Developers</option>
                            ${generateDeveloperFilterOptions(config.developers)}
                        </select>
                    </div>
                    <div class="board-filter-group">
                        <label for="boardFilterPriority">Filter by Priority:</label>
                        <select id="boardFilterPriority" onchange="filterBoard()">
                            <option value="">All Priorities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div class="board-filter-group">
                        <label for="boardFilterSprint">Filter by Sprint:</label>
                        <select id="boardFilterSprint" onchange="filterBoard()">
                            <option value="">All Sprints</option>
                            ${generateSprintFilterOptions(config.sprints)}
                        </select>
                    </div>
                    <button onclick="clearBoardFilters()" class="board-clear-btn">
                        <i class="codicon codicon-clear-all"></i> Clear Filters
                    </button>
                </div>
            </div>

            <!-- Kanban Board -->
            <div class="kanban-board" id="kanbanBoard">
                ${generateKanbanColumns()}
            </div>

            <!-- Board Footer with Statistics -->
            <div class="board-footer">
                <div class="board-stats" id="boardStats">
                    <div class="stat-item">
                        <span class="stat-label">Total Stories:</span>
                        <span class="stat-value" id="statTotal">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">In Progress:</span>
                        <span class="stat-value" id="statInProgress">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Blocked:</span>
                        <span class="stat-value" id="statBlocked">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Completed:</span>
                        <span class="stat-value" id="statCompleted">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Points:</span>
                        <span class="stat-value" id="statPoints">0</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate the 5 Kanban columns
 */
function generateKanbanColumns() {
    const columns = [
        { id: 'on-hold', label: 'On Hold', icon: 'circle-slash' },
        { id: 'ready-for-dev', label: 'Ready for Dev', icon: 'check' },
        { id: 'in-progress', label: 'In Progress', icon: 'sync' },
        { id: 'blocked', label: 'Blocked', icon: 'error' },
        { id: 'completed', label: 'Completed', icon: 'pass' }
    ];

    return columns.map(column => `
        <div class="kanban-column" data-status="${column.id}">
            <div class="column-header">
                <div class="column-title">
                    <i class="codicon codicon-${column.icon}"></i>
                    <span>${column.label}</span>
                </div>
                <div class="column-count" id="count-${column.id}">0</div>
            </div>
            <div class="column-body" 
                 id="column-${column.id}" 
                 data-status="${column.id}"
                 ondrop="handleDrop(event)" 
                 ondragover="handleDragOver(event)"
                 ondragleave="handleDragLeave(event)">
                <!-- Cards will be dynamically inserted here -->
            </div>
        </div>
    `).join('');
}

/**
 * Generate developer filter options
 */
function generateDeveloperFilterOptions(developers) {
    if (!developers || developers.length === 0) {
        return '';
    }
    
    return developers
        .filter(dev => dev.active !== false)
        .map(dev => `<option value="${dev.name}">${dev.name}</option>`)
        .join('');
}

/**
 * Generate sprint filter options
 */
function generateSprintFilterOptions(sprints) {
    if (!sprints || sprints.length === 0) {
        return '';
    }
    
    return sprints
        .map(sprint => `<option value="${sprint.sprintId}">${sprint.sprintName}</option>`)
        .join('');
}

/**
 * Generate empty state for a column
 */
function generateColumnEmptyState() {
    return `
        <div class="column-empty-state">
            <i class="codicon codicon-inbox"></i>
            <span>No stories</span>
        </div>
    `;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateBoardTab,
        generateKanbanColumns,
        generateDeveloperFilterOptions,
        generateSprintFilterOptions,
        generateColumnEmptyState
    };
}
