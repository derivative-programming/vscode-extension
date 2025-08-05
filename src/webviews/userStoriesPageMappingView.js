// Description: Handles the user stories page mapping webview display with filtering and sorting.
// Created: August 5, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let userStoriesPageMappingData = {
    items: [],
    totalRecords: 0,
    sortColumn: 'storyNumber',
    sortDescending: false
};

// Keep track of all items for filtering
let allItems = [];

// Keep track of selected items
let selectedItems = new Set();

// Helper function to show spinner
function showSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.style.display = "flex";
    }
}

// Helper function to hide spinner
function hideSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.style.display = "none";
    }
}

// Toggle filter section visibility (global function for onclick)
function toggleFilterSection() {
    const filterContent = document.getElementById('filterContent');
    const chevron = document.getElementById('filterChevron');
    
    if (filterContent && chevron) {
        const isCollapsed = filterContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            filterContent.classList.remove('collapsed');
            chevron.classList.remove('codicon-chevron-right');
            chevron.classList.add('codicon-chevron-down');
        } else {
            filterContent.classList.add('collapsed');
            chevron.classList.remove('codicon-chevron-down');
            chevron.classList.add('codicon-chevron-right');
        }
    }
}

// Clear all filters (global function for onclick)
function clearFilters() {
    document.getElementById('filterStoryNumber').value = '';
    document.getElementById('filterStoryText').value = '';
    document.getElementById('filterPageMapping').value = '';
    document.getElementById('filterIgnorePages').value = '';
    applyFilters();
}

// Apply filters
function applyFilters() {
    const storyNumberFilter = document.getElementById('filterStoryNumber').value.toLowerCase();
    const storyTextFilter = document.getElementById('filterStoryText').value.toLowerCase();
    const pageMappingFilter = document.getElementById('filterPageMapping').value.toLowerCase();
    const ignorePagesFilter = document.getElementById('filterIgnorePages').value.toLowerCase();
    
    let filtered = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        
        // Handle pageMapping as either array or string for backward compatibility
        let pageMappingText = '';
        if (Array.isArray(item.pageMapping)) {
            pageMappingText = item.pageMapping.join(' ').toLowerCase();
        } else {
            pageMappingText = (item.pageMapping || '').toLowerCase();
        }
        const matchesPageMapping = !pageMappingFilter || pageMappingText.includes(pageMappingFilter);
        
        // Handle ignorePages as either array or string for backward compatibility
        let ignorePagesText = '';
        if (Array.isArray(item.ignorePages)) {
            ignorePagesText = item.ignorePages.join(' ').toLowerCase();
        } else {
            ignorePagesText = (item.ignorePages || '').toLowerCase();
        }
        const matchesIgnorePages = !ignorePagesFilter || ignorePagesText.includes(ignorePagesFilter);
        
        return matchesStoryNumber && matchesStoryText && matchesPageMapping && matchesIgnorePages;
    });
    
    // Update data and re-render
    userStoriesPageMappingData.items = filtered;
    userStoriesPageMappingData.totalRecords = filtered.length;
    
    renderTable();
    updateRecordInfo();
}

// Sort function
function sortTable(column) {
    const isDescending = userStoriesPageMappingData.sortColumn === column && !userStoriesPageMappingData.sortDescending;
    
    vscode.postMessage({
        command: 'sortUserStoriesPageMapping',
        column: column,
        descending: isDescending
    });
}

// Update record info display
function updateRecordInfo() {
    const recordInfo = document.getElementById('record-info');
    if (recordInfo) {
        const total = userStoriesPageMappingData.totalRecords;
        const filtered = userStoriesPageMappingData.items.length;
        
        if (total === filtered) {
            recordInfo.textContent = `${total} record${total === 1 ? '' : 's'}`;
        } else {
            recordInfo.textContent = `${filtered} of ${total} record${total === 1 ? '' : 's'}`;
        }
    }
}

// Render the table
function renderTable() {
    console.log('Rendering page mapping table with', userStoriesPageMappingData.items.length, 'items');
    
    const thead = document.getElementById('pageMappingTableHead');
    const tbody = document.getElementById('pageMappingTableBody');
    
    if (!thead || !tbody) {
        console.error('Table elements not found');
        return;
    }
    
    // Clear existing content
    thead.innerHTML = "";
    tbody.innerHTML = "";
    
    if (userStoriesPageMappingData.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">No stories available. Only stories that have completed Model AI Processing are listed.</td></tr>';
        return;
    }
    
    // Create header row
    const headerRow = document.createElement('tr');
    
    // Checkbox column
    const checkboxHeader = document.createElement('th');
    checkboxHeader.className = 'checkbox-header';
    checkboxHeader.innerHTML = '<input type="checkbox" class="select-all-checkbox" id="selectAllCheckbox">';
    headerRow.appendChild(checkboxHeader);
    
    // Story Number column
    const storyNumberHeader = document.createElement('th');
    storyNumberHeader.className = 'story-number-column sortable';
    storyNumberHeader.innerHTML = 'Story Number';
    storyNumberHeader.onclick = () => sortTable('storyNumber');
    headerRow.appendChild(storyNumberHeader);
    
    // Story Text column  
    const storyTextHeader = document.createElement('th');
    storyTextHeader.className = 'story-text-column sortable';
    storyTextHeader.innerHTML = 'Story Text';
    storyTextHeader.onclick = () => sortTable('storyText');
    headerRow.appendChild(storyTextHeader);
    
    // Page Mapping column
    const pageMappingHeader = document.createElement('th');
    pageMappingHeader.className = 'page-mapping-column';
    pageMappingHeader.innerHTML = 'Page Mapping';
    headerRow.appendChild(pageMappingHeader);
    
    // Ignore Pages column
    const ignorePagesHeader = document.createElement('th');
    ignorePagesHeader.className = 'ignore-pages-column';
    ignorePagesHeader.innerHTML = 'Ignore Pages';
    headerRow.appendChild(ignorePagesHeader);
    
    thead.appendChild(headerRow);
    
    // Create data rows
    userStoriesPageMappingData.items.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Checkbox column
        const checkboxCell = document.createElement('td');
        checkboxCell.className = 'checkbox-column';
        checkboxCell.innerHTML = `<input type="checkbox" class="row-checkbox" data-story-id="${item.storyId}">`;
        row.appendChild(checkboxCell);
        
        // Story Number
        const storyNumberCell = document.createElement('td');
        storyNumberCell.className = 'story-number-column';
        storyNumberCell.textContent = item.storyNumber || '';
        row.appendChild(storyNumberCell);
        
        // Story Text  
        const storyTextCell = document.createElement('td');
        storyTextCell.className = 'story-text-column';
        storyTextCell.textContent = item.storyText || '';
        storyTextCell.title = item.storyText || '';
        row.appendChild(storyTextCell);
        
        // Page Mapping
        const pageMappingCell = document.createElement('td');
        pageMappingCell.className = 'page-mapping-column';
        const pageMappingInput = document.createElement('textarea');
        pageMappingInput.className = 'page-mapping-input';
        // Convert array to string for display (one page per line)
        pageMappingInput.value = Array.isArray(item.pageMapping) ? item.pageMapping.join('\n') : (item.pageMapping || '');
        pageMappingInput.placeholder = 'Enter page names (one per line)';
        pageMappingInput.onchange = () => handlePageMappingChange(item.storyId, pageMappingInput.value);
        pageMappingCell.appendChild(pageMappingInput);
        row.appendChild(pageMappingCell);
        
        // Ignore Pages
        const ignorePagesCell = document.createElement('td');
        ignorePagesCell.className = 'ignore-pages-column';
        const ignorePagesInput = document.createElement('textarea');
        ignorePagesInput.className = 'ignore-pages-input';
        // Convert array to string for display (one page per line)
        ignorePagesInput.value = Array.isArray(item.ignorePages) ? item.ignorePages.join('\n') : (item.ignorePages || '');
        ignorePagesInput.placeholder = 'Enter ignored page names (one per line)';
        ignorePagesInput.onchange = () => handleIgnorePagesChange(item.storyId, ignorePagesInput.value);
        ignorePagesCell.appendChild(ignorePagesInput);
        row.appendChild(ignorePagesCell);
        
        tbody.appendChild(row);
    });
    
    // Setup select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.onchange = handleSelectAll;
    }
    
    // Setup individual checkboxes
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(checkbox => {
        checkbox.onchange = handleRowSelection;
    });
}

// Handle page mapping change
function handlePageMappingChange(storyId, pageMappingText) {
    console.log('Page mapping changed for story:', storyId, pageMappingText);
    
    // Convert text to array (split by lines, filter out empty lines, trim whitespace)
    const pageMappingArray = pageMappingText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    // Find the item and update locally
    const item = userStoriesPageMappingData.items.find(i => i.storyId === storyId);
    if (item) {
        item.pageMapping = pageMappingArray;
    }
    
    // Send change to extension
    vscode.postMessage({
        command: 'savePageMappingChange',
        data: {
            storyId: storyId,
            storyNumber: item ? item.storyNumber : '',
            pageMapping: pageMappingArray,
            ignorePages: item ? item.ignorePages : [],
            mappingFilePath: item ? item.mappingFilePath : ''
        }
    });
}

// Handle ignore pages change
function handleIgnorePagesChange(storyId, ignorePagesText) {
    console.log('Ignore pages changed for story:', storyId, ignorePagesText);
    
    // Convert text to array (split by lines, filter out empty lines, trim whitespace)
    const ignorePagesArray = ignorePagesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    // Find the item and update locally
    const item = userStoriesPageMappingData.items.find(i => i.storyId === storyId);
    if (item) {
        item.ignorePages = ignorePagesArray;
    }
    
    // Send change to extension
    vscode.postMessage({
        command: 'savePageMappingChange',
        data: {
            storyId: storyId,
            storyNumber: item ? item.storyNumber : '',
            pageMapping: item ? item.pageMapping : [],
            ignorePages: ignorePagesArray,
            mappingFilePath: item ? item.mappingFilePath : ''
        }
    });
}

// Handle select all checkbox
function handleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    
    selectedItems.clear();
    
    if (selectAllCheckbox.checked) {
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            selectedItems.add(checkbox.dataset.storyId);
        });
    } else {
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    updateApplyButtonState();
}

// Handle individual row selection
function handleRowSelection() {
    const checkbox = event.target;
    const storyId = checkbox.dataset.storyId;
    
    if (checkbox.checked) {
        selectedItems.add(storyId);
    } else {
        selectedItems.delete(storyId);
    }
    
    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
    
    selectAllCheckbox.checked = checkedCount === rowCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < rowCheckboxes.length;
    
    updateApplyButtonState();
}

// Update apply button state
function updateApplyButtonState() {
    // For now, we don't have bulk operations like QA, so this is placeholder
    // Could be used for bulk clear mapping operations in the future
}

// Validate all page names
function validateAllPageNames() {
    console.log("[Webview] Running validation on all page names");
    
    const validationErrors = [];
    const totalItems = allItems.length;
    
    // Get all unique page names from the model to validate against
    vscode.postMessage({
        command: 'getModelPageNames'
    });
    
    // Note: The actual validation will happen in the message handler when we receive the page names
}

// Process validation results (called from message handler)
function processPageValidation(modelPageNames) {
    console.log("[Webview] Processing validation with", modelPageNames.length, "model page names:", modelPageNames);
    
    const validationErrors = [];
    const allPageNames = new Set(modelPageNames.map(name => name.toLowerCase()));
    
    console.log("[Webview] Validating against", allItems.length, "stories");
    
    // Validate each item's page mappings
    allItems.forEach((item, index) => {
        const pageMappings = Array.isArray(item.pageMapping) ? item.pageMapping : [];
        const ignorePages = Array.isArray(item.ignorePages) ? item.ignorePages : [];
        
        console.log(`[Webview] Story ${item.storyNumber}: checking ${pageMappings.length} page mappings and ${ignorePages.length} ignore pages`);
        
        // Check page mappings
        pageMappings.forEach(pageName => {
            if (pageName && pageName.trim() && !allPageNames.has(pageName.toLowerCase().trim())) {
                console.log(`[Webview] Invalid page mapping found: "${pageName.trim()}" in story ${item.storyNumber}`);
                validationErrors.push({
                    index: index,
                    storyNumber: item.storyNumber,
                    type: 'Page Mapping',
                    pageName: pageName.trim(),
                    message: `Page "${pageName.trim()}" not found in model`
                });
            }
        });
        
        // Check ignore pages
        ignorePages.forEach(pageName => {
            if (pageName && pageName.trim() && !allPageNames.has(pageName.toLowerCase().trim())) {
                console.log(`[Webview] Invalid ignore page found: "${pageName.trim()}" in story ${item.storyNumber}`);
                validationErrors.push({
                    index: index,
                    storyNumber: item.storyNumber,
                    type: 'Ignore Pages',
                    pageName: pageName.trim(),
                    message: `Page "${pageName.trim()}" not found in model`
                });
            }
        });
    });
    
    // Display validation results
    const validationSummary = document.getElementById('validationSummary');
    const validationTitle = document.getElementById('validationTitle');
    const validationContent = document.getElementById('validationContent');
    const totalItems = allItems.length;
    
    if (validationErrors.length === 0) {
        validationTitle.textContent = `✓ All page names are valid (checked ${totalItems} stories)`;
        validationContent.innerHTML = '<div style="color: var(--vscode-testing-iconPassed); margin: 10px 0;">No invalid page names found.</div>';
        validationSummary.style.border = '1px solid var(--vscode-testing-iconPassed)';
        validationSummary.style.backgroundColor = 'var(--vscode-inputValidation-infoBackground)';
    } else {
        validationTitle.textContent = `⚠ Found ${validationErrors.length} invalid page name(s) in ${totalItems} stories`;
        
        let errorHtml = '';
        validationErrors.forEach(error => {
            errorHtml += `<div class="error-item">
                <strong>Story ${error.storyNumber}</strong> - ${error.type}: "${error.pageName}" not found in model
            </div>`;
        });
        validationContent.innerHTML = errorHtml;
        validationSummary.style.border = '1px solid var(--vscode-inputValidation-errorBorder)';
        validationSummary.style.backgroundColor = 'var(--vscode-inputValidation-errorBackground)';
    }
    
    validationSummary.style.display = 'block';
    console.log("[Webview] Validation completed:", validationErrors.length, "errors found");
}

// Export to CSV (global function for onclick)
function exportToCSV() {
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: userStoriesPageMappingData.items
        }
    });
}

// Refresh data (global function for onclick)
function refresh() {
    vscode.postMessage({
        command: 'refresh'
    });
}

// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'setUserStoriesPageMappingData':
            console.log('Received page mapping data:', message.data);
            userStoriesPageMappingData = message.data;
            allItems = [...message.data.items];
            renderTable();
            updateRecordInfo();
            hideSpinner();
            break;
            
        case 'pageMappingChangeSaved':
            console.log('Page mapping change saved:', message.success);
            if (!message.success) {
                console.error('Error saving page mapping change:', message.error);
                // Could show a notification here
            }
            break;
            
        case 'csvExportReady':
            console.log('CSV export ready');
            if (message.success !== false) {
                // Send CSV content to extension to save to workspace (same pattern as userStoriesView)
                vscode.postMessage({
                    command: 'saveCsvToWorkspace',
                    data: {
                        content: message.csvContent,
                        filename: message.filename
                    }
                });
            } else {
                console.error('Error exporting CSV:', message.error);
                alert('Error exporting CSV: ' + (message.error || 'Unknown error'));
            }
            break;
            
        case 'modelPageNamesReady':
            console.log('Model page names received for validation');
            if (message.success !== false) {
                processPageValidation(message.pageNames || []);
            } else {
                console.error('Error getting model page names:', message.error);
                alert('Error getting model page names: ' + (message.error || 'Unknown error'));
            }
            break;
            
        default:
            console.log('Unknown message:', message);
            break;
    }
});

// Initialize the webview when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page Mapping webview DOM loaded');
    
    showSpinner();
    
    // Setup filter event listeners for auto-apply
    const filterInputs = ['filterStoryNumber', 'filterStoryText', 'filterPageMapping', 'filterIgnorePages'];
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', applyFilters);
            element.addEventListener('change', applyFilters);
        }
    });
    
    // Setup export and refresh buttons
    const exportButton = document.getElementById('exportButton');
    const refreshButton = document.getElementById('refreshButton');
    
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', refresh);
        // Setup refresh button icon (following QA view pattern exactly)
        refreshButton.innerHTML = '<span class="codicon codicon-refresh" style="font-size:16px;"></span>';
        refreshButton.title = "Refresh";
        refreshButton.style.background = "none";
        refreshButton.style.border = "none";
        refreshButton.style.color = "var(--vscode-editor-foreground)";
        refreshButton.style.padding = "4px 8px";
        refreshButton.style.cursor = "pointer";
        refreshButton.style.display = "flex";
        refreshButton.style.alignItems = "center";
        refreshButton.style.borderRadius = "4px";
        refreshButton.style.transition = "background 0.15s";
        
        // Add hover effect
        refreshButton.addEventListener("mouseenter", function() {
            refreshButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        refreshButton.addEventListener("mouseleave", function() {
            refreshButton.style.background = "none";
        });
    }
    
    // Setup validate button
    const validateButton = document.getElementById('validateButton');
    if (validateButton) {
        validateButton.addEventListener('click', validateAllPageNames);
    }
    
    // Notify extension that webview is ready
    vscode.postMessage({
        command: 'UserStoriesPageMappingWebviewReady'
    });
});
