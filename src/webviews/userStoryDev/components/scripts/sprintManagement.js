// Description: Sprint management functions for CRUD operations
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Global variable to track current sprint being edited
 */
let currentEditingSprint = null;

/**
 * Show create sprint modal
 */
function showCreateSprintModal() {
    currentEditingSprint = null;
    const modalHtml = generateSprintModal(null);
    
    // Insert modal into DOM
    let modalContainer = document.getElementById('modalContainer');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = modalHtml;
    
    // Set default start date to today
    const startDateInput = document.getElementById('sprintStartDate');
    if (startDateInput) {
        startDateInput.value = new Date().toISOString().split('T')[0];
        // Auto-calculate end date for 2 weeks
        updateSprintEndDate();
    }
}

/**
 * Edit existing sprint
 * @param {string} sprintId - Sprint ID to edit
 */
function editSprint(sprintId) {
    const sprint = devConfig.sprints.find(s => s.sprintId === sprintId);
    if (!sprint) {
        console.error('Sprint not found:', sprintId);
        return;
    }
    
    currentEditingSprint = sprint;
    const modalHtml = generateSprintModal(sprint);
    
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
 * Close sprint modal
 */
function closeSprintModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
    currentEditingSprint = null;
}

/**
 * Update sprint end date based on start date (default 2 weeks)
 */
function updateSprintEndDate() {
    const startDateInput = document.getElementById('sprintStartDate');
    const endDateInput = document.getElementById('sprintEndDate');
    const durationInput = document.getElementById('sprintDuration');
    
    if (!startDateInput || !endDateInput) {
        return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (startDate && endDate) {
        // Calculate duration
        const duration = calculateDuration(startDate, endDate);
        if (durationInput) {
            durationInput.value = duration;
        }
    } else if (startDate && !endDate) {
        // Auto-set end date to 14 days from start
        const start = new Date(startDate);
        start.setDate(start.getDate() + 14);
        endDateInput.value = start.toISOString().split('T')[0];
        
        if (durationInput) {
            durationInput.value = 14;
        }
    }
}

/**
 * Apply sprint preset duration
 * @param {number} days - Number of days
 */
function applySprintPreset(days) {
    const startDateInput = document.getElementById('sprintStartDate');
    const endDateInput = document.getElementById('sprintEndDate');
    const durationInput = document.getElementById('sprintDuration');
    
    if (!startDateInput || !endDateInput) {
        return;
    }
    
    const startDate = startDateInput.value || new Date().toISOString().split('T')[0];
    startDateInput.value = startDate;
    
    const start = new Date(startDate);
    start.setDate(start.getDate() + days);
    endDateInput.value = start.toISOString().split('T')[0];
    
    if (durationInput) {
        durationInput.value = days;
    }
}

/**
 * Save sprint (create or update)
 * @param {Event} event - Form submit event
 */
function saveSprint(event) {
    event.preventDefault();
    
    const sprintName = document.getElementById('sprintName').value.trim();
    const startDate = document.getElementById('sprintStartDate').value;
    const endDate = document.getElementById('sprintEndDate').value;
    const status = document.getElementById('sprintStatus').value;
    const capacityInput = document.getElementById('sprintCapacity').value;
    const capacity = capacityInput ? parseInt(capacityInput) : null;
    const goal = document.getElementById('sprintGoal').value.trim();
    
    // Validation
    if (!sprintName || !startDate || !endDate || !status) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
        alert('End date must be after start date');
        return;
    }
    
    // Create or update sprint object
    const sprintData = {
        sprintName,
        startDate,
        endDate,
        status,
        capacity,
        goal
    };
    
    if (currentEditingSprint) {
        // Update existing sprint
        sprintData.sprintId = currentEditingSprint.sprintId;
        
        vscode.postMessage({
            command: 'updateSprint',
            data: sprintData
        });
    } else {
        // Create new sprint
        sprintData.sprintId = generateSprintId();
        
        vscode.postMessage({
            command: 'createSprint',
            data: sprintData
        });
    }
    
    closeSprintModal();
    showSpinner();
}

/**
 * Show delete sprint confirmation modal
 * @param {string} sprintId - Sprint ID to delete
 */
function deleteSprint(sprintId) {
    const sprint = devConfig.sprints.find(s => s.sprintId === sprintId);
    if (!sprint) {
        console.error('Sprint not found:', sprintId);
        return;
    }
    
    // Count stories assigned to this sprint
    const storyCount = allItems.filter(item => item.assignedSprint === sprintId).length;
    
    const modalHtml = generateSprintDeleteConfirmModal(sprint, storyCount);
    
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
 * Close delete sprint modal
 */
function closeDeleteSprintModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}

/**
 * Confirm and execute sprint deletion
 * @param {string} sprintId - Sprint ID to delete
 */
function confirmDeleteSprint(sprintId) {
    vscode.postMessage({
        command: 'deleteSprint',
        data: { sprintId }
    });
    
    closeDeleteSprintModal();
    showSpinner();
}

/**
 * Generate unique sprint ID
 * @returns {string} Unique sprint ID
 */
function generateSprintId() {
    return 'sprint-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Switch between sprint sub-tabs
 * @param {string} subTabName - Sub-tab name ('planning' or 'burndown')
 */
function switchSprintSubTab(subTabName) {
    // Update sub-tab buttons
    const subTabButtons = document.querySelectorAll('.sprint-sub-tab');
    subTabButtons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(subTabName)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update sub-tab content
    const planningTab = document.getElementById('sprintPlanningSubTab');
    const burndownTab = document.getElementById('sprintBurndownSubTab');
    
    if (subTabName === 'planning') {
        if (planningTab) {
            planningTab.classList.add('active');
        }
        if (burndownTab) {
            burndownTab.classList.remove('active');
        }
    } else if (subTabName === 'burndown') {
        if (planningTab) {
            planningTab.classList.remove('active');
        }
        if (burndownTab) {
            burndownTab.classList.add('active');
        }
        // Render burndown chart
        setTimeout(() => renderBurndownChart(), 100);
    }
}

/**
 * Filter backlog stories
 */
function filterBacklog() {
    const priorityFilter = document.getElementById('backlogPriorityFilter')?.value || '';
    const pointsFilter = document.getElementById('backlogPointsFilter')?.value || '';
    
    const backlogStories = document.querySelectorAll('.backlog-story');
    
    backlogStories.forEach(story => {
        const priority = story.getAttribute('data-priority');
        const points = story.getAttribute('data-points');
        
        let show = true;
        
        if (priorityFilter && priority !== priorityFilter) {
            show = false;
        }
        
        if (pointsFilter && points !== pointsFilter) {
            show = false;
        }
        
        story.style.display = show ? 'block' : 'none';
    });
}

/**
 * Assign story to sprint via drag-and-drop or button
 * @param {string} storyId - Story ID
 * @param {string} sprintId - Sprint ID
 */
function assignStoryToSprint(storyId, sprintId) {
    vscode.postMessage({
        command: 'assignStoryToSprint',
        data: {
            storyId,
            sprintId
        }
    });
    
    showSpinner();
}

/**
 * Unassign story from sprint (move back to backlog)
 * @param {string} storyId - Story ID
 */
function unassignStoryFromSprint(storyId) {
    vscode.postMessage({
        command: 'unassignStoryFromSprint',
        data: { storyId }
    });
    
    showSpinner();
}

/**
 * Render burndown chart for selected sprint
 */
function renderBurndownChart() {
    const sprintSelect = document.getElementById('burndownSprintSelect');
    if (!sprintSelect) {
        return;
    }
    
    const sprintId = sprintSelect.value;
    const sprint = devConfig.sprints.find(s => s.sprintId === sprintId);
    
    if (!sprint) {
        return;
    }
    
    // Update metrics
    const metricsContainer = document.getElementById('burndownMetrics');
    if (metricsContainer) {
        metricsContainer.innerHTML = generateBurndownMetrics(sprint, allItems);
    }
    
    // Update stories list
    const storiesContainer = document.getElementById('sprintStoriesList');
    if (storiesContainer) {
        storiesContainer.innerHTML = generateSprintStoriesSummary(sprint, allItems);
    }
    
    // Render D3 burndown chart
    const chartContainer = document.getElementById('burndownChartBody');
    if (chartContainer) {
        renderSprintBurndownChart(sprint, allItems, 'burndownChartBody');
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showCreateSprintModal,
        editSprint,
        closeSprintModal,
        updateSprintEndDate,
        applySprintPreset,
        saveSprint,
        deleteSprint,
        closeDeleteSprintModal,
        confirmDeleteSprint,
        generateSprintId,
        switchSprintSubTab,
        filterBacklog,
        assignStoryToSprint,
        unassignStoryFromSprint,
        renderBurndownChart
    };
}
