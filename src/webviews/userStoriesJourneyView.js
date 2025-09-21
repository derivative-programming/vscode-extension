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

// Export to CSV (global function for onclick)
function exportToCSV() {
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: userStoriesJourneyData.items
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
        } else if (tabName === 'journey-visualization') {
            // Journey visualization tab selected - render treemap
            console.log('Journey visualization tab selected - rendering treemap');
            renderJourneyTreemap();
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
    
    // Setup button event listeners
    const exportButton = document.getElementById('exportButton');
    const refreshButton = document.getElementById('refreshButton');
    const defineJourneyStartButton = document.getElementById('defineJourneyStartButton');
    const calculateDistanceButton = document.getElementById('calculateDistanceButton');
    
    // Journey treemap buttons
    const refreshJourneyTreemapButton = document.getElementById('refreshJourneyTreemapButton');
    const generateJourneyTreemapPngBtn = document.getElementById('generateJourneyTreemapPngBtn');
    
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
    
    // Setup journey treemap button event handlers
    if (refreshJourneyTreemapButton) {
        refreshJourneyTreemapButton.addEventListener('click', function() {
            renderJourneyTreemap();
        });
    }
    
    if (generateJourneyTreemapPngBtn) {
        generateJourneyTreemapPngBtn.addEventListener('click', function() {
            generateJourneyTreemapPng();
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

        // Aggregate data by story number to get page counts
        const storyData = new Map();
        
        allItems.forEach(item => {
            const storyNumber = item.storyNumber || 'Unknown';
            const storyText = item.storyText || '';
            
            if (!storyData.has(storyNumber)) {
                storyData.set(storyNumber, {
                    storyNumber: storyNumber,
                    storyText: storyText,
                    pages: new Set(),
                    pageCount: 0
                });
            }
            
            // Add page to the story's page set
            if (item.page && item.page.trim() !== '') {
                storyData.get(storyNumber).pages.add(item.page);
            }
        });

        // Convert to array and calculate page counts
        const treemapData = Array.from(storyData.values()).map(story => ({
            storyNumber: story.storyNumber,
            storyText: story.storyText,
            pageCount: story.pages.size,
            value: Math.max(1, story.pages.size) // Ensure minimum size of 1 for visualization
        }));

        // Filter out stories with no pages or invalid data
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
                    <strong>Journey Length:</strong> ${d.data.pageCount} page${d.data.pageCount === 1 ? '' : 's'}<br/>
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
    function generateJourneyTreemapPng() {
        const journeyTreemapVisualization = document.getElementById('journey-treemap-visualization');
        const svg = journeyTreemapVisualization.querySelector('svg');
        
        if (!svg) {
            console.error('No SVG found for PNG generation');
            return;
        }

        // Clone the SVG for processing
        const clonedSvg = svg.cloneNode(true);
        
        // Get dimensions
        const width = parseInt(clonedSvg.getAttribute('width')) || 800;
        const height = parseInt(clonedSvg.getAttribute('height')) || 600;
        
        // Set proper attributes for standalone SVG
        clonedSvg.setAttribute('width', String(width));
        clonedSvg.setAttribute('height', String(height));
        clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        clonedSvg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        
        // Add title and description for accessibility
        const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titleElement.textContent = 'User Story Journey Length Visualization - Treemap';
        clonedSvg.insertBefore(titleElement, clonedSvg.firstChild);
        
        const descElement = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
        descElement.textContent = 'Generated on ' + new Date().toLocaleString() + '. Rectangle size represents journey length (page count). Colors indicate complexity levels.';
        clonedSvg.insertBefore(descElement, titleElement.nextSibling);
        
        // Convert to string
        const svgString = new XMLSerializer().serializeToString(clonedSvg);
        
        // Create canvas for PNG conversion
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        
        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            // Fill white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            // Draw the SVG
            ctx.drawImage(img, 0, 0);
            
            // Convert to PNG and download
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                link.download = `user-story-journey-visualization-${new Date().toISOString().slice(0, 10)}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                
                // Cleanup
                URL.revokeObjectURL(url);
                URL.revokeObjectURL(link.href);
            }, 'image/png');
        };
        
        img.onerror = function() {
            console.error('Failed to load SVG for PNG conversion');
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

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
