// Description: Story points management functions
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Story points options (Fibonacci sequence + ?)
 */
const STORY_POINTS_OPTIONS = ['?', '1', '2', '3', '5', '8', '13', '21'];

/**
 * Handle single story points change
 * @param {string} storyId - Story ID
 * @param {string} newPoints - New story points value
 */
function handleStoryPointsChange(storyId, newPoints) {
    if (!storyId) {
        return;
    }
    
    // Find the item
    const item = allItems.find(i => i.storyId === storyId);
    if (!item) {
        console.error('Item not found:', storyId);
        return;
    }
    
    // Update local state
    item.storyPoints = newPoints;
    
    // Recalculate estimated end date if points changed and we have a start date
    if (item.startDate && newPoints && newPoints !== '?') {
        const estimatedEndDate = calculateEstimatedEndDate(
            item.startDate,
            parseInt(newPoints),
            devConfig
        );
        item.estEndDate = estimatedEndDate;
    }
    
    // Send update to extension
    vscode.postMessage({
        command: 'saveDevChange',
        storyId: storyId,
        changes: {
            storyPoints: newPoints,
            estEndDate: item.estEndDate
        }
    });
}

/**
 * Calculate total story points for given items
 * @param {Array} items - Items to calculate
 * @returns {number} Total story points (excluding '?' and empty)
 */
function calculateTotalPoints(items) {
    if (!items || items.length === 0) {
        return 0;
    }
    
    return items.reduce((total, item) => {
        const points = item.storyPoints;
        if (points && points !== '?' && !isNaN(points)) {
            return total + parseInt(points);
        }
        return total;
    }, 0);
}

/**
 * Calculate estimated end date based on story points
 * @param {string} startDate - Start date (ISO format)
 * @param {number} storyPoints - Number of story points
 * @param {Object} config - Dev configuration
 * @returns {string} Estimated end date (ISO format)
 */
function calculateEstimatedEndDate(startDate, storyPoints, config) {
    if (!startDate || !storyPoints || !config) {
        return '';
    }
    
    const hoursPerPoint = config.hoursPerPoint || 4;
    const totalHours = storyPoints * hoursPerPoint;
    
    // Get working hours per day from config (default 8)
    const workingHours = config.workingHours || { start: 9, end: 17 };
    const hoursPerDay = (workingHours.end - workingHours.start) || 8;
    
    // Calculate working days needed
    const daysNeeded = Math.ceil(totalHours / hoursPerDay);
    
    // Add working days to start date
    const start = new Date(startDate);
    let workingDaysAdded = 0;
    let currentDate = new Date(start);
    
    while (workingDaysAdded < daysNeeded) {
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDaysAdded++;
        }
    }
    
    return currentDate.toISOString().split('T')[0];
}

/**
 * Calculate velocity (average story points per sprint)
 * @param {Array} sprints - Array of sprint objects with completed stories
 * @returns {number} Average story points per sprint
 */
function calculateVelocity(sprints) {
    if (!sprints || sprints.length === 0) {
        return 0;
    }
    
    const completedSprints = sprints.filter(sprint => sprint.status === 'completed');
    if (completedSprints.length === 0) {
        return 0;
    }
    
    const totalPoints = completedSprints.reduce((sum, sprint) => {
        return sum + (sprint.completedPoints || 0);
    }, 0);
    
    return Math.round(totalPoints / completedSprints.length);
}

/**
 * Get story points distribution
 * @returns {Object} Object with points as keys and counts as values
 */
function getStoryPointsDistribution() {
    if (!allItems) {
        return {};
    }
    
    const distribution = {};
    STORY_POINTS_OPTIONS.forEach(points => {
        distribution[points] = allItems.filter(item => item.storyPoints === points).length;
    });
    
    return distribution;
}

/**
 * Get items with unknown story points ('?' or empty)
 * @returns {Array} Items without valid story points
 */
function getItemsWithoutPoints() {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => !item.storyPoints || item.storyPoints === '?');
}

/**
 * Get items by story points
 * @param {string} points - Story points value
 * @returns {Array} Items with the specified points
 */
function getItemsByStoryPoints(points) {
    if (!allItems) {
        return [];
    }
    return allItems.filter(item => item.storyPoints === points);
}

/**
 * Convert story points to hours
 * @param {string|number} storyPoints - Story points value
 * @param {Object} config - Dev configuration
 * @returns {number} Estimated hours
 */
function storyPointsToHours(storyPoints, config) {
    if (!storyPoints || storyPoints === '?') {
        return 0;
    }
    
    const points = parseInt(storyPoints);
    if (isNaN(points)) {
        return 0;
    }
    
    const hoursPerPoint = config?.hoursPerPoint || 4;
    return points * hoursPerPoint;
}

/**
 * Format story points for display
 * @param {string} points - Story points value
 * @returns {string} Formatted display string
 */
function formatStoryPoints(points) {
    if (!points) {
        return '(Not Set)';
    }
    if (points === '?') {
        return '? (Unknown)';
    }
    return points + ' points';
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STORY_POINTS_OPTIONS,
        handleStoryPointsChange,
        calculateTotalPoints,
        calculateEstimatedEndDate,
        calculateVelocity,
        getStoryPointsDistribution,
        getItemsWithoutPoints,
        getItemsByStoryPoints,
        storyPointsToHours,
        formatStoryPoints
    };
}
