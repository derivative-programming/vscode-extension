// Description: Table rendering functions for Details Tab
// Created: October 5, 2025
// Last Modified: October 5, 2025

/**
 * Column definitions for the dev table
 */
const DEV_TABLE_COLUMNS = [
    { key: 'select', label: '', sortable: false, className: 'checkbox-column', width: '40px' },
    { key: 'storyNumber', label: 'Story #', sortable: true, className: 'story-number-column', width: '100px' },
    { key: 'storyText', label: 'Story Text', sortable: true, className: 'story-text-column', width: '250px' },
    { key: 'priority', label: 'Priority', sortable: true, className: 'priority-column', width: '100px' },
    { key: 'developmentQueuePosition', label: 'Dev Queue Position', sortable: true, className: 'queue-position-column', width: '140px' },
    { key: 'storyPoints', label: 'Points', sortable: true, className: 'story-points-column', width: '80px' },
    { key: 'assignedTo', label: 'Assigned To', sortable: true, className: 'assigned-to-column', width: '150px' },
    { key: 'devStatus', label: 'Dev Status', sortable: true, className: 'dev-status-column', width: '180px' },
    { key: 'sprint', label: 'Sprint', sortable: true, className: 'sprint-column', width: '120px' },
    { key: 'startDate', label: 'Start Date', sortable: true, className: 'start-date-column', width: '100px' },
    { key: 'estEndDate', label: 'Est. End Date', sortable: true, className: 'est-end-date-column', width: '100px' },
    { key: 'actualEndDate', label: 'Actual End Date', sortable: true, className: 'actual-end-date-column', width: '100px' },
    { key: 'blockedReason', label: 'Blocked Reason', sortable: false, className: 'blocked-reason-column', width: '150px' },
    { key: 'devNotes', label: 'Dev Notes', sortable: false, className: 'dev-notes-column', width: '150px' }
];

/**
 * Render the table structure (header and body)
 * @param {Array} items - Items to display
 * @param {Object} config - Dev configuration
 * @param {Object} sortState - Current sort state { column, descending }
 */
function renderTable(items, config, sortState) {
    const thead = document.getElementById('devTableHead');
    const tbody = document.getElementById('devTableBody');
    
    if (!thead || !tbody) {
        console.error('Table elements not found');
        return;
    }
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // Generate header
    const headerRow = document.createElement('tr');
    DEV_TABLE_COLUMNS.forEach(column => {
        const th = document.createElement('th');
        th.className = column.className;
        
        if (column.width) {
            th.style.minWidth = column.width;
        }
        
        if (column.key === 'select') {
            // Checkbox column with "Select All"
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'selectAllCheckbox';
            checkbox.addEventListener('change', (e) => {
                handleSelectAll(e.target.checked);
            });
            th.appendChild(checkbox);
        } else {
            // Regular column header
            const headerContent = document.createElement('span');
            headerContent.textContent = column.label;
            th.appendChild(headerContent);
            
            if (column.sortable) {
                th.classList.add('sortable');
                th.style.cursor = 'pointer';
                
                // Add sort indicator if this column is currently sorted
                if (sortState && sortState.column === column.key) {
                    const indicator = document.createElement('span');
                    indicator.className = 'sort-indicator';
                    indicator.textContent = sortState.descending ? ' ▼' : ' ▲';
                    th.appendChild(indicator);
                }
                
                // Add click handler for sorting
                th.addEventListener('click', () => {
                    handleSort(column.key);
                });
            }
        }
        
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Generate body rows
    if (items && items.length > 0) {
        items.forEach(item => {
            const row = createTableRow(item, config);
            tbody.appendChild(row);
        });
    } else {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = DEV_TABLE_COLUMNS.length;
        emptyCell.textContent = 'No items to display';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.padding = '20px';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    }
}

/**
 * Create a single table row
 * @param {Object} item - User story dev item
 * @param {Object} config - Dev configuration
 * @returns {HTMLElement} Table row element
 */
function createTableRow(item, config) {
    const row = document.createElement('tr');
    row.dataset.storyId = item.storyId;
    
    // Add row click handler (excluding interactive elements)
    row.addEventListener('click', (e) => {
        if (!e.target.closest('input, select, button')) {
            openStoryDetailModal(item.storyId);
        }
    });
    
    DEV_TABLE_COLUMNS.forEach(column => {
        const cell = document.createElement('td');
        cell.className = column.className;
        
        switch (column.key) {
            case 'select':
                cell.appendChild(createCheckbox(item.storyId));
                break;
            case 'storyNumber':
                cell.textContent = item.storyNumber || '';
                break;
            case 'storyText':
                cell.textContent = item.storyText || '';
                cell.title = item.storyText || '';
                break;
            case 'priority':
                cell.appendChild(createPriorityDropdown(item.storyId, item.priority, config));
                break;
            case 'developmentQueuePosition':
                cell.appendChild(createQueuePositionInput(item.storyId, item.developmentQueuePosition));
                break;
            case 'storyPoints':
                cell.appendChild(createStoryPointsDropdown(item.storyId, item.storyPoints, config));
                break;
            case 'assignedTo':
                cell.appendChild(createAssignedToDropdown(item.storyId, item.assignedTo, config));
                break;
            case 'devStatus':
                cell.appendChild(createDevStatusDropdown(item.storyId, item.devStatus, config));
                break;
            case 'sprint':
                cell.appendChild(createSprintDropdown(item.storyId, item.sprintId, config));
                break;
            case 'startDate':
                cell.textContent = formatDate(item.startDate);
                break;
            case 'estEndDate':
                cell.textContent = formatDate(item.estEndDate);
                break;
            case 'actualEndDate':
                cell.textContent = formatDate(item.actualEndDate);
                break;
            case 'blockedReason':
                cell.textContent = truncateText(item.blockedReason, 30);
                cell.title = item.blockedReason || '';
                break;
            case 'devNotes':
                cell.textContent = truncateText(item.devNotes, 30);
                cell.title = item.devNotes || '';
                break;
        }
        
        row.appendChild(cell);
    });
    
    return row;
}

/**
 * Create checkbox for row selection
 */
function createCheckbox(storyId) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'row-checkbox';
    checkbox.dataset.storyId = storyId;
    checkbox.checked = selectedItems.has(storyId);
    checkbox.addEventListener('change', (e) => {
        handleRowSelection(storyId, e.target.checked);
        e.stopPropagation();
    });
    return checkbox;
}

/**
 * Create priority dropdown
 */
function createPriorityDropdown(storyId, currentPriority, config) {
    const select = document.createElement('select');
    select.className = 'priority-select';
    select.dataset.storyId = storyId;
    
    const priorities = ['', 'low', 'medium', 'high', 'critical'];
    priorities.forEach(priority => {
        const option = document.createElement('option');
        option.value = priority;
        option.textContent = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : '(Not Set)';
        if (priority === currentPriority) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
        handlePriorityChange(storyId, e.target.value);
        e.stopPropagation();
    });
    
    return select;
}

/**
 * Create development queue position input
 */
function createQueuePositionInput(storyId, currentPosition) {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'queue-position-input';
    input.dataset.storyId = storyId;
    input.value = currentPosition !== undefined ? currentPosition : '';
    input.min = '0';
    input.step = '1';
    input.style.width = '80px';
    input.title = 'Lower values appear first in Board view columns';
    
    input.addEventListener('change', (e) => {
        handleQueuePositionChange(storyId, e.target.value);
        e.stopPropagation();
    });
    
    input.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    return input;
}

/**
 * Create story points dropdown
 */
function createStoryPointsDropdown(storyId, currentPoints, config) {
    const select = document.createElement('select');
    select.className = 'story-points-select';
    select.dataset.storyId = storyId;
    
    const points = ['', '?', '1', '2', '3', '5', '8', '13', '21'];
    points.forEach(point => {
        const option = document.createElement('option');
        option.value = point;
        option.textContent = point || '(Not Set)';
        if (point === String(currentPoints)) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
        handleStoryPointsChange(storyId, e.target.value);
        e.stopPropagation();
    });
    
    return select;
}

/**
 * Create assigned to dropdown
 */
function createAssignedToDropdown(storyId, currentAssignee, config) {
    const select = document.createElement('select');
    select.className = 'assigned-to-select';
    select.dataset.storyId = storyId;
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '(Not Assigned)';
    if (!currentAssignee) {
        emptyOption.selected = true;
    }
    select.appendChild(emptyOption);
    
    // Add developer options
    if (config.developers && config.developers.length > 0) {
        config.developers
            .filter(dev => dev.active !== false)
            .forEach(dev => {
                const option = document.createElement('option');
                option.value = dev.name;
                option.textContent = dev.name;
                if (dev.name === currentAssignee) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
    }
    
    select.addEventListener('change', (e) => {
        handleDeveloperAssignment(storyId, e.target.value);
        e.stopPropagation();
    });
    
    return select;
}

/**
 * Create dev status dropdown
 */
function createDevStatusDropdown(storyId, currentStatus, config) {
    const select = document.createElement('select');
    select.className = 'dev-status-select';
    select.dataset.storyId = storyId;
    
    const statuses = [
        { value: '', label: '(Not Set)' },
        { value: 'on-hold', label: 'On Hold' },
        { value: 'ready-for-dev', label: 'Ready for Development' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'blocked', label: 'Blocked' },
        { value: 'completed', label: 'Completed' }
    ];
    
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.value;
        option.textContent = status.label;
        if (status.value === currentStatus) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
        handleDevStatusChange(storyId, e.target.value);
        e.stopPropagation();
    });
    
    return select;
}

/**
 * Create sprint dropdown
 */
function createSprintDropdown(storyId, currentSprint, config) {
    const select = document.createElement('select');
    select.className = 'sprint-select';
    select.dataset.storyId = storyId;
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '(No Sprint)';
    if (!currentSprint) {
        emptyOption.selected = true;
    }
    select.appendChild(emptyOption);
    
    // Add sprint options
    if (config.sprints && config.sprints.length > 0) {
        config.sprints.forEach(sprint => {
            const option = document.createElement('option');
            option.value = sprint.sprintId;
            option.textContent = sprint.sprintName;
            if (sprint.sprintId === currentSprint) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
    
    select.addEventListener('change', (e) => {
        handleSprintAssignment(storyId, e.target.value);
        e.stopPropagation();
    });
    
    return select;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) {
        return '';
    }
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return dateString;
    }
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength) {
    if (!text) {
        return '';
    }
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEV_TABLE_COLUMNS,
        renderTable,
        createTableRow
    };
}
