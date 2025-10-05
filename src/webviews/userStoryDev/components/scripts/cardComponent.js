// Description: Kanban card component generator
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Generate a Kanban card for a user story
 * @param {Object} story - User story dev item
 * @param {Object} config - Dev configuration
 * @returns {string} HTML string for the card
 */
function generateKanbanCard(story, config) {
    const priorityColor = getPriorityColor(story.priority);
    const priorityLabel = story.priority ? story.priority.charAt(0).toUpperCase() + story.priority.slice(1) : '';
    const assignedTo = story.assignedTo || 'Unassigned';
    const storyPoints = story.storyPoints || '?';
    const storyText = truncateCardText(story.storyText, 100);
    
    // Determine if story is blocked
    const isBlocked = story.devStatus === 'blocked';
    const blockedClass = isBlocked ? 'card-blocked' : '';
    
    return `
        <div class="kanban-card ${blockedClass}" 
             data-story-id="${story.storyId}"
             draggable="true"
             ondragstart="handleDragStart(event)"
             ondragend="handleDragEnd(event)"
             onclick="openStoryDetailModal('${story.storyId}')">
            
            <!-- Card Header -->
            <div class="card-header">
                <div class="card-story-number">${story.storyNumber || ''}</div>
                ${priorityLabel ? `<div class="card-priority" style="background-color: ${priorityColor};">${priorityLabel}</div>` : ''}
            </div>
            
            <!-- Card Body -->
            <div class="card-body">
                <div class="card-text" title="${story.storyText || ''}">${storyText}</div>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer">
                <div class="card-meta">
                    <div class="card-points" title="Story Points">
                        <i class="codicon codicon-pulse"></i>
                        <span>${storyPoints}</span>
                    </div>
                    <div class="card-assignee" title="Assigned to ${assignedTo}">
                        <i class="codicon codicon-person"></i>
                        <span>${truncateText(assignedTo, 15)}</span>
                    </div>
                </div>
                ${isBlocked ? '<div class="card-blocked-indicator" title="This story is blocked"><i class="codicon codicon-error"></i> Blocked</div>' : ''}
            </div>
        </div>
    `;
}

/**
 * Truncate text for card display
 */
function truncateCardText(text, maxLength) {
    if (!text) {
        return '(No description)';
    }
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

/**
 * Create a card DOM element (alternative to innerHTML for better performance)
 * @param {Object} story - User story dev item
 * @param {Object} config - Dev configuration
 * @returns {HTMLElement} Card DOM element
 */
function createKanbanCardElement(story, config) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.storyId = story.storyId;
    card.draggable = true;
    
    // Add blocked class if needed
    if (story.devStatus === 'blocked') {
        card.classList.add('card-blocked');
    }
    
    // Event listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('click', (e) => {
        // Don't open modal if clicking on interactive elements
        if (!e.target.closest('.card-action')) {
            openStoryDetailModal(story.storyId);
        }
    });
    
    // Build card content
    card.innerHTML = generateKanbanCard(story, config);
    
    return card;
}

/**
 * Update card visual appearance based on filters
 * @param {HTMLElement} card - Card element
 * @param {boolean} visible - Whether card should be visible
 */
function updateCardVisibility(card, visible) {
    if (visible) {
        card.style.display = '';
        card.classList.remove('card-filtered');
    } else {
        card.style.display = 'none';
        card.classList.add('card-filtered');
    }
}

/**
 * Add visual feedback to card during drag
 * @param {HTMLElement} card - Card element
 * @param {boolean} isDragging - Whether card is being dragged
 */
function setCardDraggingState(card, isDragging) {
    if (isDragging) {
        card.classList.add('card-dragging');
    } else {
        card.classList.remove('card-dragging');
    }
}

/**
 * Highlight card temporarily (e.g., after update)
 * @param {string} storyId - Story ID
 */
function highlightCard(storyId) {
    const card = document.querySelector(`.kanban-card[data-story-id="${storyId}"]`);
    if (card) {
        card.classList.add('card-highlight');
        setTimeout(() => {
            card.classList.remove('card-highlight');
        }, 1000);
    }
}

/**
 * Get card element by story ID
 * @param {string} storyId - Story ID
 * @returns {HTMLElement|null} Card element
 */
function getCardElement(storyId) {
    return document.querySelector(`.kanban-card[data-story-id="${storyId}"]`);
}

/**
 * Remove card from board
 * @param {string} storyId - Story ID
 */
function removeCardFromBoard(storyId) {
    const card = getCardElement(storyId);
    if (card) {
        card.remove();
    }
}

/**
 * Update card content without recreating
 * @param {string} storyId - Story ID
 * @param {Object} updatedStory - Updated story data
 * @param {Object} config - Dev configuration
 */
function updateCardContent(storyId, updatedStory, config) {
    const card = getCardElement(storyId);
    if (card) {
        // Update innerHTML with new content
        card.innerHTML = generateKanbanCard(updatedStory, config);
        
        // Update blocked class
        if (updatedStory.devStatus === 'blocked') {
            card.classList.add('card-blocked');
        } else {
            card.classList.remove('card-blocked');
        }
        
        // Highlight to show update
        highlightCard(storyId);
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateKanbanCard,
        truncateCardText,
        createKanbanCardElement,
        updateCardVisibility,
        setCardDraggingState,
        highlightCard,
        getCardElement,
        removeCardFromBoard,
        updateCardContent
    };
}
