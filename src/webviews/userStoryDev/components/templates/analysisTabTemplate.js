// Description: Template generator for Analysis Tab
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Generate the HTML for the Analysis Tab
 * @param {Array} items - Array of user story dev items
 * @param {Object} config - Dev configuration
 * @returns {string} HTML string for the analysis tab
 */
function generateAnalysisTab(items, config) {
    return `
        <div class="analysis-container">
            <!-- Analysis Header -->
            <div class="analysis-header">
                <h3>Development Analytics</h3>
                <div class="analysis-controls">
                    <button onclick="refreshAnalytics()" class="icon-button" title="Refresh">
                        <i class="codicon codicon-refresh"></i>
                    </button>
                </div>
            </div>

            <!-- Key Metrics Cards -->
            <div class="metrics-grid" id="metricsGrid">
                <!-- Metrics will be dynamically inserted here -->
            </div>

            <!-- Charts Section -->
            <div class="charts-section">
                <!-- Status Distribution Chart -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h4>Status Distribution</h4>
                        <span class="chart-subtitle">Stories by development status</span>
                    </div>
                    <div class="chart-body" id="statusDistributionChart"></div>
                </div>

                <!-- Priority Distribution Chart -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h4>Priority Distribution</h4>
                        <span class="chart-subtitle">Stories by priority level</span>
                    </div>
                    <div class="chart-body" id="priorityDistributionChart"></div>
                </div>
            </div>

            <div class="charts-section">
                <!-- Velocity Chart -->
                <div class="chart-container chart-large">
                    <div class="chart-header">
                        <h4>Sprint Velocity</h4>
                        <span class="chart-subtitle">Story points completed per sprint</span>
                    </div>
                    <div class="chart-body" id="velocityChart"></div>
                </div>
            </div>

            <div class="charts-section">
                <!-- Cycle Time Chart -->
                <div class="chart-container chart-large">
                    <div class="chart-header">
                        <h4>Cycle Time Trend</h4>
                        <span class="chart-subtitle">Average days from start to completion</span>
                    </div>
                    <div class="chart-body" id="cycleTimeChart"></div>
                </div>
            </div>

            <div class="charts-section">
                <!-- Developer Workload Chart -->
                <div class="chart-container chart-large">
                    <div class="chart-header">
                        <h4>Developer Workload</h4>
                        <span class="chart-subtitle">Story points assigned by developer</span>
                    </div>
                    <div class="chart-body" id="developerWorkloadChart"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate empty state for analytics
 */
function generateAnalyticsEmptyState() {
    return `
        <div class="empty-state">
            <i class="codicon codicon-graph"></i>
            <h3>No Data Available</h3>
            <p>There are no user stories to analyze</p>
        </div>
    `;
}

/**
 * Generate loading state for charts
 */
function generateChartLoadingState() {
    return `
        <div class="chart-loading">
            <i class="codicon codicon-loading codicon-modifier-spin"></i>
            <span>Loading chart...</span>
        </div>
    `;
}

/**
 * Generate chart no-data state
 */
function generateChartNoDataState(message = 'No data available for this chart') {
    return `
        <div class="chart-no-data">
            <i class="codicon codicon-warning"></i>
            <span>${message}</span>
        </div>
    `;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateAnalysisTab,
        generateAnalyticsEmptyState,
        generateChartLoadingState,
        generateChartNoDataState
    };
}
