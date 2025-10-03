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
    storyNumberHeader.onclick = () => sortTable('storyNumber');
    // Add sort indicator if this is the active sort column
    if (userStoriesPageMappingData.sortColumn === 'storyNumber') {
        storyNumberHeader.textContent = 'Story Number' + (userStoriesPageMappingData.sortDescending ? ' ▼' : ' ▲');
    } else {
        storyNumberHeader.textContent = 'Story Number';
    }
    headerRow.appendChild(storyNumberHeader);
    
    // Story Text column  
    const storyTextHeader = document.createElement('th');
    storyTextHeader.className = 'story-text-column sortable';
    storyTextHeader.onclick = () => sortTable('storyText');
    // Add sort indicator if this is the active sort column
    if (userStoriesPageMappingData.sortColumn === 'storyText') {
        storyTextHeader.textContent = 'Story Text' + (userStoriesPageMappingData.sortDescending ? ' ▼' : ' ▲');
    } else {
        storyTextHeader.textContent = 'Story Text';
    }
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
        
        // Create container for input and lookup button
        const pageMappingContainer = document.createElement('div');
        pageMappingContainer.className = 'input-with-lookup';
        
        const pageMappingInput = document.createElement('textarea');
        pageMappingInput.className = 'page-mapping-input';
        // Convert array to string for display (one page per line)
        pageMappingInput.value = Array.isArray(item.pageMapping) ? item.pageMapping.join('\n') : (item.pageMapping || '');
        pageMappingInput.placeholder = 'Enter page names (one per line)';
        pageMappingInput.onchange = () => handlePageMappingChange(item.storyId, pageMappingInput.value);
        
        // Create lookup button
        const pageMappingLookupBtn = document.createElement('button');
        pageMappingLookupBtn.innerHTML = '<span class="codicon codicon-search" style="font-size:16px;"></span>';
        pageMappingLookupBtn.title = 'Lookup pages';
        pageMappingLookupBtn.onclick = () => openPageLookupModal(item.storyId, 'pageMapping', item);
        // Apply same styling as refresh button
        pageMappingLookupBtn.style.background = "none";
        pageMappingLookupBtn.style.border = "none";
        pageMappingLookupBtn.style.color = "var(--vscode-editor-foreground)";
        pageMappingLookupBtn.style.padding = "4px 8px";
        pageMappingLookupBtn.style.cursor = "pointer";
        pageMappingLookupBtn.style.display = "flex";
        pageMappingLookupBtn.style.alignItems = "center";
        pageMappingLookupBtn.style.borderRadius = "4px";
        pageMappingLookupBtn.style.transition = "background 0.15s";
        // Add hover effect
        pageMappingLookupBtn.addEventListener("mouseenter", function() {
            pageMappingLookupBtn.style.background = "var(--vscode-list-hoverBackground)";
        });
        pageMappingLookupBtn.addEventListener("mouseleave", function() {
            pageMappingLookupBtn.style.background = "none";
        });
        
        pageMappingContainer.appendChild(pageMappingInput);
        pageMappingContainer.appendChild(pageMappingLookupBtn);
        pageMappingCell.appendChild(pageMappingContainer);
        row.appendChild(pageMappingCell);
        
        // Ignore Pages
        const ignorePagesCell = document.createElement('td');
        ignorePagesCell.className = 'ignore-pages-column';
        
        // Create container for input and lookup button
        const ignorePagesContainer = document.createElement('div');
        ignorePagesContainer.className = 'input-with-lookup';
        
        const ignorePagesInput = document.createElement('textarea');
        ignorePagesInput.className = 'ignore-pages-input';
        // Convert array to string for display (one page per line)
        ignorePagesInput.value = Array.isArray(item.ignorePages) ? item.ignorePages.join('\n') : (item.ignorePages || '');
        ignorePagesInput.placeholder = 'Enter ignored page names (one per line)';
        ignorePagesInput.onchange = () => handleIgnorePagesChange(item.storyId, ignorePagesInput.value);
        
        // Create lookup button
        const ignorePagesLookupBtn = document.createElement('button');
        ignorePagesLookupBtn.innerHTML = '<span class="codicon codicon-search" style="font-size:16px;"></span>';
        ignorePagesLookupBtn.title = 'Lookup pages';
        ignorePagesLookupBtn.onclick = () => openPageLookupModal(item.storyId, 'ignorePages', item);
        // Apply same styling as refresh button
        ignorePagesLookupBtn.style.background = "none";
        ignorePagesLookupBtn.style.border = "none";
        ignorePagesLookupBtn.style.color = "var(--vscode-editor-foreground)";
        ignorePagesLookupBtn.style.padding = "4px 8px";
        ignorePagesLookupBtn.style.cursor = "pointer";
        ignorePagesLookupBtn.style.display = "flex";
        ignorePagesLookupBtn.style.alignItems = "center";
        ignorePagesLookupBtn.style.borderRadius = "4px";
        ignorePagesLookupBtn.style.transition = "background 0.15s";
        // Add hover effect
        ignorePagesLookupBtn.addEventListener("mouseenter", function() {
            ignorePagesLookupBtn.style.background = "var(--vscode-list-hoverBackground)";
        });
        ignorePagesLookupBtn.addEventListener("mouseleave", function() {
            ignorePagesLookupBtn.style.background = "none";
        });
        
        ignorePagesContainer.appendChild(ignorePagesInput);
        ignorePagesContainer.appendChild(ignorePagesLookupBtn);
        ignorePagesCell.appendChild(ignorePagesContainer);
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

// Convert spaced words to camelCase (e.g., "Org Customers" -> "OrgCustomers")
function convertToCamelCase(text) {
    if (!text || typeof text !== "string") { return ""; }
    
    return text
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

// Extract role from user story text
function extractRoleFromUserStory(text) {
    if (!text || typeof text !== "string") { return ""; }
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract role from: A [Role] wants to...
    const re1 = /^A\s+\[?(\w+(?:\s+\w+)*)\]?\s+wants to/i;
    const match1 = t.match(re1);
    if (match1) { return match1[1]; }
    
    // Regex to extract role from: As a [Role], I want to...
    const re2 = /^As a\s+\[?(\w+(?:\s+\w+)*)\]?\s*,?\s*I want to/i;
    const match2 = t.match(re2);
    if (match2) { return match2[1]; }
    
    return "";
}

// Extract action from user story text
function extractActionFromUserStory(text) {
    if (!text || typeof text !== "string") { return ""; }
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract action from: ...wants to [action] [a|an|all]... (case insensitive)
    const re1 = /wants to\s+\[?(view all|view|add|update|delete)\]?\s+(a|an|all)/i;
    const match1 = t.match(re1);
    if (match1) { return match1[1].toLowerCase(); }
    
    // Regex to extract action from: ...I want to [action] [a|an|all]... (case insensitive)
    const re2 = /I want to\s+\[?(view all|view|add|update|delete)\]?\s+(a|an|all)/i;
    const match2 = t.match(re2);
    if (match2) { return match2[1].toLowerCase(); }
    
    return "";
}

// Extract object from user story text
function extractObjectFromUserStory(text) {
    if (!text || typeof text !== "string") { return ""; }
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract object from: ...[action] [a|an|all] [object] (case insensitive)
    const re = /(?:view all|view|add|update|delete)\]?\s+(?:a|an|all)\s+\[?(\w+(?:\s+\w+)*)\]?$/i;
    const match = t.match(re);
    if (match) { 
        const object = match[1];
        const objectCamelCase = convertToCamelCase(object);
        console.log(`[Webview] Extracted object: "${object}", CamelCase: "${objectCamelCase}"`);
        return object; 
    }
    
    return "";
}

// Make best guess for page mappings
function makeBestGuess() {
    console.log("[Webview] Making best guess for page mappings");
    
    // Send request to extension to get model data and generate page mappings
    vscode.postMessage({
        command: 'generateBestGuessPageMappings',
        data: {
            stories: allItems
        }
    });
}

// Apply best guess page mappings to the UI
function applyBestGuessPageMappings(mappings) {
    console.log("[Webview] Applying best guess page mappings:", mappings);
    
    mappings.forEach(mapping => {
        // Find the item in our data
        const item = allItems.find(i => i.storyNumber === mapping.storyNumber);
        if (item && mapping.suggestedPages && mapping.suggestedPages.length > 0) {
            // Get the current ignore pages list for this story
            const ignorePages = Array.isArray(item.ignorePages) ? item.ignorePages : [];
            const ignorePagesLowerCase = ignorePages.map(page => page.toLowerCase().trim());
            
            // Filter out suggested pages that are already in the ignore list
            const filteredSuggestions = mapping.suggestedPages.filter(suggestedPage => {
                const isIgnored = ignorePagesLowerCase.includes(suggestedPage.toLowerCase().trim());
                if (isIgnored) {
                    console.log(`[Webview] Skipping suggested page "${suggestedPage}" for story ${item.storyNumber} - already in ignore list`);
                }
                return !isIgnored;
            });
            
            console.log(`[Webview] Story ${item.storyNumber}: Original suggestions: ${mapping.suggestedPages.length}, After filtering: ${filteredSuggestions.length}`);
            
            // Update the item's page mapping if it's currently empty and we have filtered suggestions
            if ((!Array.isArray(item.pageMapping) || item.pageMapping.length === 0) && filteredSuggestions.length > 0) {
                item.pageMapping = filteredSuggestions;
                
                // Save the change
                vscode.postMessage({
                    command: 'savePageMappingChange',
                    data: {
                        storyId: item.storyId,
                        storyNumber: item.storyNumber,
                        pageMapping: item.pageMapping,
                        ignorePages: item.ignorePages || [],
                        mappingFilePath: item.mappingFilePath
                    }
                });
            }
        }
    });
    
    // Re-render the table to show the updates
    renderTable();
    
    const appliedCount = mappings.filter(m => {
        const item = allItems.find(i => i.storyNumber === m.storyNumber);
        if (!item || !m.suggestedPages || m.suggestedPages.length === 0) {
            return false;
        }
        
        // Check if any suggestions would actually be applied (not ignored)
        const ignorePages = Array.isArray(item.ignorePages) ? item.ignorePages : [];
        const ignorePagesLowerCase = ignorePages.map(page => page.toLowerCase().trim());
        const filteredSuggestions = m.suggestedPages.filter(suggestedPage => 
            !ignorePagesLowerCase.includes(suggestedPage.toLowerCase().trim())
        );
        
        return filteredSuggestions.length > 0;
    }).length;
    
    console.log(`[Webview] Applied best guess to ${appliedCount} stories`);
    
    // Send message to extension to show notification instead of using alert
    if (appliedCount > 0) {
        vscode.postMessage({
            command: 'showNotification',
            data: {
                type: 'info',
                message: `Best guess applied to ${appliedCount} stories with page suggestions.`
            }
        });
    } else {
        vscode.postMessage({
            command: 'showNotification',
            data: {
                type: 'warning',
                message: 'No page suggestions could be generated. Please check that your model has pages defined and user stories follow the expected format.'
            }
        });
    }
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

// Page Lookup Modal Variables
let currentLookupStoryId = null;
let currentLookupFieldType = null; // 'pageMapping' or 'ignorePages'
let currentLookupStoryItem = null;
let allDetailedPages = [];
let filteredDetailedPages = [];
let selectedPageNames = new Set();

// Open page lookup modal
function openPageLookupModal(storyId, fieldType, storyItem) {
    console.log("[Webview] Opening page lookup modal for story:", storyId, "field:", fieldType);
    
    currentLookupStoryId = storyId;
    currentLookupFieldType = fieldType;
    currentLookupStoryItem = storyItem;
    
    // Get current values for pre-selection
    const currentValues = fieldType === 'pageMapping' ? storyItem.pageMapping : storyItem.ignorePages;
    selectedPageNames.clear();
    if (Array.isArray(currentValues)) {
        currentValues.forEach(pageName => {
            if (pageName && pageName.trim()) {
                selectedPageNames.add(pageName.trim());
            }
        });
    }
    
    // Request detailed page list
    vscode.postMessage({
        command: 'getDetailedPageList'
    });
    
    // Show modal
    const modal = document.getElementById('pageLookupModal');
    modal.style.display = 'block';
    
    // Focus filter input
    setTimeout(() => {
        const filterInput = document.getElementById('pageFilterInput');
        if (filterInput) {
            filterInput.focus();
        }
    }, 100);
}

// Close page lookup modal
function closePageLookupModal() {
    console.log("[Webview] Closing page lookup modal");
    
    const modal = document.getElementById('pageLookupModal');
    modal.style.display = 'none';
    
    // Clear filter
    const filterInput = document.getElementById('pageFilterInput');
    if (filterInput) {
        filterInput.value = '';
    }
    
    // Reset variables
    currentLookupStoryId = null;
    currentLookupFieldType = null;
    currentLookupStoryItem = null;
    selectedPageNames.clear();
}

// Apply selected pages to the target field
function applySelectedPages() {
    console.log("[Webview] Applying selected pages:", [...selectedPageNames]);
    
    if (!currentLookupStoryId || !currentLookupFieldType || !currentLookupStoryItem) {
        console.error("[Webview] Missing lookup context");
        return;
    }
    
    // Convert Set to Array and sort
    const selectedPagesArray = Array.from(selectedPageNames).sort();
    
    // Update the story item
    if (currentLookupFieldType === 'pageMapping') {
        currentLookupStoryItem.pageMapping = selectedPagesArray;
    } else if (currentLookupFieldType === 'ignorePages') {
        currentLookupStoryItem.ignorePages = selectedPagesArray;
    }
    
    // Save the change
    vscode.postMessage({
        command: 'savePageMappingChange',
        data: {
            storyId: currentLookupStoryId,
            storyNumber: currentLookupStoryItem.storyNumber,
            pageMapping: currentLookupStoryItem.pageMapping || [],
            ignorePages: currentLookupStoryItem.ignorePages || [],
            mappingFilePath: currentLookupStoryItem.mappingFilePath
        }
    });
    
    // Update the UI
    renderTable();
    
    // Close modal
    closePageLookupModal();
}

// Filter page list
function filterPageList() {
    const filterValue = document.getElementById('pageFilterInput').value.toLowerCase();
    console.log("[Webview] Filtering page list with:", filterValue);
    
    if (!filterValue.trim()) {
        filteredDetailedPages = [...allDetailedPages];
    } else {
        filteredDetailedPages = allDetailedPages.filter(page => {
            return page.name.toLowerCase().includes(filterValue) ||
                   page.displayText.toLowerCase().includes(filterValue) ||
                   page.ownerObject.toLowerCase().includes(filterValue) ||
                   page.targetChildObject.toLowerCase().includes(filterValue) ||
                   page.roleRequired.toLowerCase().includes(filterValue) ||
                   page.type.toLowerCase().includes(filterValue);
        });
    }
    
    renderPageList();
}

// Render page list in modal
function renderPageList() {
    console.log("[Webview] Rendering page list:", filteredDetailedPages.length, "pages");
    
    const pageListContent = document.getElementById('pageListContent');
    if (!pageListContent) {
        console.error("[Webview] Page list content element not found");
        return;
    }
    
    pageListContent.innerHTML = '';
    
    if (filteredDetailedPages.length === 0) {
        pageListContent.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground);">No pages found</div>';
        updatePageSelectionInfo();
        return;
    }
    
    filteredDetailedPages.forEach(page => {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-list-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'page-list-item-checkbox';
        checkbox.checked = selectedPageNames.has(page.name);
        checkbox.onchange = () => togglePageSelection(page.name, checkbox.checked);
        
        const label = document.createElement('span');
        label.textContent = page.displayText;
        label.onclick = () => {
            checkbox.checked = !checkbox.checked;
            togglePageSelection(page.name, checkbox.checked);
        };
        
        pageItem.appendChild(checkbox);
        pageItem.appendChild(label);
        pageListContent.appendChild(pageItem);
    });
    
    updatePageSelectionInfo();
}

// Toggle page selection
function togglePageSelection(pageName, isSelected) {
    console.log("[Webview] Toggling page selection:", pageName, isSelected);
    
    if (isSelected) {
        selectedPageNames.add(pageName);
    } else {
        selectedPageNames.delete(pageName);
    }
    
    updatePageSelectionInfo();
    
    // Update checkbox states if needed
    const checkboxes = document.querySelectorAll('.page-list-item-checkbox');
    checkboxes.forEach(checkbox => {
        const pageItem = checkbox.closest('.page-list-item');
        const label = pageItem.querySelector('span');
        if (label) {
            const displayText = label.textContent;
            const page = filteredDetailedPages.find(p => p.displayText === displayText);
            if (page) {
                checkbox.checked = selectedPageNames.has(page.name);
            }
        }
    });
}

// Update page selection info
function updatePageSelectionInfo() {
    const selectionInfo = document.getElementById('pageSelectionInfo');
    if (selectionInfo) {
        const count = selectedPageNames.size;
        selectionInfo.textContent = `${count} page${count === 1 ? '' : 's'} selected`;
    }
}

// Process detailed page list response
function processDetailedPageList(pages) {
    console.log("[Webview] Processing detailed page list:", pages.length, "pages");
    
    allDetailedPages = pages || [];
    filteredDetailedPages = [...allDetailedPages];
    
    // Pre-filter based on story context if available
    if (currentLookupStoryItem && currentLookupStoryItem.storyText) {
        const role = extractRoleFromUserStory(currentLookupStoryItem.storyText);
        const object = extractObjectFromUserStory(currentLookupStoryItem.storyText);
        
        if (role || object) {
            console.log("[Webview] Pre-filtering pages by role:", role, "object:", object);
            
            filteredDetailedPages = allDetailedPages.filter(page => {
                let matches = true;
                
                if (role && page.roleRequired && page.roleRequired !== 'N/A') {
                    // Check if role matches (case insensitive)
                    matches = matches && page.roleRequired.toLowerCase().includes(role.toLowerCase());
                }
                
                if (object && matches) {
                    // Check if object matches owner or target (case insensitive)
                    const objectLower = object.toLowerCase();
                    const ownerMatches = page.ownerObject.toLowerCase().includes(objectLower);
                    const targetMatches = page.targetChildObject.toLowerCase().includes(objectLower);
                    matches = matches && (ownerMatches || targetMatches);
                }
                
                return matches;
            });
        }
    }
    
    renderPageList();
}

// Global modal click handler to close on backdrop click
window.onclick = function(event) {
    const modal = document.getElementById('pageLookupModal');
    if (event.target === modal) {
        closePageLookupModal();
    }
};

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
            
        case 'bestGuessPageMappingsReady':
            console.log('Best guess page mappings received');
            if (message.success !== false) {
                applyBestGuessPageMappings(message.mappings || []);
            } else {
                console.error('Error generating best guess:', message.error);
                alert('Error generating best guess: ' + (message.error || 'Unknown error'));
            }
            break;
            
        case 'detailedPageListReady':
            console.log('Detailed page list received');
            if (message.success !== false) {
                processDetailedPageList(message.pages || []);
            } else {
                console.error('Error getting detailed page list:', message.error);
                alert('Error getting page list: ' + (message.error || 'Unknown error'));
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
        // Apply same styling as refresh button
        exportButton.style.background = "none";
        exportButton.style.border = "none";
        exportButton.style.color = "var(--vscode-editor-foreground)";
        exportButton.style.padding = "4px 8px";
        exportButton.style.cursor = "pointer";
        exportButton.style.display = "flex";
        exportButton.style.alignItems = "center";
        exportButton.style.borderRadius = "4px";
        exportButton.style.transition = "background 0.15s";
        // Add hover effect
        exportButton.addEventListener("mouseenter", function() {
            exportButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        exportButton.addEventListener("mouseleave", function() {
            exportButton.style.background = "none";
        });
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
        // Apply same styling as refresh button
        validateButton.style.background = "none";
        validateButton.style.border = "none";
        validateButton.style.color = "var(--vscode-editor-foreground)";
        validateButton.style.padding = "4px 8px";
        validateButton.style.cursor = "pointer";
        validateButton.style.display = "flex";
        validateButton.style.alignItems = "center";
        validateButton.style.borderRadius = "4px";
        validateButton.style.transition = "background 0.15s";
        // Add hover effect
        validateButton.addEventListener("mouseenter", function() {
            validateButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        validateButton.addEventListener("mouseleave", function() {
            validateButton.style.background = "none";
        });
    }
    
    // Setup best guess button
    const bestGuessButton = document.getElementById('bestGuessButton');
    if (bestGuessButton) {
        bestGuessButton.addEventListener('click', makeBestGuess);
        // Apply same styling as refresh button
        bestGuessButton.style.background = "none";
        bestGuessButton.style.border = "none";
        bestGuessButton.style.color = "var(--vscode-editor-foreground)";
        bestGuessButton.style.padding = "4px 8px";
        bestGuessButton.style.cursor = "pointer";
        bestGuessButton.style.display = "flex";
        bestGuessButton.style.alignItems = "center";
        bestGuessButton.style.borderRadius = "4px";
        bestGuessButton.style.transition = "background 0.15s";
        // Add hover effect
        bestGuessButton.addEventListener("mouseenter", function() {
            bestGuessButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        bestGuessButton.addEventListener("mouseleave", function() {
            bestGuessButton.style.background = "none";
        });
    }
    
    // Notify extension that webview is ready
    vscode.postMessage({
        command: 'UserStoriesPageMappingWebviewReady'
    });
});
