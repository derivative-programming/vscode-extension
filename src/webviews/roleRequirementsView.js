// Description: Handles the role requirements webview display with filtering and sorting.
// Created: August 3, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let roleRequirementsData = {
    items: [],
    totalRecords: 0,
    sortColumn: 'role',
    sortDescending: false
};

// Keep track of all items for filtering
let allItems = [];

// Keep track of unique values for filter dropdowns
let filterOptions = {
    roles: [],
    dataObjects: []
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
    const roleFilter = document.getElementById('filterRole')?.value || '';
    const dataObjectFilter = document.getElementById('filterDataObject')?.value.toLowerCase() || '';
    const actionFilter = document.getElementById('filterAction')?.value || '';
    const accessFilter = document.getElementById('filterAccess')?.value || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesRole = !roleFilter || item.role === roleFilter;
        const matchesDataObject = !dataObjectFilter || (item.dataObject || '').toLowerCase().includes(dataObjectFilter);
        const matchesAction = !actionFilter || item.action === actionFilter;
        const matchesAccess = !accessFilter || item.access === accessFilter;
        
        return matchesRole && matchesDataObject && matchesAction && matchesAccess;
    });
    
    // Update roleRequirementsData with filtered results
    roleRequirementsData.items = filteredItems;
    roleRequirementsData.totalRecords = filteredItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Clear all filters (global function for onclick)
function clearFilters() {
    document.getElementById('filterRole').value = '';
    document.getElementById('filterDataObject').value = '';
    document.getElementById('filterAction').value = '';
    document.getElementById('filterAccess').value = '';
    
    // Reset to show all items
    roleRequirementsData.items = allItems.slice();
    roleRequirementsData.totalRecords = allItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Extract unique values for filter dropdowns
function extractFilterOptions() {
    const roles = new Set();
    const dataObjects = new Set();
    
    allItems.forEach(item => {
        if (item.role) {
            roles.add(item.role);
        }
        if (item.dataObject) {
            dataObjects.add(item.dataObject);
        }
    });
    
    filterOptions.roles = Array.from(roles).sort();
    filterOptions.dataObjects = Array.from(dataObjects).sort();
}

// Populate filter dropdown options
function populateFilterDropdowns() {
    // Populate role dropdown
    const roleSelect = document.getElementById('filterRole');
    if (roleSelect) {
        // Clear existing options except "All Roles"
        roleSelect.innerHTML = '<option value="">All Roles</option>';
        
        filterOptions.roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            roleSelect.appendChild(option);
        });
    }
}

// Handle access dropdown change
function handleAccessChange(role, dataObject, action, newAccess, requirementsFilePath) {
    console.log("[Webview] Access changed:", { role, dataObject, action, newAccess });
    
    // Send message to extension to save the change
    vscode.postMessage({
        command: 'saveAccessChange',
        data: {
            role: role,
            dataObject: dataObject,
            action: action,
            access: newAccess,
            requirementsFilePath: requirementsFilePath
        }
    });
    
    // Update local data
    const item = allItems.find(item => 
        item.role === role && 
        item.dataObject === dataObject && 
        item.action === action
    );
    if (item) {
        item.access = newAccess;
    }
    
    // Update filtered data as well
    const filteredItem = roleRequirementsData.items.find(item => 
        item.role === role && 
        item.dataObject === dataObject && 
        item.action === action
    );
    if (filteredItem) {
        filteredItem.access = newAccess;
    }
}

// Render the table
function renderTable() {
    const table = document.getElementById("roleRequirementsTable");
    if (!table) {
        console.error("[Webview] Table element not found!");
        return;
    }
    
    console.log("[Webview] Rendering table with", roleRequirementsData.items.length, "items");
    
    // Clear the table
    table.innerHTML = "";
    
    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    // Add checkbox header column
    const checkboxTh = document.createElement("th");
    checkboxTh.className = "checkbox-header";
    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.className = "select-all-checkbox";
    selectAllCheckbox.addEventListener('change', handleSelectAll);
    checkboxTh.appendChild(selectAllCheckbox);
    headerRow.appendChild(checkboxTh);
    
    // Define table columns
    const columns = [
        { key: "role", label: "Role", sortable: true },
        { key: "dataObject", label: "Data Object", sortable: true },
        { key: "action", label: "Action", sortable: true },
        { key: "access", label: "Access", sortable: false }
    ];
    
    // Create table header cells
    columns.forEach(column => {
        const th = document.createElement("th");
        
        if (column.sortable) {
            th.style.cursor = "pointer";
            th.addEventListener("click", () => {
                // Toggle sort order if clicking the same column
                let sortDescending = false;
                if (roleRequirementsData.sortColumn === column.key) {
                    sortDescending = !roleRequirementsData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortRoleRequirements",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (roleRequirementsData.sortColumn === column.key) {
                th.textContent = column.label + (roleRequirementsData.sortDescending ? " ▼" : " ▲");
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
    if (roleRequirementsData.items && roleRequirementsData.items.length > 0) {
        roleRequirementsData.items.forEach((item, index) => {
            const row = document.createElement("tr");
            
            // Add checkbox column
            const checkboxTd = document.createElement("td");
            checkboxTd.className = "checkbox-column";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "row-checkbox";
            checkbox.dataset.index = index;
            checkbox.addEventListener('change', updateSelectAllState);
            checkboxTd.appendChild(checkbox);
            row.appendChild(checkboxTd);
            
            columns.forEach(col => {
                const td = document.createElement("td");
                
                if (col.key === "access") {
                    // Create access dropdown
                    const select = document.createElement("select");
                    select.className = "access-dropdown";
                    
                    const accessOptions = ['Unassigned', 'Allowed', 'Required', 'Not Allowed'];
                    accessOptions.forEach(option => {
                        const optionElement = document.createElement("option");
                        optionElement.value = option;
                        optionElement.textContent = option;
                        if (option === item.access) {
                            optionElement.selected = true;
                        }
                        select.appendChild(optionElement);
                    });
                    
                    // Add change event listener
                    select.addEventListener('change', (e) => {
                        const newAccess = e.target.value;
                        handleAccessChange(
                            item.role, 
                            item.dataObject, 
                            item.action, 
                            newAccess, 
                            item.requirementsFilePath
                        );
                    });
                    
                    td.appendChild(select);
                } else if (col.key === "dataObject") {
                    // For data object column, display the value with truncation
                    const value = item[col.key] || "";
                    td.textContent = value;
                    td.className = "data-object";
                    
                    // Add tooltip for longer text
                    if (value.length > 25) {
                        td.title = value;
                    }
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
            
            // Add click handler for row (except access column)
            row.addEventListener('click', (e) => {
                // Don't toggle if clicking on the access dropdown or checkbox
                if (e.target.classList.contains('access-dropdown') || 
                    e.target.classList.contains('row-checkbox')) {
                    return;
                }
                
                // Toggle the checkbox for this row
                const checkbox = row.querySelector('.row-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    updateSelectAllState();
                }
            });
            
            tbody.appendChild(row);
        });
    } else {
        // No items
        const row = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5; // Number of columns (checkbox + 4 data columns)
        td.style.textAlign = "center";
        td.style.padding = "20px";
        td.style.color = "var(--vscode-descriptionForeground)";
        td.textContent = "No role requirements found. Make sure you have roles and data objects defined in your model.";
        row.appendChild(td);
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
}

// Render record info
function renderRecordInfo() {
    const recordInfoElement = document.getElementById("record-info");
    if (recordInfoElement) {
        const totalRecords = roleRequirementsData.totalRecords || 0;
        if (totalRecords > 0) {
            recordInfoElement.textContent = `${totalRecords} requirement${totalRecords === 1 ? '' : 's'} found`;
        } else {
            recordInfoElement.textContent = "No requirements to display";
        }
    }
}

// Setup filter event listeners
function setupFilterEventListeners() {
    // Add event listeners for filter inputs
    const filterInputs = ['filterRole', 'filterDataObject', 'filterAction', 'filterAccess'];
    
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
    console.log("[Webview] DOM Content loaded for Role Requirements");
    
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
    
    // Setup bulk actions
    setupBulkActions();
    
    // Setup filter event listeners
    setupFilterEventListeners();
    
    // Tell the extension we're ready
    vscode.postMessage({ command: 'RoleRequirementsWebviewReady' });
    
    // Show spinner while loading
    showSpinner();
});

// Event listeners for messages from the extension
window.addEventListener("message", function(event) {
    const message = event.data;
    console.log("[Webview] Received message:", message.command);
    
    if (message.command === "setRoleRequirementsData") {
        console.log("[Webview] Handling setRoleRequirementsData with", message.data?.items?.length || 0, "items");
        const data = message.data || { items: [], totalRecords: 0, sortColumn: 'role', sortDescending: false };
        
        // Store all items for filtering
        allItems = data.items || [];
        
        // Update roleRequirementsData
        roleRequirementsData = {
            items: allItems.slice(), // Copy of all items initially
            totalRecords: allItems.length,
            sortColumn: data.sortColumn || 'role',
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
    } else if (message.command === "accessChangeSaved") {
        if (message.success) {
            console.log("[Webview] Access change saved successfully");
        } else {
            console.error("[Webview] Error saving access change:", message.error);
            vscode.postMessage({
                command: 'showError',
                message: `Failed to save access change: ${message.error || 'Unknown error'}`
            });
        }
    }
});

// Setup bulk actions functionality
function setupBulkActions() {
    const applyButton = document.getElementById('applyButton');
    const bulkAccessDropdown = document.getElementById('bulkAccessDropdown');
    
    if (applyButton && bulkAccessDropdown) {
        // Initially disable the apply button
        applyButton.disabled = true;
        
        // Enable/disable apply button based on selections and dropdown value
        function updateApplyButtonState() {
            const selectedRows = getSelectedRows();
            const hasSelection = selectedRows.length > 0;
            const hasAccessValue = bulkAccessDropdown.value !== '';
            
            applyButton.disabled = !hasSelection || !hasAccessValue;
        }
        
        // Listen to dropdown changes
        bulkAccessDropdown.addEventListener('change', updateApplyButtonState);
        
        // Apply button click handler
        applyButton.addEventListener('click', () => {
            const selectedRows = getSelectedRows();
            const newAccess = bulkAccessDropdown.value;
            
            if (selectedRows.length === 0 || !newAccess) {
                return;
            }
            
            console.log(`[Webview] Applying access '${newAccess}' to ${selectedRows.length} selected rows`);
            
            // Apply access change to each selected row
            selectedRows.forEach(item => {
                handleAccessChange(
                    item.role,
                    item.dataObject,
                    item.action,
                    newAccess,
                    item.requirementsFilePath
                );
            });
            
            // Reset dropdown after applying
            bulkAccessDropdown.value = '';
            updateApplyButtonState();
            
            // Re-render the table to show the updated access values
            renderTable();
            
            // Show success message
            console.log(`[Webview] Applied '${newAccess}' access to ${selectedRows.length} role requirements`);
        });
        
        // Store the update function globally so checkbox handlers can call it
        window.updateApplyButtonState = updateApplyButtonState;
    }
}

// Checkbox handler functions
function handleSelectAll(event) {
    const isChecked = event.target.checked;
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    
    console.log(`[Webview] ${isChecked ? 'Selected' : 'Deselected'} all ${rowCheckboxes.length} rows`);
    
    // Update apply button state
    if (window.updateApplyButtonState) {
        window.updateApplyButtonState();
    }
}

function updateSelectAllState() {
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const selectAllCheckbox = document.querySelector('.select-all-checkbox');
    
    if (selectAllCheckbox) {
        if (checkedBoxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedBoxes.length === rowCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
    
    // Update apply button state
    if (window.updateApplyButtonState) {
        window.updateApplyButtonState();
    }
}

function getSelectedRows() {
    const selectedRows = [];
    const rowCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    
    rowCheckboxes.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        if (!isNaN(index) && roleRequirementsData.items[index]) {
            selectedRows.push(roleRequirementsData.items[index]);
        }
    });
    
    return selectedRows;
}
