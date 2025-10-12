// Description: Queue position management functions
// Created: October 12, 2025
// Last Modified: October 12, 2025

/**
 * Handle single queue position change
 * @param {string} storyId - Story ID
 * @param {string} newPosition - New queue position value (as string from input)
 */
function handleQueuePositionChange(storyId, newPosition) {
    if (!storyId) {
        return;
    }
    
    // Find the item
    const item = allItems.find(i => i.storyId === storyId);
    if (!item) {
        console.error('Item not found:', storyId);
        return;
    }
    
    // Parse position as integer (empty string becomes undefined)
    const positionValue = newPosition === '' ? undefined : parseInt(newPosition, 10);
    
    // Validate
    if (positionValue !== undefined && (isNaN(positionValue) || positionValue < 0)) {
        console.error('Invalid queue position:', newPosition);
        return;
    }
    
    // Update local state
    item.developmentQueuePosition = positionValue;
    
    // Build complete dev record and send to extension
    const devRecord = buildDevRecord(item);
    vscode.postMessage({
        command: 'saveDevChange',
        data: devRecord
    });
    
    console.log(`Queue position updated for story ${storyId}: ${positionValue}`);
}

/**
 * Get queue position for display
 * @param {Object} item - Story item
 * @returns {number|string} Queue position value or empty string
 */
function getQueuePositionDisplay(item) {
    if (item.developmentQueuePosition !== undefined && item.developmentQueuePosition !== null) {
        return item.developmentQueuePosition;
    }
    return item.storyNumber || '';
}

/**
 * Sort items by queue position
 * @param {Array} items - Array of items to sort
 * @returns {Array} Sorted array
 */
function sortByQueuePosition(items) {
    return [...items].sort((a, b) => {
        const posA = a.developmentQueuePosition !== undefined ? 
                     a.developmentQueuePosition : 
                     (typeof a.storyNumber === 'number' ? a.storyNumber : parseInt(a.storyNumber) || 0);
        const posB = b.developmentQueuePosition !== undefined ? 
                     b.developmentQueuePosition : 
                     (typeof b.storyNumber === 'number' ? b.storyNumber : parseInt(b.storyNumber) || 0);
        return posA - posB;
    });
}

// Export functions if in module context
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleQueuePositionChange,
        getQueuePositionDisplay,
        sortByQueuePosition
    };
}
