// generalListView.js
// General list view for VS Code extension
// Shows all general workflow flows with filtering and sorting capabilities
// Created: January 25, 2025

"use strict";

// Global variables
let generalData = { items: [], totalRecords: 0 };
let filterOptions = { objects: [] };
let currentSortColumn = 'displayName';
let currentSortDescending = false;

// Get VS Code API
const vscode = acquireVsCodeApi();

// Define table columns
const columns = [
    { key: "displayName", label: "Name", sortable: true },
    { key: "objectName", label: "Object", sortable: true },
    { key: "description", label: "Description", sortable: true },
    { key: "isActive", label: "Active", sortable: true },
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
    
    const table = document.getElementById("generalListTable");
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
    if (generalData.items && generalData.items.length > 0) {
        generalData.items.forEach(item => {
            const row = document.createElement("tr");
            
            columns.forEach(col => {
                const td = document.createElement("td");
                
                if (col.key === "actions") {
                    // Create action buttons container
                    const actionsContainer = document.createElement("div");
                    actionsContainer.className = "actions-container";
                    
                    // Create details button (for general flow details)
                    const detailsButton = document.createElement("button");
                    detailsButton.className = "action-button";
                    detailsButton.textContent = "Details";
                    detailsButton.title = "View general flow details";
                    detailsButton.onclick = (e) => {
                        e.stopPropagation();
                        viewDetails(item);
                    };
                    
                    actionsContainer.appendChild(detailsButton);
                    td.appendChild(actionsContainer);
                } else if (col.key === "isActive") {
                    // Display boolean as Yes/No
                    td.textContent = item[col.key] ? "Yes" : "No";
                } else {
                    // Display the value directly
                    const value = item[col.key];
                    td.textContent = value || "";
                    
                    // Add title for long text
                    if (value && value.length > 50) {
                        td.title = value;
                    }
                }
                
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
    } else {
        // Show no data message
        const row = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = columns.length;
        td.textContent = "No general flows found";
        td.style.textAlign = "center";
        td.style.fontStyle = "italic";
        td.style.color = "var(--vscode-descriptionForeground)";
        row.appendChild(td);
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    
    // Update record count
    updateRecordInfo();
    
    hideSpinner();
}

// Function to handle sorting
function handleSort(column) {
    if (currentSortColumn === column) {
        currentSortDescending = !currentSortDescending;
    } else {
        currentSortColumn = column;
        currentSortDescending = false;
    }
    
    // Sort the data
    generalData.items.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        // Handle null/undefined values
        if (aVal == null) aVal = "";
        if (bVal == null) bVal = "";
        
        // Convert to strings for comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        
        let result = aVal.localeCompare(bVal);
        return currentSortDescending ? -result : result;
    });
    
    renderTable();
}

// Function to view details
function viewDetails(item) {
    console.log("Viewing details for general flow:", item.name);
    vscode.postMessage({
        command: "viewDetails",
        generalName: item.name,
        objectName: item.objectName
    });
}

// Function to apply filters
function applyFilters() {
    // Get filter values
    const nameFilter = document.getElementById("nameFilter").value.toLowerCase();
    const objectFilter = document.getElementById("objectFilter").value.toLowerCase();
    
    // Filter the data
    const filteredItems = generalData.items.filter(item => {
        const matchesName = !nameFilter || (item.displayName && item.displayName.toLowerCase().includes(nameFilter));
        const matchesObject = !objectFilter || (item.objectName && item.objectName.toLowerCase().includes(objectFilter));
        
        return matchesName && matchesObject;
    });
    
    // Create a temporary data object for rendering
    const tempData = { ...generalData, items: filteredItems };
    const originalData = generalData;
    generalData = tempData;
    
    renderTable();
    
    // Restore original data
    generalData = originalData;
}

// Function to clear filters
function clearFilters() {
    document.getElementById("nameFilter").value = "";
    document.getElementById("objectFilter").value = "";
    renderTable();
}

// Function to toggle filter section
function toggleFilterSection() {
    const filterContent = document.getElementById("filterContent");
    const filterChevron = document.getElementById("filterChevron");
    
    if (filterContent.classList.contains("collapsed")) {
        filterContent.classList.remove("collapsed");
        filterChevron.classList.remove("collapsed");
    } else {
        filterContent.classList.add("collapsed");
        filterChevron.classList.add("collapsed");
    }
}

// Function to update record info
function updateRecordInfo() {
    const recordInfo = document.getElementById("record-info");
    if (recordInfo && generalData.items) {
        const count = generalData.items.length;
        recordInfo.textContent = `${count} general flow${count !== 1 ? 's' : ''}`;
    }
}

// Function to export data as CSV
function exportToCSV() {
    if (!generalData.items || generalData.items.length === 0) {
        vscode.postMessage({
            command: "showMessage",
            message: "No data to export"
        });
        return;
    }
    
    // Create CSV header
    const csvHeaders = columns.filter(col => col.key !== 'actions').map(col => col.label);
    let csvContent = csvHeaders.join(',') + '\n';
    
    // Add data rows
    generalData.items.forEach(item => {
        const row = columns.filter(col => col.key !== 'actions').map(col => {
            let value = item[col.key];
            
            if (col.key === "isActive") {
                value = value ? "Yes" : "No";
            }
            
            // Escape quotes and wrap in quotes if contains comma
            if (value == null) value = "";
            value = String(value);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csvContent += row.join(',') + '\n';
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'general-flows.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Function to refresh data
function refreshData() {
    console.log("Refreshing general flows data...");
    vscode.postMessage({ command: "refresh" });
}

// Event listeners for filter inputs
document.addEventListener("DOMContentLoaded", function() {
    // Add event listeners for filter inputs
    const nameFilter = document.getElementById("nameFilter");
    const objectFilter = document.getElementById("objectFilter");
    
    if (nameFilter) {
        nameFilter.addEventListener("input", applyFilters);
    }
    
    if (objectFilter) {
        objectFilter.addEventListener("input", applyFilters);
    }
    
    // Add event listener for export button
    const exportButton = document.getElementById("exportButton");
    if (exportButton) {
        exportButton.addEventListener("click", exportToCSV);
    }
    
    // Add event listener for refresh button
    const refreshButton = document.getElementById("refreshButton");
    if (refreshButton) {
        refreshButton.addEventListener("click", refreshData);
    }
    
    // Notify VS Code that the webview is ready
    vscode.postMessage({ command: "GeneralListWebviewReady" });
});

// Listen for messages from VS Code
window.addEventListener("message", event => {
    const message = event.data;
    
    switch (message.command) {
        case "loadGeneralFlows":
            console.log("Loading general flows:", message.data);
            generalData.items = message.data || [];
            generalData.totalRecords = generalData.items.length;
            
            // Extract unique object names for filter options
            const uniqueObjects = [...new Set(generalData.items.map(item => item.objectName))].sort();
            filterOptions.objects = uniqueObjects;
            
            renderTable();
            break;
    }
});