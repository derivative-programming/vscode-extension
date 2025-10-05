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

    // Render tab-specific content
    switch (tabName) {
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
        case 'forecast':
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

    // Show loading state for charts
    const chartBodies = analysisTab.querySelectorAll('.chart-body');
    chartBodies.forEach(body => {
        body.innerHTML = generateChartLoadingState();
    });

    // Re-calculate and re-render after brief delay
    setTimeout(() => {
        renderAnalysisTab();
    }, 300);
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
                case 'forecast':
                    renderForecastTab();
                    break;
            }
            break;

        case 'setDevConfig':
            console.log('[Webview] Received dev config:', message.config);
            devConfig = message.config;
            
            // Re-render current tab if needed
            if (currentTab === 'sprint' || currentTab === 'forecast') {
                switch (currentTab) {
                    case 'sprint':
                        renderSprintTab();
                        break;
                    case 'forecast':
                        renderForecastTab();
                        break;
                }
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
                renderForecastTab();
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

        default:
            console.warn('[Webview] Unknown command:', message.command);
    }
});

// Initialize view
console.log('[Webview] User Stories Dev View initialized');
showSpinner();
