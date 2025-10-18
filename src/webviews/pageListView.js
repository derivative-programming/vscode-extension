// Description: Handles the page list webview display with filtering and sorting.
// Created: August 3, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let pageData = {
    items: [],
    totalRecords: 0,
    sortColumn: 'name',
    sortDescending: false
};

// Keep track of all items for filtering
let allItems = [];

// Keep track of current chart type for complexity distribution (bar or pie)
let complexityChartType = 'bar';

// Keep track of unique values for filter dropdowns
let filterOptions = {
    rolesRequired: []
};

// Keep track of selected roles for filtering (Set for efficient lookup)
let selectedRoles = new Set();

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

// Sync filter values across all tabs
function syncFilterValues() {
    // Get values from the pages tab (base filters)
    const baseValues = {
        name: document.getElementById('filterName')?.value || '',
        title: document.getElementById('filterTitle')?.value || '',
        type: document.getElementById('filterType')?.value || '',
        reportType: document.getElementById('filterReportType')?.value || '',
        ownerObject: document.getElementById('filterOwnerObject')?.value || '',
        targetChildObject: document.getElementById('filterTargetChildObject')?.value || ''
    };
    
    // Sync to visualization tab
    const nameViz = document.getElementById('filterNameVisualization');
    const titleViz = document.getElementById('filterTitleVisualization');
    const typeViz = document.getElementById('filterTypeVisualization');
    const reportTypeViz = document.getElementById('filterReportTypeVisualization');
    const ownerObjectViz = document.getElementById('filterOwnerObjectVisualization');
    const targetChildObjectViz = document.getElementById('filterTargetChildObjectVisualization');
    
    if (nameViz) { nameViz.value = baseValues.name; }
    if (titleViz) { titleViz.value = baseValues.title; }
    if (typeViz) { typeViz.value = baseValues.type; }
    if (reportTypeViz) { reportTypeViz.value = baseValues.reportType; }
    if (ownerObjectViz) { ownerObjectViz.value = baseValues.ownerObject; }
    if (targetChildObjectViz) { targetChildObjectViz.value = baseValues.targetChildObject; }
    
    // Sync to distribution tab
    const nameDist = document.getElementById('filterNameDistribution');
    const titleDist = document.getElementById('filterTitleDistribution');
    const typeDist = document.getElementById('filterTypeDistribution');
    const reportTypeDist = document.getElementById('filterReportTypeDistribution');
    const ownerObjectDist = document.getElementById('filterOwnerObjectDistribution');
    const targetChildObjectDist = document.getElementById('filterTargetChildObjectDistribution');
    
    if (nameDist) { nameDist.value = baseValues.name; }
    if (titleDist) { titleDist.value = baseValues.title; }
    if (typeDist) { typeDist.value = baseValues.type; }
    if (reportTypeDist) { reportTypeDist.value = baseValues.reportType; }
    if (ownerObjectDist) { ownerObjectDist.value = baseValues.ownerObject; }
    if (targetChildObjectDist) { targetChildObjectDist.value = baseValues.targetChildObject; }
}

// Switch between tabs
function switchTab(tabName) {
    // Sync filter values before switching
    syncFilterValues();
    
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Apply filters and load visualization data when switching to visualization tab
    if (tabName === 'visualization' && allItems.length > 0) {
        applyFilters(); // This will render treemap with filtered data
    } else if (tabName === 'distribution' && allItems.length > 0) {
        applyFilters(); // This will render histogram with filtered data
    }
}









// Helper function to show spinner
function showSpinner() {
    console.log('[PageList] showSpinner called');
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        console.log('[PageList] Found spinner overlay element, showing it');
        spinnerOverlay.style.display = "flex";
    } else {
        console.log('[PageList] Spinner overlay element not found!');
    }
}

// Helper function to hide spinner
function hideSpinner() {
    console.log('[PageList] hideSpinner called');
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        console.log('[PageList] Found spinner overlay element, hiding it');
        spinnerOverlay.style.display = "none";
    } else {
        console.log('[PageList] Spinner overlay element not found!');
    }
}

// Toggle filter section visibility (global function for onclick)
function toggleFilterSection(event) {
    // Get the clicked filter header element
    const filterHeader = event?.target?.closest?.('.filter-header') || event?.currentTarget || document.querySelector('.filter-header');
    if (!filterHeader) {
        return;
    }
    
    // Find the corresponding filter content and chevron within the same parent
    const filterSection = filterHeader.parentElement;
    const filterContent = filterSection.querySelector('.filter-content');
    const chevron = filterHeader.querySelector('[id^="filterChevron"]');
    
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

// Get filter values based on current active tab
function getActiveFilters() {
    // Determine which tab is active
    const activeTab = document.querySelector('.tab-content.active');
    const tabId = activeTab?.id || 'pages-tab';
    
    let suffix = '';
    if (tabId === 'visualization-tab') {
        suffix = 'Visualization';
    } else if (tabId === 'distribution-tab') {
        suffix = 'Distribution';
    }
    
    return {
        name: document.getElementById('filterName' + suffix)?.value.toLowerCase() || '',
        title: document.getElementById('filterTitle' + suffix)?.value.toLowerCase() || '',
        type: document.getElementById('filterType' + suffix)?.value || '',
        reportType: document.getElementById('filterReportType' + suffix)?.value || '',
        ownerObject: document.getElementById('filterOwnerObject' + suffix)?.value.toLowerCase() || '',
        targetChildObject: document.getElementById('filterTargetChildObject' + suffix)?.value.toLowerCase() || ''
    };
}

// Apply filters to the data (global function for onclick)
function applyFilters() {
    const filters = getActiveFilters();
    
    let filteredItems = allItems.filter(item => {
        const matchesName = !filters.name || (item.name || '').toLowerCase().includes(filters.name);
        const matchesTitle = !filters.title || (item.titleText || '').toLowerCase().includes(filters.title);
        const matchesType = !filters.type || item.type === filters.type;
        const matchesReportType = !filters.reportType || item.reportType === filters.reportType;
        const matchesOwnerObject = !filters.ownerObject || (item.ownerObject || '').toLowerCase().includes(filters.ownerObject);
        const matchesTargetChildObject = !filters.targetChildObject || (item.targetChildObject || '').toLowerCase().includes(filters.targetChildObject);
        
        // Check if item's role is in the selected roles set (if no roles selected, show all)
        const matchesRoleRequired = selectedRoles.size === 0 || selectedRoles.has(item.roleRequired);
        
        return matchesName && matchesTitle && matchesType && matchesReportType && matchesOwnerObject && matchesTargetChildObject && matchesRoleRequired;
    });
    
    // Update pageData with filtered results
    pageData.items = filteredItems;
    pageData.totalRecords = filteredItems.length;
    
    // Determine which view to re-render
    const activeTab = document.querySelector('.tab-content.active');
    const tabId = activeTab?.id || 'pages-tab';
    
    if (tabId === 'pages-tab') {
        // Re-render the table
        renderTable();
        renderRecordInfo();
    } else if (tabId === 'visualization-tab') {
        // Re-render treemap with filtered data
        renderPageTreemap();
    } else if (tabId === 'distribution-tab') {
        // Re-render histogram with filtered data
        renderComplexityDistribution();
    }
}

// Clear all filters (global function for onclick)
function clearFilters() {
    // Clear filters for all tabs
    const suffixes = ['', 'Visualization', 'Distribution'];
    
    suffixes.forEach(suffix => {
        const nameInput = document.getElementById('filterName' + suffix);
        const titleInput = document.getElementById('filterTitle' + suffix);
        const typeSelect = document.getElementById('filterType' + suffix);
        const reportTypeSelect = document.getElementById('filterReportType' + suffix);
        const ownerObjectInput = document.getElementById('filterOwnerObject' + suffix);
        const targetChildObjectInput = document.getElementById('filterTargetChildObject' + suffix);
        
        if (nameInput) {
            nameInput.value = '';
        }
        if (titleInput) {
            titleInput.value = '';
        }
        if (typeSelect) {
            typeSelect.value = '';
        }
        if (reportTypeSelect) {
            reportTypeSelect.value = '';
        }
        if (ownerObjectInput) {
            ownerObjectInput.value = '';
        }
        if (targetChildObjectInput) {
            targetChildObjectInput.value = '';
        }
    });
    
    // Clear role checkboxes and reset selected roles
    selectedRoles.clear();
    const roleCheckboxes = document.querySelectorAll('.role-checkbox-item input[type="checkbox"]');
    roleCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset to show all items
    pageData.items = allItems.slice();
    pageData.totalRecords = allItems.length;
    
    // Determine which view to re-render
    const activeTab = document.querySelector('.tab-content.active');
    const tabId = activeTab?.id || 'pages-tab';
    
    if (tabId === 'pages-tab') {
        // Re-render the table
        renderTable();
        renderRecordInfo();
    } else if (tabId === 'visualization-tab') {
        // Re-render treemap with all data
        renderPageTreemap();
    } else if (tabId === 'distribution-tab') {
        // Re-render histogram with all data
        renderComplexityDistribution();
    }
}

// Extract unique values for filter dropdowns
function extractFilterOptions() {
    const rolesRequired = new Set();
    
    allItems.forEach(item => {
        if (item.roleRequired) {
            rolesRequired.add(item.roleRequired);
        }
    });
    
    filterOptions.rolesRequired = Array.from(rolesRequired).sort();
}

// Populate filter dropdown options
function populateFilterDropdowns() {
    // Reset selected roles (start with all roles selected)
    selectedRoles.clear();
    
    // Populate role required checkboxes for all tabs
    const suffixes = ['', 'Visualization', 'Distribution'];
    
    suffixes.forEach(suffix => {
        const roleRequiredContainer = document.getElementById('filterRoleRequired' + suffix);
        if (roleRequiredContainer) {
            // Clear existing checkboxes
            roleRequiredContainer.innerHTML = '';
            
            filterOptions.rolesRequired.forEach(role => {
                const roleItem = document.createElement('div');
                roleItem.className = 'role-checkbox-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = 'role-' + role + '-' + suffix;
                checkbox.value = role;
                checkbox.checked = true; // Check all by default
                checkbox.addEventListener('change', handleRoleFilterChange);
                
                const label = document.createElement('label');
                label.htmlFor = 'role-' + role + '-' + suffix;
                label.textContent = role;
                
                roleItem.appendChild(checkbox);
                roleItem.appendChild(label);
                roleRequiredContainer.appendChild(roleItem);
            });
        }
    });
    
    // Add all roles to selected roles (all selected by default)
    filterOptions.rolesRequired.forEach(role => {
        selectedRoles.add(role);
    });
}

// Handle role filter checkbox change
function handleRoleFilterChange(event) {
    const checkbox = event.target;
    const role = checkbox.value;
    
    if (checkbox.checked) {
        selectedRoles.add(role);
    } else {
        selectedRoles.delete(role);
    }
    
    // Apply filters with new role selection
    applyFilters();
}

// Render the table
function renderTable() {
    const table = document.getElementById("pageListTable");
    if (!table) {
        console.error("[Webview] Table element not found!");
        return;
    }
    
    console.log("[Webview] Rendering table with", pageData.items.length, "items");
    
    // Clear the table
    table.innerHTML = "";
    
    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    // Define table columns
    const columns = [
        { key: "name", label: "Name", sortable: true },
        { key: "titleText", label: "Title Text", sortable: true },
        { key: "type", label: "Type", sortable: true },
        { key: "reportType", label: "Report Type", sortable: true },
        { key: "ownerObject", label: "Owner Object", sortable: true },
        { key: "targetChildObject", label: "Target Child Object", sortable: true },
        { key: "roleRequired", label: "Role Required", sortable: true },
        { key: "totalElements", label: "Total Items", sortable: true },
        { key: "actions", label: "Actions", sortable: false }
    ];
    
    // Create table header cells
    columns.forEach(column => {
        const th = document.createElement("th");
        
        if (column.sortable) {
            th.style.cursor = "pointer";
            th.addEventListener("click", () => {
                // Toggle sort order if clicking the same column
                let sortDescending = false;
                if (pageData.sortColumn === column.key) {
                    sortDescending = !pageData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortPages",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (pageData.sortColumn === column.key) {
                th.textContent = column.label + (pageData.sortDescending ? " ▼" : " ▲");
            } else {
                th.textContent = column.label;
            }
        } else {
            th.textContent = column.label;
        }
        
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement("tbody");
    
    // Create rows for each item
    if (pageData.items && pageData.items.length > 0) {
        pageData.items.forEach(item => {
            const row = document.createElement("tr");
            
            columns.forEach(col => {
                const td = document.createElement("td");
                
                if (col.key === "actions") {
                    // Create action buttons container
                    const actionsContainer = document.createElement("div");
                    actionsContainer.className = "actions-container";
                    
                    // Create action buttons
                    const previewButton = document.createElement("button");
                    previewButton.className = "preview-button";
                    previewButton.innerHTML = '<i class="codicon codicon-eye"></i>';
                    previewButton.title = "View page preview";
                    previewButton.onclick = function(e) {
                        e.stopPropagation();
                        vscode.postMessage({
                            command: "previewPage",
                            pageName: item.name
                        });
                    };
                    
                    const detailsButton = document.createElement("button");
                    detailsButton.className = "edit-button";
                    detailsButton.innerHTML = '<i class="codicon codicon-edit"></i>';
                    detailsButton.title = "Edit page details";
                    detailsButton.onclick = function(e) {
                        e.stopPropagation();
                        vscode.postMessage({
                            command: "viewDetails",
                            pageName: item.name,
                            pageType: item.type,
                            ownerObject: item.ownerObject
                        });
                    };
                    
                    actionsContainer.appendChild(previewButton);
                    actionsContainer.appendChild(detailsButton);
                    td.appendChild(actionsContainer);
                } else {
                    // For other columns, display the value
                    const value = item[col.key] || "";
                    td.textContent = value;
                    
                    // Add tooltip for longer text
                    if (value.length > 30) {
                        td.title = value;
                    }
                }
                
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
    } else {
        // No items
        const row = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9; // Number of columns (updated for Total Items column)
        td.style.textAlign = "center";
        td.style.padding = "20px";
        td.style.color = "var(--vscode-descriptionForeground)";
        td.textContent = "No pages found. Pages must have isPage='true' property to appear here.";
        row.appendChild(td);
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
}

// Render record info
function renderRecordInfo() {
    const recordInfoElement = document.getElementById("record-info");
    if (recordInfoElement) {
        const totalRecords = pageData.totalRecords || 0;
        if (totalRecords > 0) {
            recordInfoElement.textContent = `${totalRecords} page${totalRecords === 1 ? '' : 's'} found`;
        } else {
            recordInfoElement.textContent = "No pages to display";
        }
    }
}

// Setup filter event listeners
function setupFilterEventListeners() {
    // Add event listeners for filter inputs in all tabs
    const filterInputs = ['filterName', 'filterTitle', 'filterType', 'filterReportType', 'filterOwnerObject', 'filterTargetChildObject'];
    const suffixes = ['', 'Visualization', 'Distribution'];
    
    suffixes.forEach(suffix => {
        filterInputs.forEach(id => {
            const element = document.getElementById(id + suffix);
            if (element) {
                element.addEventListener('input', debounce(applyFilters, 300));
                element.addEventListener('change', applyFilters);
            }
        });
    });
}

// Debounce function to limit filter calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Helper function to request refresh
function requestRefresh() {
    showSpinner();
    vscode.postMessage({ command: 'refresh' });
}

// Export to CSV (global function for onclick)
function exportToCSV() {
    console.log('[PageList] Export to CSV requested');
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: pageData.items
        }
    });
}

// Set up the UI when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("[Webview] DOM Content loaded for Page List");
    
    // Initialize tabs
    initializeTabs();
    
    // Setup refresh button
    const refreshBtn = document.getElementById("refreshButton");
    if (refreshBtn) {
        refreshBtn.innerHTML = '<span class="codicon codicon-refresh" style="font-size:16px;"></span>';
        refreshBtn.title = "Refresh";
        refreshBtn.style.background = "none";
        refreshBtn.style.border = "none";
        refreshBtn.style.color = "var(--vscode-editor-foreground)";
        refreshBtn.style.padding = "4px 8px";
        refreshBtn.style.cursor = "pointer";
        refreshBtn.style.display = "flex";
        refreshBtn.style.alignItems = "center";
        refreshBtn.style.borderRadius = "4px";
        refreshBtn.style.transition = "background 0.15s";

        // Add hover effect
        refreshBtn.addEventListener("mouseenter", function() {
            refreshBtn.style.background = "var(--vscode-toolbar-hoverBackground, #2a2d2e)";
        });
        refreshBtn.addEventListener("mouseleave", function() {
            refreshBtn.style.background = "none";
        });
        
        // Attach refresh button handler
        refreshBtn.onclick = function() {
            requestRefresh();
        };
    }
    
    // Setup export button
    const exportBtn = document.getElementById("exportButton");
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            console.log('[PageList] Export button clicked');
            exportToCSV();
        });
    }
    
    // Setup treemap refresh button
    const refreshTreemapBtn = document.getElementById("refreshPageTreemapButton");
    if (refreshTreemapBtn) {
        console.log('[PageList] Setting up treemap refresh button event listener');
        refreshTreemapBtn.addEventListener('click', () => {
            console.log('[PageList] *** TREEMAP REFRESH BUTTON CLICKED ***');
            console.log('[PageList] allItems.length:', allItems.length);
            console.log('[PageList] About to call showSpinner()');
            // Use the same spinner overlay pattern as the main refresh button
            showSpinner();
            
            // Add a small delay to make the spinner visible, then render
            setTimeout(() => {
                if (allItems.length > 0) {
                    console.log('[PageList] Calling renderPageTreemap() after delay');
                    renderPageTreemap();
                } else {
                    console.log('[PageList] No items, hiding spinner');
                    hideSpinner();
                }
            }, 100); // 100ms delay to make spinner visible
        });
    } else {
        console.log('[PageList] Treemap refresh button not found during setup');
    }
    
    // Setup treemap PNG export button
    const generatePngBtn = document.getElementById("generatePageTreemapPngBtn");
    if (generatePngBtn) {
        console.log('[PageList] Setting up PNG export button event listener');
        generatePngBtn.addEventListener('click', () => {
            console.log('[PageList] *** GENERATE PNG BUTTON CLICKED ***');
            generatePageTreemapPNG();
        });
    } else {
        console.log('[PageList] PNG export button not found during setup');
    }
    
    // Setup complexity chart type toggle buttons
    const complexityChartTypeBarBtn = document.getElementById('complexityChartTypeBar');
    const complexityChartTypePieBtn = document.getElementById('complexityChartTypePie');
    
    if (complexityChartTypeBarBtn) {
        complexityChartTypeBarBtn.addEventListener('click', function() {
            if (complexityChartType === 'bar') {
                return; // Already in bar mode
            }
            
            complexityChartType = 'bar';
            
            // Update button states
            complexityChartTypeBarBtn.classList.add('active');
            complexityChartTypePieBtn.classList.remove('active');
            
            // Re-render the distribution
            renderComplexityDistribution();
        });
    }
    
    if (complexityChartTypePieBtn) {
        complexityChartTypePieBtn.addEventListener('click', function() {
            if (complexityChartType === 'pie') {
                return; // Already in pie mode
            }
            
            complexityChartType = 'pie';
            
            // Update button states
            complexityChartTypePieBtn.classList.add('active');
            complexityChartTypeBarBtn.classList.remove('active');
            
            // Re-render the distribution
            renderComplexityDistribution();
        });
    }
    
    // Setup histogram refresh button
    const refreshHistogramBtn = document.getElementById("refreshPageHistogramButton");
    if (refreshHistogramBtn) {
        console.log('[PageList] Setting up histogram refresh button event listener');
        refreshHistogramBtn.addEventListener('click', () => {
            console.log('[PageList] *** HISTOGRAM REFRESH BUTTON CLICKED ***');
            showSpinner();
            setTimeout(() => {
                if (allItems.length > 0) {
                    renderComplexityDistribution();
                } else {
                    hideSpinner();
                }
            }, 100);
        });
    } else {
        console.log('[PageList] Histogram refresh button not found during setup');
    }
    
    // Setup histogram PNG export button
    const generateHistogramPngBtn = document.getElementById("generatePageHistogramPngBtn");
    if (generateHistogramPngBtn) {
        console.log('[PageList] Setting up histogram PNG export button event listener');
        generateHistogramPngBtn.addEventListener('click', () => {
            console.log('[PageList] *** GENERATE HISTOGRAM PNG BUTTON CLICKED ***');
            generatePageHistogramPNG();
        });
    } else {
        console.log('[PageList] Histogram PNG export button not found during setup');
    }
    
    // Setup filter event listeners
    setupFilterEventListeners();
    
    // Tell the extension we're ready
    vscode.postMessage({ command: 'PageListWebviewReady' });
    
    // Show spinner while loading
    showSpinner();
});

// Event listeners for messages from the extension
window.addEventListener("message", function(event) {
    const message = event.data;
    console.log("[Webview] Received message:", message.command);
    
    if (message.command === "switchToTab") {
        console.log('[PageList] Received switchToTab message:', message.tabName);
        // Find the tab button and switch to it
        const tabButton = document.querySelector(`.tab[data-tab="${message.tabName}"]`);
        if (tabButton) {
            console.log('[PageList] Found tab button, switching to tab:', message.tabName);
            switchTab(message.tabName);
        } else {
            console.warn('[PageList] Tab button not found for:', message.tabName);
        }
    } else if (message.command === "setPageData") {
        console.log("[Webview] Handling setPageData with", message.data?.items?.length || 0, "items");
        const data = message.data || { items: [], totalRecords: 0, sortColumn: 'name', sortDescending: false };
        
        // Store all items for filtering
        allItems = data.items || [];
        
        // Update pageData
        pageData = {
            items: allItems.slice(), // Copy of all items initially
            totalRecords: allItems.length,
            sortColumn: data.sortColumn || 'name',
            sortDescending: data.sortDescending || false
        };
        
        // Extract unique values for filter dropdowns
        extractFilterOptions();
        
        // Populate filter dropdowns
        populateFilterDropdowns();
        
        // Render the table and record info
        renderTable();
        renderRecordInfo();
        

        
        // Hide spinner when data is loaded
        hideSpinner();
    } else if (message.command === 'csvExportReady') {
        console.log('[PageList] CSV export ready');
        if (message.success !== false) {
            // Send CSV content to extension to save to workspace
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
    } else if (message.command === 'pngSaveResult') {
        if (message.success) {
            // Show success message briefly
            console.log('[PageList] PNG saved successfully:', message.filename);
        } else {
            console.error('Error saving PNG:', message.error);
            alert('Error saving PNG: ' + (message.error || 'Unknown error'));
        }
    }
});

// Page treemap visualization functionality
function renderPageTreemap() {
    const treemapVisualization = document.getElementById('page-treemap-visualization');
    const treemapLoading = document.getElementById('page-treemap-loading');
    
    // Use pageData.items (filtered data) instead of allItems
    const itemsToVisualize = pageData.items.length > 0 ? pageData.items : allItems;
    
    if (!treemapVisualization || !treemapLoading || itemsToVisualize.length === 0) {
        setTimeout(() => hideSpinner(), 500);
        return;
    }
    
    // Clear any existing content
    treemapVisualization.innerHTML = '';
    
    // Prepare data for treemap - filter out items with 0 elements
    const treemapData = itemsToVisualize.filter(item => item.totalElements > 0);
    
    if (treemapData.length === 0) {
        treemapLoading.textContent = 'No pages with elements found';
        setTimeout(() => hideSpinner(), 500);
        return;
    }
    
    // Hide loading and show visualization
    treemapLoading.classList.add('hidden');
    treemapVisualization.classList.remove('hidden');
    
    // Set dimensions
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(treemapVisualization)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'var(--vscode-editor-background)');
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Prepare data for treemap
    const root = d3.hierarchy({ children: treemapData })
        .sum(d => d.totalElements)
        .sort((a, b) => b.value - a.value);
    
    // Create treemap
    const treemap = d3.treemap()
        .size([width, height])
        .padding(2);
    
    treemap(root);
    
    // Color scale based on complexity
    const colorScale = d3.scaleOrdinal()
        .domain(['tiny', 'small', 'medium', 'large'])
        .range(['#6c757d', '#28a745', '#f66a0a', '#d73a49']);
    
    // Create tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'treemap-tooltip')
        .style('opacity', 0);
    
    // Draw rectangles
    const cell = g.selectAll('.treemap-cell')
        .data(root.leaves())
        .enter().append('g')
        .attr('class', 'treemap-cell')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);
    
    cell.append('rect')
        .attr('class', 'treemap-rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => {
            const elements = d.data.totalElements;
            if (elements > 20) { return colorScale('large'); }     // High complexity
            if (elements > 10) { return colorScale('medium'); }   // Medium complexity  
            if (elements > 5) { return colorScale('small'); }     // Low complexity
            return colorScale('tiny');                            // Very low complexity
        })
        .on('mouseover', function(event, d) {
            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            
            tooltip.html(`
                <strong>${escapeHtml(d.data.name)}</strong><br/>
                Type: ${escapeHtml(d.data.type)}<br/>
                Total Elements: ${d.data.totalElements}<br/>
                Owner Object: ${escapeHtml(d.data.ownerObject || 'Unknown')}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        })
        .on('click', function(event, d) {
            // Allow clicking to preview page
            vscode.postMessage({
                command: 'previewPage',
                pageName: d.data.name
            });
        });
    
    // Add text labels
    cell.append('text')
        .attr('class', 'treemap-text')
        .attr('x', d => (d.x1 - d.x0) / 2)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .text(d => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            // Only show text if rectangle is large enough
            if (width > 80 && height > 20) {
                const name = d.data.name;
                return name.length > 12 ? name.substring(0, 12) + '...' : name;
            }
            return '';
        });
    
    // Hide spinner after minimum duration to make it visible  
    setTimeout(() => {
        hideSpinner();
    }, 800); // Minimum 800ms spinner duration
}

// Generate PNG from page treemap
function generatePageTreemapPNG() {
    console.log('[PageList] *** GENERATE PNG FUNCTION CALLED ***');
    try {
        const treemapContainer = document.getElementById('page-treemap-visualization');
        console.log('[PageList] Treemap container found:', treemapContainer);
        console.log('[PageList] Container classes:', treemapContainer ? treemapContainer.className : 'N/A');
        console.log('[PageList] Container hidden?', treemapContainer ? treemapContainer.classList.contains('hidden') : 'N/A');
        
        if (!treemapContainer || treemapContainer.classList.contains('hidden')) {
            console.log('[PageList] Container not found or hidden, showing alert');
            alert('Load page complexity visualization before exporting PNG');
            return;
        }
        
        const svgElement = treemapContainer.querySelector('svg');
        console.log('[PageList] SVG element found:', svgElement);
        
        if (!svgElement) {
            console.log('[PageList] SVG not found, showing alert');
            alert('Page treemap SVG not found');
            return;
        }
        
        console.log('[PageList] SVG dimensions:', svgElement.getAttribute('width'), 'x', svgElement.getAttribute('height'));
        
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
            const fill = text.getAttribute('fill') || cs.fill || 'white';
            text.setAttribute('fill', fill.startsWith('var(') ? 'white' : fill);
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
                    const filename = `page-complexity-treemap-${timestamp}.png`;
                    vscode.postMessage({
                        command: 'savePngToWorkspace',
                        data: { base64, filename, type: 'page-treemap' }
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

// Page histogram visualization functionality
function renderPageHistogram() {
    console.log('[PageList] Starting histogram rendering');
    const histogramVisualization = document.getElementById('page-histogram-visualization');
    const histogramLoading = document.getElementById('page-histogram-loading');
    
    // Use pageData.items (filtered data) instead of allItems
    const itemsToVisualize = pageData.items.length > 0 ? pageData.items : allItems;
    
    if (!histogramVisualization || !histogramLoading || itemsToVisualize.length === 0) {
        hideSpinner();
        return;
    }
    
    // Clear any existing content
    histogramVisualization.innerHTML = '';
    
    // Calculate element distribution
    const distribution = calculateElementDistribution(itemsToVisualize);
    console.log('[PageList] Element distribution:', distribution);
    
    // Setup dimensions
    const margin = {top: 20, right: 20, bottom: 80, left: 60};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(histogramVisualization)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'var(--vscode-editor-background)');
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Setup scales
    const categories = ['Very Low Complexity', 'Low Complexity', 'Medium Complexity', 'High Complexity'];
    const values = [distribution.tinyComplexity, distribution.smallComplexity, distribution.mediumComplexity, distribution.largeComplexity];
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
        .attr('class', 'histogram-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'var(--vscode-editorHoverWidget-background)')
        .style('border', '1px solid var(--vscode-editorHoverWidget-border)')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('font-size', '12px')
        .style('color', 'var(--vscode-editorHoverWidget-foreground)')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    
    // Draw bars
    g.selectAll('.histogram-bar')
        .data(categories)
        .enter().append('rect')
        .attr('class', 'histogram-bar')
        .attr('x', d => xScale(d))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(values[categories.indexOf(d)]))
        .attr('height', d => height - yScale(values[categories.indexOf(d)]))
        .attr('fill', (d, i) => colors[i])
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            const value = values[categories.indexOf(d)];
            const percentage = allItems.length > 0 ? ((value / allItems.length) * 100).toFixed(1) : '0.0';
            
            // Map category to full description
            const descriptions = {
                'Very Low Complexity': 'Very Low Complexity (<5 elements)',
                'Low Complexity': 'Low Complexity (5-10 elements)', 
                'Medium Complexity': 'Medium Complexity (10-20 elements)',
                'High Complexity': 'High Complexity (>20 elements)'
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
    
    // Add value labels on bars
    g.selectAll('.histogram-value')
        .data(categories)
        .enter().append('text')
        .attr('class', 'histogram-value')
        .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(values[categories.indexOf(d)]) - 5)
        .text(d => values[categories.indexOf(d)])
        .attr('fill', 'var(--vscode-foreground)')
        .style('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', 'bold');
    
    // Add axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('fill', 'var(--vscode-foreground)')
        .style('text-anchor', 'middle')
        .style('font-size', '11px');
    
    g.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .attr('fill', 'var(--vscode-foreground)');
    
    // Add axis labels
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -height / 2)
        .attr('fill', 'var(--vscode-foreground)')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Number of Pages');
    
    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 60)
        .attr('fill', 'var(--vscode-foreground)')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Element Count Categories');
    
    // Hide loading and show visualization
    histogramLoading.classList.add('hidden');
    histogramVisualization.classList.remove('hidden');
    
    // Hide spinner after rendering
    setTimeout(() => {
        hideSpinner();
    }, 800);
}

// Render page complexity distribution as a pie chart
function renderPageComplexityPieChart() {
    console.log('[PageList] Starting pie chart rendering');
    const histogramVisualization = document.getElementById('page-histogram-visualization');
    const histogramLoading = document.getElementById('page-histogram-loading');
    
    // Use pageData.items (filtered data) instead of allItems
    const itemsToVisualize = pageData.items.length > 0 ? pageData.items : allItems;
    
    if (!histogramVisualization || !histogramLoading || itemsToVisualize.length === 0) {
        hideSpinner();
        return;
    }
    
    // Clear any existing content
    histogramVisualization.innerHTML = '';
    
    // Calculate element distribution
    const distribution = calculateElementDistribution(itemsToVisualize);
    console.log('[PageList] Element distribution:', distribution);
    
    // Prepare data for pie chart
    const pieData = [
        { category: 'Very Low', count: distribution.tinyComplexity, color: '#6c757d', description: 'Very Low Complexity (<5 elements)' },
        { category: 'Low', count: distribution.smallComplexity, color: '#28a745', description: 'Low Complexity (5-10 elements)' },
        { category: 'Medium', count: distribution.mediumComplexity, color: '#f66a0a', description: 'Medium Complexity (10-20 elements)' },
        { category: 'High', count: distribution.largeComplexity, color: '#d73a49', description: 'High Complexity (>20 elements)' }
    ];
    
    // Filter out categories with zero count
    const filteredData = pieData.filter(d => d.count > 0);
    
    if (filteredData.length === 0) {
        histogramVisualization.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground);">No data available</div>';
        hideSpinner();
        return;
    }
    
    // Calculate total for percentages
    const totalPages = filteredData.reduce((sum, d) => sum + d.count, 0);
    
    // Setup dimensions
    const width = 600;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Create SVG
    const svg = d3.select(histogramVisualization)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', 'var(--vscode-editor-background)');
    
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2 - 100},${height / 2})`);
    
    // Create pie layout
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);
    
    // Create arc generator
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'histogram-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'var(--vscode-editorHoverWidget-background)')
        .style('border', '1px solid var(--vscode-editorHoverWidget-border)')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('font-size', '12px')
        .style('color', 'var(--vscode-editorHoverWidget-foreground)')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    
    // Create pie slices
    const slices = g.selectAll('.pie-slice')
        .data(pie(filteredData))
        .enter()
        .append('g')
        .attr('class', 'pie-slice');
    
    // Add paths for slices
    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-width', 2)
        .style('opacity', 1)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 0.9);
            
            const percentage = ((d.data.count / totalPages) * 100).toFixed(1);
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            
            tooltip.html(`
                <strong>${d.data.description}</strong><br/>
                Pages: ${d.data.count}<br/>
                Percentage: ${percentage}%
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 1);
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Add percentage labels on slices (only for slices > 5%)
    slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(d => {
            const percentage = (d.data.count / totalPages) * 100;
            return percentage > 5 ? `${Math.round(percentage)}%` : '';
        });
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 160}, 20)`);
    
    const legendItems = legend.selectAll('.legend-item')
        .data(filteredData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 25})`);
    
    legendItems.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', d => d.color)
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-width', 1);
    
    legendItems.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '0.35em')
        .style('fill', 'var(--vscode-foreground)')
        .style('font-size', '12px')
        .text(d => `${d.category} Complexity`);
    
    legendItems.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '0.35em')
        .attr('dx', '110px')
        .style('fill', 'var(--vscode-descriptionForeground)')
        .style('font-size', '11px')
        .text(d => {
            const percentage = ((d.count / totalPages) * 100).toFixed(1);
            return `(${d.count}, ${percentage}%)`;
        });
    
    // Hide loading and show visualization
    histogramLoading.classList.add('hidden');
    histogramVisualization.classList.remove('hidden');
    
    // Hide spinner after rendering
    setTimeout(() => {
        hideSpinner();
    }, 800);
}

// Unified function to render complexity distribution (bar or pie)
function renderComplexityDistribution() {
    if (complexityChartType === 'pie') {
        renderPageComplexityPieChart();
    } else {
        renderPageHistogram();
    }
}

// Calculate element distribution from data
function calculateElementDistribution(data) {
    console.log('[PageList] Calculating element distribution for', data.length, 'pages');
    const distribution = {
        tinyComplexity: 0,
        smallComplexity: 0,
        mediumComplexity: 0,
        largeComplexity: 0
    };
    
    data.forEach(item => {
        const elementCount = item.totalElements || 0;
        if (elementCount > 20) {          // >20 elements
            distribution.largeComplexity++;
        } else if (elementCount > 10) {   // 10-20 elements
            distribution.mediumComplexity++;
        } else if (elementCount > 5) {    // 5-10 elements
            distribution.smallComplexity++;
        } else {                          // <5 elements
            distribution.tinyComplexity++;
        }
    });
    
    return distribution;
}

// Generate PNG from page histogram
function generatePageHistogramPNG() {
    console.log('[PageList] *** GENERATE HISTOGRAM PNG FUNCTION CALLED ***');
    try {
        const histogramContainer = document.getElementById('page-histogram-visualization');
        console.log('[PageList] Histogram container found:', histogramContainer);
        
        if (!histogramContainer || histogramContainer.classList.contains('hidden')) {
            console.log('[PageList] Container not found or hidden, showing alert');
            alert('Load element distribution visualization before exporting PNG');
            return;
        }
        
        const svgElement = histogramContainer.querySelector('svg');
        console.log('[PageList] SVG element found:', svgElement);
        
        if (!svgElement) {
            console.log('[PageList] SVG not found, showing alert');
            alert('Page histogram SVG not found');
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
                    const filename = `page-element-distribution-${timestamp}.png`;
                    vscode.postMessage({
                        command: 'savePngToWorkspace',
                        data: { base64, filename, type: 'page-histogram' }
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

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


