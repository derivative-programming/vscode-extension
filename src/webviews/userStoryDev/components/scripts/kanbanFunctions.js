// Description: Kanban board functions (drag-and-drop, filtering, statistics)
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Currently dragged card element and story ID
 */
let draggedCard = null;
let draggedStoryId = null;

/**
 * Board filter state
 */
let boardFilters = {
    developer: '',
    priority: '',
    sprint: ''
};

/**
 * Render the Kanban board with all cards
 * @param {Array} items - All user story items
 * @param {Object} config - Dev configuration
 */
function renderKanbanBoard(items, config) {
    if (!items) {
        return;
    }
    
    // Clear all columns
    clearAllColumns();
    
    // Group items by status
    const itemsByStatus = groupItemsByStatus(items);
    
    // Render cards in each column
    Object.keys(itemsByStatus).forEach(status => {
        const columnBody = document.getElementById(`column-${status}`);
        if (columnBody) {
            const statusItems = itemsByStatus[status];
            statusItems.forEach(item => {
                const cardHTML = generateKanbanCard(item, config);
                columnBody.insertAdjacentHTML('beforeend', cardHTML);
            });
            
            // Show empty state if no cards
            if (statusItems.length === 0) {
                columnBody.innerHTML = generateColumnEmptyState();
            }
            
            // Update column count
            updateColumnCount(status, statusItems.length);
        }
    });
    
    // Update board statistics
    updateBoardStatistics(items);
}

/**
 * Clear all column bodies
 */
function clearAllColumns() {
    const statuses = [
        'on-hold', 'ready-for-dev', 'in-progress', 'blocked', 'completed'
    ];
    
    statuses.forEach(status => {
        const columnBody = document.getElementById(`column-${status}`);
        if (columnBody) {
            columnBody.innerHTML = '';
        }
    });
}

/**
 * Group items by their dev status
 */
function groupItemsByStatus(items) {
    const grouped = {
        'on-hold': [],
        'ready-for-dev': [],
        'in-progress': [],
        'blocked': [],
        'completed': []
    };
    
    items.forEach(item => {
        const status = item.devStatus || 'ready-for-dev';
        if (grouped[status]) {
            grouped[status].push(item);
        }
    });
    
    return grouped;
}

/**
 * Update column count badge
 */
function updateColumnCount(status, count) {
    const countElement = document.getElementById(`count-${status}`);
    if (countElement) {
        countElement.textContent = count;
    }
}

/**
 * Update board statistics in footer
 */
function updateBoardStatistics(items) {
    const stats = {
        total: items.length,
        inProgress: items.filter(i => i.devStatus === 'in-progress').length,
        blocked: items.filter(i => i.devStatus === 'blocked').length,
        completed: items.filter(i => i.devStatus === 'completed').length,
        points: calculateTotalPoints(items)
    };
    
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statInProgress').textContent = stats.inProgress;
    document.getElementById('statBlocked').textContent = stats.blocked;
    document.getElementById('statCompleted').textContent = stats.completed;
    document.getElementById('statPoints').textContent = stats.points;
}

/**
 * Handle drag start event
 */
function handleDragStart(event) {
    draggedCard = event.target.closest('.kanban-card');
    draggedStoryId = draggedCard.dataset.storyId;
    
    // Add dragging visual state
    setTimeout(() => {
        if (draggedCard) {
            draggedCard.classList.add('card-dragging');
        }
    }, 0);
    
    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', draggedCard.innerHTML);
    event.dataTransfer.setData('story-id', draggedStoryId);
}

/**
 * Handle drag end event
 */
function handleDragEnd(event) {
    if (draggedCard) {
        draggedCard.classList.remove('card-dragging');
    }
    
    // Remove drag-over class from all columns
    document.querySelectorAll('.column-body').forEach(column => {
        column.classList.remove('drag-over');
    });
    
    draggedCard = null;
    draggedStoryId = null;
}

/**
 * Handle drag over event (must preventDefault to allow drop)
 */
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback
    const columnBody = event.target.closest('.column-body');
    if (columnBody && !columnBody.classList.contains('drag-over')) {
        columnBody.classList.add('drag-over');
    }
    
    return false;
}

/**
 * Handle drag leave event
 */
function handleDragLeave(event) {
    const columnBody = event.target.closest('.column-body');
    if (columnBody) {
        // Only remove if we're actually leaving the column
        const rect = columnBody.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX >= rect.right ||
            event.clientY < rect.top || event.clientY >= rect.bottom) {
            columnBody.classList.remove('drag-over');
        }
    }
}

/**
 * Handle drop event
 */
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const columnBody = event.target.closest('.column-body');
    if (!columnBody) {
        return;
    }
    
    // Remove drag-over visual feedback
    columnBody.classList.remove('drag-over');
    
    // Get the new status from the column
    const newStatus = columnBody.dataset.status;
    const storyId = event.dataTransfer.getData('story-id');
    
    if (!storyId || !newStatus) {
        return;
    }
    
    // Find the story in allItems
    const story = allItems.find(item => item.storyId === storyId);
    if (!story) {
        return;
    }
    
    const oldStatus = story.devStatus;
    
    // Don't do anything if dropped in same column
    if (oldStatus === newStatus) {
        return;
    }
    
    // Move the card visually
    moveCardToColumn(storyId, newStatus);
    
    // Update the story status
    handleDevStatusChange(storyId, newStatus);
    
    return false;
}

/**
 * Move card to a different column
 */
function moveCardToColumn(storyId, newStatus) {
    const card = getCardElement(storyId);
    if (!card) {
        return;
    }
    
    const targetColumn = document.getElementById(`column-${newStatus}`);
    if (!targetColumn) {
        return;
    }
    
    // Remove empty state if present
    const emptyState = targetColumn.querySelector('.column-empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Get old column
    const oldColumn = card.closest('.column-body');
    const oldStatus = oldColumn?.dataset.status;
    
    // Move card to new column
    targetColumn.appendChild(card);
    
    // Update column counts
    if (oldStatus) {
        const oldCount = oldColumn.querySelectorAll('.kanban-card:not(.card-filtered)').length;
        updateColumnCount(oldStatus, oldCount);
        
        // Add empty state to old column if now empty
        if (oldCount === 0) {
            oldColumn.innerHTML = generateColumnEmptyState();
        }
    }
    
    const newCount = targetColumn.querySelectorAll('.kanban-card:not(.card-filtered)').length;
    updateColumnCount(newStatus, newCount);
    
    // Highlight the moved card
    highlightCard(storyId);
    
    // Update statistics
    updateBoardStatistics(allItems);
}

/**
 * Filter board based on current filter selections
 */
function filterBoard() {
    // Get filter values
    boardFilters.developer = document.getElementById('boardFilterDeveloper')?.value || '';
    boardFilters.priority = document.getElementById('boardFilterPriority')?.value || '';
    boardFilters.sprint = document.getElementById('boardFilterSprint')?.value || '';
    
    // Get all cards
    const cards = document.querySelectorAll('.kanban-card');
    
    // Track visible count per column
    const columnCounts = {};
    
    cards.forEach(card => {
        const storyId = card.dataset.storyId;
        const story = allItems.find(item => item.storyId === storyId);
        
        if (!story) {
            return;
        }
        
        // Check if story passes all filters
        let visible = true;
        
        if (boardFilters.developer && story.assignedTo !== boardFilters.developer) {
            visible = false;
        }
        
        if (boardFilters.priority && story.priority !== boardFilters.priority) {
            visible = false;
        }
        
        if (boardFilters.sprint && story.sprint !== boardFilters.sprint) {
            visible = false;
        }
        
        // Update card visibility
        updateCardVisibility(card, visible);
        
        // Count visible cards per column
        if (visible) {
            const status = story.devStatus || 'ready-for-dev';
            columnCounts[status] = (columnCounts[status] || 0) + 1;
        }
    });
    
    // Update all column counts
    const statuses = [
        'on-hold', 'ready-for-dev', 'in-progress', 'blocked', 'completed'
    ];
    
    statuses.forEach(status => {
        const count = columnCounts[status] || 0;
        updateColumnCount(status, count);
        
        // Show/hide empty state
        const columnBody = document.getElementById(`column-${status}`);
        if (columnBody) {
            const visibleCards = columnBody.querySelectorAll('.kanban-card:not(.card-filtered)').length;
            const emptyState = columnBody.querySelector('.column-empty-state');
            
            if (visibleCards === 0 && !emptyState) {
                columnBody.insertAdjacentHTML('beforeend', generateColumnEmptyState());
            } else if (visibleCards > 0 && emptyState) {
                emptyState.remove();
            }
        }
    });
    
    // Update statistics with filtered items
    const visibleItems = allItems.filter(item => {
        let visible = true;
        if (boardFilters.developer && item.assignedTo !== boardFilters.developer) {
            visible = false;
        }
        if (boardFilters.priority && item.priority !== boardFilters.priority) {
            visible = false;
        }
        if (boardFilters.sprint && item.sprintId !== boardFilters.sprint) {
            visible = false;
        }
        return visible;
    });
    
    updateBoardStatistics(visibleItems);
}

/**
 * Clear all board filters
 */
function clearBoardFilters() {
    document.getElementById('boardFilterDeveloper').value = '';
    document.getElementById('boardFilterPriority').value = '';
    document.getElementById('boardFilterSprint').value = '';
    
    boardFilters = { developer: '', priority: '', sprint: '' };
    
    // Show all cards
    document.querySelectorAll('.kanban-card').forEach(card => {
        updateCardVisibility(card, true);
    });
    
    // Re-render to update counts and empty states
    renderKanbanBoard(allItems, devConfig);
}

/**
 * Refresh board (re-render from current data)
 */
function refreshBoard() {
    // Show spinner overlay
    showSpinner();
    
    // Re-render after brief delay to allow spinner to display
    setTimeout(() => {
        try {
            renderKanbanBoard(allItems, devConfig);
            
            // Reapply filters if any are active
            if (boardFilters.developer || boardFilters.priority || boardFilters.sprint) {
                filterBoard();
            }
        } finally {
            // Hide spinner after processing
            hideSpinner();
        }
    }, 50);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderKanbanBoard,
        clearAllColumns,
        groupItemsByStatus,
        updateColumnCount,
        updateBoardStatistics,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        moveCardToColumn,
        filterBoard,
        clearBoardFilters,
        refreshBoard
    };
}
