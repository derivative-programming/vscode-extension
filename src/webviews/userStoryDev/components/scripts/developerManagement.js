// Description: Developer management functions for CRUD operations
// Created: October 11, 2025
// Last Modified: October 11, 2025

/**
 * Global variable to track selected developers
 */
let selectedDevelopers = new Set();

/**
 * Current developer filter and sort state
 */
let developerFilterState = {
    status: '',
    search: '',
    sortColumn: 'name',
    sortDescending: false
};

/**
 * Show add developer modal
 */
function showAddDeveloperModal() {
    const modalHtml = generateDeveloperModal(null);
    
    // Insert modal into DOM
    let modalContainer = document.getElementById('modalContainer');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = modalHtml;
    
    // Focus on name input
    setTimeout(() => {
        const nameInput = document.getElementById('developerName');
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

/**
 * Edit existing developer
 * @param {string} developerId - Developer ID to edit
 */
function editDeveloper(developerId) {
    const developer = devConfig.developers.find(d => d.id === developerId);
    if (!developer) {
        console.error('Developer not found:', developerId);
        return;
    }
    
    const modalHtml = generateDeveloperModal(developer);
    
    // Insert modal into DOM
    let modalContainer = document.getElementById('modalContainer');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = modalHtml;
}

/**
 * Close developer modal
 */
function closeDeveloperModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}

/**
 * Save developer (add or update)
 * @param {Event} event - Form submit event
 */
function saveDeveloper(event) {
    event.preventDefault();
    
    // Get form values
    const developerIdInput = document.getElementById('developerId');
    const isEdit = developerIdInput !== null;
    
    const name = document.getElementById('developerName').value.trim();
    const email = document.getElementById('developerEmail').value.trim();
    const role = document.getElementById('developerRole').value.trim();
    const capacityInput = document.getElementById('developerCapacity').value.trim();
    const capacity = capacityInput ? parseInt(capacityInput, 10) : null;
    const rateInput = document.getElementById('developerRate').value.trim();
    const hourlyRate = rateInput ? parseFloat(rateInput) : null;
    const active = document.getElementById('developerActive').checked;
    
    // Validate
    if (!name) {
        showFormError('Developer name is required');
        return;
    }
    
    if (email && !isValidEmail(email)) {
        showFormError('Please enter a valid email address');
        return;
    }
    
    if (capacity !== null && (capacity < 0 || capacity > 200)) {
        showFormError('Capacity must be between 0 and 200');
        return;
    }
    
    if (hourlyRate !== null && hourlyRate < 0) {
        showFormError('Hourly rate must be a positive number');
        return;
    }
    
    // Generate ID for new developer
    const developerId = isEdit ? developerIdInput.value : generateDeveloperId(name);
    
    // Check for duplicate ID (only for new developers)
    if (!isEdit && devConfig.developers.some(d => d.id === developerId)) {
        showFormError('A developer with this name already exists');
        return;
    }
    
    // Create developer object
    const developer = {
        id: developerId,
        name: name,
        email: email || '',
        role: role || '',
        capacity: capacity,
        hourlyRate: hourlyRate,
        active: active
    };
    
    // Update config
    if (isEdit) {
        const index = devConfig.developers.findIndex(d => d.id === developerId);
        if (index !== -1) {
            devConfig.developers[index] = developer;
        }
    } else {
        devConfig.developers.push(developer);
    }
    
    // Save to extension
    saveDevConfig();
    
    // Close modal
    closeDeveloperModal();
    
    // Refresh developers tab
    renderDevelopersTab();
}

/**
 * Delete developer
 * @param {string} developerId - Developer ID to delete
 */
function deleteDeveloper(developerId) {
    const developer = devConfig.developers.find(d => d.id === developerId);
    if (!developer) {
        console.error('Developer not found:', developerId);
        return;
    }
    
    // Check if developer is assigned to any stories
    const assignedCount = countAssignedStories(developerId, allItems, devConfig.developers);
    if (assignedCount > 0) {
        vscode.postMessage({
            command: 'showError',
            message: `Cannot delete ${developer.name} - they are assigned to ${assignedCount} user stor${assignedCount === 1 ? 'y' : 'ies'}. Please reassign these stories first.`
        });
        return;
    }
    
    // Show confirmation modal
    const modalHtml = generateDeveloperDeleteConfirmModal(developer);
    
    // Insert modal into DOM
    let modalContainer = document.getElementById('modalContainer');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = modalHtml;
}

/**
 * Close delete developer confirmation modal
 */
function closeDeleteDeveloperModal() {
    const modal = document.getElementById('deleteDeveloperModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Confirm delete developer (called from modal)
 * @param {string} developerId - Developer ID
 */
function confirmDeleteDeveloper(developerId) {
    // Close modal
    closeDeleteDeveloperModal();
    
    // Remove developer from config
    devConfig.developers = devConfig.developers.filter(d => d.id !== developerId);
    
    // Save to extension
    saveDevConfig();
    
    // Refresh developers tab
    renderDevelopersTab();
}

/**
 * Toggle developer selection
 */
function toggleDeveloperSelection() {
    selectedDevelopers.clear();
    
    const checkboxes = document.querySelectorAll('.developer-checkbox:checked');
    checkboxes.forEach(cb => {
        selectedDevelopers.add(cb.dataset.developerId);
    });
    
    // Update bulk action button states in action bar
    updateDeveloperBulkActionButtons();
    
    // Update select all checkbox
    updateSelectAllDevelopersCheckbox();
}

/**
 * Toggle select all developers
 */
function toggleSelectAllDevelopers() {
    const selectAllCheckbox = document.getElementById('selectAllDevelopers');
    const checkboxes = document.querySelectorAll('.developer-checkbox');
    
    checkboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
    });
    
    toggleDeveloperSelection();
}

/**
 * Update select all checkbox state
 */
function updateSelectAllDevelopersCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllDevelopers');
    const checkboxes = document.querySelectorAll('.developer-checkbox');
    const checkedBoxes = document.querySelectorAll('.developer-checkbox:checked');
    
    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === checkboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

/**
 * Bulk activate selected developers
 */
function bulkActivateDevelopers() {
    if (selectedDevelopers.size === 0) {
        return;
    }
    
    devConfig.developers.forEach(dev => {
        if (selectedDevelopers.has(dev.id)) {
            dev.active = true;
        }
    });
    
    saveDevConfig();
    renderDevelopersTab();
    selectedDevelopers.clear();
}

/**
 * Bulk deactivate selected developers
 */
function bulkDeactivateDevelopers() {
    if (selectedDevelopers.size === 0) {
        return;
    }
    
    devConfig.developers.forEach(dev => {
        if (selectedDevelopers.has(dev.id)) {
            dev.active = false;
        }
    });
    
    saveDevConfig();
    renderDevelopersTab();
    selectedDevelopers.clear();
}

/**
 * Bulk delete selected developers
 */
function bulkDeleteDevelopers() {
    if (selectedDevelopers.size === 0) {
        return;
    }
    
    // Check if any selected developers are assigned to stories
    const developersWithAssignments = [];
    selectedDevelopers.forEach(devId => {
        const dev = devConfig.developers.find(d => d.id === devId);
        const assignedCount = countAssignedStories(devId, allItems, devConfig.developers);
        if (assignedCount > 0) {
            developersWithAssignments.push({ name: dev.name, count: assignedCount });
        }
    });
    
    if (developersWithAssignments.length > 0) {
        const names = developersWithAssignments.map(d => `${d.name} (${d.count} stories)`).join(', ');
        vscode.postMessage({
            command: 'showError',
            message: `Cannot delete developers with assignments: ${names}. Please reassign their stories first.`
        });
        return;
    }
    
    // Show confirmation
    const confirmMessage = `Are you sure you want to delete ${selectedDevelopers.size} developer${selectedDevelopers.size === 1 ? '' : 's'}?`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Remove developers
    devConfig.developers = devConfig.developers.filter(d => !selectedDevelopers.has(d.id));
    
    saveDevConfig();
    renderDevelopersTab();
    selectedDevelopers.clear();
}

/**
 * Filter developers based on current filter state
 */
function filterDevelopers() {
    const statusFilter = document.getElementById('developerStatusFilter').value;
    const searchInput = document.getElementById('developerSearchInput').value.toLowerCase().trim();
    
    developerFilterState.status = statusFilter;
    developerFilterState.search = searchInput;
    
    // Get all developer rows
    const rows = document.querySelectorAll('.developer-row');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const developerId = row.dataset.developerId;
        const developer = devConfig.developers.find(d => d.id === developerId);
        
        if (!developer) {
            row.style.display = 'none';
            return;
        }
        
        let visible = true;
        
        // Apply status filter
        if (statusFilter === 'active' && !developer.active) {
            visible = false;
        } else if (statusFilter === 'inactive' && developer.active) {
            visible = false;
        }
        
        // Apply search filter
        if (searchInput && visible) {
            const name = (developer.name || '').toLowerCase();
            const email = (developer.email || '').toLowerCase();
            const role = (developer.role || '').toLowerCase();
            
            if (!name.includes(searchInput) && !email.includes(searchInput) && !role.includes(searchInput)) {
                visible = false;
            }
        }
        
        row.style.display = visible ? '' : 'none';
        if (visible) {
            visibleCount++;
        }
    });
    
    // Update record info
    const recordInfo = document.getElementById('developerRecordInfo');
    if (recordInfo) {
        const totalCount = devConfig.developers.length;
        if (visibleCount === totalCount) {
            recordInfo.textContent = `Showing ${totalCount} developer${totalCount !== 1 ? 's' : ''}`;
        } else {
            recordInfo.textContent = `Showing ${visibleCount} of ${totalCount} developer${totalCount !== 1 ? 's' : ''}`;
        }
    }
}

/**
 * Clear all developer filters
 */
function clearDeveloperFilters() {
    document.getElementById('developerStatusFilter').value = '';
    document.getElementById('developerSearchInput').value = '';
    
    filterDevelopers();
}

/**
 * Toggle developer filter section expand/collapse
 */
function toggleDeveloperFilters() {
    const filterContent = document.getElementById('developerFilterContent');
    const chevron = document.getElementById('developerFilterChevron');
    
    if (!filterContent || !chevron) {
        return;
    }
    
    const isExpanded = filterContent.style.display !== 'none';
    
    if (isExpanded) {
        filterContent.style.display = 'none';
        chevron.classList.remove('codicon-chevron-down');
        chevron.classList.add('codicon-chevron-right');
    } else {
        filterContent.style.display = 'block';
        chevron.classList.remove('codicon-chevron-right');
        chevron.classList.add('codicon-chevron-down');
    }
}

/**
 * Refresh developers display
 */
function refreshDevelopers() {
    showSpinner();
    vscode.postMessage({ command: 'refresh' });
}

/**
 * Sort developers by column
 * @param {string} column - Column to sort by
 */
function sortDevelopersBy(column) {
    // Toggle sort direction if same column
    if (developerFilterState.sortColumn === column) {
        developerFilterState.sortDescending = !developerFilterState.sortDescending;
    } else {
        developerFilterState.sortColumn = column;
        developerFilterState.sortDescending = false;
    }
    
    // Sort developers array
    devConfig.developers.sort((a, b) => {
        let aVal, bVal;
        
        switch (column) {
            case 'name':
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
                break;
            case 'email':
                aVal = (a.email || '').toLowerCase();
                bVal = (b.email || '').toLowerCase();
                break;
            case 'role':
                aVal = (a.role || '').toLowerCase();
                bVal = (b.role || '').toLowerCase();
                break;
            case 'capacity':
                aVal = a.capacity || 0;
                bVal = b.capacity || 0;
                break;
            case 'assignedCount':
                aVal = countAssignedStories(a.id, allItems, devConfig.developers);
                bVal = countAssignedStories(b.id, allItems, devConfig.developers);
                break;
            case 'active':
                aVal = a.active ? 1 : 0;
                bVal = b.active ? 1 : 0;
                break;
            default:
                return 0;
        }
        
        let comparison = 0;
        if (aVal < bVal) {
            comparison = -1;
        } else if (aVal > bVal) {
            comparison = 1;
        }
        
        return developerFilterState.sortDescending ? -comparison : comparison;
    });
    
    // Re-render table
    renderDevelopersTab();
    
    // Update sort indicators
    updateDeveloperSortIndicators();
}

/**
 * Update sort indicators in table headers
 */
function updateDeveloperSortIndicators() {
    const headers = document.querySelectorAll('.developers-table th.sortable');
    headers.forEach(header => {
        const indicator = header.querySelector('.sort-indicator');
        if (indicator) {
            indicator.textContent = '';
        }
    });
    
    // Find the active column header
    const activeHeader = Array.from(headers).find(header => {
        const onclick = header.getAttribute('onclick');
        return onclick && onclick.includes(`'${developerFilterState.sortColumn}'`);
    });
    
    if (activeHeader) {
        const indicator = activeHeader.querySelector('.sort-indicator');
        if (indicator) {
            indicator.textContent = developerFilterState.sortDescending ? ' ▼' : ' ▲';
        }
    }
}

/**
 * Generate unique developer ID from name
 * @param {string} name - Developer name
 * @returns {string} Generated ID
 */
function generateDeveloperId(name) {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let id = base;
    let counter = 1;
    
    while (devConfig.developers.some(d => d.id === id)) {
        id = `${base}${counter}`;
        counter++;
    }
    
    return id;
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Show form error message
 * @param {string} message - Error message
 */
function showFormError(message) {
    const errorDiv = document.getElementById('developerFormError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Export developers to CSV
 */
function exportDevelopersToCSV() {
    console.log('[DeveloperManagement] Download CSV button clicked');
    vscode.postMessage({
        command: 'downloadDevelopersCsv'
    });
}

/**
 * Get selected developer checkboxes
 * @returns {Array} Array of selected developer IDs
 */
function getSelectedDevelopers() {
    const checkboxes = document.querySelectorAll('.developer-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.developerId);
}

/**
 * Update bulk action button states for Developers tab
 */
function updateDeveloperBulkActionButtons() {
    const selected = getSelectedDevelopers();
    const hasSelection = selected.length > 0;
    
    const bulkActivateBtn = document.getElementById('bulkActivateBtn');
    const bulkDeactivateBtn = document.getElementById('bulkDeactivateBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    
    if (bulkActivateBtn) {
        bulkActivateBtn.disabled = !hasSelection;
    }
    if (bulkDeactivateBtn) {
        bulkDeactivateBtn.disabled = !hasSelection;
    }
    if (bulkDeleteBtn) {
        bulkDeleteBtn.disabled = !hasSelection;
    }
}

/**
 * Bulk activate selected developers
 */
function bulkActivateDevelopers() {
    const selected = getSelectedDevelopers();
    if (selected.length === 0) {
        return;
    }
    
    selected.forEach(id => {
        const developer = devConfig.developers.find(d => d.id === id);
        if (developer) {
            developer.active = true;
        }
    });
    
    saveDevConfig();
    console.log(`[DeveloperManagement] Bulk activated ${selected.length} developers`);
}

/**
 * Bulk deactivate selected developers
 */
function bulkDeactivateDevelopers() {
    const selected = getSelectedDevelopers();
    if (selected.length === 0) {
        return;
    }
    
    selected.forEach(id => {
        const developer = devConfig.developers.find(d => d.id === id);
        if (developer) {
            developer.active = false;
        }
    });
    
    saveDevConfig();
    console.log(`[DeveloperManagement] Bulk deactivated ${selected.length} developers`);
}

/**
 * Bulk delete selected developers
 */
function bulkDeleteDevelopers() {
    const selected = getSelectedDevelopers();
    if (selected.length === 0) {
        return;
    }
    
    // Confirm deletion
    const count = selected.length;
    const message = `Are you sure you want to delete ${count} developer${count > 1 ? 's' : ''}?\n\nNote: Developers with assigned stories should be deactivated instead of deleted.`;
    
    if (confirm(message)) {
        devConfig.developers = devConfig.developers.filter(d => !selected.includes(d.id));
        saveDevConfig();
        console.log(`[DeveloperManagement] Bulk deleted ${count} developers`);
    }
}

/**
 * Save dev config to extension
 */
function saveDevConfig() {
    showSpinner();
    
    vscode.postMessage({
        command: 'saveDevConfig',
        config: devConfig
    });
}

// Expose functions to window for onclick handlers
if (typeof window !== 'undefined') {
    window.refreshDevelopers = refreshDevelopers;
    window.exportDevelopersToCSV = exportDevelopersToCSV;
    window.bulkActivateDevelopers = bulkActivateDevelopers;
    window.bulkDeactivateDevelopers = bulkDeactivateDevelopers;
    window.bulkDeleteDevelopers = bulkDeleteDevelopers;
    window.closeDeleteDeveloperModal = closeDeleteDeveloperModal;
    window.confirmDeleteDeveloper = confirmDeleteDeveloper;
}
