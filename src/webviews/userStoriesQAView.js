// Description: Handles the user stories QA webview display with filtering and sorting.
// Created: August 4, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let userStoriesQAData = {
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
    const qaStatusFilter = document.getElementById('filterQAStatus')?.value || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        const matchesQAStatus = !qaStatusFilter || item.qaStatus === qaStatusFilter;
        
        return matchesStoryNumber && matchesStoryText && matchesQAStatus;
    });
    
    // Update userStoriesQAData with filtered results
    userStoriesQAData.items = filteredItems;
    userStoriesQAData.totalRecords = filteredItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Clear all filters (global function for onclick)
function clearFilters() {
    document.getElementById('filterStoryNumber').value = '';
    document.getElementById('filterStoryText').value = '';
    document.getElementById('filterQAStatus').value = '';
    
    // Reset to show all items
    userStoriesQAData.items = allItems.slice();
    userStoriesQAData.totalRecords = allItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

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
    document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Handle tab-specific logic
    if (tabName === 'analysis') {
        // Future: Load analysis data
        console.log('Analysis tab selected - placeholder for future analytics');
    }
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
        userStoriesQAData.items.forEach(item => {
            selectedItems.add(item.storyId);
        });
    }
    
    // Update all row checkboxes
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// Handle individual row checkbox change
function handleRowCheckboxChange(storyId, isChecked) {
    if (isChecked) {
        selectedItems.add(storyId);
    } else {
        selectedItems.delete(storyId);
    }
    
    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const totalItems = userStoriesQAData.items.length;
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
    
    // Update apply button state
    updateApplyButtonState();
}

// Handle row click to toggle checkbox
function handleRowClick(event, storyId) {
    // Don't toggle if the click was on an interactive element
    const target = event.target;
    if (target.type === 'checkbox' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
    }
    
    // Toggle the checkbox state
    const isCurrentlySelected = selectedItems.has(storyId);
    handleRowCheckboxChange(storyId, !isCurrentlySelected);
    
    // Update the actual checkbox element
    const checkbox = event.currentTarget.querySelector('.row-checkbox');
    if (checkbox) {
        checkbox.checked = !isCurrentlySelected;
    }
}

// Update apply button state based on selections and dropdown value
function updateApplyButtonState() {
    const applyButton = document.getElementById('applyButton');
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    
    if (applyButton && bulkStatusDropdown) {
        const hasSelection = selectedItems.size > 0;
        const hasStatus = bulkStatusDropdown.value !== '';
        applyButton.disabled = !(hasSelection && hasStatus);
    }
}

// Bulk update selected items (global function for onclick)
function bulkUpdateSelected() {
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    const selectedStatus = bulkStatusDropdown.value;
    
    if (selectedItems.size === 0) {
        alert('Please select items to update');
        return;
    }
    
    if (!selectedStatus) {
        alert('Please select a status');
        return;
    }

    console.log(`[Webview] Applying status '${selectedStatus}' to ${selectedItems.size} selected rows`);
    
    // Get first item to find qaFilePath
    const firstItem = userStoriesQAData.items.find(item => selectedItems.has(item.storyId));
    if (!firstItem) {
        return;
    }

    // Update local data immediately for each selected item
    const currentDate = new Date().toISOString().split('T')[0];
    selectedItems.forEach(storyId => {
        // Update in allItems array
        const allItem = allItems.find(item => item.storyId === storyId);
        if (allItem) {
            allItem.qaStatus = selectedStatus;
            if (selectedStatus === 'success' || selectedStatus === 'failure') {
                allItem.dateVerified = currentDate;
            }
        }
        
        // Update in filtered data as well
        const filteredItem = userStoriesQAData.items.find(item => item.storyId === storyId);
        if (filteredItem) {
            filteredItem.qaStatus = selectedStatus;
            if (selectedStatus === 'success' || selectedStatus === 'failure') {
                filteredItem.dateVerified = currentDate;
            }
        }
    });

    // Send bulk update message to save changes
    vscode.postMessage({
        command: 'bulkUpdateQAStatus',
        data: {
            selectedStoryIds: Array.from(selectedItems),
            qaStatus: selectedStatus,
            qaFilePath: firstItem.qaFilePath
        }
    });

    // Reset dropdown and clear selections
    bulkStatusDropdown.value = '';
    selectedItems.clear();
    updateApplyButtonState();
    
    // Re-render the table to show the updated status values immediately
    renderTable();
}

// Export to CSV (global function for onclick)
function exportToCSV() {
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: userStoriesQAData.items
        }
    });
}

// Handle QA status change
function handleQAStatusChange(storyId, newStatus) {
    // Find the item and update locally
    const item = userStoriesQAData.items.find(i => i.storyId === storyId);
    if (item) {
        item.qaStatus = newStatus;
        
        // Set date verified if status is success or failure
        if (newStatus === 'success' || newStatus === 'failure') {
            item.dateVerified = new Date().toISOString().split('T')[0];
            
            // Update the date cell in the current row without re-rendering entire table
            const row = document.querySelector(`#qaTableBody tr[data-story-id="${storyId}"]`);
            if (row) {
                const dateCell = row.querySelector('.date-verified-column');
                if (dateCell) {
                    dateCell.textContent = item.dateVerified;
                }
            }
        }
        
        // Also update in allItems
        const allItem = allItems.find(i => i.storyId === storyId);
        if (allItem) {
            allItem.qaStatus = newStatus;
            if (newStatus === 'success' || newStatus === 'failure') {
                allItem.dateVerified = new Date().toISOString().split('T')[0];
            }
        }
        
        // Don't re-render table - just update the specific cell data
        // The dropdown value is already set by the user interaction
        
        // Save the change
        vscode.postMessage({
            command: 'saveQAChange',
            data: {
                storyId: storyId,
                qaStatus: newStatus,
                qaNotes: item.qaNotes || '',
                dateVerified: item.dateVerified || '',
                qaFilePath: item.qaFilePath
            }
        });
    }
}

// Handle QA notes change
function handleQANotesChange(storyId, newNotes) {
    // Find the item and update locally
    const item = userStoriesQAData.items.find(i => i.storyId === storyId);
    if (item) {
        item.qaNotes = newNotes;
        
        // Also update in allItems
        const allItem = allItems.find(i => i.storyId === storyId);
        if (allItem) {
            allItem.qaNotes = newNotes;
        }
        
        // Save the change
        vscode.postMessage({
            command: 'saveQAChange',
            data: {
                storyId: storyId,
                qaStatus: item.qaStatus || 'pending',
                qaNotes: newNotes,
                dateVerified: item.dateVerified || '',
                qaFilePath: item.qaFilePath
            }
        });
    }
}

// Render the table
function renderTable() {
    const table = document.getElementById("qaTable");
    const thead = document.getElementById("qaTableHead");
    const tbody = document.getElementById("qaTableBody");
    
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
        { key: 'qaStatus', label: 'Status', sortable: true, className: 'qa-status-column' },
        { key: 'qaNotes', label: 'Notes', sortable: false, className: 'qa-notes-column' },
        { key: 'dateVerified', label: 'Date Verified', sortable: true, className: 'date-verified-column' }
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
                if (userStoriesQAData.sortColumn === column.key) {
                    sortDescending = !userStoriesQAData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortUserStoriesQA",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (userStoriesQAData.sortColumn === column.key) {
                th.textContent = column.label + (userStoriesQAData.sortDescending ? " ▼" : " ▲");
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
    if (userStoriesQAData.items && userStoriesQAData.items.length > 0) {
        userStoriesQAData.items.forEach(item => {
            const row = document.createElement("tr");
            row.setAttribute("data-story-id", item.storyId); // Add story ID to row for easy identification
            
            // Checkbox column
            const checkboxCell = document.createElement("td");
            checkboxCell.className = "checkbox-column";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "row-checkbox";
            checkbox.checked = selectedItems.has(item.storyId);
            checkbox.addEventListener("change", (e) => {
                handleRowCheckboxChange(item.storyId, e.target.checked);
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
            
            // QA Status
            const qaStatusCell = document.createElement("td");
            qaStatusCell.className = "qa-status-column";
            const qaStatusSelect = document.createElement("select");
            qaStatusSelect.className = "qa-status-select";
            
            const statusOptions = [
                { value: 'pending', text: 'Pending' },
                { value: 'started', text: 'Started' },
                { value: 'success', text: 'Success' },
                { value: 'failure', text: 'Failure' }
            ];
            
            statusOptions.forEach(option => {
                const optionElement = document.createElement("option");
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                qaStatusSelect.appendChild(optionElement);
            });
            
            // Set the value AFTER adding options
            qaStatusSelect.value = item.qaStatus || 'pending';
            
            qaStatusSelect.addEventListener("change", (e) => {
                handleQAStatusChange(item.storyId, e.target.value);
            });
            
            qaStatusCell.appendChild(qaStatusSelect);
            row.appendChild(qaStatusCell);
            
            // QA Notes
            const qaNotesCell = document.createElement("td");
            qaNotesCell.className = "qa-notes-column";
            const qaNotesTextArea = document.createElement("textarea");
            qaNotesTextArea.className = "qa-notes-input";
            qaNotesTextArea.value = item.qaNotes || '';
            qaNotesTextArea.placeholder = "Enter QA notes...";
            
            qaNotesTextArea.addEventListener("blur", (e) => {
                handleQANotesChange(item.storyId, e.target.value);
            });
            
            qaNotesCell.appendChild(qaNotesTextArea);
            row.appendChild(qaNotesCell);
            
            // Date Verified
            const dateVerifiedCell = document.createElement("td");
            dateVerifiedCell.className = "date-verified-column";
            dateVerifiedCell.textContent = item.dateVerified || '';
            row.appendChild(dateVerifiedCell);
            
            // Add click event listener to toggle checkbox when row is clicked
            row.style.cursor = "pointer";
            row.addEventListener("click", (e) => {
                handleRowClick(e, item.storyId);
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
        const totalCount = userStoriesQAData.totalRecords || 0;
        const filteredCount = userStoriesQAData.items ? userStoriesQAData.items.length : 0;
        const selectedCount = selectedItems.size;
        
        let infoText = '';
        if (filteredCount === totalCount) {
            infoText = `${totalCount} processed stories`;
        } else {
            infoText = `${filteredCount} of ${totalCount} processed stories`;
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
        case 'setUserStoriesQAData':
            console.log('Received QA data:', message.data);
            hideSpinner();
            
            if (message.data.error) {
                console.error('Error loading QA data:', message.data.error);
                // Show error state
                userStoriesQAData = {
                    items: [],
                    totalRecords: 0,
                    sortColumn: 'storyNumber',
                    sortDescending: false
                };
                allItems = [];
            } else {
                userStoriesQAData = message.data;
                allItems = message.data.items.slice(); // Create a copy for filtering
                selectedItems.clear(); // Clear selection when new data is loaded
            }
            
            renderTable();
            renderRecordInfo();
            updateApplyButtonState();
            break;
        
        case 'switchToTab':
            // Switch to the specified tab
            if (message.data && message.data.tabName) {
                console.log('[UserStoriesQAView] Received switchToTab command:', message.data.tabName);
                switchTab(message.data.tabName);
            }
            break;
            
        case 'qaChangeSaved':
            console.log('QA change saved:', message.success);
            if (!message.success) {
                console.error('Error saving QA change:', message.error);
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
            
        default:
            console.log('Unknown message:', message);
            break;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('User Stories QA webview loaded');
    
    // Initialize tab functionality
    initializeTabs();
    
    // Setup filter event listeners for auto-apply
    const filterInputs = ['filterStoryNumber', 'filterStoryText', 'filterQAStatus'];
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', applyFilters);
            element.addEventListener('change', applyFilters);
        }
    });
    
    // Setup bulk actions event listeners
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    const applyButton = document.getElementById('applyButton');
    const exportButton = document.getElementById('exportButton');
    const refreshButton = document.getElementById('refreshButton');
    
    if (bulkStatusDropdown) {
        bulkStatusDropdown.addEventListener('change', () => {
            const hasSelection = selectedItems.size > 0;
            const hasStatus = bulkStatusDropdown.value !== '';
            applyButton.disabled = !(hasSelection && hasStatus);
        });
    }
    
    if (applyButton) {
        applyButton.addEventListener('click', bulkUpdateSelected);
    }
    
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
        // Setup refresh button icon (following roleRequirementsView pattern exactly)
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
    
    // Send ready message to extension
    vscode.postMessage({
        command: 'UserStoriesQAWebviewReady'
    });
});
