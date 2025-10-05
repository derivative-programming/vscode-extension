/**
 * Forecast Tab Template
 * Generates HTML for the Forecast tab with Gantt chart timeline and project completion forecasts
 * Last Modified: October 5, 2025
 */

/**
 * Generate the complete Forecast tab HTML
 * @param {Array} items - All user story items
 * @param {Object} config - Dev view configuration including forecast settings
 * @returns {string} HTML string for the forecast tab
 */
function generateForecastTab(items, config) {
    const forecastConfig = config.forecastConfig || getDefaultForecastConfig();
    const hasStories = items && items.length > 0;
    const forecastableStatuses = ['on-hold', 'ready-for-dev', 'in-progress', 'blocked'];
    const hasForecastableStories = hasStories && items.some(item => forecastableStatuses.includes(item.devStatus));
    
    return `
        <div class="forecast-tab-container">
            ${generateForecastHeader(forecastConfig)}
            
            ${!hasStories ? generateForecastEmptyState("no-stories") : 
              !hasForecastableStories ? generateForecastEmptyState("no-forecastable") :
              generateForecastContent(items, forecastConfig)}
        </div>
    `;
}

/**
 * Generate forecast tab header with controls
 * @param {Object} forecastConfig - Forecast configuration settings
 * @returns {string} HTML for header section
 */
function generateForecastHeader(forecastConfig) {
    return `
        <div class="forecast-header">
            <div class="forecast-header-left">
                <h3>
                    <span class="codicon codicon-graph-line"></span>
                    Project Forecast
                </h3>
                <span class="forecast-subtitle">Timeline and completion predictions</span>
            </div>
            <div class="forecast-header-right">
                <button class="forecast-btn forecast-btn-secondary" onclick="showForecastConfigModal()">
                    <span class="codicon codicon-settings-gear"></span>
                    Configure
                </button>
                <button class="forecast-btn forecast-btn-secondary" onclick="refreshForecast()">
                    <span class="codicon codicon-refresh"></span>
                    Refresh
                </button>
                <button class="forecast-btn forecast-btn-secondary" onclick="exportGanttChart('png')">
                    <span class="codicon codicon-file-media"></span>
                    Export PNG
                </button>
                <button class="forecast-btn forecast-btn-secondary" onclick="exportGanttChart('csv')">
                    <span class="codicon codicon-file-code"></span>
                    Export CSV
                </button>
            </div>
        </div>
    `;
}

/**
 * Generate main forecast content with Gantt chart and statistics
 * @param {Array} items - All user story items
 * @param {Object} forecastConfig - Forecast configuration
 * @returns {string} HTML for main content
 */
function generateForecastContent(items, forecastConfig) {
    return `
        <div class="forecast-content-layout">
            <div class="forecast-main-section">
                ${generateTimelineControls()}
                ${generateGanttChartContainer()}
            </div>
            <div class="forecast-stats-sidebar">
                ${generateForecastStatistics(items, forecastConfig)}
            </div>
        </div>
    `;
}

/**
 * Generate timeline controls (zoom, pan, filters)
 * @returns {string} HTML for timeline controls
 */
function generateTimelineControls() {
    return `
        <div class="timeline-controls">
            <div class="timeline-controls-left">
                <label class="timeline-control-label">
                    <span class="codicon codicon-filter"></span>
                    Group By:
                </label>
                <select id="gantt-group-by" class="timeline-select" onchange="updateGanttGrouping(this.value)">
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="developer">Developer</option>
                    <option value="sprint">Sprint</option>
                    <option value="none">None (Flat)</option>
                </select>
                
                <label class="timeline-control-label">
                    <span class="codicon codicon-eye"></span>
                    Show:
                </label>
                <select id="gantt-filter" class="timeline-select" onchange="filterGanttChart(this.value)">
                    <option value="all">All Stories</option>
                    <option value="incomplete">Incomplete Only</option>
                    <option value="complete">Completed Only</option>
                    <option value="blocked">Blocked</option>
                    <option value="critical">Critical Priority</option>
                </select>
            </div>
            
            <div class="timeline-controls-right">
                <label class="timeline-control-label">
                    <span class="codicon codicon-calendar"></span>
                    Zoom:
                </label>
                <button class="timeline-btn" onclick="zoomGanttChart('day')" title="Day view">
                    <span class="codicon codicon-dash"></span>
                </button>
                <button class="timeline-btn" onclick="zoomGanttChart('week')" title="Week view">
                    <span class="codicon codicon-menu"></span>
                </button>
                <button class="timeline-btn" onclick="zoomGanttChart('month')" title="Month view">
                    <span class="codicon codicon-three-bars"></span>
                </button>
                <button class="timeline-btn" onclick="zoomGanttChart('reset')" title="Reset zoom">
                    <span class="codicon codicon-screen-normal"></span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Generate Gantt chart container
 * @returns {string} HTML for Gantt chart
 */
function generateGanttChartContainer() {
    return `
        <div class="gantt-chart-wrapper">
            <div id="gantt-chart-container" class="gantt-chart-container">
                <!-- Gantt chart will be rendered here by ganttChart.js -->
                <div class="gantt-loading">
                    <span class="codicon codicon-loading codicon-modifier-spin"></span>
                    Calculating timeline...
                </div>
            </div>
            <div class="gantt-legend">
                <div class="legend-item">
                    <span class="legend-bar legend-bar-critical"></span>
                    <span>Critical Priority</span>
                </div>
                <div class="legend-item">
                    <span class="legend-bar legend-bar-high"></span>
                    <span>High Priority</span>
                </div>
                <div class="legend-item">
                    <span class="legend-bar legend-bar-medium"></span>
                    <span>Medium Priority</span>
                </div>
                <div class="legend-item">
                    <span class="legend-bar legend-bar-low"></span>
                    <span>Low Priority</span>
                </div>
                <div class="legend-item">
                    <span class="legend-bar legend-bar-complete"></span>
                    <span>Completed</span>
                </div>
                <div class="legend-item">
                    <span class="legend-marker legend-marker-today"></span>
                    <span>Today</span>
                </div>
                <div class="legend-item">
                    <span class="legend-marker legend-marker-dependency"></span>
                    <span>Dependency</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate forecast statistics sidebar
 * @param {Array} items - All user story items
 * @param {Object} forecastConfig - Forecast configuration
 * @returns {string} HTML for statistics sidebar
 */
function generateForecastStatistics(items, forecastConfig) {
    // Calculate forecast data
    const forecast = calculateDevelopmentForecast ? calculateDevelopmentForecast(items, forecastConfig) : null;
    
    if (!forecast) {
        return `
            <div class="forecast-stats-empty">
                <span class="codicon codicon-info"></span>
                <p>Calculating forecast...</p>
            </div>
        `;
    }
    
    const {
        projectedCompletionDate,
        totalRemainingHours,
        totalRemainingDays,
        averageVelocity,
        riskLevel,
        bottlenecks,
        recommendations
    } = forecast;
    
    return `
        <div class="forecast-stats-content">
            <h4 class="forecast-stats-title">Project Overview</h4>
            
            ${generateForecastMetric(
                "calendar",
                "Projected Completion",
                formatForecastDate(projectedCompletionDate),
                riskLevel === "high" ? "risk-high" : riskLevel === "medium" ? "risk-medium" : "risk-low"
            )}
            
            ${generateForecastMetric(
                "clock",
                "Remaining Hours",
                `${totalRemainingHours.toFixed(1)} hrs`,
                ""
            )}
            
            ${generateForecastMetric(
                "calendar",
                "Remaining Work Days",
                `${totalRemainingDays.toFixed(1)} days`,
                ""
            )}
            
            ${generateForecastMetric(
                "pulse",
                "Team Velocity",
                `${averageVelocity.toFixed(1)} pts/sprint`,
                ""
            )}
            
            ${generateRiskAssessment(riskLevel, bottlenecks)}
            ${generateRecommendations(recommendations)}
            ${generateConfigSummary(forecastConfig)}
        </div>
    `;
}

/**
 * Generate a forecast metric card
 * @param {string} icon - Codicon name
 * @param {string} label - Metric label
 * @param {string} value - Metric value
 * @param {string} riskClass - CSS class for risk level
 * @returns {string} HTML for metric card
 */
function generateForecastMetric(icon, label, value, riskClass = "") {
    return `
        <div class="forecast-metric ${riskClass}">
            <div class="forecast-metric-icon">
                <span class="codicon codicon-${icon}"></span>
            </div>
            <div class="forecast-metric-content">
                <div class="forecast-metric-label">${label}</div>
                <div class="forecast-metric-value">${value}</div>
            </div>
        </div>
    `;
}

/**
 * Generate risk assessment section
 * @param {string} riskLevel - Risk level (low/medium/high)
 * @param {Array} bottlenecks - List of bottleneck issues
 * @returns {string} HTML for risk assessment
 */
function generateRiskAssessment(riskLevel, bottlenecks) {
    const riskIcon = riskLevel === "high" ? "error" : riskLevel === "medium" ? "warning" : "check";
    const riskText = riskLevel === "high" ? "High Risk" : riskLevel === "medium" ? "Medium Risk" : "On Track";
    const riskClass = `risk-${riskLevel}`;
    
    return `
        <div class="forecast-risk-section ${riskClass}">
            <h5 class="forecast-section-title">
                <span class="codicon codicon-${riskIcon}"></span>
                Risk Assessment
            </h5>
            <div class="forecast-risk-level">${riskText}</div>
            ${bottlenecks && bottlenecks.length > 0 ? `
                <div class="forecast-bottlenecks">
                    <div class="forecast-bottleneck-title">
                        <span class="codicon codicon-alert"></span>
                        Bottlenecks Identified:
                    </div>
                    <ul class="forecast-bottleneck-list">
                        ${bottlenecks.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
                    </ul>
                </div>
            ` : ""}
        </div>
    `;
}

/**
 * Generate recommendations section
 * @param {Array} recommendations - List of recommendations
 * @returns {string} HTML for recommendations
 */
function generateRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
        return "";
    }
    
    return `
        <div class="forecast-recommendations-section">
            <h5 class="forecast-section-title">
                <span class="codicon codicon-lightbulb"></span>
                Recommendations
            </h5>
            <ul class="forecast-recommendation-list">
                ${recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join("")}
            </ul>
        </div>
    `;
}

/**
 * Generate configuration summary
 * @param {Object} forecastConfig - Forecast configuration
 * @returns {string} HTML for config summary
 */
function generateConfigSummary(forecastConfig) {
    return `
        <div class="forecast-config-summary">
            <h5 class="forecast-section-title">
                <span class="codicon codicon-settings-gear"></span>
                Configuration
            </h5>
            <div class="forecast-config-items">
                <div class="forecast-config-item">
                    <span class="forecast-config-label">Hours per Point:</span>
                    <span class="forecast-config-value">${forecastConfig.hoursPerPoint || 8}</span>
                </div>
                <div class="forecast-config-item">
                    <span class="forecast-config-label">Working Hours/Day:</span>
                    <span class="forecast-config-value">${forecastConfig.workingHoursPerDay || 8}</span>
                </div>
                <div class="forecast-config-item">
                    <span class="forecast-config-label">Working Days/Week:</span>
                    <span class="forecast-config-value">${forecastConfig.workingDaysPerWeek || 5}</span>
                </div>
                <div class="forecast-config-item">
                    <span class="forecast-config-label">Exclude Weekends:</span>
                    <span class="forecast-config-value">${forecastConfig.excludeWeekends !== false ? "Yes" : "No"}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate empty state for forecast tab
 * @param {string} reason - Reason for empty state (no-stories, no-velocity)
 * @returns {string} HTML for empty state
 */
function generateForecastEmptyState(reason) {
    if (reason === "no-stories") {
        return `
            <div class="forecast-empty-state">
                <span class="codicon codicon-inbox"></span>
                <h3>No Stories to Forecast</h3>
                <p>Add user stories in the Details tab to see project timeline forecasts.</p>
            </div>
        `;
    } else if (reason === "no-forecastable") {
        return `
            <div class="forecast-empty-state">
                <span class="codicon codicon-graph"></span>
                <h3>No Stories to Forecast</h3>
                <p>No stories with forecastable dev statuses (on-hold, ready-for-dev, in-progress, blocked) found.</p>
                <p class="forecast-empty-hint">
                    <span class="codicon codicon-lightbulb"></span>
                    Add stories and set their dev status in the Details or Board tabs to see the forecast timeline.
                </p>
            </div>
        `;
    }
    
    return `
        <div class="forecast-empty-state">
            <span class="codicon codicon-info"></span>
            <h3>Forecast Unavailable</h3>
            <p>Unable to generate forecast with current data.</p>
        </div>
    `;
}

/**
 * Get default forecast configuration
 * @returns {Object} Default configuration values
 */
function getDefaultForecastConfig() {
    return {
        hoursPerPoint: 8,
        workingHoursPerDay: 8,
        workingDaysPerWeek: 5,
        excludeWeekends: true,
        holidays: [],
        velocityOverride: null,
        parallelWorkFactor: 1.0
    };
}

/**
 * Format a date for forecast display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatForecastDate(date) {
    if (!date) {
        return "Unknown";
    }
    
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        return "Invalid Date";
    }
    
    const options = { year: "numeric", month: "short", day: "numeric" };
    return d.toLocaleDateString("en-US", options);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) {
        return "";
    }
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
