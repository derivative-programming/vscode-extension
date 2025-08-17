// workflowListView.js
// Workflow list view for VS Code extension
// Shows all DynaFlow workflows with filtering and sorting capabilities
// Created: January 25, 2025

"use strict";

// Global variables
let workflowData = { items: [], totalRecords: 0 };
let filterOptions = { ownerObjects: [] };
let currentSortColumn = 'name';
let currentSortDescending = false;

// Get VS Code API
const vscode = acquireVsCodeApi();

// Define table columns
const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "titleText", label: "Title", sortable: true },
    { key: "ownerObject", label: "Owner Object", sortable: true },
    { key: "workflowType", label: "Type", sortable: true },
    { key: "actions", label: "Actions", sortable: false }
];

// Show/hide spinner functions
function showSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.style.display = "flex";
    }
}

function hideSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.style.display = "none";
    }
}

// Function to render the table
function renderTable() {
    showSpinner();
    
    const table = document.getElementById("workflowListTable");
    if (!table) {
        console.error("Table element not found");
        hideSpinner();
        return;
    }
    
    // Clear existing content
    table.innerHTML = "";
    
    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.label;
        
        if (col.sortable) {
            th.style.cursor = "pointer";
            th.className = "sortable";
            th.onclick = () => handleSort(col.key);
            
            // Add sort indicator if this is the current sort column
            if (currentSortColumn === col.key) {
                const indicator = document.createElement("span");
                indicator.textContent = currentSortDescending ? " ↓" : " ↑";
                indicator.style.marginLeft = "4px";
                th.appendChild(indicator);
            }
        }
        
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement("tbody");
    
    // Create rows for each item
    if (workflowData.items && workflowData.items.length > 0) {
        workflowData.items.forEach(item => {
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
        td.textContent = "No DynaFlow workflows found. These are workflows where isDynaFlow is true.";
        row.appendChild(td);
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    
    // Hide spinner after rendering
    hideSpinner();
}

// Handle sort
function handleSort(columnKey) {
    if (currentSortColumn === columnKey) {
        // Toggle sort direction if same column
        currentSortDescending = !currentSortDescending;
    } else {
        // New column, default to ascending
        currentSortColumn = columnKey;
        currentSortDescending = false;
    }
    
    // Request sorted data from extension
    vscode.postMessage({
        command: "sortWorkflows",
        column: columnKey,
        descending: currentSortDescending
    });
}

// Apply filters
function applyFilters() {
    const nameFilter = document.getElementById("filterName").value.toLowerCase();
    const titleFilter = document.getElementById("filterTitle").value.toLowerCase();
    const ownerObjectFilter = document.getElementById("filterOwnerObject").value;
    
    // Filter the original data
    const filteredItems = workflowData.items.filter(item => {
        const nameMatch = !nameFilter || (item.name && item.name.toLowerCase().includes(nameFilter));
        const titleMatch = !titleFilter || (item.titleText && item.titleText.toLowerCase().includes(titleFilter));
        const ownerMatch = !ownerObjectFilter || item.ownerObject === ownerObjectFilter;
        
        return nameMatch && titleMatch && ownerMatch;
    });
    
    // Update the displayed data
    const originalItems = workflowData.items;
    workflowData.items = filteredItems;
    renderTable();
    renderRecordInfo();
    
    // Restore original data for future filtering
    workflowData.items = originalItems;
}

// Clear all filters
function clearFilters() {
    document.getElementById("filterName").value = "";
    document.getElementById("filterTitle").value = "";
    document.getElementById("filterOwnerObject").value = "";
    
    // Re-render with all data
    renderTable();
    renderRecordInfo();
}

// Toggle filter section
function toggleFilterSection() {
    const content = document.getElementById("filterContent");
    const chevron = document.getElementById("filterChevron");
    
    if (content.classList.contains("collapsed")) {
        content.classList.remove("collapsed");
        chevron.className = "codicon codicon-chevron-down";
    } else {
        content.classList.add("collapsed");
        chevron.className = "codicon codicon-chevron-right";
    }
}

// Render record info
function renderRecordInfo() {
    const recordInfoElement = document.getElementById("record-info");
    if (recordInfoElement) {
        const totalRecords = workflowData.totalRecords || 0;
        if (totalRecords > 0) {
            recordInfoElement.textContent = `${totalRecords} workflow${totalRecords === 1 ? '' : 's'} found`;
        } else {
            recordInfoElement.textContent = "No workflows to display";
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

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("[Webview] WorkflowList DOM loaded");
    
    // Setup refresh button
    const refreshButton = document.getElementById("refreshButton");
    if (refreshButton) {
        refreshButton.innerHTML = '<i class="codicon codicon-refresh"></i> Refresh';
        refreshButton.addEventListener("click", requestRefresh);
    }
    
    // Setup filter event listeners
    setupFilterEventListeners();
    
    // Show initial spinner
    showSpinner();
    
    // Notify extension that webview is ready
    vscode.postMessage({ command: "WorkflowListWebviewReady" });
});

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    
    if (message.command === 'setWorkflowData') {
        console.log("[Webview] Received workflow data:", message.data);
        workflowData = message.data;
        
        // Update current sort info if provided
        if (message.data.sortColumn) {
            currentSortColumn = message.data.sortColumn;
        }
        if (message.data.sortDescending !== undefined) {
            currentSortDescending = message.data.sortDescending;
        }
        
        // Extract unique owner objects for filter dropdown
        const uniqueOwnerObjects = [...new Set(workflowData.items.map(item => item.ownerObject))].sort();
        filterOptions.ownerObjects = uniqueOwnerObjects;
        
        // Populate dropdowns and render table
        populateFilterDropdowns();
        renderTable();
        renderRecordInfo();
        
        // Hide spinner when data is loaded
        hideSpinner();
    }
});