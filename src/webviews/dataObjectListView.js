// Description: Data Objects List View JavaScript
// Created: August 10, 2025

// Acquire VS Code API
const vscode = acquireVsCodeApi();

// Global variables
let dataObjectData = {
    items: [],
    totalRecords: 0,
    sortColumn: 'name',
    sortDescending: false
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DataObjectList] DOM content loaded');
    setupEventListeners();
    
    // Notify extension that webview is ready
    console.log('[DataObjectList] Sending DataObjectListWebviewReady message');
    vscode.postMessage({ command: 'DataObjectListWebviewReady' });
});

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.innerHTML = '<span class="codicon codicon-refresh"></span>';
        refreshButton.addEventListener('click', () => {
            console.log('[DataObjectList] Refresh button clicked');
            showSpinner();
            vscode.postMessage({ command: 'refresh' });
        });
    }

    // Export button
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            console.log('[DataObjectList] Export button clicked');
            exportToCSV();
        });
    }

    // Setup filter event listeners
    setupFilterEventListeners();
}

// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    console.log('[DataObjectList] Received message:', message.command);
    
    switch (message.command) {
        case 'setDataObjectData':
            dataObjectData = message.data;
            console.log('[DataObjectList] Received data objects data:', dataObjectData);
            hideSpinner();
            renderTable();
            renderRecordInfo();
            break;
            
        case 'csvExportReady':
            console.log('[DataObjectList] CSV export ready');
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
            break;
    }
});

// Show spinner overlay
function showSpinner() {
    const spinnerOverlay = document.getElementById('spinner-overlay');
    if (spinnerOverlay) {
        spinnerOverlay.style.display = 'flex';
    }
}

// Hide spinner overlay
function hideSpinner() {
    const spinnerOverlay = document.getElementById('spinner-overlay');
    if (spinnerOverlay) {
        spinnerOverlay.style.display = 'none';
    }
}

// Toggle filter section
function toggleFilterSection() {
    const filterContent = document.getElementById('filterContent');
    const filterChevron = document.getElementById('filterChevron');
    
    if (filterContent && filterChevron) {
        if (filterContent.classList.contains('collapsed')) {
            filterContent.classList.remove('collapsed');
            filterChevron.className = 'codicon codicon-chevron-down';
        } else {
            filterContent.classList.add('collapsed');
            filterChevron.className = 'codicon codicon-chevron-right';
        }
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

// Apply filters to the table
function applyFilters() {
    console.log('[DataObjectList] Applying filters');
    const nameFilter = document.getElementById('filterName')?.value.toLowerCase() || '';
    const descriptionFilter = document.getElementById('filterDescription')?.value.toLowerCase() || '';
    const declarationTextFilter = document.getElementById('filterDeclarationText')?.value.toLowerCase() || '';
    const isLookupFilter = document.getElementById('filterIsLookup')?.value || '';
    
    // Filter the data
    const filteredItems = dataObjectData.items.filter(item => {
        const nameMatch = !nameFilter || (item.name || '').toLowerCase().includes(nameFilter);
        const descriptionMatch = !descriptionFilter || (item.description || '').toLowerCase().includes(descriptionFilter);
        const declarationTextMatch = !declarationTextFilter || (item.declarationText || '').toLowerCase().includes(declarationTextFilter);
        
        // Handle isLookup filter
        let isLookupMatch = true;
        if (isLookupFilter && isLookupFilter !== 'all') {
            const itemIsLookup = item.isLookup === true;
            if (isLookupFilter === 'yes') {
                isLookupMatch = itemIsLookup;
            } else if (isLookupFilter === 'no') {
                isLookupMatch = !itemIsLookup;
            }
        }
        
        return nameMatch && descriptionMatch && declarationTextMatch && isLookupMatch;
    });
    
    // Update the table with filtered data
    renderTableWithData(filteredItems);
    
    // Update record info
    const recordInfoElement = document.getElementById("record-info");
    if (recordInfoElement) {
        const totalRecords = filteredItems.length;
        if (totalRecords > 0) {
            recordInfoElement.textContent = `${totalRecords} data object${totalRecords === 1 ? '' : 's'} found`;
        } else {
            recordInfoElement.textContent = "No data objects to display";
        }
    }
}

// Clear all filters
function clearFilters() {
    console.log('[DataObjectList] Clearing all filters');
    const filterInputs = ['filterName', 'filterDescription', 'filterDeclarationText'];
    
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    // Clear the Is Lookup filter
    const isLookupFilter = document.getElementById('filterIsLookup');
    if (isLookupFilter) {
        isLookupFilter.value = 'all';
    }
    
    // Re-render table with original data
    renderTable();
    renderRecordInfo();
}

// Export to CSV (global function for onclick)
function exportToCSV() {
    console.log('[DataObjectList] Export to CSV requested');
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: dataObjectData.items
        }
    });
}

// Render the table
function renderTable() {
    renderTableWithData(dataObjectData.items);
}

// Render the table with specific data
function renderTableWithData(items) {
    const table = document.getElementById('dataObjectListTable');
    if (!table) {
        console.error('[DataObjectList] Table element not found');
        return;
    }
    
    // Clear existing content
    table.innerHTML = '';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const columns = [
        { key: "name", label: "Name", sortable: true },
        { key: "description", label: "Description", sortable: true },
        { key: "declarationText", label: "Declaration Text", sortable: true },
        { key: "isLookup", label: "Is Lookup", sortable: true },
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
                if (dataObjectData.sortColumn === column.key) {
                    sortDescending = !dataObjectData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortDataObjects",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (dataObjectData.sortColumn === column.key) {
                th.textContent = column.label + (dataObjectData.sortDescending ? " ▼" : " ▲");
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
    const tbody = document.createElement('tbody');
    
    if (items && items.length > 0) {
        items.forEach(item => {
            const row = document.createElement('tr');
            
            // Name column
            const nameCell = document.createElement('td');
            nameCell.textContent = item.name || '';
            if (item.isIgnored) {
                nameCell.style.opacity = '0.6';
                nameCell.style.textDecoration = 'line-through';
            }
            row.appendChild(nameCell);
            
            // Description column
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = item.description || '';
            if (item.isIgnored) {
                descriptionCell.style.opacity = '0.6';
            }
            row.appendChild(descriptionCell);
            
            // Declaration Text column
            const declarationTextCell = document.createElement('td');
            declarationTextCell.textContent = item.declarationText || '';
            if (item.isIgnored) {
                declarationTextCell.style.opacity = '0.6';
            }
            row.appendChild(declarationTextCell);
            
            // Is Lookup column
            const isLookupCell = document.createElement('td');
            isLookupCell.className = 'is-lookup-cell';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.isLookup === true;
            checkbox.disabled = true; // Read-only display
            checkbox.style.pointerEvents = 'none';
            
            if (item.isIgnored) {
                isLookupCell.style.opacity = '0.6';
            }
            
            isLookupCell.appendChild(checkbox);
            row.appendChild(isLookupCell);
            
            // Actions column
            const actionsCell = document.createElement('td');
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'actions-container';
            
            // Edit button
            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.innerHTML = '<span class="codicon codicon-edit"></span>';
            editButton.title = 'Edit Data Object';
            editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[DataObjectList] Edit button clicked for:', item.name);
                vscode.postMessage({
                    command: 'viewDetails',
                    objectName: item.name
                });
            });
            
            actionsContainer.appendChild(editButton);
            actionsCell.appendChild(actionsContainer);
            row.appendChild(actionsCell);
            
            tbody.appendChild(row);
        });
    } else {
        // Show "No data" row
        const noDataRow = document.createElement('tr');
        const noDataCell = document.createElement('td');
        noDataCell.setAttribute('colspan', '5');
        noDataCell.textContent = 'No data objects to display';
        noDataCell.style.textAlign = 'center';
        noDataCell.style.fontStyle = 'italic';
        noDataCell.style.padding = '20px';
        noDataRow.appendChild(noDataCell);
        tbody.appendChild(noDataRow);
    }
    
    table.appendChild(tbody);
}

// Render record info
function renderRecordInfo() {
    const recordInfoElement = document.getElementById("record-info");
    if (recordInfoElement) {
        const totalRecords = dataObjectData.totalRecords || 0;
        if (totalRecords > 0) {
            recordInfoElement.textContent = `${totalRecords} data object${totalRecords === 1 ? '' : 's'} found`;
        } else {
            recordInfoElement.textContent = "No data objects to display";
        }
    }
}

// Setup filter event listeners
function setupFilterEventListeners() {
    // Add event listeners for filter inputs
    const filterInputs = ['filterName', 'filterDescription', 'filterDeclarationText'];
    
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(applyFilters, 300));
            element.addEventListener('change', applyFilters);
        }
    });
    
    // Add event listener for the Is Lookup filter dropdown
    const isLookupFilter = document.getElementById('filterIsLookup');
    if (isLookupFilter) {
        isLookupFilter.addEventListener('change', applyFilters);
    }
}
