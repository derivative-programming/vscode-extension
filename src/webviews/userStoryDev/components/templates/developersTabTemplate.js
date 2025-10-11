// Description: Developers Management Tab template
// Created: October 11, 2025
// Last Modified: October 11, 2025

/**
 * Generate Developers Management Tab
 * @param {Object} config - Configuration with developers array
 * @param {Array} items - All user story items (to check assignments)
 * @returns {string} HTML for Developers Tab
 */
function generateDevelopersTab(config, items) {
    const developers = config.developers || [];
    
    return `
        <div class="developers-tab-container">
            <div class="developers-header">
                <div class="developers-header-left">
                    <span class="codicon codicon-person"></span>
                    <div class="developers-header-text">
                        <h3>Developer Management</h3>
                        <p>Manage team members and their assignments</p>
                    </div>
                </div>
                <div class="developers-header-right">
                    <button id="addDeveloperBtn" class="btn btn-primary">
                        <span class="codicon codicon-add"></span>
                        Add Developer
                    </button>
                </div>
            </div>

            <!-- Filter Section -->
            <div class="filter-section">
                <div class="filter-header" onclick="toggleDeveloperFilters()">
                    <i id="developerFilterChevron" class="codicon codicon-chevron-down"></i>
                    <span>Filters</span>
                </div>
                <div id="developerFilterContent" class="filter-content">
                    <div class="filter-row">
                        <div class="filter-item">
                            <label for="developerStatusFilter">Status:</label>
                            <select id="developerStatusFilter" onchange="filterDevelopers()">
                                <option value="">All Developers</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                        <div class="filter-item">
                            <label for="developerSearchInput">Search:</label>
                            <input 
                                type="text" 
                                id="developerSearchInput" 
                                placeholder="Search by name or email..."
                                oninput="filterDevelopers()"
                            />
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button onclick="clearDeveloperFilters()" class="filter-button">
                            <i class="codicon codicon-clear-all"></i> Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-bar">
                <div class="action-group">
                    <button onclick="bulkActivateDevelopers()" class="action-button" id="bulkActivateBtn" disabled>
                        <i class="codicon codicon-check"></i> Bulk Activate
                    </button>
                    <button onclick="bulkDeactivateDevelopers()" class="action-button" id="bulkDeactivateBtn" disabled>
                        <i class="codicon codicon-circle-slash"></i> Bulk Deactivate
                    </button>
                    <button onclick="bulkDeleteDevelopers()" class="action-button" id="bulkDeleteBtn" disabled>
                        <i class="codicon codicon-trash"></i> Bulk Delete
                    </button>
                </div>
                <div class="action-group">
                    <button onclick="exportDevelopersToCSV()" class="icon-button" title="Download CSV">
                        <i class="codicon codicon-cloud-download"></i>
                    </button>
                    <button onclick="refreshDevelopers()" class="icon-button" title="Refresh">
                        <i class="codicon codicon-refresh"></i>
                    </button>
                </div>
            </div>

            <div class="developers-table-container">
                <table class="developers-table" id="developersTable">
                    <thead>
                        <tr>
                            <th class="col-select">
                                <input type="checkbox" id="selectAllDevelopers" onchange="toggleSelectAllDevelopers()" />
                            </th>
                            <th class="col-name sortable" onclick="sortDevelopersBy('name')">
                                Name
                                <span class="sort-indicator"></span>
                            </th>
                            <th class="col-email sortable" onclick="sortDevelopersBy('email')">
                                Email
                                <span class="sort-indicator"></span>
                            </th>
                            <th class="col-role sortable" onclick="sortDevelopersBy('role')">
                                Role
                                <span class="sort-indicator"></span>
                            </th>
                            <th class="col-capacity sortable" onclick="sortDevelopersBy('capacity')">
                                Capacity (pts/sprint)
                                <span class="sort-indicator"></span>
                            </th>
                            <th class="col-rate sortable" onclick="sortDevelopersBy('hourlyRate')">
                                Hourly Rate ($/hr)
                                <span class="sort-indicator"></span>
                            </th>
                            <th class="col-assigned sortable" onclick="sortDevelopersBy('assignedCount')">
                                Assigned Stories
                                <span class="sort-indicator"></span>
                            </th>
                            <th class="col-status sortable" onclick="sortDevelopersBy('active')">
                                Status
                                <span class="sort-indicator"></span>
                            </th>
                            <th class="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="developersTableBody">
                        ${generateDevelopersTableRows(developers, items)}
                    </tbody>
                </table>
            </div>

            <div class="developers-footer">
                <div class="record-info" id="developerRecordInfo">
                    Showing ${developers.length} developer${developers.length !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate table rows for developers
 * @param {Array} developers - Array of developer objects
 * @param {Array} items - All user story items
 * @returns {string} HTML for table rows
 */
function generateDevelopersTableRows(developers, items) {
    if (!developers || developers.length === 0) {
        return `
            <tr>
                <td colspan="9" class="empty-row">
                    <div class="empty-state">
                        <span class="codicon codicon-person"></span>
                        <h3>No Developers</h3>
                        <p>Add your first developer to start assigning user stories</p>
                    </div>
                </td>
            </tr>
        `;
    }

    return developers.map(dev => {
        const assignedCount = countAssignedStories(dev.id, items, developers);
        const statusClass = dev.active ? 'status-active' : 'status-inactive';
        const statusText = dev.active ? 'Active' : 'Inactive';
        
        return `
            <tr class="developer-row" data-developer-id="${escapeHtml(dev.id)}">
                <td class="col-select">
                    <input 
                        type="checkbox" 
                        class="developer-checkbox" 
                        data-developer-id="${escapeHtml(dev.id)}"
                        onchange="toggleDeveloperSelection()"
                    />
                </td>
                <td class="col-name" ondblclick="editDeveloper('${escapeHtml(dev.id)}')">
                    ${escapeHtml(dev.name)}
                </td>
                <td class="col-email" ondblclick="editDeveloper('${escapeHtml(dev.id)}')">
                    ${escapeHtml(dev.email || '-')}
                </td>
                <td class="col-role" ondblclick="editDeveloper('${escapeHtml(dev.id)}')">
                    ${escapeHtml(dev.role || '-')}
                </td>
                <td class="col-capacity" ondblclick="editDeveloper('${escapeHtml(dev.id)}')">
                    ${dev.capacity || '-'}
                </td>
                <td class="col-rate" ondblclick="editDeveloper('${escapeHtml(dev.id)}')">
                    ${dev.hourlyRate ? '$' + dev.hourlyRate.toFixed(2) : '-'}
                </td>
                <td class="col-assigned">
                    <span class="assigned-count ${assignedCount > 0 ? 'has-assignments' : ''}">
                        ${assignedCount}
                    </span>
                </td>
                <td class="col-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="col-actions">
                    <button 
                        class="btn-icon" 
                        onclick="editDeveloper('${escapeHtml(dev.id)}')"
                        title="Edit Developer"
                    >
                        <span class="codicon codicon-edit"></span>
                    </button>
                    <button 
                        class="btn-icon btn-danger" 
                        onclick="deleteDeveloper('${escapeHtml(dev.id)}')"
                        title="Delete Developer"
                        ${assignedCount > 0 ? 'disabled' : ''}
                    >
                        <span class="codicon codicon-trash"></span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Count stories assigned to a developer
 * @param {string} developerId - Developer ID
 * @param {Array} items - All user story items
 * @param {Array} developers - Developers array to lookup name
 * @returns {number} Count of assigned stories
 */
function countAssignedStories(developerId, items, developers) {
    if (!items || !Array.isArray(items)) {
        return 0;
    }
    
    // Find developer by ID to get their name
    const developer = developers?.find(d => d.id === developerId);
    if (!developer) {
        return 0;
    }
    
    // User stories store assignedTo by developer name, not ID
    return items.filter(item => item.assignedTo === developer.name).length;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
