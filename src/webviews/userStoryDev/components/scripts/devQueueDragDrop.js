// Description: Dev Queue Drag and Drop Management
// Created: October 12, 2025
// Last Modified: October 12, 2025

var devQueueDraggedElement = null;
var devQueueDraggedStoryId = null;
var devQueueOriginalIndex = null;

/**
 * Initialize drag and drop for dev queue items
 */
function initializeDevQueueDragDrop() {
    const queueItems = document.querySelectorAll('.dev-queue-item');
    
    queueItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

/**
 * Handle drag start
 */
function handleDragStart(e) {
    devQueueDraggedElement = e.currentTarget;
    devQueueDraggedStoryId = devQueueDraggedElement.getAttribute('data-story-id');
    devQueueOriginalIndex = parseInt(devQueueDraggedElement.getAttribute('data-array-index'), 10);
    
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

/**
 * Handle drag over
 */
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

/**
 * Handle drag enter
 */
function handleDragEnter(e) {
    if (e.currentTarget !== devQueueDraggedElement) {
        e.currentTarget.classList.add('drag-over');
    }
}

/**
 * Handle drag leave
 */
function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

/**
 * Handle drop
 */
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    const dropTarget = e.currentTarget;
    dropTarget.classList.remove('drag-over');
    
    if (devQueueDraggedElement !== dropTarget) {
        const newIndex = parseInt(dropTarget.getAttribute('data-array-index'), 10);
        
        // Perform the reordering
        reorderQueue(devQueueOriginalIndex, newIndex);
    }
    
    return false;
}

/**
 * Handle drag end
 */
function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    
    // Remove drag-over class from all items
    const queueItems = document.querySelectorAll('.dev-queue-item');
    queueItems.forEach(item => {
        item.classList.remove('drag-over');
    });
    
    devQueueDraggedElement = null;
    devQueueDraggedStoryId = null;
    devQueueOriginalIndex = null;
}

/**
 * Reorder the queue and update positions
 */
function reorderQueue(fromIndex, toIndex) {
    // Get incomplete items sorted by current queue position
    const incompleteItems = allItems.filter(item => {
        return item.devStatus !== 'completed' && !item.isIgnored;
    });
    const sortedItems = sortByQueuePosition(incompleteItems);
    
    if (fromIndex < 0 || fromIndex >= sortedItems.length || 
        toIndex < 0 || toIndex >= sortedItems.length) {
        console.error('Invalid indices:', fromIndex, toIndex);
        return;
    }
    
    // Get the dragged item
    const draggedItem = sortedItems[fromIndex];
    
    // Remove from original position
    sortedItems.splice(fromIndex, 1);
    
    // Insert at new position
    sortedItems.splice(toIndex, 0, draggedItem);
    
    // Reassign queue positions based on new order
    // Use increments of 10 to allow for future insertions
    const updatedRecords = [];
    sortedItems.forEach((item, index) => {
        const newPosition = (index + 1) * 10;
        if (item.developmentQueuePosition !== newPosition) {
            item.developmentQueuePosition = newPosition;
            updatedRecords.push({
                storyId: item.storyId,
                developmentQueuePosition: newPosition
            });
        }
    });
    
    // Send batch update to extension
    if (updatedRecords.length > 0) {
        vscode.postMessage({
            command: 'batchUpdateQueuePositions',
            data: updatedRecords
        });
        
        console.log(`Reordered queue: moved item from index ${fromIndex} to ${toIndex}, updated ${updatedRecords.length} positions`);
        
        // Refresh the display
        refreshDevQueueList();
        
        // Also refresh Board tab if it's rendered
        if (typeof refreshBoard === 'function') {
            refreshBoard();
        }
    }
}

/**
 * Auto-sequence the queue positions with gaps of 10
 */
function autoSequenceQueue() {
    const incompleteItems = allItems.filter(item => {
        return item.devStatus !== 'completed' && !item.isIgnored;
    });
    const sortedItems = sortByQueuePosition(incompleteItems);
    
    const updatedRecords = [];
    sortedItems.forEach((item, index) => {
        const newPosition = (index + 1) * 10;
        if (item.developmentQueuePosition !== newPosition) {
            item.developmentQueuePosition = newPosition;
            updatedRecords.push({
                storyId: item.storyId,
                developmentQueuePosition: newPosition
            });
        }
    });
    
    if (updatedRecords.length > 0) {
        vscode.postMessage({
            command: 'batchUpdateQueuePositions',
            data: updatedRecords
        });
        
        console.log(`Auto-sequenced ${updatedRecords.length} queue positions`);
        
        // Refresh displays
        refreshDevQueueList();
        if (typeof refreshBoard === 'function') {
            refreshBoard();
        }
    }
}

/**
 * Reset all queue positions to story numbers
 * Note: Confirmation removed due to webview sandbox restrictions
 */
function resetQueuePositions() {
    const incompleteItems = allItems.filter(item => {
        return item.devStatus !== 'completed' && !item.isIgnored;
    });
    
    const updatedRecords = [];
    incompleteItems.forEach(item => {
        if (item.developmentQueuePosition !== undefined) {
            item.developmentQueuePosition = undefined;
            updatedRecords.push({
                storyId: item.storyId,
                developmentQueuePosition: undefined
            });
        }
    });
    
    if (updatedRecords.length > 0) {
        vscode.postMessage({
            command: 'batchUpdateQueuePositions',
            data: updatedRecords
        });
        
        console.log(`Reset ${updatedRecords.length} queue positions to story numbers`);
        
        // Refresh displays
        refreshDevQueueList();
        if (typeof refreshBoard === 'function') {
            refreshBoard();
        }
    } else {
        console.log('No custom queue positions to reset');
    }
}

/**
 * Open story modal (uses existing modal functionality)
 */
function openStoryModal(storyId) {
    if (typeof openStoryDetailModal === 'function') {
        openStoryDetailModal(storyId);
    } else {
        console.warn('openStoryDetailModal function not available');
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDevQueueDragDrop,
        reorderQueue,
        autoSequenceQueue,
        resetQueuePositions,
        openStoryModal
    };
}
