// Description: Handles the user stories journey webview display with filtering and sorting.
// Created: August 6, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let userStoriesJourneyData = {
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

// Apply filters to the data (global function for onclick)
function applyFilters() {
    const storyNumberFilter = document.getElementById('filterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('filterStoryText')?.value.toLowerCase() || '';
    const pageFilter = document.getElementById('filterPage')?.value.toLowerCase() || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        const matchesPage = !pageFilter || (item.page || '').toLowerCase().includes(pageFilter);
        
        return matchesStoryNumber && matchesStoryText && matchesPage;
    });
    
    // Update userStoriesJourneyData with filtered results
    userStoriesJourneyData.items = filteredItems;
    userStoriesJourneyData.totalRecords = filteredItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Clear all filters (global function for onclick)
function clearFilters() {
    document.getElementById('filterStoryNumber').value = '';
    document.getElementById('filterStoryText').value = '';
    document.getElementById('filterPage').value = '';
    
    // Reset to show all items
    userStoriesJourneyData.items = allItems.slice();
    userStoriesJourneyData.totalRecords = allItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Refresh data (global function for onclick)
function refresh() {
    showSpinner();
    vscode.postMessage({
        command: 'refresh'
    });
}

// Page usage global functions for onclick

// Helper function to get filtered page data based on current tab
function getFilteredPageDataForTab() {
    // Get the active tab to determine which checkbox to check
    const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab');
    let hideStartPages = false;
    
    if (activeTab === 'page-usage-treemap') {
        hideStartPages = document.getElementById('hideStartPagesTreemap')?.checked || false;
    } else if (activeTab === 'page-usage-distribution') {
        hideStartPages = document.getElementById('hideStartPagesHistogram')?.checked || false;
    } else if (activeTab === 'page-usage-vs-complexity') {
        hideStartPages = document.getElementById('hideStartPagesScatter')?.checked || false;
    }
    
    return (pageUsageData.pages || []).filter(page => {
        const matchesStartPageFilter = !hideStartPages || !page.isStartPage;
        return matchesStartPageFilter;
    });
}

// Helper function to get filtered page data for table (no start page filter on table)
function getFilteredPageData() {
    const nameFilter = document.getElementById('filterPageName')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('filterPageType')?.value || '';
    const complexityFilter = document.getElementById('filterPageComplexity')?.value || '';
    
    return (pageUsageData.pages || []).filter(page => {
        const matchesName = !nameFilter || (page.name || '').toLowerCase().includes(nameFilter);
        const matchesType = !typeFilter || page.type === typeFilter;
        const matchesComplexity = !complexityFilter || page.complexity === complexityFilter;
        
        return matchesName && matchesType && matchesComplexity;
    });
}

function applyPageUsageFilters() {
    // Only re-render table and summary (not the visualizations)
    renderPageUsageTable();
    renderPageUsageSummary();
}

function clearPageUsageFilters() {
    document.getElementById('filterPageName').value = '';
    document.getElementById('filterPageType').value = '';
    document.getElementById('filterPageComplexity').value = '';
    
    // Only re-render table and summary (not the visualizations)
    renderPageUsageTable();
    renderPageUsageSummary();
}

// Functions to handle start page filters for visualization tabs
function applyStartPageFilter() {
    // Get the active tab to determine which visualization to refresh
    const activeTab = document.querySelector('.tab.active')?.getAttribute('data-tab');
    
    if (activeTab === 'page-usage-treemap') {
        renderPageUsageTreemap();
    } else if (activeTab === 'page-usage-distribution') {
        renderPageUsageHistogram();
    } else if (activeTab === 'page-usage-vs-complexity') {
        renderPageUsageVsComplexityScatter();
    }
}

function refreshPageUsageData() {
    renderPageUsageData();
}

// Open page details view (global function for onclick)
function openPageDetails(pageName, pageType) {
    console.log('Opening page details for:', pageName, 'type:', pageType);
    
    // Send command to extension to open the appropriate details view
    vscode.postMessage({
        command: 'openPageDetails',
        pageName: pageName,
        pageType: pageType
    });
}

// Toggle page usage filter section (global function for onclick)
function togglePageUsageFilterSection() {
    const filterContent = document.getElementById('pageUsageFilterContent');
    const chevron = document.getElementById('pageUsageFilterChevron');
    
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

// Export to CSV (global function for onclick)
function exportToCSV() {
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: userStoriesJourneyData.items
        }
    });
}

// Export Page Usage to CSV (global function for onclick)
function exportPageUsageToCSV() {
    vscode.postMessage({
        command: 'exportPageUsageToCSV',
        data: {
            pages: pageUsageData.pages || []
        }
    });
}

// Journey Start Pages Management
let allRoles = [];
let allPages = [];
let journeyStartPages = {};
let selectedPageForRole = null;
let currentSelectedRole = null;

// Open journey start pages modal (global function for onclick)
function openJourneyStartModal() {
    vscode.postMessage({
        command: 'getJourneyStartData'
    });
}

// Close journey start pages modal (global function for onclick)
function closeJourneyStartModal() {
    const modal = document.getElementById('journeyStartModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Open page lookup modal for journey start (global function for onclick)
function openJourneyStartPageLookup(roleName) {
    currentSelectedRole = roleName;
    selectedPageForRole = null;
    
    vscode.postMessage({
        command: 'getPageListForJourneyStart'
    });
}

// Close page lookup modal for journey start (global function for onclick)
function closeJourneyStartPageLookupModal() {
    const modal = document.getElementById('journeyStartPageLookupModal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedPageForRole = null;
    currentSelectedRole = null;
}

// Open progress modal (global function for onclick)
function openProgressModal() {
    const modal = document.getElementById('progressModal');
    if (modal) {
        modal.style.display = 'block';
        resetProgressModal();
    }
}

// Close progress modal (global function for onclick)
function closeProgressModal() {
    const modal = document.getElementById('progressModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Reset progress modal to initial state
function resetProgressModal() {
    updateProgress(0, 'Initializing...');
    document.getElementById('stepLoadingDetail').textContent = 'Initializing';
    document.getElementById('stepPageFlowDetail').textContent = 'Waiting';
    document.getElementById('stepCalculatingDetail').textContent = 'Waiting';
    document.getElementById('stepSavingDetail').textContent = 'Waiting';
    document.getElementById('progressCloseButton').disabled = true;
}

// Update progress bar and percentage
function updateProgress(percentage, detail) {
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = Math.round(percentage) + '%';
    }
}

// Update specific step detail
function updateStepDetail(stepName, detail) {
    const stepElement = document.getElementById('step' + stepName + 'Detail');
    if (stepElement) {
        stepElement.textContent = detail;
    }
}

// Complete progress and enable close button
function completeProgress() {
    updateProgress(100, 'Complete');
    document.getElementById('progressCloseButton').disabled = false;
}

// Open User Journey view for specific page (global function for onclick)
function openUserJourneyForPage(targetPage, pageRole) {
    console.log('Opening User Journey for page:', targetPage, 'with role:', pageRole);
    
    // Send command to extension to open Page Flow with User Journey tab
    vscode.postMessage({
        command: 'openUserJourneyForPage',
        targetPage: targetPage,
        pageRole: pageRole
    });
}

// Open Page Preview view for specific page (global function for onclick)
function openPagePreviewForPage(targetPage, pageRole) {
    console.log('Opening Page Preview for page:', targetPage, 'with role:', pageRole);
    
    // Send command to extension to open Page Preview with specific page selected
    vscode.postMessage({
        command: 'openPagePreviewForPage',
        targetPage: targetPage,
        pageRole: pageRole
    });
}

// Start distance calculation (global function for onclick)
function calculateDistances() {
    openProgressModal();
    
    // Send command to extension to start calculation
    vscode.postMessage({
        command: 'calculatePageDistances'
    });
}

// Filter pages in the journey start page lookup (global function for onkeyup)
function filterJourneyStartPageList() {
    const filterInput = document.getElementById('journeyStartPageFilterInput');
    const filter = filterInput ? filterInput.value.toLowerCase() : '';
    const pageListContent = document.getElementById('journeyStartPageListContent');
    
    if (!pageListContent) {
        return;
    }
    
    const filteredPages = allPages.filter(page => {
        const nameMatch = page.name.toLowerCase().includes(filter);
        const titleMatch = (page.titleText || '').toLowerCase().includes(filter);
        const typeMatch = (page.type || '').toLowerCase().includes(filter);
        return nameMatch || titleMatch || typeMatch;
    });
    
    renderJourneyStartPageList(filteredPages);
}

// Handle keydown events in the journey start page filter (global function for onkeydown)
function handleJourneyStartPageFilterKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        // If a page is already selected, apply it
        if (selectedPageForRole) {
            applySelectedJourneyStartPage();
        } else {
            // If no page is selected but there are filtered results, select the first one
            const pageItems = document.querySelectorAll('#journeyStartPageListContent .page-list-item');
            if (pageItems.length > 0) {
                const firstPageName = pageItems[0].querySelector('.page-list-item-name');
                if (firstPageName) {
                    selectJourneyStartPage(firstPageName.textContent);
                    applySelectedJourneyStartPage();
                }
            }
        }
    }
}

// Render the page list for journey start lookup
function renderJourneyStartPageList(pages) {
    const pageListContent = document.getElementById('journeyStartPageListContent');
    if (!pageListContent) {
        return;
    }
    
    pageListContent.innerHTML = '';
    
    if (!pages || pages.length === 0) {
        pageListContent.innerHTML = '<div class="page-list-item" style="text-align: center; font-style: italic; color: var(--vscode-descriptionForeground);">No pages found</div>';
        return;
    }
    
    pages.forEach(page => {
        const item = document.createElement('div');
        item.className = 'page-list-item';
        item.tabIndex = 0; // Make it focusable
        item.onclick = () => selectJourneyStartPage(page.name);
        item.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectJourneyStartPage(page.name);
                applySelectedJourneyStartPage();
            }
        };
        
        item.innerHTML = `
            <div class="page-list-item-main">
                <div class="page-list-item-name">${page.name}</div>
                <div class="page-list-item-details">${page.type} - ${page.titleText || 'No title'}</div>
            </div>
        `;
        
        pageListContent.appendChild(item);
    });
    
    // Update select button state
    updateJourneyStartSelectButtonState();
}

// Select a page for journey start (global function for onclick)
function selectJourneyStartPage(pageName) {
    selectedPageForRole = pageName;
    
    // Update visual selection
    const pageItems = document.querySelectorAll('#journeyStartPageListContent .page-list-item');
    pageItems.forEach(item => {
        const nameElement = item.querySelector('.page-list-item-name');
        if (nameElement && nameElement.textContent === pageName) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    updateJourneyStartSelectButtonState();
}

// Update the select button state
function updateJourneyStartSelectButtonState() {
    const selectButton = document.querySelector('.page-lookup-select-button');
    if (selectButton) {
        selectButton.disabled = !selectedPageForRole;
    }
}

// Apply selected page to the role (global function for onclick)
function applySelectedJourneyStartPage() {
    if (!selectedPageForRole || !currentSelectedRole) {
        return;
    }
    
    // Update the journey start pages object
    journeyStartPages[currentSelectedRole] = selectedPageForRole;
    
    // Update the input field in the table
    const input = document.querySelector(`input[data-role="${currentSelectedRole}"]`);
    if (input) {
        input.value = selectedPageForRole;
    }
    
    // Close the modal
    closeJourneyStartPageLookupModal();
}

// Save journey start pages (global function for onclick)
function saveJourneyStartPages() {
    // Collect all the values from the input fields
    const inputs = document.querySelectorAll('.journey-start-page-input');
    const journeyStartData = {};
    
    inputs.forEach(input => {
        const roleName = input.getAttribute('data-role');
        const pageName = input.value.trim();
        if (roleName && pageName) {
            journeyStartData[roleName] = pageName;
        }
    });
    
    // Send to extension to save
    vscode.postMessage({
        command: 'saveJourneyStartPages',
        data: {
            journeyStartPages: journeyStartData
        }
    });
}

// Process journey start data response
function processJourneyStartData(data) {
    allRoles = data.roles || [];
    journeyStartPages = data.journeyStartPages || {};
    
    renderJourneyStartTable();
    
    // Show the modal
    const modal = document.getElementById('journeyStartModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Render the journey start table
function renderJourneyStartTable() {
    const tableBody = document.getElementById('journeyStartTableBody');
    if (!tableBody) {
        return;
    }
    
    tableBody.innerHTML = '';
    
    // Filter out 'Unknown' roles and empty role names
    const validRoles = allRoles.filter(role => 
        role && 
        role.trim() !== '' && 
        role.toLowerCase() !== 'unknown'
    );
    
    if (validRoles.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="2" style="text-align: center; font-style: italic; color: var(--vscode-descriptionForeground); padding: 20px;">
                No valid roles found in the model. Please ensure you have a Role data object with lookup items defined.
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    validRoles.forEach(role => {
        const row = document.createElement('tr');
        const currentPage = journeyStartPages[role] || '';
        
        // Create role cell
        const roleCell = document.createElement('td');
        roleCell.textContent = role;
        row.appendChild(roleCell);
        
        // Create page input cell
        const pageCell = document.createElement('td');
        
        // Create a container for input and button
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.gap = '4px';
        inputContainer.style.alignItems = 'center';
        
        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'journey-start-page-input';
        input.value = currentPage;
        input.setAttribute('data-role', role);
        input.placeholder = 'Select a start page...';
        input.style.flex = '1'; // Take up remaining space
        inputContainer.appendChild(input);
        
        // Create search button with same styling as refresh button
        const searchButton = document.createElement('button');
        searchButton.title = 'Search and select page';
        searchButton.innerHTML = '<span class="codicon codicon-search" style="font-size:16px;"></span>';
        searchButton.onclick = () => openJourneyStartPageLookup(role);
        // Apply same styling as refresh button
        searchButton.style.background = "none";
        searchButton.style.border = "none";
        searchButton.style.color = "var(--vscode-editor-foreground)";
        searchButton.style.padding = "4px 8px";
        searchButton.style.cursor = "pointer";
        searchButton.style.display = "flex";
        searchButton.style.alignItems = "center";
        searchButton.style.borderRadius = "4px";
        searchButton.style.transition = "background 0.15s";
        // Add hover effect
        searchButton.addEventListener("mouseenter", function() {
            searchButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        searchButton.addEventListener("mouseleave", function() {
            searchButton.style.background = "none";
        });
        inputContainer.appendChild(searchButton);
        
        pageCell.appendChild(inputContainer);
        
        row.appendChild(pageCell);
        tableBody.appendChild(row);
    });
}

// Process page list response for journey start
function processJourneyStartPageList(pages) {
    allPages = pages || [];
    renderJourneyStartPageList(allPages);
    
    // Show the page lookup modal
    const modal = document.getElementById('journeyStartPageLookupModal');
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Clear filter input
    const filterInput = document.getElementById('journeyStartPageFilterInput');
    if (filterInput) {
        filterInput.value = '';
        // Set focus to the search input for better UX
        setTimeout(() => {
            filterInput.focus();
        }, 100);
    }
}

// Process journey start pages save response
function processJourneyStartPagesSaved(success, message) {
    if (success) {
        closeJourneyStartModal();
        // Show success message (optional)
        console.log('Journey start pages saved successfully');
    } else {
        alert('Error saving journey start pages: ' + (message || 'Unknown error'));
    }
}

// Render the table
function renderTable() {
    const table = document.getElementById("journeyTable");
    const thead = document.getElementById("journeyTableHead");
    const tbody = document.getElementById("journeyTableBody");
    
    if (!table || !thead || !tbody) {
        console.error("Table elements not found");
        return;
    }
    
    // Clear existing content
    thead.innerHTML = "";
    tbody.innerHTML = "";
    
    // Define table columns
    const columns = [
        { key: 'storyNumber', label: 'Story Number', sortable: true, className: 'story-number-column' },
        { key: 'storyText', label: 'Story Text', sortable: true, className: 'story-text-column' },
        { key: 'page', label: 'Page', sortable: true, className: 'page-column' },
        { key: 'journeyPageDistance', label: 'Journey Page Distance', sortable: true, className: 'journey-page-distance-column' }
    ];
    
    // Create table header
    const headerRow = document.createElement("tr");
    columns.forEach(column => {
        const th = document.createElement("th");
        th.className = column.className || '';
        
        if (column.sortable) {
            th.style.cursor = "pointer";
            th.classList.add("sortable");
            th.addEventListener("click", () => {
                // Toggle sort order if clicking the same column
                let sortDescending = false;
                if (userStoriesJourneyData.sortColumn === column.key) {
                    sortDescending = !userStoriesJourneyData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortUserStoriesJourney",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (userStoriesJourneyData.sortColumn === column.key) {
                th.textContent = column.label + (userStoriesJourneyData.sortDescending ? " ▼" : " ▲");
            } else {
                th.textContent = column.label;
            }
        } else {
            th.textContent = column.label;
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Create table body
    if (userStoriesJourneyData.items && userStoriesJourneyData.items.length > 0) {
        userStoriesJourneyData.items.forEach(item => {
            const row = document.createElement("tr");
            const itemKey = item.storyId + '_' + item.page; // Use unique combination
            row.setAttribute("data-item-key", itemKey);
            
            // Story Number
            const storyNumberCell = document.createElement("td");
            storyNumberCell.className = "story-number-column";
            storyNumberCell.textContent = item.storyNumber || '';
            row.appendChild(storyNumberCell);
            
            // Story Text
            const storyTextCell = document.createElement("td");
            storyTextCell.className = "story-text-column";
            storyTextCell.textContent = item.storyText || '';
            row.appendChild(storyTextCell);
            
            // Page
            const pageCell = document.createElement("td");
            pageCell.className = "page-column";
            pageCell.textContent = item.page || '';
            row.appendChild(pageCell);
            
            // Journey Page Distance
            const journeyPageDistanceCell = document.createElement("td");
            journeyPageDistanceCell.className = "journey-page-distance-column";
            
            // Create a container for distance value and button
            const distanceContainer = document.createElement("div");
            distanceContainer.className = "distance-container";
            
            // Add distance value if available
            if (item.journeyPageDistance !== undefined && item.journeyPageDistance !== -1 && item.page) {
                const distanceSpan = document.createElement("span");
                distanceSpan.className = "distance-value";
                distanceSpan.textContent = item.journeyPageDistance.toString();
                distanceContainer.appendChild(distanceSpan);
                
                // Add icon button for showing user journey
                const journeyButton = document.createElement("button");
                journeyButton.title = "Show User Journey Page Flow Diagram";
                journeyButton.innerHTML = '<span class="codicon codicon-map" style="font-size:16px;"></span>';
                journeyButton.onclick = () => openUserJourneyForPage(item.page, item.pageRole);
                // Apply same styling as refresh button
                journeyButton.style.background = "none";
                journeyButton.style.border = "none";
                journeyButton.style.color = "var(--vscode-editor-foreground)";
                journeyButton.style.padding = "4px 8px";
                journeyButton.style.cursor = "pointer";
                journeyButton.style.display = "flex";
                journeyButton.style.alignItems = "center";
                journeyButton.style.borderRadius = "4px";
                journeyButton.style.transition = "background 0.15s";
                // Add hover effect
                journeyButton.addEventListener("mouseenter", function() {
                    journeyButton.style.background = "var(--vscode-list-hoverBackground)";
                });
                journeyButton.addEventListener("mouseleave", function() {
                    journeyButton.style.background = "none";
                });
                distanceContainer.appendChild(journeyButton);
                
                // Add icon button for showing page preview
                const previewButton = document.createElement("button");
                previewButton.title = "Show User Journey Page Preview";
                previewButton.innerHTML = '<span class="codicon codicon-eye" style="font-size:16px;"></span>';
                previewButton.onclick = () => openPagePreviewForPage(item.page, item.pageRole);
                // Apply same styling as refresh button
                previewButton.style.background = "none";
                previewButton.style.border = "none";
                previewButton.style.color = "var(--vscode-editor-foreground)";
                previewButton.style.padding = "4px 8px";
                previewButton.style.cursor = "pointer";
                previewButton.style.display = "flex";
                previewButton.style.alignItems = "center";
                previewButton.style.borderRadius = "4px";
                previewButton.style.transition = "background 0.15s";
                // Add hover effect
                previewButton.addEventListener("mouseenter", function() {
                    previewButton.style.background = "var(--vscode-list-hoverBackground)";
                });
                previewButton.addEventListener("mouseleave", function() {
                    previewButton.style.background = "none";
                });
                distanceContainer.appendChild(previewButton);
            }
            
            journeyPageDistanceCell.appendChild(distanceContainer);
            row.appendChild(journeyPageDistanceCell);
            
            
            tbody.appendChild(row);
        });
    } else {
        // Show empty state
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = columns.length;
        cell.textContent = "No processed user stories found";
        cell.style.textAlign = "center";
        cell.style.padding = "20px";
        cell.style.fontStyle = "italic";
        cell.style.color = "var(--vscode-descriptionForeground)";
        row.appendChild(cell);
        tbody.appendChild(row);
    }
}

// Render record information
function renderRecordInfo() {
    const recordInfo = document.getElementById("record-info");
    if (recordInfo) {
        const totalCount = userStoriesJourneyData.totalRecords || 0;
        const filteredCount = userStoriesJourneyData.items ? userStoriesJourneyData.items.length : 0;
        const selectedCount = selectedItems.size;
        
        let infoText = '';
        if (filteredCount === totalCount) {
            infoText = `${totalCount} story-page mappings`;
        } else {
            infoText = `${filteredCount} of ${totalCount} story-page mappings`;
        }
        
        if (selectedCount > 0) {
            infoText += ` (${selectedCount} selected)`;
        }
        
        recordInfo.textContent = infoText;
    }
}

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'setUserStoriesJourneyData':
            console.log('Received journey data:', message.data);
            hideSpinner();
            
            if (message.data.error) {
                console.error('Error loading journey data:', message.data.error);
                // Show error state
                userStoriesJourneyData = {
                    items: [],
                    totalRecords: 0,
                    sortColumn: 'storyNumber',
                    sortDescending: false
                };
                allItems = [];
            } else {
                userStoriesJourneyData = message.data;
                allItems = message.data.items.slice(); // Create a copy for filtering
                selectedItems.clear(); // Clear selection when new data is loaded
            }
            
            renderTable();
            renderRecordInfo();
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
            
        case 'journeyStartDataReady':
            console.log('Journey start data received');
            if (message.success !== false) {
                processJourneyStartData(message.data || {});
            } else {
                console.error('Error getting journey start data:', message.error);
                alert('Error getting journey start data: ' + (message.error || 'Unknown error'));
            }
            break;
            
        case 'journeyStartPageListReady':
            console.log('Journey start page list received');
            if (message.success !== false) {
                processJourneyStartPageList(message.pages || []);
            } else {
                console.error('Error getting page list:', message.error);
                alert('Error getting page list: ' + (message.error || 'Unknown error'));
            }
            break;
            
        case 'journeyStartPagesSaved':
            console.log('Journey start pages save response');
            processJourneyStartPagesSaved(message.success, message.message);
            break;
            
        case 'distanceCalculationProgress':
            console.log('Distance calculation progress:', message.data);
            const { step, percentage, detail, stepDetails } = message.data;
            
            updateProgress(percentage, detail);
            
            if (stepDetails) {
                if (stepDetails.loading) {
                    updateStepDetail('Loading', stepDetails.loading);
                }
                if (stepDetails.pageFlow) {
                    updateStepDetail('PageFlow', stepDetails.pageFlow);
                }
                if (stepDetails.calculating) {
                    updateStepDetail('Calculating', stepDetails.calculating);
                }
                if (stepDetails.saving) {
                    updateStepDetail('Saving', stepDetails.saving);
                }
            }
            break;
            
        case 'distanceCalculationComplete':
            console.log('Distance calculation complete:', message.data);
            completeProgress();
            
            if (message.data.success) {
                setTimeout(() => {
                    closeProgressModal();
                    // Optionally refresh the view to show updated data
                    refresh();
                }, 2000);
            } else {
                alert('Error calculating distances: ' + (message.data.error || 'Unknown error'));
            }
            break;
            
        case 'pageUsageDataReady':
            console.log('Page usage data received:', message.data);
            if (message.success !== false) {
                handlePageUsageDataResponse(message.data || {});
            } else {
                console.error('Error getting page usage data:', message.error);
                // Show error state in page usage tab
                const tableContainer = document.querySelector('#page-usage-tab .table-container');
                if (tableContainer) {
                    tableContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: var(--vscode-errorForeground);">
                            <div>Error loading page usage data: ${message.error || 'Unknown error'}</div>
                        </div>
                    `;
                }
            }
            break;
            
        default:
            console.log('Unknown message:', message);
            break;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('User Stories Journey webview loaded');
    
    // Initialize tab functionality
    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            });
        });
    }

    // Switch between tabs
    function switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Handle tab-specific logic
        if (tabName === 'user-stories') {
            // Refresh user stories data if needed
            // (current functionality is already in user-stories tab)
        } else if (tabName === 'page-usage') {
            // Page Usage tab selected - render page usage data
            console.log('Page Usage tab selected - rendering page usage data');
            renderPageUsageData();
        } else if (tabName === 'page-usage-treemap') {
            // Page Usage treemap tab selected - render treemap
            console.log('Page Usage treemap tab selected - rendering treemap');
            renderPageUsageTreemap();
        } else if (tabName === 'page-usage-distribution') {
            // Page Usage distribution tab selected - render histogram
            console.log('Page Usage distribution tab selected - rendering histogram');
            renderPageUsageHistogram();
        } else if (tabName === 'page-usage-vs-complexity') {
            // Page Usage vs Complexity tab selected - render scatter plot
            console.log('Page Usage vs Complexity tab selected - rendering scatter plot');
            renderPageUsageVsComplexityScatter();
        } else if (tabName === 'journey-visualization') {
            // Journey visualization tab selected - render treemap
            console.log('Journey visualization tab selected - rendering treemap');
            renderJourneyTreemap();
        } else if (tabName === 'journey-distribution') {
            // Journey distribution tab selected - render histogram
            console.log('Journey distribution tab selected - rendering histogram');
            renderJourneyHistogram();
        }
    }
    
    // Initialize tabs
    initializeTabs();
    
    // Setup filter event listeners for auto-apply
    const filterInputs = ['filterStoryNumber', 'filterStoryText', 'filterPage'];
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', applyFilters);
            element.addEventListener('change', applyFilters);
        }
    });
    
    // Setup page usage filter event listeners for auto-apply
    const pageUsageFilterInputs = ['filterPageName', 'filterPageType', 'filterPageComplexity'];
    pageUsageFilterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', applyPageUsageFilters);
            element.addEventListener('change', applyPageUsageFilters);
        }
    });
    
    // Setup start page filter event listeners for visualization tabs
    const startPageFilterInputs = ['hideStartPagesTreemap', 'hideStartPagesHistogram', 'hideStartPagesScatter'];
    startPageFilterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyStartPageFilter);
        }
    });
    
    // Setup button event listeners
    const exportButton = document.getElementById('exportButton');
    const refreshButton = document.getElementById('refreshButton');
    const defineJourneyStartButton = document.getElementById('defineJourneyStartButton');
    const calculateDistanceButton = document.getElementById('calculateDistanceButton');
    
    // Journey treemap buttons
    const refreshJourneyTreemapButton = document.getElementById('refreshTreemapButton');
    const generateJourneyTreemapPngBtn = document.getElementById('generateTreemapPngBtn');
    
    // Page Usage visualization buttons
    const refreshPageUsageTreemapButton = document.getElementById('refreshPageUsageTreemapButton');
    const generatePageUsageTreemapPngBtn = document.getElementById('generatePageUsageTreemapPngBtn');
    const refreshPageUsageHistogramButton = document.getElementById('refreshPageUsageHistogramButton');
    const generatePageUsageHistogramPngBtn = document.getElementById('generatePageUsageHistogramPngBtn');
    const refreshPageUsageVsComplexityButton = document.getElementById('refreshPageUsageVsComplexityButton');
    const generatePageUsageVsComplexityPngBtn = document.getElementById('generatePageUsageVsComplexityPngBtn');
    
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }
    
    // Page Usage export button
    const exportPageUsageButton = document.getElementById('exportPageUsageButton');
    if (exportPageUsageButton) {
        exportPageUsageButton.addEventListener('click', exportPageUsageToCSV);
    }
    
    if (defineJourneyStartButton) {
        defineJourneyStartButton.addEventListener('click', openJourneyStartModal);
        // Apply same styling as refresh button
        defineJourneyStartButton.style.background = "none";
        defineJourneyStartButton.style.border = "none";
        defineJourneyStartButton.style.color = "var(--vscode-editor-foreground)";
        defineJourneyStartButton.style.padding = "4px 8px";
        defineJourneyStartButton.style.cursor = "pointer";
        defineJourneyStartButton.style.display = "flex";
        defineJourneyStartButton.style.alignItems = "center";
        defineJourneyStartButton.style.borderRadius = "4px";
        defineJourneyStartButton.style.transition = "background 0.15s";
        // Add hover effect
        defineJourneyStartButton.addEventListener("mouseenter", function() {
            defineJourneyStartButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        defineJourneyStartButton.addEventListener("mouseleave", function() {
            defineJourneyStartButton.style.background = "none";
        });
    }
    
    if (calculateDistanceButton) {
        calculateDistanceButton.addEventListener('click', calculateDistances);
        // Apply same styling as refresh button
        calculateDistanceButton.style.background = "none";
        calculateDistanceButton.style.border = "none";
        calculateDistanceButton.style.color = "var(--vscode-editor-foreground)";
        calculateDistanceButton.style.padding = "4px 8px";
        calculateDistanceButton.style.cursor = "pointer";
        calculateDistanceButton.style.display = "flex";
        calculateDistanceButton.style.alignItems = "center";
        calculateDistanceButton.style.borderRadius = "4px";
        calculateDistanceButton.style.transition = "background 0.15s";
        // Add hover effect
        calculateDistanceButton.addEventListener("mouseenter", function() {
            calculateDistanceButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        calculateDistanceButton.addEventListener("mouseleave", function() {
            calculateDistanceButton.style.background = "none";
        });
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', refresh);
    }
    
    // Page Usage refresh button
    const refreshPageUsageButton = document.getElementById('refreshPageUsageButton');
    if (refreshPageUsageButton) {
        refreshPageUsageButton.addEventListener('click', refreshPageUsageData);
    }
    
    // Setup journey treemap button event handlers
    if (refreshJourneyTreemapButton) {
        refreshJourneyTreemapButton.addEventListener('click', function() {
            showSpinner();
            refresh();
        });
    }
    
    if (generateJourneyTreemapPngBtn) {
        generateJourneyTreemapPngBtn.addEventListener('click', function() {
            generateTreemapPNG();
        });
    }
    
    // Setup journey histogram button event handlers
    const refreshJourneyHistogramButton = document.getElementById('refreshHistogramButton');
    const generateJourneyHistogramPngBtn = document.getElementById('generateHistogramPngBtn');
    
    if (refreshJourneyHistogramButton) {
        refreshJourneyHistogramButton.addEventListener('click', function() {
            refresh(); // Use the global refresh function to reload data
        });
    }
    
    if (generateJourneyHistogramPngBtn) {
        generateJourneyHistogramPngBtn.addEventListener('click', function() {
            generateJourneyHistogramPNG(); // Fixed function name to match naming convention
        });
    }
    
    // Setup page usage visualization button event handlers
    if (refreshPageUsageTreemapButton) {
        refreshPageUsageTreemapButton.addEventListener('click', function() {
            refreshPageUsageData();
        });
    }

    if (generatePageUsageTreemapPngBtn) {
        generatePageUsageTreemapPngBtn.addEventListener('click', function() {
            generatePageUsageTreemapPNG();
        });
    }

    if (refreshPageUsageHistogramButton) {
        refreshPageUsageHistogramButton.addEventListener('click', function() {
            refreshPageUsageData();
        });
    }    if (generatePageUsageHistogramPngBtn) {
        generatePageUsageHistogramPngBtn.addEventListener('click', function() {
            generatePageUsageHistogramPNG();
        });
    }

    if (refreshPageUsageVsComplexityButton) {
        refreshPageUsageVsComplexityButton.addEventListener('click', function() {
            refreshPageUsageData();
        });
    }

    if (generatePageUsageVsComplexityPngBtn) {
        generatePageUsageVsComplexityPngBtn.addEventListener('click', function() {
            generatePageUsageVsComplexityPNG();
        });
    }
    
    // Notify extension that webview is ready
    vscode.postMessage({ command: 'UserStoriesJourneyWebviewReady' });
    
    // Add modal close event handlers
    window.onclick = function(event) {
        const journeyStartModal = document.getElementById('journeyStartModal');
        const pageLookupModal = document.getElementById('journeyStartPageLookupModal');
        const progressModal = document.getElementById('progressModal');
        
        if (event.target === journeyStartModal) {
            closeJourneyStartModal();
        }
        
        if (event.target === pageLookupModal) {
            closeJourneyStartPageLookupModal();
        }
        
        if (event.target === progressModal) {
            // Don't close progress modal by clicking outside - it should only close when done
            // closeProgressModal();
        }
    };

    // Journey Treemap rendering function  
    function renderJourneyTreemap() {
        const journeyTreemapVisualization = document.getElementById('journey-treemap-visualization');
        const journeyTreemapLoading = document.getElementById('journey-treemap-loading');
        
        if (!journeyTreemapVisualization || !journeyTreemapLoading || !allItems || allItems.length === 0) {
            console.error('Journey treemap elements not found or no data available');
            return;
        }

        // Hide loading and show visualization first (matching data object size analysis pattern)
        journeyTreemapLoading.classList.add('hidden');
        journeyTreemapVisualization.classList.remove('hidden');

        // Clear previous content
        journeyTreemapVisualization.innerHTML = '';
        journeyTreemapVisualization.classList.add('hidden');

        // Aggregate data by story number using journey page distance
        const storyData = new Map();
        
        allItems.forEach(item => {
            const storyNumber = item.storyNumber || 'Unknown';
            const storyText = item.storyText || '';
            const journeyDistance = item.journeyPageDistance;
            
            if (!storyData.has(storyNumber)) {
                storyData.set(storyNumber, {
                    storyNumber: storyNumber,
                    storyText: storyText,
                    journeyPageDistance: journeyDistance,
                    maxDistance: journeyDistance || 0
                });
            } else {
                // Keep the maximum journey page distance for this story
                const existing = storyData.get(storyNumber);
                if (journeyDistance > existing.maxDistance) {
                    existing.maxDistance = journeyDistance;
                    existing.journeyPageDistance = journeyDistance;
                }
            }
        });

        // Convert to array using journey page distance
        const treemapData = Array.from(storyData.values()).map(story => ({
            storyNumber: story.storyNumber,
            storyText: story.storyText,
            pageCount: story.maxDistance, // Use journey distance as the complexity metric
            value: Math.max(1, story.maxDistance || 1) // Ensure minimum size of 1 for visualization
        }));

        // Filter out stories with no journey distance data or invalid data
        const validTreemapData = treemapData.filter(story => 
            story.storyNumber && story.storyNumber !== 'Unknown' && story.pageCount > 0
        );

        if (validTreemapData.length === 0) {
            // Show empty state
            journeyTreemapLoading.classList.add('hidden');
            journeyTreemapVisualization.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">No journey data available for visualization</div>';
            journeyTreemapVisualization.classList.remove('hidden');
            return;
        }

        // Clear previous content
        journeyTreemapVisualization.innerHTML = '';

        // Set dimensions
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };
        const width = 800 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(journeyTreemapVisualization)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('background', 'var(--vscode-editor-background)');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create root hierarchy with sorting for better grouping (matching data object size analysis)
        const root = d3.hierarchy({ children: validTreemapData })
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value); // Sort by value to group similar sizes together

        // Create treemap layout
        const treemap = d3.treemap()
            .size([width, height])
            .padding(2);

        treemap(root);

        // Color scale matching data object size analysis colors
        const colorScale = d3.scaleOrdinal()
            .domain(['tiny', 'small', 'medium', 'large'])
            .range(['#6c757d', '#28a745', '#f66a0a', '#d73a49']); // Matches data object size colors

        // Create tooltip with explicit styles to match data object size analysis
        const tooltip = d3.select('body').append('div')
            .attr('class', 'treemap-tooltip')
            .style('position', 'absolute')
            .style('background', 'var(--vscode-editorHoverWidget-background)')
            .style('border', '1px solid var(--vscode-editorHoverWidget-border)')
            .style('border-radius', '4px')
            .style('padding', '8px')
            .style('font-size', '12px')
            .style('color', 'var(--vscode-editorHoverWidget-foreground)')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)')
            .style('opacity', 0);

        // Create rectangles with proper cell grouping
        const cell = g.selectAll('.treemap-cell')
            .data(root.leaves())
            .enter()
            .append('g')
            .attr('class', 'treemap-cell')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        // Add rectangles
        cell.append('rect')
            .attr('class', 'treemap-rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => {
                const pageCount = d.data.pageCount;
                // Map journey complexity to match data object size analysis pattern:
                // Higher complexity = higher impact colors
                if (pageCount >= 10) { return colorScale('large'); }       // Very Complex -> Red (like Large Size)
                if (pageCount >= 6) { return colorScale('medium'); }       // Complex -> Orange (like Medium Size)  
                if (pageCount >= 3) { return colorScale('small'); }        // Medium -> Green (like Small Size)
                return colorScale('tiny');                                 // Simple -> Gray (like Tiny Size)
            })
            .on('mouseover', function(event, d) {
                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                const complexityLabel = d.data.pageCount >= 10 ? 'Very Complex' :
                                      d.data.pageCount >= 6 ? 'Complex' :
                                      d.data.pageCount >= 3 ? 'Medium' : 'Simple';
                
                tooltip.html(`
                    <strong>Story #${escapeHtml(d.data.storyNumber)}</strong><br/>
                    <strong>Journey Distance:</strong> ${d.data.pageCount} page${d.data.pageCount === 1 ? '' : 's'}<br/>
                    <strong>Complexity:</strong> ${complexityLabel}<br/>
                    <strong>Story Text:</strong><br/>
                    <em>${escapeHtml(d.data.storyText || 'No description available')}</em>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add text labels (story numbers) with matching sizing logic
        cell.append('text')
            .attr('class', 'treemap-text')
            .attr('x', d => (d.x1 - d.x0) / 2)
            .attr('y', d => (d.y1 - d.y0) / 2)
            .text(d => {
                const width = d.x1 - d.x0;
                const height = d.y1 - d.y0;
                // Only show text if rectangle is large enough (matching data object size analysis)
                if (width > 80 && height > 20) {
                    return `#${d.data.storyNumber}`;
                }
                return '';
            });

    }

    // Generate PNG from journey treemap
    function generateTreemapPNG() {
        try {
            const journeyTreemapVisualization = document.getElementById('journey-treemap-visualization');
            const svg = journeyTreemapVisualization?.querySelector('svg');
            
            if (!svg) {
                vscode.postMessage({ 
                    command: 'showError', 
                    error: 'Treemap not rendered yet. Please switch to the treemap tab first.' 
                });
                return;
            }

            // Get SVG dimensions
            const width = parseInt(svg.getAttribute('width')) || 800;
            const height = parseInt(svg.getAttribute('height')) || 600;
            
            // Serialize SVG
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        vscode.postMessage({ command: 'showError', error: 'Canvas conversion failed' });
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const base64 = reader.result;
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const filename = `user-story-journey-treemap-${timestamp}.png`;
                        vscode.postMessage({
                            command: 'savePngToWorkspace',
                            data: { base64, filename, type: 'treemap' }
                        });
                    };
                    reader.readAsDataURL(blob);
                }, 'image/png');
            };
            img.onerror = function() {
                vscode.postMessage({ command: 'showError', error: 'SVG rendering failed' });
                URL.revokeObjectURL(url);
            };
            img.src = url;
            
        } catch (error) {
            console.error('PNG generation error:', error);
            vscode.postMessage({ 
                command: 'showError', 
                error: 'PNG generation failed: ' + error.message 
            });
        }
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Journey Histogram rendering function
    function renderJourneyHistogram() {
        const journeyHistogramVisualization = document.getElementById('journey-histogram-visualization');
        const journeyHistogramLoading = document.getElementById('journey-histogram-loading');
        
        if (!journeyHistogramVisualization || !journeyHistogramLoading || !allItems || allItems.length === 0) {
            console.error('Journey histogram elements not found or no data available');
            return;
        }

        // Hide loading and show visualization
        journeyHistogramLoading.classList.add('hidden');
        journeyHistogramVisualization.classList.remove('hidden');

        // Clear previous content
        journeyHistogramVisualization.innerHTML = '';

        // Calculate complexity distribution from allItems
        const distribution = calculateJourneyComplexityDistribution(allItems);
        
        // Calculate total stories for percentage calculation
        const totalStories = distribution.simple + distribution.medium + distribution.complex + distribution.veryComplex;
        
        console.log('Journey complexity distribution:', distribution, 'Total stories:', totalStories);
        
        // Setup dimensions
        const margin = {top: 20, right: 20, bottom: 80, left: 60};
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select(journeyHistogramVisualization)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('background', 'var(--vscode-editor-background)');
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Setup data for histogram
        const categories = ['Simple', 'Medium', 'Complex', 'Very Complex'];
        const values = [distribution.simple, distribution.medium, distribution.complex, distribution.veryComplex];
        const colors = ['#6c757d', '#28a745', '#f66a0a', '#d73a49']; // Matching our color scheme
        
        const xScale = d3.scaleBand()
            .domain(categories)
            .range([0, width])
            .padding(0.1);
        
        const yScale = d3.scaleLinear()
            .domain([0, Math.max(...values)])
            .range([height, 0]);
        
        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'histogram-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'var(--vscode-editor-hoverHighlightBackground)')
            .style('border', '1px solid var(--vscode-panel-border)')
            .style('border-radius', '3px')
            .style('padding', '8px')
            .style('font-size', '12px')
            .style('z-index', '1000')
            .style('pointer-events', 'none');
        
        // Add bars
        g.selectAll('.histogram-bar')
            .data(categories)
            .enter()
            .append('rect')
            .attr('class', 'histogram-bar')
            .attr('x', d => xScale(d))
            .attr('y', d => yScale(values[categories.indexOf(d)]))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(values[categories.indexOf(d)]))
            .attr('fill', (d, i) => colors[i])
            .attr('stroke', 'var(--vscode-panel-border)')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                const value = values[categories.indexOf(d)];
                const percentage = totalStories > 0 ? ((value / totalStories) * 100).toFixed(1) : '0.0';
                
                // Map category to full description
                const descriptions = {
                    'Simple': 'Simple (1-2 pages)',
                    'Medium': 'Medium (3-5 pages)', 
                    'Complex': 'Complex (6-10 pages)',
                    'Very Complex': 'Very Complex (10+ pages)'
                };
                
                d3.select(this).attr('opacity', 0.8);
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                tooltip.html(`
                    <strong>${descriptions[d]}</strong><br/>
                    Count: ${value}<br/>
                    Percentage: ${percentage}%
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('fill', 'var(--vscode-foreground)')
            .style('font-size', '12px');

        g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('fill', 'var(--vscode-foreground)')
            .style('font-size', '12px');

        // Add axis labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', 'var(--vscode-foreground)')
            .style('font-size', '14px')
            .text('Number of Stories');

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--vscode-foreground)')
            .style('font-size', '14px')
            .text('Journey Complexity');
    }

    // Calculate journey complexity distribution
    function calculateJourneyComplexityDistribution(items) {
        const distribution = {
            simple: 0,
            medium: 0,
            complex: 0,
            veryComplex: 0
        };

        // Aggregate data by story number using journey page distance (same as treemap logic)
        const storyData = new Map();
        
        items.forEach(item => {
            const storyNumber = item.storyNumber || 'Unknown';
            const journeyDistance = item.journeyPageDistance;
            
            if (!storyData.has(storyNumber)) {
                storyData.set(storyNumber, {
                    storyNumber: storyNumber,
                    maxDistance: journeyDistance || 0
                });
            } else {
                // Keep the maximum journey page distance for this story
                const existing = storyData.get(storyNumber);
                if (journeyDistance > existing.maxDistance) {
                    existing.maxDistance = journeyDistance;
                }
            }
        });

        // Categorize each story by journey page distance
        storyData.forEach(story => {
            const journeyDistance = story.maxDistance;
            if (journeyDistance >= 10) {
                distribution.veryComplex++;
            } else if (journeyDistance >= 6) {
                distribution.complex++;
            } else if (journeyDistance >= 3) {
                distribution.medium++;
            } else {
                distribution.simple++;
            }
        });

        return distribution;
    }

    // Generate PNG from journey histogram
    function generateJourneyHistogramPNG() {
        try {
            const journeyHistogramVisualization = document.getElementById('journey-histogram-visualization');
            if (!journeyHistogramVisualization || journeyHistogramVisualization.classList.contains('hidden')) {
                alert('Load histogram before exporting PNG');
                return;
            }
            
            const svgElement = journeyHistogramVisualization.querySelector('svg');
            if (!svgElement) {
                alert('Histogram SVG not found');
                return;
            }
            
            // Clone and inline styles
            const cloned = svgElement.cloneNode(true);
            
            // Inline rect styles
            cloned.querySelectorAll('rect').forEach(rect => {
                const cs = window.getComputedStyle(rect);
                const fill = rect.getAttribute('fill') || cs.fill || '#4c78a8';
                const stroke = rect.getAttribute('stroke') || cs.stroke || '#333333';
                rect.setAttribute('fill', fill.startsWith('var(') ? '#4c78a8' : fill);
                rect.setAttribute('stroke', stroke.startsWith('var(') ? '#333333' : stroke);
                rect.setAttribute('stroke-width', rect.getAttribute('stroke-width') || '1');
            });
            
            // Inline text styles
            cloned.querySelectorAll('text').forEach(text => {
                const cs = window.getComputedStyle(text);
                const fill = text.getAttribute('fill') || cs.fill || '#333333';
                text.setAttribute('fill', fill.startsWith('var(') ? '#333333' : fill);
            });
            
            // Convert SVG to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(cloned);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            
            // Convert to PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        alert('Canvas conversion failed');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const base64 = reader.result;
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const filename = `journey-complexity-distribution-${timestamp}.png`;
                        vscode.postMessage({
                            command: 'savePngToWorkspace',
                            data: { base64, filename, type: 'journey-histogram' }
                        });
                    };
                    reader.readAsDataURL(blob);
                }, 'image/png');
            };
            
            img.onerror = function() {
                alert('Failed to render SVG to image');
            };
            
            img.src = url;
        } catch (err) {
            alert('Failed to generate PNG: ' + err.message);
        }
    }
});

// Page Usage tab data and functions
let pageUsageData = {
    pages: [],
    totalPages: 0,
    complexityBreakdown: {},
    usageStats: {},
    sortColumn: 'name',
    sortDescending: false
};

// Render page usage data when tab is activated
function renderPageUsageData() {
    // Request page usage data from extension
    showPageUsageSpinner();
    vscode.postMessage({
        command: 'getPageUsageData'
    });
}

// Show page usage spinner
function showPageUsageSpinner() {
    const pageUsageContent = document.getElementById('page-usage-tab');
    if (pageUsageContent) {
        const tableContainer = pageUsageContent.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">
                    <div class="spinner" style="margin: 0 auto 10px auto;"></div>
                    <div>Loading page usage data...</div>
                </div>
            `;
        }
    }
}

// Handle page usage data response from extension
function handlePageUsageDataResponse(data) {
    pageUsageData = data;
    renderPageUsageTable();
    renderPageUsageSummary();
}

// Render page usage summary statistics
function renderPageUsageSummary() {
    const summaryContainer = document.querySelector('#page-usage-tab .page-usage-summary');
    if (!summaryContainer) {
        return;
    }
    
    const filteredPages = getFilteredPageData();
    const totalPages = filteredPages.length;
    const complexityBreakdown = pageUsageData.complexityBreakdown || {};
    const totalUsage = filteredPages.reduce((sum, page) => sum + (page.usageCount || 0), 0);
    
    summaryContainer.innerHTML = `
        <div class="summary-stat">
            <div class="summary-stat-value">${totalPages}</div>
            <div class="summary-stat-label">Total Pages</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${complexityBreakdown.simple || 0}</div>
            <div class="summary-stat-label">Simple</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${complexityBreakdown.moderate || 0}</div>
            <div class="summary-stat-label">Moderate</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${complexityBreakdown.complex || 0}</div>
            <div class="summary-stat-label">Complex</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${complexityBreakdown['very-complex'] || 0}</div>
            <div class="summary-stat-label">Very Complex</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${totalUsage}</div>
            <div class="summary-stat-label">Total Usage</div>
        </div>
    `;
}

// Render page usage table
function renderPageUsageTable() {
    const tableContainer = document.querySelector('#page-usage-tab .table-container');
    if (!tableContainer) {
        return;
    }
    
    const pages = getFilteredPageData();
    
    if (pages.length === 0) {
        tableContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">
                <div>No page data available</div>
            </div>
        `;
        return;
    }
    
    // Helper function to generate sort indicator
    const getSortIndicator = (column) => {
        if (pageUsageData.sortColumn === column) {
            return pageUsageData.sortDescending ? ' ▼' : ' ▲';
        }
        return '';
    };
    
    // Build table HTML
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th class="page-name-column sortable" data-column="name">
                        Page Name${getSortIndicator('name')}
                    </th>
                    <th class="page-type-column sortable" data-column="type">
                        Type${getSortIndicator('type')}
                    </th>
                    <th class="page-complexity-column sortable" data-column="complexity">
                        Complexity${getSortIndicator('complexity')}
                    </th>
                    <th class="page-total-elements-column sortable" data-column="totalElements">
                        Total Items${getSortIndicator('totalElements')}
                    </th>
                    <th class="page-elements-column">
                        Elements
                    </th>
                    <th class="page-usage-column sortable" data-column="usageCount">
                        Usage${getSortIndicator('usageCount')}
                    </th>
                    <th class="page-actions-column">
                        Actions
                    </th>
                </tr>
            </thead>
            <tbody>
                ${pages.map(page => createPageUsageRow(page)).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHtml;
    
    // Add click handlers for sorting
    tableContainer.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-column');
            sortPageUsageData(column);
        });
    });
    
    // Update record info
    updatePageUsageRecordInfo(pages.length);
}

// Create a table row for page usage data
function createPageUsageRow(page) {
    const pageType = page.type || 'unknown';
    const complexity = page.complexity || 'simple';
    const usageCount = page.usageCount || 0;
    const elements = page.elements || {};
    
    // Determine usage level for styling
    let usageLevel = 'none';
    if (usageCount > 10) {
        usageLevel = 'high';
    } else if (usageCount > 5) {
        usageLevel = 'medium';
    } else if (usageCount > 0) {
        usageLevel = 'low';
    }
    
    // Build elements summary based on page type
    let elementCounts = [];
    if (pageType === 'form') {
        // For forms: objectWorkflowButton, objectWorkflowParam (inputs), objectWorkflowOutputVar
        if (elements.buttons > 0) { elementCounts.push(`<span>${elements.buttons} buttons</span>`); }
        if (elements.inputs > 0) { elementCounts.push(`<span>${elements.inputs} inputs</span>`); }
        if (elements.outputVars > 0) { elementCounts.push(`<span>${elements.outputVars} outputs</span>`); }
    } else if (pageType === 'report') {
        // For reports: reportButton, reportColumn, reportParam
        if (elements.buttons > 0) { elementCounts.push(`<span>${elements.buttons} buttons</span>`); }
        if (elements.columns > 0) { elementCounts.push(`<span>${elements.columns} columns</span>`); }
        if (elements.params > 0) { elementCounts.push(`<span>${elements.params} params</span>`); }
    } else {
        // Fallback for unknown types
        if (elements.buttons > 0) { elementCounts.push(`<span>${elements.buttons} buttons</span>`); }
        if (elements.columns > 0) { elementCounts.push(`<span>${elements.columns} columns</span>`); }
        if (elements.inputs > 0) { elementCounts.push(`<span>${elements.inputs} inputs</span>`); }
        if (elements.filters > 0) { elementCounts.push(`<span>${elements.filters} filters</span>`); }
        if (elements.outputVars > 0) { elementCounts.push(`<span>${elements.outputVars} outputs</span>`); }
        if (elements.params > 0) { elementCounts.push(`<span>${elements.params} params</span>`); }
    }
    
    const elementCountsText = elementCounts.join(', ');
    
    return `
        <tr>
            <td class="page-name-column">
                <div class="page-name-cell">
                    <span class="page-name-text" title="${page.name}">${page.name}</span>
                </div>
            </td>
            <td class="page-type-column">
                <span>${pageType}</span>
            </td>
            <td class="page-complexity-column">
                <span>${complexity.charAt(0).toUpperCase() + complexity.slice(1).replace('-', ' ')}</span>
            </td>
            <td class="page-total-elements-column">
                <span>${page.totalElements || 0}</span>
            </td>
            <td class="page-elements-column">
                <div class="page-elements-summary">
                    ${elementCountsText || 'No elements'}
                </div>
            </td>
            <td class="page-usage-column">
                <span>${usageCount}</span>
            </td>
            <td class="page-actions-column">
                <button class="action-edit-button" title="View Page Details" onclick="openPageDetails('${page.name}', '${pageType}')">
                    <span class="codicon codicon-edit"></span>
                </button>
            </td>
        </tr>
    `;
}

// Sort page usage data
function sortPageUsageData(column) {
    const pages = pageUsageData.pages || [];
    
    // Toggle sort direction if same column, otherwise default to ascending
    if (pageUsageData.sortColumn === column) {
        pageUsageData.sortDescending = !pageUsageData.sortDescending;
    } else {
        pageUsageData.sortColumn = column;
        pageUsageData.sortDescending = false;
    }
    
    pages.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';
        
        // Handle numeric comparison for usage count and total elements
        if (column === 'usageCount' || column === 'totalElements') {
            const aNum = typeof aVal === 'number' ? aVal : 0;
            const bNum = typeof bVal === 'number' ? bVal : 0;
            return pageUsageData.sortDescending ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison for other columns
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
        }
        if (typeof bVal === 'string') {
            bVal = bVal.toLowerCase();
        }
        
        let result = 0;
        if (aVal < bVal) {
            result = -1;
        } else if (aVal > bVal) {
            result = 1;
        }
        
        return pageUsageData.sortDescending ? -result : result;
    });
    
    pageUsageData.pages = pages;
    renderPageUsageTable();
}

// Update page usage record info
function updatePageUsageRecordInfo(count) {
    const recordInfo = document.querySelector('#page-usage-tab .table-footer-right');
    if (recordInfo) {
        recordInfo.innerHTML = `Showing ${count} page${count !== 1 ? 's' : ''}`;
    }
}

// Page Usage Treemap rendering function
function renderPageUsageTreemap() {
    const pageUsageTreemapVisualization = document.getElementById('page-usage-treemap-visualization');
    const pageUsageTreemapLoading = document.getElementById('page-usage-treemap-loading');
    
    const filteredPages = getFilteredPageDataForTab();
    
    if (!pageUsageTreemapVisualization || !pageUsageTreemapLoading || !pageUsageData || filteredPages.length === 0) {
        console.error('Page usage treemap elements not found or no data available');
        return;
    }

    // Hide loading and show visualization
    pageUsageTreemapLoading.classList.add('hidden');
    pageUsageTreemapVisualization.classList.remove('hidden');

    // Clear previous content
    pageUsageTreemapVisualization.innerHTML = '';

    // Prepare treemap data using page usage counts
    const treemapData = filteredPages.map(page => ({
        pageName: page.name,
        pageType: page.type,
        complexity: page.complexity,
        totalElements: page.totalElements,
        usageCount: page.usageCount,
        value: Math.max(1, page.usageCount || 1) // Ensure minimum size of 1 for visualization
    }));

    // Filter out pages with no usage
    const validTreemapData = treemapData.filter(page => 
        page.pageName && page.usageCount > 0
    );

    if (validTreemapData.length === 0) {
        // Show empty state
        pageUsageTreemapLoading.classList.add('hidden');
        pageUsageTreemapVisualization.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">No page usage data available for visualization</div>';
        pageUsageTreemapVisualization.classList.remove('hidden');
        return;
    }

    // Set dimensions
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(pageUsageTreemapVisualization)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'var(--vscode-editor-background)');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create root hierarchy
    const root = d3.hierarchy({ children: validTreemapData })
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    // Create treemap layout
    const treemap = d3.treemap()
        .size([width, height])
        .padding(2);

    treemap(root);

    // Color scale based on page usage count
    const getUsageColor = (usageCount) => {
        if (usageCount >= 1 && usageCount <= 2) {
            return '#6c757d'; // Low usage - gray
        } else if (usageCount >= 3 && usageCount <= 5) {
            return '#28a745'; // Medium usage - green
        } else if (usageCount >= 6 && usageCount <= 10) {
            return '#f66a0a'; // High usage - orange
        } else if (usageCount > 10) {
            return '#d73a49'; // Very high usage - red
        } else {
            return '#6c757d'; // Default - gray
        }
    };

    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'page-usage-treemap-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'var(--vscode-editor-hoverHighlightBackground)')
        .style('border', '1px solid var(--vscode-panel-border)')
        .style('border-radius', '3px')
        .style('padding', '8px')
        .style('font-size', '12px')
        .style('z-index', '1000')
        .style('pointer-events', 'none');

    // Add rectangles
    const leaf = g.selectAll('g')
        .data(root.leaves())
        .enter().append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    leaf.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => getUsageColor(d.data.usageCount))
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`
                <strong>${d.data.pageName}</strong><br/>
                Type: ${d.data.pageType}<br/>
                Complexity: ${d.data.complexity}<br/>
                Usage Count: ${d.data.usageCount}<br/>
                Total Elements: ${d.data.totalElements}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(d) {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Add text labels
    leaf.append('text')
        .attr('x', 4)
        .attr('y', 14)
        .text(d => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            if (width > 80 && height > 30) {
                return d.data.pageName.length > 12 ? d.data.pageName.substring(0, 12) + '...' : d.data.pageName;
            } else if (width > 50 && height > 20) {
                return d.data.pageName.length > 8 ? d.data.pageName.substring(0, 8) + '...' : d.data.pageName;
            }
            return '';
        })
        .attr('font-size', d => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            if (width > 100 && height > 40) {
                return '12px';
            } else if (width > 60 && height > 25) {
                return '10px';
            } else {
                return '8px';
            }
        })
        .attr('fill', 'white')
        .attr('font-weight', 'bold');

    // Add usage count as second line
    leaf.append('text')
        .attr('x', 4)
        .attr('y', 28)
        .text(d => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            if (width > 60 && height > 35) {
                return `${d.data.usageCount} usage${d.data.usageCount !== 1 ? 's' : ''}`;
            }
            return '';
        })
        .attr('font-size', '9px')
        .attr('fill', 'rgba(255, 255, 255, 0.8)');

    console.log(`Page usage treemap rendered with ${validTreemapData.length} pages`);
}

// Page Usage Histogram rendering function
function renderPageUsageHistogram() {
    const pageUsageHistogramVisualization = document.getElementById('page-usage-histogram-visualization');
    const pageUsageHistogramLoading = document.getElementById('page-usage-histogram-loading');
    
    const filteredPages = getFilteredPageDataForTab();
    
    if (!pageUsageHistogramVisualization || !pageUsageHistogramLoading || !pageUsageData || filteredPages.length === 0) {
        console.error('Page usage histogram elements not found or no data available');
        return;
    }

    // Hide loading and show visualization
    pageUsageHistogramLoading.classList.add('hidden');
    pageUsageHistogramVisualization.classList.remove('hidden');

    // Clear previous content
    pageUsageHistogramVisualization.innerHTML = '';

    // Calculate usage distribution
    const distribution = {
        low: 0,      // 1-2 usages
        medium: 0,   // 3-5 usages
        high: 0,     // 6-10 usages
        veryHigh: 0  // 10+ usages
    };

    filteredPages.forEach(page => {
        const usage = page.usageCount || 0;
        if (usage >= 1 && usage <= 2) {
            distribution.low++;
        } else if (usage >= 3 && usage <= 5) {
            distribution.medium++;
        } else if (usage >= 6 && usage <= 10) {
            distribution.high++;
        } else if (usage > 10) {
            distribution.veryHigh++;
        }
    });

    // Calculate total pages for percentage calculation
    const totalPages = distribution.low + distribution.medium + distribution.high + distribution.veryHigh;
    
    console.log('Page usage distribution:', distribution, 'Total pages:', totalPages);
    
    // Setup dimensions
    const margin = {top: 20, right: 20, bottom: 80, left: 60};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(pageUsageHistogramVisualization)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'var(--vscode-editor-background)');
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Setup data for histogram
    const categories = ['Low Usage', 'Medium Usage', 'High Usage', 'Very High Usage'];
    const values = [distribution.low, distribution.medium, distribution.high, distribution.veryHigh];
    const colors = ['#6c757d', '#28a745', '#f66a0a', '#d73a49'];
    
    const xScale = d3.scaleBand()
        .domain(categories)
        .range([0, width])
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .domain([0, Math.max(...values)])
        .range([height, 0]);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'page-usage-histogram-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'var(--vscode-editor-hoverHighlightBackground)')
        .style('border', '1px solid var(--vscode-panel-border)')
        .style('border-radius', '3px')
        .style('padding', '8px')
        .style('font-size', '12px')
        .style('z-index', '1000')
        .style('pointer-events', 'none');
    
    // Add bars
    g.selectAll('.histogram-bar')
        .data(categories)
        .enter()
        .append('rect')
        .attr('class', 'histogram-bar')
        .attr('x', d => xScale(d))
        .attr('y', d => yScale(values[categories.indexOf(d)]))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(values[categories.indexOf(d)]))
        .attr('fill', (d, i) => colors[i])
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            const value = values[categories.indexOf(d)];
            const percentage = totalPages > 0 ? ((value / totalPages) * 100).toFixed(1) : '0.0';
            
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`
                <strong>${d}</strong><br/>
                Pages: ${value}<br/>
                Percentage: ${percentage}%
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(d) {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Add value labels on top of bars
    g.selectAll('.bar-label')
        .data(categories)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(values[categories.indexOf(d)]) - 5)
        .attr('text-anchor', 'middle')
        .text(d => values[categories.indexOf(d)])
        .attr('fill', 'var(--vscode-editor-foreground)')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');
    
    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')
        .attr('fill', 'var(--vscode-editor-foreground)');
    
    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .attr('fill', 'var(--vscode-editor-foreground)');
    
    // Style axis lines
    g.selectAll('.domain, .tick line')
        .attr('stroke', 'var(--vscode-panel-border)');
    
    console.log(`Page usage histogram rendered with distribution:`, distribution);
}

// PNG export functions for page usage visualizations
function generatePageUsageTreemapPNG() {
    const svgElement = document.querySelector('#page-usage-treemap-visualization svg');
    if (!svgElement) {
        console.error('No page usage treemap SVG found for PNG export');
        return;
    }
    
    // Convert SVG to canvas and then to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = (new XMLSerializer()).serializeToString(svgElement);
    const DOMURL = window.URL || window.webkitURL || window;
    
    const img = new Image();
    const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = DOMURL.createObjectURL(svgBlob);
    
    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        
        const pngData = canvas.toDataURL('image/png');
        
        // Send to extension for saving
        vscode.postMessage({
            command: 'savePngToWorkspace',
            data: {
                base64: pngData.split(',')[1], // Remove data:image/png;base64, prefix
                filename: `page-usage-treemap-${new Date().toISOString().split('T')[0]}.png`
            }
        });
    };
    
    img.src = url;
}

function generatePageUsageHistogramPNG() {
    const svgElement = document.querySelector('#page-usage-histogram-visualization svg');
    if (!svgElement) {
        console.error('No page usage histogram SVG found for PNG export');
        return;
    }
    
    // Convert SVG to canvas and then to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = (new XMLSerializer()).serializeToString(svgElement);
    const DOMURL = window.URL || window.webkitURL || window;
    
    const img = new Image();
    const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = DOMURL.createObjectURL(svgBlob);
    
    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        
        const pngData = canvas.toDataURL('image/png');
        
        // Send to extension for saving
        vscode.postMessage({
            command: 'savePngToWorkspace',
            data: {
                base64: pngData.split(',')[1], // Remove data:image/png;base64, prefix
                filename: `page-usage-histogram-${new Date().toISOString().split('T')[0]}.png`
            }
        });
    };
    
    img.src = url;
}

// Page Usage vs Complexity Scatter Plot rendering function
function renderPageUsageVsComplexityScatter() {
    const scatterVisualization = document.getElementById('page-usage-vs-complexity-visualization');
    const scatterLoading = document.getElementById('page-usage-vs-complexity-loading');
    
    const filteredPages = getFilteredPageDataForTab();
    
    if (!scatterVisualization || !scatterLoading || !pageUsageData || filteredPages.length === 0) {
        console.error('Page usage vs complexity elements not found or no data available');
        return;
    }

    // Hide loading and show visualization
    scatterLoading.classList.add('hidden');
    scatterVisualization.classList.remove('hidden');

    // Clear previous content
    scatterVisualization.innerHTML = '';

    // Prepare scatter plot data
    const scatterData = filteredPages.map(page => ({
        pageName: page.name,
        pageType: page.type,
        complexity: page.complexity,
        totalElements: page.totalElements || 0,
        usageCount: page.usageCount || 0,
        x: page.totalElements || 0,  // X-axis: element count (complexity)
        y: page.usageCount || 0      // Y-axis: usage count
    }));

    // Filter out pages with no data
    const validScatterData = scatterData.filter(page => 
        page.pageName && page.totalElements >= 0 && page.usageCount >= 0
    );

    if (validScatterData.length === 0) {
        // Show empty state
        scatterLoading.classList.add('hidden');
        scatterVisualization.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">No data available for scatter plot</div>';
        scatterVisualization.classList.remove('hidden');
        return;
    }

    // Set dimensions
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(scatterVisualization)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'var(--vscode-editor-background)');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xMax = d3.max(validScatterData, d => d.x) || 10;
    const yMax = d3.max(validScatterData, d => d.y) || 10;
    
    const xScale = d3.scaleLinear()
        .domain([0, xMax * 1.1])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, yMax * 1.1])
        .range([height, 0]);

    // Add quadrant lines
    const xMidpoint = xScale(xMax / 2);
    const yMidpoint = yScale(yMax / 2);
    
    // Vertical line (complexity divider)
    g.append('line')
        .attr('x1', xMidpoint)
        .attr('x2', xMidpoint)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5);
    
    // Horizontal line (usage divider)
    g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yMidpoint)
        .attr('y2', yMidpoint)
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5);

    // Color scale based on quadrants
    const getQuadrantColor = (elementCount, usageCount) => {
        const isHighComplexity = elementCount > (xMax / 2);
        const isHighUsage = usageCount > (yMax / 2);
        
        if (isHighUsage && !isHighComplexity) {
            return '#28a745'; // Green - High usage, low complexity (well-designed)
        } else if (isHighUsage && isHighComplexity) {
            return '#dc3545'; // Red - High usage, high complexity (needs attention)
        } else if (!isHighUsage && !isHighComplexity) {
            return '#6f42c1'; // Purple - Low usage, low complexity (simple utility)
        } else {
            return '#fd7e14'; // Orange - Low usage, high complexity (over-engineered)
        }
    };

    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'page-usage-complexity-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'var(--vscode-editor-hoverHighlightBackground)')
        .style('border', '1px solid var(--vscode-panel-border)')
        .style('border-radius', '3px')
        .style('padding', '8px')
        .style('font-size', '12px')
        .style('z-index', '1000')
        .style('pointer-events', 'none');

    // Add dots
    g.selectAll('.scatter-dot')
        .data(validScatterData)
        .enter()
        .append('circle')
        .attr('class', 'scatter-dot')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 6)
        .attr('fill', d => getQuadrantColor(d.totalElements, d.usageCount))
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8)
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`
                <strong>${d.pageName}</strong><br/>
                Type: ${d.pageType}<br/>
                Complexity: ${d.complexity}<br/>
                Element Count: ${d.totalElements}<br/>
                Usage Count: ${d.usageCount}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
                
            d3.select(this)
                .attr('r', 8)
                .attr('opacity', 1);
        })
        .on('mouseout', function(d) {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
                
            d3.select(this)
                .attr('r', 6)
                .attr('opacity', 0.8);
        });

    // Add X axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('fill', 'var(--vscode-editor-foreground)');

    // Add Y axis
    g.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .attr('fill', 'var(--vscode-editor-foreground)');

    // Add X axis label
    g.append('text')
        .attr('transform', `translate(${width / 2}, ${height + 45})`)
        .style('text-anchor', 'middle')
        .attr('fill', 'var(--vscode-editor-foreground)')
        .text('Page Complexity (Element Count)');

    // Add Y axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .attr('fill', 'var(--vscode-editor-foreground)')
        .text('Usage Frequency (Journey Count)');

    // Style axis lines
    g.selectAll('.domain, .tick line')
        .attr('stroke', 'var(--vscode-panel-border)');

    console.log(`Page usage vs complexity scatter plot rendered with ${validScatterData.length} pages`);
}

// PNG export function for scatter plot
function generatePageUsageVsComplexityPNG() {
    const svgElement = document.querySelector('#page-usage-vs-complexity-visualization svg');
    if (!svgElement) {
        console.error('No page usage vs complexity scatter plot SVG found for PNG export');
        return;
    }
    
    // Convert SVG to canvas and then to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = (new XMLSerializer()).serializeToString(svgElement);
    const DOMURL = window.URL || window.webkitURL || window;
    
    const img = new Image();
    const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = DOMURL.createObjectURL(svgBlob);
    
    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        
        const pngData = canvas.toDataURL('image/png');
        
        // Send to extension for saving
        vscode.postMessage({
            command: 'savePngToWorkspace',
            data: {
                base64: pngData.split(',')[1], // Remove data:image/png;base64, prefix
                filename: `page-usage-vs-complexity-${new Date().toISOString().split('T')[0]}.png`
            }
        });
    };
    
    img.src = url;
}

// Export functions for module (following QA view pattern)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showUserStoriesJourneyView,
        getUserStoriesJourneyPanel,
        closeUserStoriesJourneyPanel,
        openJourneyStartModal,
        closeJourneyStartModal,
        openJourneyStartPageLookup,
        closeJourneyStartPageLookupModal,
        saveJourneyStartPages
    };
}
