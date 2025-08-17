// Description: Handles the page init list webview display with filtering and sorting.
// Created: January 25, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let pageInitData = {
    items: [],
    totalRecords: 0,
    sortColumn: 'name',
    sortDescending: false
};

// Keep track of all items for filtering
let allItems = [];

// Keep track of unique values for filter dropdowns
let filterOptions = {
    ownerObjects: []
};

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
    const nameFilter = document.getElementById('filterName')?.value.toLowerCase() || '';
    const titleFilter = document.getElementById('filterTitle')?.value.toLowerCase() || '';
    const ownerObjectFilter = document.getElementById('filterOwnerObject')?.value || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesName = !nameFilter || (item.name || '').toLowerCase().includes(nameFilter);
        const matchesTitle = !titleFilter || (item.titleText || '').toLowerCase().includes(titleFilter);
        const matchesOwnerObject = !ownerObjectFilter || item.ownerObject === ownerObjectFilter;
        
        return matchesName && matchesTitle && matchesOwnerObject;
    });
    
    // Update pageInitData with filtered results
    pageInitData.items = filteredItems;
    pageInitData.totalRecords = filteredItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Clear all filters (global function for onclick)
function clearFilters() {
    document.getElementById('filterName').value = '';
    document.getElementById('filterTitle').value = '';
    document.getElementById('filterOwnerObject').value = '';
    
    // Reset to show all items
    pageInitData.items = allItems.slice();
    pageInitData.totalRecords = allItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Extract unique values for filter dropdowns
function extractFilterOptions() {
    const ownerObjects = new Set();
    
    allItems.forEach(item => {
        if (item.ownerObject) {
            ownerObjects.add(item.ownerObject);
        }
    });
    
    filterOptions.ownerObjects = Array.from(ownerObjects).sort();
}

// Populate filter dropdown options
function populateFilterDropdowns() {
    // Populate owner object dropdown
    const ownerObjectSelect = document.getElementById('filterOwnerObject');
    if (ownerObjectSelect) {
        // Clear existing options except "All Objects"
        ownerObjectSelect.innerHTML = '<option value="">All Objects</option>';
        
        filterOptions.ownerObjects.forEach(obj => {
            const option = document.createElement('option');
            option.value = obj;
            option.textContent = obj;
            ownerObjectSelect.appendChild(option);
        });
    }
}

// Render the table
function renderTable() {
    const table = document.getElementById("pageInitListTable");
    if (!table) {
        console.error("[Webview] Table element not found!");
        return;
    }
    
    console.log("[Webview] Rendering table with", pageInitData.items.length, "items");
    
    // Clear the table
    table.innerHTML = "";
    
    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    // Define table columns
    const columns = [
        { key: "name", label: "Name", sortable: true },
        { key: "titleText", label: "Title Text", sortable: true },
        { key: "workflowType", label: "Workflow Type", sortable: true },
        { key: "ownerObject", label: "Owner Object", sortable: true },
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
                if (pageInitData.sortColumn === column.key) {
                    sortDescending = !pageInitData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortPageInits",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (pageInitData.sortColumn === column.key) {
                th.textContent = column.label + (pageInitData.sortDescending ? " ▼" : " ▲");
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
    if (pageInitData.items && pageInitData.items.length > 0) {
        pageInitData.items.forEach(item => {
            const row = document.createElement("tr");
            
            columns.forEach(col => {
                const td = document.createElement("td");
                
                if (col.key === "actions") {
                    // Create action buttons container
                    const actionsContainer = document.createElement("div");
                    actionsContainer.className = "actions-container";
                    
                    // Create edit button (for workflow details)
                    const detailsButton = document.createElement("button");
                    detailsButton.className = "edit-button";
                    detailsButton.innerHTML = '<i class="codicon codicon-edit"></i>';
                    detailsButton.title = "View workflow details";
                    detailsButton.onclick = function(e) {
                        e.stopPropagation();
                        vscode.postMessage({
                            command: "viewDetails",
                            workflowName: item.name,
                            ownerObject: item.ownerObject
                        });
                    };
                    
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
        td.colSpan = 5; // Number of columns
        td.style.textAlign = "center";
        td.style.padding = "20px";
        td.style.color = "var(--vscode-descriptionForeground)";
        td.textContent = "No page initialization flows found. These are workflows ending with 'initreport' or 'initobjwf'.";
        row.appendChild(td);
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
}

// Render record info
function renderRecordInfo() {
    const recordInfoElement = document.getElementById("record-info");
    if (recordInfoElement) {
        const totalRecords = pageInitData.totalRecords || 0;
        if (totalRecords > 0) {
            recordInfoElement.textContent = `${totalRecords} page init flow${totalRecords === 1 ? '' : 's'} found`;
        } else {
            recordInfoElement.textContent = "No page init flows to display";
        }
    }
}

// Setup filter event listeners
function setupFilterEventListeners() {
    // Add event listeners for filter inputs
    const filterInputs = ['filterName', 'filterTitle', 'filterOwnerObject'];
    
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(applyFilters, 300));
            element.addEventListener('change', applyFilters);
        }
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

// Set up the UI when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("[Webview] DOM Content loaded for Page Init List");
    
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
    
    // Setup filter event listeners
    setupFilterEventListeners();
    
    // Tell the extension we're ready
    vscode.postMessage({ command: 'PageInitListWebviewReady' });
    
    // Show spinner while loading
    showSpinner();
});

// Event listeners for messages from the extension
window.addEventListener("message", function(event) {
    const message = event.data;
    console.log("[Webview] Received message:", message.command);
    
    if (message.command === "setPageInitData") {
        console.log("[Webview] Handling setPageInitData with", message.data?.items?.length || 0, "items");
        const data = message.data || { items: [], totalRecords: 0, sortColumn: 'name', sortDescending: false };
        
        // Store all items for filtering
        allItems = data.items || [];
        
        // Update pageInitData
        pageInitData = {
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
    }
});