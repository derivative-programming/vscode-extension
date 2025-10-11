// Description: Developer modal template for add/edit operations
// Created: October 11, 2025
// Last Modified: October 11, 2025

/**
 * Generate Developer Modal HTML
 * @param {Object|null} developer - Developer object to edit, or null for new
 * @returns {string} HTML for developer modal
 */
function generateDeveloperModal(developer) {
    const isEdit = developer !== null;
    const title = isEdit ? 'Edit Developer' : 'Add Developer';
    
    // Default values
    const id = developer?.id || '';
    const name = developer?.name || '';
    const email = developer?.email || '';
    const role = developer?.role || '';
    const capacity = developer?.capacity || '';
    const active = developer?.active !== false; // Default to true
    
    return `
        <div class="modal-overlay" onclick="handleModalOverlayClick(event)">
            <div class="modal-content modal-medium">
                <div class="modal-header">
                    <h3>
                        <span class="codicon codicon-person"></span>
                        ${title}
                    </h3>
                    <button class="modal-close" onclick="closeDeveloperModal()">
                        <span class="codicon codicon-close"></span>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form id="developerForm" onsubmit="saveDeveloper(event)">
                        <!-- Developer ID (hidden for edit) -->
                        ${isEdit ? `
                            <input type="hidden" id="developerId" value="${id.replace(/"/g, '&quot;')}" />
                        ` : ''}
                        
                        <!-- Name -->
                        <div class="form-group">
                            <label for="developerName" class="required">
                                <span class="codicon codicon-person"></span>
                                Name *
                            </label>
                            <input 
                                type="text" 
                                id="developerName" 
                                class="form-control" 
                                value="${name.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"
                                placeholder="Enter developer name"
                                required
                                maxlength="100"
                            />
                        </div>

                        <!-- Email -->
                        <div class="form-group">
                            <label for="developerEmail">
                                <span class="codicon codicon-mail"></span>
                                Email
                            </label>
                            <input 
                                type="email" 
                                id="developerEmail" 
                                class="form-control" 
                                value="${email.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"
                                placeholder="developer@example.com"
                                maxlength="150"
                            />
                        </div>

                        <!-- Role -->
                        <div class="form-group">
                            <label for="developerRole">
                                <span class="codicon codicon-briefcase"></span>
                                Role
                            </label>
                            <input 
                                type="text" 
                                id="developerRole" 
                                class="form-control" 
                                value="${role.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"
                                placeholder="e.g., Senior Developer, Frontend Developer"
                                maxlength="100"
                            />
                        </div>

                        <!-- Capacity -->
                        <div class="form-group">
                            <label for="developerCapacity">
                                <span class="codicon codicon-dashboard"></span>
                                Capacity (Story Points per Sprint)
                            </label>
                            <input 
                                type="number" 
                                id="developerCapacity" 
                                class="form-control" 
                                value="${capacity}"
                                placeholder="e.g., 20"
                                min="0"
                                max="200"
                                step="1"
                            />
                        </div>

                        <!-- Hourly Rate -->
                        <div class="form-group">
                            <label for="developerRate">
                                <span class="codicon codicon-symbol-currency"></span>
                                Hourly Rate ($/hr)
                            </label>
                            <input 
                                type="number" 
                                id="developerRate" 
                                class="form-control" 
                                value="${developer?.hourlyRate || ''}"
                                placeholder="Leave blank to use default rate"
                                min="0"
                                step="1"
                            />
                            <small class="form-text">Override the default developer rate for cost calculations</small>
                        </div>

                        <!-- Active Status -->
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="developerActive" 
                                    ${active ? 'checked' : ''}
                                />
                                <span class="checkbox-text">
                                    <span class="codicon codicon-check"></span>
                                    Active Developer
                                </span>
                            </label>
                        </div>

                        <!-- Validation Messages -->
                        <div id="developerFormError" class="form-error" style="display: none;"></div>
                    </form>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeDeveloperModal()">
                        <span class="codicon codicon-close"></span>
                        Cancel
                    </button>
                    <button type="submit" form="developerForm" class="btn btn-primary">
                        <span class="codicon codicon-save"></span>
                        ${isEdit ? 'Update' : 'Add'} Developer
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Handle modal overlay click to close
 * @param {Event} event - Click event
 */
function handleModalOverlayClick(event) {
    if (event.target.classList.contains('modal-overlay')) {
        closeDeveloperModal();
    }
}

/**
 * Generate Developer Delete Confirmation Modal
 * @param {Object} developer - Developer object to delete
 * @returns {string} HTML for delete confirmation modal
 */
function generateDeveloperDeleteConfirmModal(developer) {
    return `
        <div id="deleteDeveloperModal" class="modal">
            <div class="modal-content modal-small">
                <div class="modal-header">
                    <h3>Delete Developer</h3>
                    <button class="modal-close" onclick="closeDeleteDeveloperModal()">
                        <span class="codicon codicon-close"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="warning-message">
                        <span class="codicon codicon-warning"></span>
                        <div class="warning-content">
                            <p><strong>Are you sure you want to delete "${escapeHtmlForModal(developer.name)}"?</strong></p>
                            <p>This action cannot be undone.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeDeleteDeveloperModal()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-danger" onclick="confirmDeleteDeveloper('${developer.id}')">
                        <span class="codicon codicon-trash"></span>
                        Delete Developer
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS (defined locally for modal)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtmlForModal(text) {
    if (text === null || text === undefined) {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
