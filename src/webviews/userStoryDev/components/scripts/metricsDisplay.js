// Description: Metrics display component for analytics key performance indicators
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Generate all metrics cards HTML
 * @param {Array} items - All user story items
 * @param {Object} velocityData - Velocity statistics
 * @param {Object} cycleTimeData - Cycle time statistics
 * @returns {string} HTML for metrics grid
 */
function generateMetricsCards(items, velocityData, cycleTimeData) {
    const cards = [
        generateTotalStoriesCard(items),
        generateCompletedStoriesCard(items),
        generateAverageVelocityCard(velocityData),
        generateAverageCycleTimeCard(cycleTimeData),
        generateInProgressCard(items),
        generateBlockedCard(items)
    ];
    
    return cards.join('');
}

/**
 * Generate total stories metric card
 * @param {Array} items - All user story items
 * @returns {string} HTML for card
 */
function generateTotalStoriesCard(items) {
    const total = items.length;
    
    return `
        <div class="metric-card">
            <div class="metric-icon">
                <span class="codicon codicon-list-unordered"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${total}</div>
                <div class="metric-label">Total Stories</div>
            </div>
        </div>
    `;
}

/**
 * Generate completed stories metric card
 * @param {Array} items - All user story items
 * @returns {string} HTML for card
 */
function generateCompletedStoriesCard(items) {
    const completed = items.filter(item => item.devStatus === 'completed').length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return `
        <div class="metric-card metric-success">
            <div class="metric-icon">
                <span class="codicon codicon-check-all"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${completed} <span class="metric-secondary">(${percentage}%)</span></div>
                <div class="metric-label">Completed Stories</div>
            </div>
        </div>
    `;
}

/**
 * Generate average velocity metric card
 * @param {Object} velocityData - Velocity statistics from calculator
 * @returns {string} HTML for card
 */
function generateAverageVelocityCard(velocityData) {
    if (!velocityData || !velocityData.statistics) {
        return `
            <div class="metric-card">
                <div class="metric-icon">
                    <span class="codicon codicon-graph-line"></span>
                </div>
                <div class="metric-content">
                    <div class="metric-value">N/A</div>
                    <div class="metric-label">Average Velocity</div>
                    <div class="metric-sublabel">No sprint data</div>
                </div>
            </div>
        `;
    }
    
    const stats = velocityData.statistics;
    const avg = stats.average || 0;
    const trend = stats.trend || { trend: 'stable', change: 0 };
    
    let trendClass = '';
    let trendIcon = 'codicon-dash';
    let trendText = 'Stable';
    
    if (trend.trend === 'increasing') {
        trendClass = 'metric-success';
        trendIcon = 'codicon-arrow-up';
        trendText = `+${trend.change}%`;
    } else if (trend.trend === 'decreasing') {
        trendClass = 'metric-warning';
        trendIcon = 'codicon-arrow-down';
        trendText = `${trend.change}%`;
    }
    
    return `
        <div class="metric-card ${trendClass}">
            <div class="metric-icon">
                <span class="codicon codicon-pulse"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${avg} pts/sprint</div>
                <div class="metric-label">Average Velocity</div>
                <div class="metric-trend">
                    <span class="codicon ${trendIcon}"></span>
                    ${trendText}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate average cycle time metric card
 * @param {Object} cycleTimeData - Cycle time statistics from calculator
 * @returns {string} HTML for card
 */
function generateAverageCycleTimeCard(cycleTimeData) {
    if (!cycleTimeData || cycleTimeData.count === 0) {
        return `
            <div class="metric-card">
                <div class="metric-icon">
                    <span class="codicon codicon-watch"></span>
                </div>
                <div class="metric-content">
                    <div class="metric-value">N/A</div>
                    <div class="metric-label">Average Cycle Time</div>
                    <div class="metric-sublabel">No completed stories</div>
                </div>
            </div>
        `;
    }
    
    const avg = cycleTimeData.average || 0;
    const min = cycleTimeData.min || 0;
    const max = cycleTimeData.max || 0;
    
    // Determine quality based on average
    let qualityClass = '';
    if (avg <= 5) {
        qualityClass = 'metric-success';
    } else if (avg <= 10) {
        qualityClass = '';
    } else {
        qualityClass = 'metric-warning';
    }
    
    return `
        <div class="metric-card ${qualityClass}">
            <div class="metric-icon">
                <span class="codicon codicon-clock"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${avg} days</div>
                <div class="metric-label">Average Cycle Time</div>
                <div class="metric-sublabel">Range: ${min}-${max} days</div>
            </div>
        </div>
    `;
}

/**
 * Generate in-progress stories metric card
 * @param {Array} items - All user story items
 * @returns {string} HTML for card
 */
function generateInProgressCard(items) {
    const inProgress = items.filter(item => item.devStatus === 'in-progress').length;
    
    return `
        <div class="metric-card">
            <div class="metric-icon">
                <span class="codicon codicon-rocket"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${inProgress}</div>
                <div class="metric-label">In Progress</div>
            </div>
        </div>
    `;
}

/**
 * Generate blocked stories metric card
 * @param {Array} items - All user story items
 * @returns {string} HTML for card
 */
function generateBlockedCard(items) {
    const blocked = items.filter(item => item.devStatus === 'blocked').length;
    const cardClass = blocked > 0 ? 'metric-danger' : '';
    
    return `
        <div class="metric-card ${cardClass}">
            <div class="metric-icon">
                <span class="codicon codicon-error"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${blocked}</div>
                <div class="metric-label">Blocked</div>
                ${blocked > 0 ? '<div class="metric-sublabel">Needs attention!</div>' : ''}
            </div>
        </div>
    `;
}

/**
 * Generate ready for QA metric card
 * @param {Array} items - All user story items
 * @returns {string} HTML for card
 */
function generateReadyForQACard(items) {
    const readyForQA = items.filter(item => item.devStatus === 'ready-for-qa').length;
    const cardClass = readyForQA > 0 ? 'metric-success' : '';
    
    return `
        <div class="metric-card ${cardClass}">
            <div class="metric-icon">
                <span class="codicon codicon-checklist"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${readyForQA}</div>
                <div class="metric-label">Ready for QA</div>
            </div>
        </div>
    `;
}

/**
 * Generate story points completion metric card
 * @param {Array} items - All user story items
 * @returns {string} HTML for card
 */
function generateStoryPointsCard(items) {
    let totalPoints = 0;
    let completedPoints = 0;
    
    items.forEach(item => {
        const points = parseInt(item.storyPoints);
        if (!isNaN(points)) {
            totalPoints += points;
            if (item.devStatus === 'completed') {
                completedPoints += points;
            }
        }
    });
    
    const percentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    
    return `
        <div class="metric-card">
            <div class="metric-icon">
                <span class="codicon codicon-dashboard"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${completedPoints}/${totalPoints} <span class="metric-secondary">(${percentage}%)</span></div>
                <div class="metric-label">Story Points Completed</div>
            </div>
        </div>
    `;
}

/**
 * Generate priority distribution metric card
 * @param {Array} items - All user story items
 * @returns {string} HTML for card
 */
function generatePriorityDistributionCard(items) {
    const critical = items.filter(item => item.priority === 'critical').length;
    const high = items.filter(item => item.priority === 'high').length;
    
    const cardClass = critical > 0 ? 'metric-danger' : (high > 0 ? 'metric-warning' : '');
    
    return `
        <div class="metric-card ${cardClass}">
            <div class="metric-icon">
                <span class="codicon codicon-flame"></span>
            </div>
            <div class="metric-content">
                <div class="metric-value">${critical + high}</div>
                <div class="metric-label">High Priority Stories</div>
                <div class="metric-sublabel">Critical: ${critical}, High: ${high}</div>
            </div>
        </div>
    `;
}

/**
 * Update a specific metric card with new data
 * @param {string} metricType - Type of metric to update
 * @param {Object} data - Updated data
 */
function updateMetricCard(metricType, data) {
    // This function can be called to update individual metrics without re-rendering everything
    const metricsGrid = document.querySelector('.analytics-metrics-grid');
    if (!metricsGrid) {
        return;
    }
    
    // Implementation depends on specific metric type
    switch (metricType) {
        case 'velocity':
            // Update velocity card
            break;
        case 'cycleTime':
            // Update cycle time card
            break;
        // Add other cases as needed
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateMetricsCards,
        generateTotalStoriesCard,
        generateCompletedStoriesCard,
        generateAverageVelocityCard,
        generateAverageCycleTimeCard,
        generateInProgressCard,
        generateBlockedCard,
        generateReadyForQACard,
        generateStoryPointsCard,
        generatePriorityDistributionCard,
        updateMetricCard
    };
}
