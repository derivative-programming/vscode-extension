// Description: Velocity calculation functions for sprint analytics
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Calculate velocity for all sprints
 * @param {Array} items - All user story items
 * @param {Object} config - Dev configuration with sprints
 * @returns {Array} Array of sprint velocity data
 */
function calculateSprintVelocity(items, config) {
    if (!config || !config.sprints || config.sprints.length === 0) {
        return [];
    }
    
    const velocityData = config.sprints.map(sprint => {
        const sprintItems = items.filter(item => item.sprintId === sprint.sprintId);
        const completedItems = sprintItems.filter(item => item.devStatus === 'completed');
        
        const plannedPoints = calculateTotalPoints(sprintItems);
        const completedPoints = calculateTotalPoints(completedItems);
        
        return {
            sprintId: sprint.sprintId,
            sprintName: sprint.sprintName,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            status: sprint.status || 'planned',
            totalStories: sprintItems.length,
            completedStories: completedItems.length,
            plannedPoints: plannedPoints,
            completedPoints: completedPoints,
            completionRate: sprintItems.length > 0 ? (completedItems.length / sprintItems.length * 100).toFixed(1) : 0
        };
    });
    
    // Sort by start date
    return velocityData.sort((a, b) => {
        if (!a.startDate) {
            return 1;
        }
        if (!b.startDate) {
            return -1;
        }
        return new Date(a.startDate) - new Date(b.startDate);
    });
}

/**
 * Calculate average velocity across completed sprints
 * @param {Array} velocityData - Sprint velocity data
 * @returns {number} Average story points per sprint
 */
function calculateAverageVelocity(velocityData) {
    const completedSprints = velocityData.filter(sprint => sprint.status === 'completed');
    
    if (completedSprints.length === 0) {
        return 0;
    }
    
    const totalPoints = completedSprints.reduce((sum, sprint) => sum + sprint.completedPoints, 0);
    return Math.round(totalPoints / completedSprints.length);
}

/**
 * Calculate velocity trend (increasing, decreasing, stable)
 * @param {Array} velocityData - Sprint velocity data
 * @returns {Object} Trend analysis { trend: 'increasing'|'decreasing'|'stable', change: number }
 */
function calculateVelocityTrend(velocityData) {
    const completedSprints = velocityData.filter(sprint => sprint.status === 'completed');
    
    if (completedSprints.length < 2) {
        return { trend: 'stable', change: 0 };
    }
    
    // Get last 3 sprints for trend
    const recentSprints = completedSprints.slice(-3);
    
    if (recentSprints.length < 2) {
        return { trend: 'stable', change: 0 };
    }
    
    const firstAvg = recentSprints.slice(0, Math.floor(recentSprints.length / 2))
        .reduce((sum, s) => sum + s.completedPoints, 0) / Math.floor(recentSprints.length / 2);
    
    const lastAvg = recentSprints.slice(Math.floor(recentSprints.length / 2))
        .reduce((sum, s) => sum + s.completedPoints, 0) / Math.ceil(recentSprints.length / 2);
    
    const change = lastAvg - firstAvg;
    const percentChange = firstAvg > 0 ? (change / firstAvg * 100).toFixed(1) : 0;
    
    let trend = 'stable';
    if (Math.abs(percentChange) > 10) {
        trend = change > 0 ? 'increasing' : 'decreasing';
    }
    
    return { trend, change: parseFloat(percentChange) };
}

/**
 * Get velocity statistics
 * @param {Array} velocityData - Sprint velocity data
 * @returns {Object} Statistics object
 */
function getVelocityStatistics(velocityData) {
    const completedSprints = velocityData.filter(sprint => sprint.status === 'completed');
    
    if (completedSprints.length === 0) {
        return {
            average: 0,
            min: 0,
            max: 0,
            median: 0,
            trend: { trend: 'stable', change: 0 }
        };
    }
    
    const points = completedSprints.map(s => s.completedPoints).sort((a, b) => a - b);
    
    return {
        average: calculateAverageVelocity(velocityData),
        min: Math.min(...points),
        max: Math.max(...points),
        median: points[Math.floor(points.length / 2)],
        trend: calculateVelocityTrend(velocityData)
    };
}

/**
 * Calculate forecasted completion date based on velocity
 * @param {number} remainingPoints - Remaining story points
 * @param {number} averageVelocity - Average points per sprint
 * @param {Object} config - Dev configuration
 * @returns {Object} Forecast data { sprintsNeeded, estimatedDate }
 */
function forecastCompletion(remainingPoints, averageVelocity, config) {
    if (averageVelocity === 0) {
        return { sprintsNeeded: 0, estimatedDate: null };
    }
    
    const sprintsNeeded = Math.ceil(remainingPoints / averageVelocity);
    
    // Calculate estimated date based on sprint length (assume 2 weeks if not specified)
    const sprintLengthDays = config?.sprintLengthDays || 14;
    const today = new Date();
    const estimatedDate = new Date(today.getTime() + (sprintsNeeded * sprintLengthDays * 24 * 60 * 60 * 1000));
    
    return {
        sprintsNeeded,
        estimatedDate: estimatedDate.toISOString().split('T')[0]
    };
}

/**
 * Get sprint performance comparison
 * @param {Array} velocityData - Sprint velocity data
 * @returns {Array} Performance comparison data
 */
function getSprintPerformanceComparison(velocityData) {
    const avgVelocity = calculateAverageVelocity(velocityData);
    
    return velocityData.map(sprint => {
        const variance = sprint.completedPoints - avgVelocity;
        const variancePercent = avgVelocity > 0 ? (variance / avgVelocity * 100).toFixed(1) : 0;
        
        return {
            ...sprint,
            avgVelocity,
            variance,
            variancePercent,
            performance: variance > 0 ? 'above' : variance < 0 ? 'below' : 'average'
        };
    });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateSprintVelocity,
        calculateAverageVelocity,
        calculateVelocityTrend,
        getVelocityStatistics,
        forecastCompletion,
        getSprintPerformanceComparison
    };
}
