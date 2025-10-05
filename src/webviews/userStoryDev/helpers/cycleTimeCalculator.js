// Description: Cycle time calculation functions for story analytics
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Calculate cycle time for a single story (days from start to completion)
 * @param {Object} story - User story item
 * @returns {number|null} Cycle time in days, or null if not calculable
 */
function calculateStoryCycleTime(story) {
    if (!story.startDate || !story.actualEndDate) {
        return null;
    }
    
    const start = new Date(story.startDate);
    const end = new Date(story.actualEndDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
    }
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Calculate cycle time statistics for all completed stories
 * @param {Array} items - All user story items
 * @returns {Object} Cycle time statistics
 */
function calculateCycleTimeStatistics(items) {
    const completedItems = items.filter(item => 
        item.devStatus === 'completed' && item.startDate && item.actualEndDate
    );
    
    if (completedItems.length === 0) {
        return {
            average: 0,
            min: 0,
            max: 0,
            median: 0,
            count: 0,
            cycleTimes: []
        };
    }
    
    const cycleTimes = completedItems
        .map(item => ({
            storyId: item.storyId,
            storyNumber: item.storyNumber,
            cycleTime: calculateStoryCycleTime(item),
            priority: item.priority,
            storyPoints: item.storyPoints,
            completedDate: item.actualEndDate
        }))
        .filter(item => item.cycleTime !== null)
        .sort((a, b) => a.cycleTime - b.cycleTime);
    
    if (cycleTimes.length === 0) {
        return {
            average: 0,
            min: 0,
            max: 0,
            median: 0,
            count: 0,
            cycleTimes: []
        };
    }
    
    const times = cycleTimes.map(ct => ct.cycleTime);
    const sum = times.reduce((a, b) => a + b, 0);
    
    return {
        average: Math.round(sum / times.length * 10) / 10,
        min: Math.min(...times),
        max: Math.max(...times),
        median: times[Math.floor(times.length / 2)],
        count: times.length,
        cycleTimes: cycleTimes
    };
}

/**
 * Calculate cycle time by priority
 * @param {Array} items - All user story items
 * @returns {Object} Cycle time grouped by priority
 */
function calculateCycleTimeByPriority(items) {
    const stats = calculateCycleTimeStatistics(items);
    
    const byPriority = {
        critical: [],
        high: [],
        medium: [],
        low: [],
        none: []
    };
    
    stats.cycleTimes.forEach(ct => {
        const priority = ct.priority || 'none';
        if (byPriority[priority]) {
            byPriority[priority].push(ct.cycleTime);
        }
    });
    
    return Object.keys(byPriority).reduce((result, priority) => {
        const times = byPriority[priority];
        if (times.length > 0) {
            const sum = times.reduce((a, b) => a + b, 0);
            result[priority] = {
                average: Math.round(sum / times.length * 10) / 10,
                count: times.length,
                min: Math.min(...times),
                max: Math.max(...times)
            };
        } else {
            result[priority] = {
                average: 0,
                count: 0,
                min: 0,
                max: 0
            };
        }
        return result;
    }, {});
}

/**
 * Calculate cycle time by story points
 * @param {Array} items - All user story items
 * @returns {Object} Cycle time grouped by story points
 */
function calculateCycleTimeByPoints(items) {
    const stats = calculateCycleTimeStatistics(items);
    
    const byPoints = {};
    
    stats.cycleTimes.forEach(ct => {
        const points = ct.storyPoints || '?';
        if (!byPoints[points]) {
            byPoints[points] = [];
        }
        byPoints[points].push(ct.cycleTime);
    });
    
    return Object.keys(byPoints).reduce((result, points) => {
        const times = byPoints[points];
        const sum = times.reduce((a, b) => a + b, 0);
        result[points] = {
            average: Math.round(sum / times.length * 10) / 10,
            count: times.length,
            min: Math.min(...times),
            max: Math.max(...times)
        };
        return result;
    }, {});
}

/**
 * Calculate cycle time trend over time (by week or month)
 * @param {Array} items - All user story items
 * @param {string} groupBy - 'week' or 'month'
 * @returns {Array} Time series data
 */
function calculateCycleTimeTrend(items, groupBy = 'week') {
    const stats = calculateCycleTimeStatistics(items);
    
    if (stats.cycleTimes.length === 0) {
        return [];
    }
    
    // Group by completion date
    const grouped = {};
    
    stats.cycleTimes.forEach(ct => {
        const date = new Date(ct.completedDate);
        let key;
        
        if (groupBy === 'month') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
            // Week: use ISO week calculation
            const weekNum = getISOWeek(date);
            key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        }
        
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(ct.cycleTime);
    });
    
    // Calculate average for each period
    return Object.keys(grouped).sort().map(period => {
        const times = grouped[period];
        const sum = times.reduce((a, b) => a + b, 0);
        return {
            period,
            average: Math.round(sum / times.length * 10) / 10,
            count: times.length,
            min: Math.min(...times),
            max: Math.max(...times)
        };
    });
}

/**
 * Get ISO week number
 */
function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Identify stories with unusually long cycle times (outliers)
 * @param {Array} items - All user story items
 * @returns {Array} Stories with cycle time > 1.5x average
 */
function identifyCycleTimeOutliers(items) {
    const stats = calculateCycleTimeStatistics(items);
    
    if (stats.cycleTimes.length === 0) {
        return [];
    }
    
    const threshold = stats.average * 1.5;
    
    return stats.cycleTimes
        .filter(ct => ct.cycleTime > threshold)
        .map(ct => ({
            ...ct,
            averageCycleTime: stats.average,
            difference: ct.cycleTime - stats.average,
            percentAboveAverage: Math.round((ct.cycleTime - stats.average) / stats.average * 100)
        }));
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateStoryCycleTime,
        calculateCycleTimeStatistics,
        calculateCycleTimeByPriority,
        calculateCycleTimeByPoints,
        calculateCycleTimeTrend,
        identifyCycleTimeOutliers
    };
}
