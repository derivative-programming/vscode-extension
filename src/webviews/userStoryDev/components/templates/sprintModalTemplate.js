// Description: Sprint modal template for creating and editing sprints
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Generate sprint modal HTML
 * @param {Object|null} sprint - Sprint object for editing, null for creating
 * @returns {string} HTML for sprint modal
 */
function generateSprintModal(sprint = null) {
    const isEdit = sprint !== null;
    const modalTitle = isEdit ? 'Edit Sprint' : 'Create Sprint';
    
    return `
        <div id="sprintModal" class="modal">
            <div class="modal-content modal-medium">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close" onclick="closeSprintModal()">
                        <span class="codicon codicon-close"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="sprintForm" onsubmit="saveSprint(event)">
                        <div class="form-section">
                            <h4>Sprint Information</h4>
                            
                            <div class="form-group">
                                <label for="sprintName">
                                    Sprint Name *
                                    <span class="field-hint">e.g., Sprint 1, Q4 Sprint 3</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="sprintName" 
                                    class="form-input" 
                                    placeholder="Enter sprint name"
                                    value="${isEdit ? sprint.sprintName : ''}"
                                    required
                                />
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="sprintStartDate">
                                        Start Date *
                                    </label>
                                    <input 
                                        type="date" 
                                        id="sprintStartDate" 
                                        class="form-input" 
                                        value="${isEdit ? sprint.startDate : ''}"
                                        onchange="updateSprintEndDate()"
                                        required
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="sprintEndDate">
                                        End Date *
                                    </label>
                                    <input 
                                        type="date" 
                                        id="sprintEndDate" 
                                        class="form-input" 
                                        value="${isEdit ? sprint.endDate : ''}"
                                        onchange="updateSprintEndDate()"
                                        required
                                    />
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="sprintDuration">
                                        Duration (days)
                                        <span class="field-hint">Auto-calculated</span>
                                    </label>
                                    <input 
                                        type="number" 
                                        id="sprintDuration" 
                                        class="form-input" 
                                        value="${isEdit ? calculateDuration(sprint.startDate, sprint.endDate) : ''}"
                                        readonly
                                        disabled
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="sprintStatus">
                                        Status *
                                    </label>
                                    <select id="sprintStatus" class="form-select" required>
                                        ${(() => {
                                            // Handle both old format (active: boolean) and new format (status: string)
                                            const currentStatus = isEdit ? (sprint.status || (sprint.active ? 'active' : 'planned')) : 'planned';
                                            return `
                                                <option value="planned" ${currentStatus === 'planned' ? 'selected' : ''}>Planned</option>
                                                <option value="active" ${currentStatus === 'active' ? 'selected' : ''}>Active</option>
                                                <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
                                            `;
                                        })()}
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="sprintCapacity">
                                    Sprint Capacity (story points)
                                    <span class="field-hint">Optional: Team's estimated capacity</span>
                                </label>
                                <input 
                                    type="number" 
                                    id="sprintCapacity" 
                                    class="form-input" 
                                    placeholder="e.g., 40"
                                    min="0"
                                    value="${isEdit && sprint.capacity ? sprint.capacity : ''}"
                                />
                            </div>

                            <div class="form-group">
                                <label for="sprintGoal">
                                    Sprint Goal
                                    <span class="field-hint">Optional: What you aim to achieve</span>
                                </label>
                                <textarea 
                                    id="sprintGoal" 
                                    class="form-textarea" 
                                    rows="3"
                                    placeholder="Describe the sprint goal..."
                                >${isEdit && sprint.goal ? sprint.goal : ''}</textarea>
                            </div>
                        </div>

                        ${isEdit ? `<input type="hidden" id="sprintId" value="${sprint.sprintId}" />` : ''}
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeSprintModal()">
                        Cancel
                    </button>
                    <button type="submit" form="sprintForm" class="btn btn-primary">
                        <span class="codicon codicon-save"></span>
                        ${isEdit ? 'Save Changes' : 'Create Sprint'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate sprint deletion confirmation modal
 * @param {Object} sprint - Sprint object to delete
 * @param {number} storyCount - Number of stories assigned to sprint
 * @returns {string} HTML for confirmation modal
 */
function generateSprintDeleteConfirmModal(sprint, storyCount) {
    return `
        <div id="deleteSprintModal" class="modal">
            <div class="modal-content modal-small">
                <div class="modal-header">
                    <h3>Delete Sprint</h3>
                    <button class="modal-close" onclick="closeDeleteSprintModal()">
                        <span class="codicon codicon-close"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="warning-message">
                        <span class="codicon codicon-warning"></span>
                        <div class="warning-content">
                            <p><strong>Are you sure you want to delete "${sprint.sprintName}"?</strong></p>
                            ${storyCount > 0 ? `
                                <p>This sprint has <strong>${storyCount} assigned stories</strong>. 
                                They will be moved back to the backlog.</p>
                            ` : `
                                <p>This sprint has no assigned stories.</p>
                            `}
                            <p>This action cannot be undone.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeDeleteSprintModal()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-danger" onclick="confirmDeleteSprint('${sprint.sprintId}')">
                        <span class="codicon codicon-trash"></span>
                        Delete Sprint
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Calculate duration between two dates
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {number} Duration in days
 */
function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) {
        return 0;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Generate quick sprint creation presets
 * @returns {string} HTML for preset buttons
 */
function generateSprintPresets() {
    return `
        <div class="sprint-presets">
            <h5>Quick Presets:</h5>
            <div class="preset-buttons">
                <button type="button" class="btn btn-sm" onclick="applySprintPreset(7)">
                    1 Week
                </button>
                <button type="button" class="btn btn-sm" onclick="applySprintPreset(14)">
                    2 Weeks
                </button>
                <button type="button" class="btn btn-sm" onclick="applySprintPreset(21)">
                    3 Weeks
                </button>
                <button type="button" class="btn btn-sm" onclick="applySprintPreset(30)">
                    1 Month
                </button>
            </div>
        </div>
    `;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateSprintModal,
        generateSprintDeleteConfirmModal,
        calculateDuration,
        generateSprintPresets
    };
}
