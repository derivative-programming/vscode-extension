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
              generateForecastContent(items, config)}
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
                <button class="icon-button" onclick="showForecastConfigModal()" title="Configure">
                    <span class="codicon codicon-settings-gear"></span>
                </button>
                <button class="icon-button" onclick="refreshForecast()" title="Refresh">
                    <span class="codicon codicon-refresh"></span>
                </button>
                <button class="icon-button" onclick="exportGanttChart('png')" title="Export as PNG">
                    <span class="codicon codicon-device-camera"></span>
                </button>
                <button class="icon-button" onclick="exportGanttChartCSV()" title="Download CSV">
                    <span class="codicon codicon-cloud-download"></span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Generate main forecast content with Gantt chart and statistics
 * @param {Array} items - All user story items
 * @param {Object} config - Full configuration object
 * @returns {string} HTML for main content
 */
function generateForecastContent(items, config) {
    return `
        <div class="forecast-content-layout" style="display: flex; flex-direction: column; gap: 20px;">
            <div class="forecast-stats-top" style="width: 100%;">
                ${generateForecastStatistics(items, config)}
            </div>
            <div class="forecast-main-section" style="width: 100%; flex: 1;">
                ${generateTimelineControls()}
                ${generateGanttChartContainer(config.forecastConfig || getDefaultForecastConfig())}
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
            </div>
            
            <div class="timeline-controls-right">
                <label class="timeline-control-label">
                    <span class="codicon codicon-calendar"></span>
                    Zoom:
                </label>
                <button class="timeline-btn" onclick="zoomGanttChart('hour')" title="Hour view">
                    <span class="codicon codicon-watch"></span>
                </button>
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
 * @param {Object} forecastConfig - Forecast configuration
 * @returns {string} HTML for Gantt chart
 */
function generateGanttChartContainer(forecastConfig) {
    const excludeWeekends = forecastConfig?.excludeWeekends !== false;
    const excludeNonWorkingHours = forecastConfig?.excludeNonWorkingHours !== false;
    
    return `
        <div class="gantt-chart-wrapper">
            <div id="gantt-chart-container" class="gantt-chart-container">
                <!-- Gantt chart will be rendered here by ganttChart.js -->
                <div class="gantt-loading">
                    <span class="codicon codicon-loading codicon-modifier-spin"></span>
                    Calculating timeline...
                </div>
            </div>
            <div class="gantt-legend" style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; padding: 10px; background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px;">
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span class="legend-bar legend-bar-critical" style="display: inline-block; width: 20px; height: 12px; background-color: #ff4040; border-radius: 2px;"></span>
                    <span style="font-size: 12px;">Critical Priority</span>
                </div>
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span class="legend-bar legend-bar-high" style="display: inline-block; width: 20px; height: 12px; background-color: #ff6b6b; border-radius: 2px;"></span>
                    <span style="font-size: 12px;">High Priority</span>
                </div>
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span class="legend-bar legend-bar-medium" style="display: inline-block; width: 20px; height: 12px; background-color: #ff9f40; border-radius: 2px;"></span>
                    <span style="font-size: 12px;">Medium Priority</span>
                </div>
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span class="legend-bar legend-bar-low" style="display: inline-block; width: 20px; height: 12px; background-color: #3794ff; border-radius: 2px;"></span>
                    <span style="font-size: 12px;">Low Priority</span>
                </div>
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span class="legend-bar legend-bar-complete" style="display: inline-block; width: 20px; height: 12px; background-color: #10b981; border-radius: 2px;"></span>
                    <span style="font-size: 12px;">Completed</span>
                </div>
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span class="legend-marker legend-marker-today" style="display: inline-block; width: 20px; height: 2px; background-color: orange;"></span>
                    <span style="font-size: 12px;">Today</span>
                </div>
                ${excludeNonWorkingHours === false ? `
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 20px; height: 12px; background-color: #808080; opacity: 0.15; border-radius: 2px;"></span>
                    <span style="font-size: 12px;">Non-Working Hours</span>
                </div>
                ` : ''}
                ${!excludeWeekends ? `
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 20px; height: 12px; background-color: #ff0000; opacity: 0.08; border-radius: 2px;"></span>
                    <span style="font-size: 12px;">Weekends</span>
                </div>
                ` : ''}
                <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                    <span class="legend-marker legend-marker-dependency" style="display: inline-block; width: 2px; height: 12px; background-color: var(--vscode-textLink-foreground); border-left: 2px dashed var(--vscode-textLink-foreground);"></span>
                    <span style="font-size: 12px;">Dependency</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate forecast statistics sidebar
 * @param {Array} items - All user story items
 * @param {Object} config - Full configuration object
 * @returns {string} HTML for statistics sidebar
 */
function generateForecastStatistics(items, config) {
    // Calculate forecast data
    const forecast = calculateDevelopmentForecast ? calculateDevelopmentForecast(items, config) : null;
    
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
        recommendations,
        totalCost,
        completedCost,
        remainingCost
    } = forecast;
    
    return `
        <div class="forecast-stats-content">
            <h4 class="forecast-stats-title" onclick="toggleProjectOverview()" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Project Overview</span>
                <span id="project-overview-toggle-icon" class="codicon codicon-chevron-down"></span>
            </h4>
            
            <div id="project-overview-details" class="project-overview-details">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
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
                    
                    ${generateForecastMetric(
                        "symbol-currency",
                        "Total Project Cost",
                        `${formatCurrency(totalCost)}`,
                        ""
                    )}
                    
                    ${generateForecastMetric(
                        "symbol-currency",
                        "Remaining Work Cost",
                        `${formatCurrency(remainingCost)}`,
                        remainingCost > totalCost * 0.5 ? "risk-medium" : ""
                    )}
                </div>
                
                ${generateRiskAssessment(riskLevel, bottlenecks)}
                ${generateRecommendations(recommendations)}
            </div>
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
        hoursPerPoint: 4,
        defaultDeveloperRate: 60,
        workingHoursPerDay: 8,
        workingDaysPerWeek: 5,
        excludeWeekends: true,
        excludeNonWorkingHours: true,
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
 * Format currency with thousands separators
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (without $ sign)
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return "0.00";
    }
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
