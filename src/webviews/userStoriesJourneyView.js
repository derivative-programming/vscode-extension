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

// Toggle select all checkboxes (global function for onclick)
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const isChecked = selectAllCheckbox.checked;
    
    // Update selectedItems set
    selectedItems.clear();
    if (isChecked) {
        userStoriesJourneyData.items.forEach(item => {
            selectedItems.add(item.storyId + '_' + item.page); // Use unique combination
        });
    }
    
    // Update all row checkboxes
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// Handle individual row checkbox change
function handleRowCheckboxChange(itemKey, isChecked) {
    if (isChecked) {
        selectedItems.add(itemKey);
    } else {
        selectedItems.delete(itemKey);
    }
    
    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const totalItems = userStoriesJourneyData.items.length;
    const selectedCount = selectedItems.size;
    
    if (selectedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedCount === totalItems) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// Handle row click to toggle checkbox
function handleRowClick(event, itemKey) {
    // Don't toggle if the click was on an interactive element
    const target = event.target;
    if (target.type === 'checkbox' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
    }
    
    // Toggle the checkbox state
    const isCurrentlySelected = selectedItems.has(itemKey);
    handleRowCheckboxChange(itemKey, !isCurrentlySelected);
    
    // Update the actual checkbox element
    const checkbox = event.currentTarget.querySelector('.row-checkbox');
    if (checkbox) {
        checkbox.checked = !isCurrentlySelected;
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
        { key: 'select', label: '', sortable: false, className: 'checkbox-column' },
        { key: 'storyNumber', label: 'Story Number', sortable: true, className: 'story-number-column' },
        { key: 'storyText', label: 'Story Text', sortable: true, className: 'story-text-column' },
        { key: 'page', label: 'Page', sortable: true, className: 'page-column' }
    ];
    
    // Create table header
    const headerRow = document.createElement("tr");
    columns.forEach(column => {
        const th = document.createElement("th");
        th.className = column.className || '';
        
        if (column.key === 'select') {
            // Select all checkbox in header
            const selectAllCheckbox = document.createElement("input");
            selectAllCheckbox.type = "checkbox";
            selectAllCheckbox.id = "selectAllCheckbox";
            selectAllCheckbox.addEventListener("change", toggleSelectAll);
            th.appendChild(selectAllCheckbox);
        } else if (column.sortable) {
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
            
            // Checkbox column
            const checkboxCell = document.createElement("td");
            checkboxCell.className = "checkbox-column";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "row-checkbox";
            checkbox.checked = selectedItems.has(itemKey);
            checkbox.addEventListener("change", (e) => {
                handleRowCheckboxChange(itemKey, e.target.checked);
            });
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
            
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
            
            // Add click event listener to toggle checkbox when row is clicked
            row.style.cursor = "pointer";
            row.addEventListener("click", (e) => {
                handleRowClick(e, itemKey);
            });
            
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
            
        default:
            console.log('Unknown message:', message);
            break;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('User Stories Journey webview loaded');
    
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
    
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', refresh);
        // Setup refresh button icon (following QA view pattern exactly)
        refreshButton.innerHTML = '<span class="codicon codicon-refresh" style="font-size:16px;"></span>';
    }
    
    // Notify extension that webview is ready
    vscode.postMessage({ command: 'UserStoriesJourneyWebviewReady' });
});

// Export functions for module (following QA view pattern)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showUserStoriesJourneyView,
        getUserStoriesJourneyPanel,
        closeUserStoriesJourneyPanel
    };
}
