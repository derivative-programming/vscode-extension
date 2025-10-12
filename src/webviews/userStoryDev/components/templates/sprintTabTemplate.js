// Description: Sprint Management Tab template with Planning and Burndown sub-tabs
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Generate Sprint Management Tab with sub-tabs
 * @param {Array} items - All user story items
 * @param {Object} config - Configuration with sprints array
 * @returns {string} HTML for Sprint Tab
 */
function generateSprintTab(items, config) {
    return `
        <div class="sprint-tab-container">
            <div class="sprint-header">
                <div class="sprint-header-left">
                    <span class="codicon codicon-dashboard"></span>
                    <div class="sprint-header-text">
                        <h3>Sprint Management</h3>
                        <p>Plan sprints, assign stories, and track burndown progress</p>
                    </div>
                </div>
                <div class="sprint-header-right">
                    <button id="createSprintBtn" class="btn btn-primary">
                        <span class="codicon codicon-add"></span>
                        Create Sprint
                    </button>
                </div>
            </div>

            <div class="sprint-sub-tabs">
                <button class="sprint-sub-tab active" onclick="switchSprintSubTab('planning')">
                    <span class="codicon codicon-list-tree"></span>
                    Sprint Planning
                </button>
                <button class="sprint-sub-tab" onclick="switchSprintSubTab('burndown')">
                    <span class="codicon codicon-graph-line"></span>
                    Burndown Chart
                </button>
            </div>

            <div id="sprintPlanningSubTab" class="sprint-sub-tab-content active">
                ${generateSprintPlanningContent(items, config)}
            </div>

            <div id="sprintBurndownSubTab" class="sprint-sub-tab-content">
                ${generateSprintBurndownContent(items, config)}
            </div>
        </div>
    `;
}

/**
 * Generate Sprint Planning sub-tab content
 * @param {Array} items - All user story items
 * @param {Object} config - Configuration with sprints
 * @returns {string} HTML for planning sub-tab
 */
function generateSprintPlanningContent(items, config) {
    const sprints = config.sprints || [];
    
    if (sprints.length === 0) {
        return `
            <div class="empty-state">
                <span class="codicon codicon-inbox"></span>
                <h3>No Sprints Configured</h3>
                <p>Create your first sprint to start planning development work</p>
                <button onclick="document.getElementById('createSprintBtn').click()" class="btn btn-primary">
                    <span class="codicon codicon-add"></span>
                    Create Sprint
                </button>
            </div>
        `;
    }

    return `
        <div class="sprint-planning-layout">
            <div class="sprint-list-section">
                <div class="section-header">
                    <h4>Sprints</h4>
                    <span class="section-count">${sprints.length}</span>
                </div>
                <div id="sprintsList" class="sprints-list">
                    ${generateSprintsList(sprints, items)}
                </div>
            </div>

            <div class="sprint-backlog-section">
                <div class="section-header">
                    <h4>Backlog</h4>
                    <span class="section-count">${getUnassignedStoriesCount(items)}</span>
                </div>
                <div class="backlog-filters">
                    <select id="backlogPriorityFilter" class="filter-select" onchange="filterBacklog()">
                        <option value="">All Priorities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select id="backlogPointsFilter" class="filter-select" onchange="filterBacklog()">
                        <option value="">All Points</option>
                        <option value="?">?</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="5">5</option>
                        <option value="8">8</option>
                        <option value="13">13</option>
                        <option value="21">21</option>
                    </select>
                </div>
                <div id="backlogStories" class="backlog-stories">
                    ${generateBacklogStories(items)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate Sprint Burndown sub-tab content
 * @param {Array} items - All user story items
 * @param {Object} config - Configuration with sprints
 * @returns {string} HTML for burndown sub-tab
 */
function generateSprintBurndownContent(items, config) {
    const sprints = config.sprints || [];
    
    if (sprints.length === 0) {
        return `
            <div class="empty-state">
                <span class="codicon codicon-graph-line"></span>
                <h3>No Sprints to Display</h3>
                <p>Create sprints in the Sprint Planning tab to view burndown charts</p>
            </div>
        `;
    }

    // Handle both old format (active: boolean) and new format (status: string)
    const activeSprint = sprints.find(s => s.status === 'active' || s.active === true) || sprints[0];

    return `
        <div class="burndown-container">
            <div class="burndown-header">
                <div class="burndown-sprint-selector">
                    <label for="burndownSprintSelect">Select Sprint:</label>
                    <select id="burndownSprintSelect" class="filter-select" onchange="renderBurndownChart()">
                        ${sprints.map(sprint => `
                            <option value="${sprint.sprintId}" ${sprint.sprintId === activeSprint.sprintId ? 'selected' : ''}>
                                ${sprint.sprintName} (${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <button id="refreshBurndownBtn" class="icon-button" title="Refresh">
                    <i class="codicon codicon-refresh"></i>
                </button>
            </div>

            <div class="burndown-metrics">
                <div id="burndownMetrics" class="metrics-row">
                    ${generateBurndownMetrics(activeSprint, items)}
                </div>
            </div>

            <div class="burndown-chart-container">
                <div id="burndownChartBody" class="chart-body">
                    ${generateChartLoadingState()}
                </div>
            </div>

            <div class="burndown-sprint-info">
                <div id="sprintStoriesList" class="sprint-stories-list">
                    ${generateSprintStoriesSummary(activeSprint, items)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate sprints list
 * @param {Array} sprints - Array of sprint objects
 * @param {Array} items - All user story items
 * @returns {string} HTML for sprints list
 */
function generateSprintsList(sprints, items) {
    // Sort sprints: active first, then by start date
    const sortedSprints = sprints.slice().sort((a, b) => {
        // Handle both old format (active: boolean) and new format (status: string)
        const aStatus = a.status || (a.active ? 'active' : 'planned');
        const bStatus = b.status || (b.active ? 'active' : 'planned');
        
        if (aStatus === 'active' && bStatus !== 'active') {
            return -1;
        }
        if (aStatus !== 'active' && bStatus === 'active') {
            return 1;
        }
        return new Date(b.startDate) - new Date(a.startDate);
    });

    return sortedSprints.map(sprint => {
        const sprintStories = items.filter(item => item.sprintId === sprint.sprintId);
        const totalPoints = calculateTotalPoints(sprintStories);
        const completedStories = sprintStories.filter(item => item.devStatus === 'completed').length;
        const completionRate = sprintStories.length > 0 
            ? Math.round((completedStories / sprintStories.length) * 100) 
            : 0;

        // Handle both old format (active: boolean) and new format (status: string)
        const sprintStatus = sprint.status || (sprint.active ? 'active' : 'planned');

        return `
            <div class="sprint-card ${sprintStatus}" data-sprint-id="${sprint.sprintId}">
                <div class="sprint-card-header">
                    <div class="sprint-card-title">
                        <span class="sprint-status-badge status-${sprintStatus}">${formatSprintStatus(sprintStatus)}</span>
                        <h4>${sprint.sprintName}</h4>
                    </div>
                    <div class="sprint-card-actions">
                        <button class="btn-icon" onclick="editSprint('${sprint.sprintId}')" title="Edit Sprint">
                            <span class="codicon codicon-edit"></span>
                        </button>
                        <button class="btn-icon" onclick="deleteSprint('${sprint.sprintId}')" title="Delete Sprint">
                            <span class="codicon codicon-trash"></span>
                        </button>
                    </div>
                </div>
                <div class="sprint-card-dates">
                    <span class="codicon codicon-calendar"></span>
                    ${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}
                    <span class="sprint-duration">(${calculateSprintDays(sprint)} days)</span>
                </div>
                <div class="sprint-card-stats">
                    <div class="sprint-stat">
                        <span class="stat-label">Stories</span>
                        <span class="stat-value">${completedStories}/${sprintStories.length}</span>
                    </div>
                    <div class="sprint-stat">
                        <span class="stat-label">Points</span>
                        <span class="stat-value">${totalPoints}</span>
                    </div>
                    <div class="sprint-stat">
                        <span class="stat-label">Completion</span>
                        <span class="stat-value">${completionRate}%</span>
                    </div>
                </div>
                <div class="sprint-card-capacity">
                    <div class="capacity-bar">
                        <div class="capacity-fill" style="width: ${Math.min(completionRate, 100)}%"></div>
                    </div>
                </div>
                ${sprintStories.length > 0 ? `
                    <div class="sprint-card-stories">
                        <div class="sprint-stories-header">
                            <span class="codicon codicon-list-unordered"></span>
                            <span>Assigned Stories</span>
                        </div>
                        <div class="sprint-stories-list">
                            ${sprintStories.map(story => {
                                const tooltipText = `Story #${story.storyNumber}\n${story.storyText}\n\nPriority: ${formatPriority(story.priority)}\nStatus: ${formatDevStatus(story.devStatus)}\nPoints: ${story.storyPoints || '?'}\nDeveloper: ${story.assignedTo || 'Unassigned'}`;
                                return `
                                <div class="sprint-story-item" 
                                     title="${escapeHtml(tooltipText)}"
                                     onclick="event.target.closest('.btn-icon') ? null : openStoryDetailModal('${story.storyId}')">
                                    <span class="story-number">#${story.storyNumber}</span>
                                    <span class="story-title">${story.storyText}</span>
                                    <span class="story-points-badge">${story.storyPoints || '?'}</span>
                                    <button class="btn-icon btn-small" onclick="event.stopPropagation(); unassignStoryFromSprint('${story.storyId}')" title="Remove from sprint">
                                        <span class="codicon codicon-close"></span>
                                    </button>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Generate backlog stories list
 * @param {Array} items - All user story items
 * @returns {string} HTML for backlog stories
 */
function generateBacklogStories(items) {
    // Filter for unassigned stories that are NOT completed
    const unassignedStories = items.filter(item => 
        !item.sprintId && item.devStatus !== "completed"
    );

    if (unassignedStories.length === 0) {
        return `
            <div class="empty-state-small">
                <span class="codicon codicon-check"></span>
                <p>All stories are assigned to sprints</p>
            </div>
        `;
    }

    // Sort by development queue position (or story number as fallback)
    const sortedStories = sortByQueuePosition(unassignedStories);

    return sortedStories.map(story => `
        <div class="backlog-story" 
             data-story-id="${story.storyId}" 
             data-priority="${story.priority || 'none'}"
             data-points="${story.storyPoints || '?'}"
             draggable="true"
             onclick="openStoryDetailModal('${story.storyId}')">
            <div class="backlog-story-header">
                <span class="story-number">#${story.storyNumber}</span>
                ${story.priority ? `<span class="priority-badge priority-${story.priority}">${story.priority}</span>` : ''}
            </div>
            <div class="backlog-story-text">${story.storyText}</div>
            <div class="backlog-story-footer">
                <span class="story-points">
                    <span class="codicon codicon-dashboard"></span>
                    ${story.storyPoints || '?'} pts
                </span>
                ${story.assignedDeveloper ? `
                    <span class="story-developer">
                        <span class="codicon codicon-person"></span>
                        ${story.assignedDeveloper}
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Generate burndown metrics
 * @param {Object} sprint - Sprint object
 * @param {Array} items - All user story items
 * @returns {string} HTML for burndown metrics
 */
function generateBurndownMetrics(sprint, items) {
    const sprintStories = items.filter(item => item.sprintId === sprint.sprintId);
    const totalPoints = calculateTotalPoints(sprintStories);
    const completedPoints = calculateTotalPoints(sprintStories.filter(item => item.devStatus === 'completed'));
    const remainingPoints = totalPoints - completedPoints;
    
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, totalDays - elapsedDays);

    return `
        <div class="burndown-metric">
            <span class="metric-icon codicon codicon-dashboard"></span>
            <div class="metric-content">
                <div class="metric-value">${remainingPoints}</div>
                <div class="metric-label">Points Remaining</div>
            </div>
        </div>
        <div class="burndown-metric">
            <span class="metric-icon codicon codicon-calendar"></span>
            <div class="metric-content">
                <div class="metric-value">${remainingDays}</div>
                <div class="metric-label">Days Remaining</div>
            </div>
        </div>
        <div class="burndown-metric">
            <span class="metric-icon codicon codicon-graph-line"></span>
            <div class="metric-content">
                <div class="metric-value">${totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0}%</div>
                <div class="metric-label">Completed</div>
            </div>
        </div>
        <div class="burndown-metric">
            <span class="metric-icon codicon codicon-list-unordered"></span>
            <div class="metric-content">
                <div class="metric-value">${sprintStories.length}</div>
                <div class="metric-label">Total Stories</div>
            </div>
        </div>
    `;
}

/**
 * Generate sprint stories summary
 * @param {Object} sprint - Sprint object
 * @param {Array} items - All user story items
 * @returns {string} HTML for sprint stories summary
 */
function generateSprintStoriesSummary(sprint, items) {
    const sprintStories = items.filter(item => item.sprintId === sprint.sprintId);

    if (sprintStories.length === 0) {
        return `
            <div class="empty-state-small">
                <span class="codicon codicon-inbox"></span>
                <p>No stories assigned to this sprint</p>
            </div>
        `;
    }

    return `
        <h4>Sprint Stories (${sprintStories.length})</h4>
        <table class="sprint-stories-table">
            <thead>
                <tr>
                    <th>Story #</th>
                    <th>Story</th>
                    <th>Status</th>
                    <th>Points</th>
                    <th>Developer</th>
                </tr>
            </thead>
            <tbody>
                ${sprintStories.map(story => `
                    <tr class="status-${story.devStatus}" 
                        onclick="openStoryDetailModal('${story.storyId}')" 
                        style="cursor: pointer;">
                        <td>#${story.storyNumber}</td>
                        <td class="story-text">${story.storyText}</td>
                        <td><span class="status-badge">${formatStatus(story.devStatus)}</span></td>
                        <td>${story.storyPoints || '?'}</td>
                        <td>${story.assignedTo || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Helper: Get count of unassigned stories
 */
function getUnassignedStoriesCount(items) {
    return items.filter(item => !item.sprintId).length;
}

/**
 * Helper: Calculate sprint duration in days
 */
function calculateSprintDays(sprint) {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Helper: Format sprint status
 */
function formatSprintStatus(status) {
    const statusMap = {
        'active': 'Active',
        'planned': 'Planned',
        'completed': 'Completed'
    };
    return statusMap[status] || status;
}

/**
 * Helper: Format date
 */
function formatDate(dateString) {
    if (!dateString) {
        return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format priority for display
 */
function formatPriority(priority) {
    if (!priority || priority === 'none') {
        return 'Not Set';
    }
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
}

/**
 * Format dev status for display
 */
function formatDevStatus(status) {
    if (!status) {
        return 'Not Set';
    }
    // Convert kebab-case to Title Case
    return status.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

/**
 * Escape HTML for use in title attributes
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateSprintTab,
        generateSprintPlanningContent,
        generateSprintBurndownContent,
        generateSprintsList,
        generateBacklogStories,
        generateBurndownMetrics,
        generateSprintStoriesSummary
    };
}
