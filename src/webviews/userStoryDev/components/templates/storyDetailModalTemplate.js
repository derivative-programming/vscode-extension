// Description: Story detail modal template generator
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Generate the HTML for the story detail modal
 * @param {Object} story - User story dev item
 * @param {Object} config - Dev configuration
 * @returns {string} HTML string for the modal
 */
function generateStoryDetailModal(story, config) {
    const statusOptions = [
        { value: '', label: '(Not Set)' },
        { value: 'on-hold', label: 'On Hold' },
        { value: 'ready-for-dev', label: 'Ready for Development' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'blocked', label: 'Blocked' },
        { value: 'completed', label: 'Completed' },
        { value: 'ready-for-dev-env-deploy', label: 'Ready for Dev Env Deploy' },
        { value: 'deployed-to-dev', label: 'Deployed to Dev' },
        { value: 'ready-for-qa', label: 'Ready for QA' }
    ];
    
    const priorityOptions = [
        { value: '', label: '(Not Set)' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
    ];
    
    const storyPointsOptions = ['', '?', '1', '2', '3', '5', '8', '13', '21'];
    
    const developers = config?.developers || [];
    const sprints = config?.sprints || [];
    
    // Get page mappings for this story
    const pageMappings = story.pageMappings || [];
    const pageMappingsHTML = pageMappings.length > 0
        ? pageMappings.map(pm => `<li>${pm.pageNumber} - ${pm.pageName}</li>`).join('')
        : '<li>(No page mappings)</li>';
    
    return `
        <div class="modal-overlay">
            <div class="modal-content story-detail-modal">
                <div class="modal-header">
                    <h2>User Story Details</h2>
                    <button id="modalCloseBtn" class="close-button" title="Close">
                        <i class="codicon codicon-close"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Story Identification (Read-Only) -->
                    <div class="form-section">
                        <h3>Story Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Story ID:</label>
                                <input type="text" value="${story.storyId || ''}" readonly class="readonly-input">
                            </div>
                            <div class="form-group">
                                <label>Story Number:</label>
                                <input type="text" value="${story.storyNumber || ''}" readonly class="readonly-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Story Text:</label>
                            <textarea readonly class="readonly-input" rows="3">${story.storyText || ''}</textarea>
                        </div>
                    </div>
                    
                    <!-- Development Status -->
                    <div class="form-section">
                        <h3>Development Status</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="modalDevStatus">Status:</label>
                                <select id="modalDevStatus" class="form-control">
                                    ${statusOptions.map(opt => 
                                        `<option value="${opt.value}" ${opt.value === story.devStatus ? 'selected' : ''}>${opt.label}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="modalPriority">Priority:</label>
                                <select id="modalPriority" class="form-control">
                                    ${priorityOptions.map(opt => 
                                        `<option value="${opt.value}" ${opt.value === story.priority ? 'selected' : ''}>${opt.label}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="modalStoryPoints">Story Points:</label>
                                <select id="modalStoryPoints" class="form-control">
                                    ${storyPointsOptions.map(opt => 
                                        `<option value="${opt}" ${opt === String(story.storyPoints) ? 'selected' : ''}>${opt || '(Not Set)'}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Assignment -->
                    <div class="form-section">
                        <h3>Assignment</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="modalAssignedTo">Assigned To:</label>
                                <select id="modalAssignedTo" class="form-control">
                                    <option value="">(Not Assigned)</option>
                                    ${developers
                                        .filter(dev => dev.active !== false)
                                        .map(dev => 
                                            `<option value="${dev.name}" ${dev.name === story.assignedTo ? 'selected' : ''}>${dev.name}</option>`
                                        ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="modalSprint">Sprint:</label>
                                <select id="modalSprint" class="form-control">
                                    <option value="">(No Sprint)</option>
                                    ${sprints.map(sprint => 
                                        `<option value="${sprint.sprintId}" ${sprint.sprintId === story.sprint ? 'selected' : ''}>${sprint.sprintName}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Dates -->
                    <div class="form-section">
                        <h3>Timeline</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="modalStartDate">Start Date:</label>
                                <input type="date" id="modalStartDate" class="form-control" value="${story.startDate || ''}">
                            </div>
                            <div class="form-group">
                                <label for="modalEstEndDate">Estimated End Date:</label>
                                <input type="date" id="modalEstEndDate" class="form-control" value="${story.estEndDate || ''}">
                            </div>
                            <div class="form-group">
                                <label for="modalActualEndDate">Actual End Date:</label>
                                <input type="date" id="modalActualEndDate" class="form-control" value="${story.actualEndDate || ''}">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Blocked Reason (shown only when status is blocked) -->
                    <div class="form-section" id="modalBlockedReasonGroup" style="display: ${story.devStatus === 'blocked' ? 'block' : 'none'};">
                        <h3>Blocked Information</h3>
                        <div class="form-group">
                            <label for="modalBlockedReason">Blocked Reason:</label>
                            <textarea id="modalBlockedReason" class="form-control" rows="3" placeholder="Describe why this story is blocked...">${story.blockedReason || ''}</textarea>
                        </div>
                    </div>
                    
                    <!-- Dev Notes -->
                    <div class="form-section">
                        <h3>Development Notes</h3>
                        <div class="form-group">
                            <label for="modalDevNotes">Notes:</label>
                            <textarea id="modalDevNotes" class="form-control" rows="4" placeholder="Add development notes, implementation details, or comments...">${story.devNotes || ''}</textarea>
                        </div>
                    </div>
                    
                    <!-- Page Mappings (Read-Only) -->
                    <div class="form-section">
                        <h3>Page Mappings</h3>
                        <div class="info-box">
                            <p>This story is mapped to the following pages:</p>
                            <ul class="page-mappings-list">
                                ${pageMappingsHTML}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button id="modalSaveBtn" class="primary-button">
                        <i class="codicon codicon-save"></i> Save Changes
                    </button>
                    <button id="modalCancelBtn" class="secondary-button">
                        <i class="codicon codicon-close"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate a simplified modal for bulk operations (future use)
 * @param {string} title - Modal title
 * @param {string} content - HTML content
 * @param {Array} actions - Array of { label, onclick, primary }
 * @returns {string} HTML string for the modal
 */
function generateSimpleModal(title, content, actions = []) {
    const actionsHTML = actions.map(action => {
        const buttonClass = action.primary ? 'primary-button' : 'secondary-button';
        return `<button onclick="${action.onclick}" class="${buttonClass}">${action.label}</button>`;
    }).join('');
    
    return `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>${title}</h2>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${actionsHTML}
                </div>
            </div>
        </div>
    `;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateStoryDetailModal,
        generateSimpleModal
    };
}
