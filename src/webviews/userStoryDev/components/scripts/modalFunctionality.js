// Description: Story detail modal functionality
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Currently open story ID
 */
let currentModalStoryId = null;

/**
 * Open story detail modal
 * @param {string} storyId - Story ID to display
 */
function openStoryDetailModal(storyId) {
    if (!storyId) {
        return;
    }
    
    // Find the item
    const item = allItems.find(i => i.storyId === storyId);
    if (!item) {
        console.error('Item not found:', storyId);
        return;
    }
    
    // Store current story ID
    currentModalStoryId = storyId;
    
    // Generate and display modal
    const modalHTML = generateStoryDetailModal(item, devConfig);
    
    // Create modal element
    const modalContainer = document.createElement('div');
    modalContainer.id = 'storyDetailModalContainer';
    modalContainer.innerHTML = modalHTML;
    
    document.body.appendChild(modalContainer);
    
    // Set up event listeners
    setupModalEventListeners();
    
    // Focus first input
    setTimeout(() => {
        const firstInput = modalContainer.querySelector('select, input, textarea');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

/**
 * Close story detail modal
 */
function closeStoryDetailModal() {
    const modalContainer = document.getElementById('storyDetailModalContainer');
    if (modalContainer) {
        modalContainer.remove();
    }
    currentModalStoryId = null;
}

/**
 * Save story details from modal
 */
function saveStoryDetails() {
    if (!currentModalStoryId) {
        return;
    }
    
    // Find the item and update local state
    const item = allItems.find(i => i.storyId === currentModalStoryId);
    if (!item) {
        console.error('Item not found:', currentModalStoryId);
        return;
    }
    
    // Update item properties from form values
    item.devStatus = document.getElementById('modalDevStatus')?.value || item.devStatus || '';
    item.priority = document.getElementById('modalPriority')?.value || item.priority || '';
    item.storyPoints = document.getElementById('modalStoryPoints')?.value || item.storyPoints || '';
    item.assignedTo = document.getElementById('modalAssignedTo')?.value || item.assignedTo || '';
    item.sprint = document.getElementById('modalSprint')?.value || item.sprint || '';
    item.startDate = document.getElementById('modalStartDate')?.value || item.startDate || '';
    item.estimatedEndDate = document.getElementById('modalEstEndDate')?.value || item.estimatedEndDate || '';
    item.actualEndDate = document.getElementById('modalActualEndDate')?.value || item.actualEndDate || '';
    item.blockedReason = document.getElementById('modalBlockedReason')?.value || item.blockedReason || '';
    item.devNotes = document.getElementById('modalDevNotes')?.value || item.devNotes || '';
    
    // Build complete dev record and send to extension
    const devRecord = buildDevRecord(item);
    vscode.postMessage({
        command: 'saveDevChange',
        data: devRecord
    });
    
    // Close modal first
    closeStoryDetailModal();
    
    // Refresh the current active tab to reflect changes
    refreshCurrentTab();
}

/**
 * Set up event listeners for modal
 */
function setupModalEventListeners() {
    // Close button
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeStoryDetailModal);
    }
    
    // Save button
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveStoryDetails);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('modalCancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeStoryDetailModal);
    }
    
    // Click outside to close
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeStoryDetailModal();
            }
        });
    }
    
    // Escape key to close
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeStoryDetailModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Story points change triggers estimated end date calculation
    const storyPointsSelect = document.getElementById('modalStoryPoints');
    const startDateInput = document.getElementById('modalStartDate');
    const estEndDateInput = document.getElementById('modalEstEndDate');
    
    if (storyPointsSelect && startDateInput && estEndDateInput) {
        const recalculateEndDate = () => {
            const points = storyPointsSelect.value;
            const startDate = startDateInput.value;
            
            if (points && points !== '?' && startDate) {
                const estimatedEndDate = calculateEstimatedEndDate(
                    startDate,
                    parseInt(points),
                    devConfig
                );
                estEndDateInput.value = estimatedEndDate;
            }
        };
        
        storyPointsSelect.addEventListener('change', recalculateEndDate);
        startDateInput.addEventListener('change', recalculateEndDate);
    }
    
    // Dev status change shows/hides blocked reason
    const devStatusSelect = document.getElementById('modalDevStatus');
    const blockedReasonGroup = document.getElementById('modalBlockedReasonGroup');
    
    if (devStatusSelect && blockedReasonGroup) {
        const toggleBlockedReason = () => {
            if (devStatusSelect.value === 'blocked') {
                blockedReasonGroup.style.display = 'block';
            } else {
                blockedReasonGroup.style.display = 'none';
            }
        };
        
        devStatusSelect.addEventListener('change', toggleBlockedReason);
        toggleBlockedReason(); // Initial state
    }
    
    // Auto-set start date when changing to in-progress
    if (devStatusSelect && startDateInput) {
        devStatusSelect.addEventListener('change', () => {
            if (devStatusSelect.value === 'in-progress' && !startDateInput.value) {
                startDateInput.value = new Date().toISOString().split('T')[0];
            }
        });
    }
    
    // Auto-set actual end date when changing to completed
    const actualEndDateInput = document.getElementById('modalActualEndDate');
    if (devStatusSelect && actualEndDateInput) {
        devStatusSelect.addEventListener('change', () => {
            if (devStatusSelect.value === 'completed' && !actualEndDateInput.value) {
                actualEndDateInput.value = new Date().toISOString().split('T')[0];
            }
        });
    }
}

/**
 * Handle modal form submission (Enter key)
 */
function handleModalFormSubmit(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        // Allow Enter in textarea for new lines (with Shift)
        const target = e.target;
        if (target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            saveStoryDetails();
        }
    }
}

/**
 * Refresh the current active tab after modal save
 */
function refreshCurrentTab() {
    // currentTab is a global variable set in userStoryDevView.js
    if (typeof currentTab === 'undefined') {
        console.warn('currentTab not defined, refreshing details tab by default');
        if (typeof renderDetailsTab === 'function') {
            renderDetailsTab();
        }
        return;
    }
    
    switch (currentTab) {
        case 'details':
            if (typeof renderDetailsTab === 'function') {
                renderDetailsTab();
            }
            break;
        case 'board':
            if (typeof refreshBoard === 'function') {
                refreshBoard();
            }
            break;
        case 'forecast':
            if (typeof refreshForecast === 'function') {
                refreshForecast();
            }
            break;
        case 'analysis':
            if (typeof renderAnalysisTab === 'function') {
                renderAnalysisTab();
            }
            break;
        case 'sprint':
            if (typeof renderSprintTab === 'function') {
                renderSprintTab();
            }
            break;
        default:
            console.warn('Unknown tab:', currentTab);
            break;
    }
}

/**
 * Open modal for a new story (if needed in future)
 * @param {Object} defaultValues - Default values for new story
 */
function openNewStoryModal(defaultValues = {}) {
    // For future use - creating new user stories from Dev view
    console.log('New story modal not implemented yet');
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openStoryDetailModal,
        closeStoryDetailModal,
        saveStoryDetails,
        setupModalEventListeners,
        handleModalFormSubmit,
        refreshCurrentTab,
        openNewStoryModal
    };
}
