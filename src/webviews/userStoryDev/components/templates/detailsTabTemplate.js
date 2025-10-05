// Description: Template generator for Details Tab (Development Tracking Table)
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Generate the HTML for the Details Tab
 * @param {Array} items - Array of user story dev items
 * @param {Object} config - Dev configuration (developers, sprints, etc.)
 * @returns {string} HTML string for the details tab
 */
function generateDetailsTab(items, config) {
    const hasItems = items && items.length > 0;
    
    return `
        <!-- Filter Section -->
        <div class="filter-section">
            <div class="filter-header" onclick="toggleFilterSection()">
                <i id="filterChevron" class="codicon codicon-chevron-down"></i>
                <span>Filters</span>
            </div>
            <div id="filterContent" class="filter-content">
                <div class="filter-row">
                    <div class="filter-item">
                        <label for="filterStoryNumber">Story Number:</label>
                        <input type="text" id="filterStoryNumber" placeholder="Filter by story number...">
                    </div>
                    <div class="filter-item">
                        <label for="filterStoryText">Story Text:</label>
                        <input type="text" id="filterStoryText" placeholder="Filter by story text...">
                    </div>
                    <div class="filter-item">
                        <label for="filterDevStatus">Status:</label>
                        <select id="filterDevStatus">
                            <option value="">All Statuses</option>
                            ${generateStatusFilterOptions()}
                        </select>
                    </div>
                </div>
                <div class="filter-row">
                    <div class="filter-item">
                        <label for="filterPriority">Priority:</label>
                        <select id="filterPriority">
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <label for="filterAssignedTo">Assigned To:</label>
                        <select id="filterAssignedTo">
                            <option value="">All Developers</option>
                            ${generateDeveloperOptions(config.developers)}
                        </select>
                    </div>
                    <div class="filter-item">
                        <label for="filterSprint">Sprint:</label>
                        <select id="filterSprint">
                            <option value="">All Sprints</option>
                            ${generateSprintOptions(config.sprints)}
                        </select>
                    </div>
                </div>
                <div class="filter-actions">
                    <button onclick="applyFilters()" class="filter-button">
                        <i class="codicon codicon-filter"></i> Apply Filters
                    </button>
                    <button onclick="clearFilters()" class="filter-button">
                        <i class="codicon codicon-clear-all"></i> Clear Filters
                    </button>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-bar">
            <div class="action-group">
                <button onclick="openBulkStatusModal()" class="action-button" id="bulkStatusBtn" disabled>
                    <i class="codicon codicon-symbol-event"></i> Bulk Status Update
                </button>
                <button onclick="openBulkPriorityModal()" class="action-button" id="bulkPriorityBtn" disabled>
                    <i class="codicon codicon-warning"></i> Bulk Priority Update
                </button>
                <button onclick="openBulkAssignmentModal()" class="action-button" id="bulkAssignmentBtn" disabled>
                    <i class="codicon codicon-person"></i> Bulk Assignment
                </button>
                <button onclick="openBulkSprintModal()" class="action-button" id="bulkSprintBtn" disabled>
                    <i class="codicon codicon-project"></i> Bulk Sprint Assignment
                </button>
            </div>
            <div class="action-group">
                <button onclick="exportToCSV()" class="icon-button" title="Download CSV">
                    <i class="codicon codicon-cloud-download"></i>
                </button>
                <button onclick="refreshData()" class="icon-button" title="Refresh">
                    <i class="codicon codicon-refresh"></i>
                </button>
            </div>
        </div>

        <!-- Record Info -->
        <div id="recordInfo" class="record-info">
            Showing ${hasItems ? items.length : 0} user stories
        </div>

        <!-- Table Container -->
        <div class="table-container">
            <table id="devTable" class="dev-table">
                <thead id="devTableHead"></thead>
                <tbody id="devTableBody"></tbody>
            </table>
        </div>

        ${hasItems ? '' : generateEmptyState()}
    `;
}

/**
 * Generate status filter options
 */
function generateStatusFilterOptions() {
    const statuses = [
        { value: 'on-hold', label: 'On Hold' },
        { value: 'ready-for-dev', label: 'Ready for Development' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'blocked', label: 'Blocked' },
        { value: 'completed', label: 'Completed' }
    ];
    
    return statuses.map(s => `<option value="${s.value}">${s.label}</option>`).join('');
}

/**
 * Generate developer options for dropdown
 */
function generateDeveloperOptions(developers) {
    if (!developers || developers.length === 0) {
        return '<option value="">No developers configured</option>';
    }
    
    return developers
        .filter(dev => dev.active !== false)
        .map(dev => `<option value="${dev.name}">${dev.name}</option>`)
        .join('');
}

/**
 * Generate sprint options for dropdown
 */
function generateSprintOptions(sprints) {
    if (!sprints || sprints.length === 0) {
        return '<option value="">No sprints configured</option>';
    }
    
    return sprints
        .map(sprint => `<option value="${sprint.sprintId}">${sprint.sprintName}</option>`)
        .join('');
}

/**
 * Generate empty state message
 */
function generateEmptyState() {
    return `
        <div class="empty-state">
            <i class="codicon codicon-inbox"></i>
            <h3>No User Stories Found</h3>
            <p>No processed user stories available for development tracking</p>
        </div>
    `;
}

// Export function for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateDetailsTab,
        generateStatusFilterOptions,
        generateDeveloperOptions,
        generateSprintOptions
    };
}
