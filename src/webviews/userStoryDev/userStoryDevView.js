// Description: Main orchestrator for user stories development view webview
// Created: October 5, 2025
// Last Modified: October 5, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Current sort state
let currentSortState = {
    column: 'storyNumber',
    descending: false
};

// Keep track of the current state
let devData = {
    items: [],
    totalRecords: 0,
    sortColumn: 'storyNumber',
    sortDescending: false
};

// Keep track of all items for filtering
let allItems = [];

// Keep track of selected items
let selectedItems = new Set();

// Keep track of configuration
let devConfig = {
    developers: [],
    sprints: [],
    forecastConfig: {},
    settings: {}
};

// Current active tab
let currentTab = 'details';

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Activate tab button
    event.target.classList.add('active');
    currentTab = tabName;

    // Render tab-specific content and refresh data
    switch (tabName) {
        case 'details':
            renderDetailsTab();
            // Auto-refresh data from extension
            if (typeof refreshData === 'function') {
                refreshData();
            }
            break;
        case 'analysis':
            renderAnalysisTab();
            // Auto-refresh analytics calculations
            if (typeof refreshAnalytics === 'function') {
                refreshAnalytics();
            }
            break;
        case 'board':
            renderBoardTab();
            // Auto-refresh board layout
            if (typeof refreshBoard === 'function') {
                refreshBoard();
            }
            break;
        case 'sprint':
            renderSprintTab();
            // Sprint tab renders fresh data, no additional refresh needed
            break;
        case 'developers':
            renderDevelopersTab();
            // Developers tab renders fresh data
            break;
        case 'forecast':
            // Render forecast tab (includes calculation and Gantt chart)
            renderForecastTab();
            break;
    }
}

/**
 * Show spinner overlay
 */
function showSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.style.display = "flex";
    }
}

/**
 * Hide spinner overlay
 */
function hideSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.style.display = "none";
    }
}

/**
 * Build complete dev record for saving
 * Helper function to create a complete dev record with all fields
 * @param {object} item - The item object from allItems
 * @returns {object} Complete dev record ready to send to extension
 */
function buildDevRecord(item) {
    return {
        storyId: item.storyId,
        devStatus: item.devStatus || 'on-hold',
        priority: item.priority || 'medium',
        storyPoints: item.storyPoints || '?',
        assignedTo: item.assignedTo || '',
        sprintId: item.sprintId || '',
        startDate: item.startDate || '',
        estimatedEndDate: item.estimatedEndDate || '',
        actualEndDate: item.actualEndDate || '',
        blockedReason: item.blockedReason || '',
        devNotes: item.devNotes || '',
        devFilePath: item.devFilePath
    };
}

/**
 * Render Details Tab
 */
function renderDetailsTab() {
    const detailsTab = document.getElementById('detailsTab');
    if (!detailsTab) {
        return;
    }

    // Generate the tab HTML using template
    detailsTab.innerHTML = generateDetailsTab(allItems, devConfig);

    // Set up filter event listeners
    setupFilterEventListeners();

    // Render the table
    renderTable(allItems, devConfig, currentSortState);

    // Update record info
    updateRecordInfo(allItems.length, allItems.length);
}

/**
 * Render Analysis Tab
 */
function renderAnalysisTab() {
    const analysisTab = document.getElementById('analysisTab');
    if (!analysisTab) {
        return;
    }

    if (!allItems || allItems.length === 0) {
        analysisTab.innerHTML = generateAnalyticsEmptyState();
        return;
    }

    // Generate the tab HTML using template
    analysisTab.innerHTML = generateAnalysisTab(allItems, devConfig);

    // Calculate velocity data
    const velocityData = calculateSprintVelocity(allItems, devConfig);
    const velocityStats = getVelocityStatistics(velocityData);

    // Calculate cycle time data
    const cycleTimeStats = calculateCycleTimeStatistics(allItems);
    const cycleTimeTrend = calculateCycleTimeTrend(allItems, 'week');

    // Generate and insert metrics cards
    const metricsGrid = document.querySelector('.analytics-metrics-grid');
    if (metricsGrid) {
        metricsGrid.innerHTML = generateMetricsCards(
            allItems,
            { statistics: velocityStats, data: velocityData },
            cycleTimeStats
        );
    }

    // Render charts
    setTimeout(() => {
        renderStatusDistributionChart(allItems, 'statusDistributionChart');
        renderPriorityDistributionChart(allItems, 'priorityDistributionChart');
        renderVelocityChart(velocityData, 'velocityChart');
        renderCycleTimeChart(cycleTimeTrend, 'cycleTimeChart');
        renderDeveloperWorkloadChart(allItems, devConfig, 'developerWorkloadChart');
    }, 100);

    // Set up refresh button handler
    const refreshButton = document.getElementById('refreshAnalyticsBtn');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshAnalytics);
    }
}

/**
 * Refresh analytics data and charts
 */
function refreshAnalytics() {
    const analysisTab = document.getElementById('analysisTab');
    if (!analysisTab) {
        return;
    }

    // Show spinner overlay
    showSpinner();

    // Re-calculate and re-render after brief delay to allow spinner to display
    setTimeout(() => {
        try {
            renderAnalysisTab();
        } finally {
            // Hide spinner after processing
            hideSpinner();
        }
    }, 50);
}

/**
 * Render Board Tab
 */
function renderBoardTab() {
    const boardTab = document.getElementById('boardTab');
    if (!boardTab) {
        return;
    }

    // Generate the board HTML using template
    boardTab.innerHTML = generateBoardTab(allItems, devConfig);

    // Render the Kanban board with cards
    renderKanbanBoard(allItems, devConfig);
}

/**
 * Render Sprint Tab
 */
function renderSprintTab() {
    const sprintTab = document.getElementById('sprintTab');
    if (!sprintTab) {
        return;
    }

    // Generate the sprint tab HTML using template
    sprintTab.innerHTML = generateSprintTab(allItems, devConfig);

    // Set up create sprint button handler
    const createSprintBtn = document.getElementById('createSprintBtn');
    if (createSprintBtn) {
        createSprintBtn.addEventListener('click', showCreateSprintModal);
    }

    // Set up drag-and-drop for sprint planning
    if (typeof setupSprintDragDrop === 'function') {
        setupSprintDragDrop();
    }

    // Set up refresh burndown button handler if on burndown sub-tab
    const refreshBurndownBtn = document.getElementById('refreshBurndownBtn');
    if (refreshBurndownBtn) {
        refreshBurndownBtn.addEventListener('click', renderBurndownChart);
    }

    // If burndown sub-tab is active, render the chart
    const burndownSubTab = document.getElementById('sprintBurndownSubTab');
    if (burndownSubTab && burndownSubTab.classList.contains('active')) {
        setTimeout(() => renderBurndownChart(), 100);
    }
}

/**
 * Render Developers Tab
 */
function renderDevelopersTab() {
    const developersTab = document.getElementById('developersTab');
    if (!developersTab) {
        return;
    }

    // Generate the developers tab HTML using template
    developersTab.innerHTML = generateDevelopersTab(devConfig, allItems);

    // Set up add developer button handler
    const addDeveloperBtn = document.getElementById('addDeveloperBtn');
    if (addDeveloperBtn) {
        addDeveloperBtn.addEventListener('click', showAddDeveloperModal);
    }

    // Apply current filters
    if (developerFilterState.status || developerFilterState.search) {
        document.getElementById('developerStatusFilter').value = developerFilterState.status;
        document.getElementById('developerSearchInput').value = developerFilterState.search;
        filterDevelopers();
    }

    // Update sort indicators
    updateDeveloperSortIndicators();
}

/**
 * Render Forecast Tab
 */
function renderForecastTab() {
    const forecastTab = document.getElementById('forecastTab');
    if (!forecastTab) {
        return;
    }

    // Generate forecast tab HTML
    forecastTab.innerHTML = generateForecastTab(allItems, devConfig);
    
    // If we have data, calculate forecast and render Gantt chart
    if (allItems && allItems.length > 0) {
        const forecastConfig = devConfig.forecastConfig || getDefaultForecastConfig();
        const forecast = calculateDevelopmentForecast(allItems, devConfig);
        
        if (forecast) {
            // Render Gantt chart with a small delay to ensure DOM is ready
            setTimeout(() => {
                renderGanttChart(allItems, forecast, forecastConfig);
            }, 100);
        }
    }
}

/**
 * Handle messages from the extension
 */
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'setDevData':
            console.log('[Webview] Received dev data:', message.data);
            devData = message.data;
            allItems = message.data.items.slice();
            hideSpinner();
            
            // Render current tab
            switch (currentTab) {
                case 'details':
                    renderDetailsTab();
                    break;
                case 'analysis':
                    renderAnalysisTab();
                    break;
                case 'board':
                    renderBoardTab();
                    break;
                case 'sprint':
                    renderSprintTab();
                    break;
                case 'developers':
                    renderDevelopersTab();
                    break;
                case 'forecast':
                    renderForecastTab();
                    break;
            }
            break;

        case 'setDevConfig':
            console.log('[Webview] Received dev config:', message.config);
            devConfig = message.config;
            hideSpinner();
            
            // Re-render current tab with config data
            switch (currentTab) {
                case 'details':
                    renderDetailsTab();
                    break;
                case 'sprint':
                    renderSprintTab();
                    break;
                case 'developers':
                    renderDevelopersTab();
                    break;
                case 'forecast':
                    renderForecastTab();
                    break;
            }
            break;

        case 'devChangeSaved':
            hideSpinner();
            if (message.success) {
                console.log('[Webview] Dev change saved successfully');
                // Optionally show a toast notification
            } else {
                console.error('[Webview] Failed to save dev change:', message.error);
            }
            break;

        case 'sprintSaved':
            hideSpinner();
            if (message.success) {
                console.log('[Webview] Sprint saved successfully');
                // Update local config
                if (message.sprint) {
                    const index = devConfig.sprints.findIndex(s => s.sprintId === message.sprint.sprintId);
                    if (index >= 0) {
                        devConfig.sprints[index] = message.sprint;
                    } else {
                        devConfig.sprints.push(message.sprint);
                    }
                    renderSprintTab();
                }
            }
            break;

        case 'forecastConfigSaved':
            hideSpinner();
            if (message.success) {
                console.log('[Webview] Forecast config saved successfully');
                devConfig.forecastConfig = message.config;
                // Close the config modal
                if (typeof closeForecastConfigModal === 'function') {
                    closeForecastConfigModal();
                }
                renderForecastTab();
            } else {
                // Re-enable the save button on error
                const form = document.getElementById("forecast-config-form");
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span class="codicon codicon-save"></span> Save Configuration';
                    }
                }
            }
            break;

        case 'switchToTab':
            if (message.data && message.data.tabName) {
                const tabButton = document.querySelector(`.tab[onclick*="${message.data.tabName}"]`);
                if (tabButton) {
                    tabButton.click();
                }
            }
            break;

        case 'csvData':
            // Download CSV file - send to extension to save in workspace
            try {
                console.log('[UserStoryDev] Received csvData message from extension', message.data);
                // Send a message to the extension host to save the file in the workspace
                vscode.postMessage({
                    command: 'saveCsvToWorkspace',
                    data: {
                        content: message.data.content,
                        filename: message.data.filename
                    }
                });
            } catch (e) {
                console.error('[UserStoryDev] Failed to trigger CSV workspace save:', e);
            }
            break;

        default:
            console.warn('[Webview] Unknown command:', message.command);
    }
});

// Initialize view
console.log('[Webview] User Stories Dev View initialized');
showSpinner();
