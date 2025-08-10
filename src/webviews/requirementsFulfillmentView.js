// Description: Handles the requirements fulfillment webview display with filtering and sorting.
// Created: August 10, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let requirementsFulfillmentData = {
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

// Keep track of user stories for validation
let userStories = [];

// Function to check if a user story exists for a given role/action/object combination
function checkUserStoryExists(role, action, dataObject) {
    if (!userStories || userStories.length === 0) {
        return false;
    }
    
    // Normalize action for comparison (user stories use different action formats)
    const normalizeAction = (actionText) => {
        const lower = actionText.toLowerCase();
        if (lower === 'view all') { return 'view all'; }
        if (lower === 'view') { return 'view'; }
        if (lower === 'add') { return 'add'; }
        if (lower === 'update') { return 'update'; }
        if (lower === 'delete') { return 'delete'; }
        return lower;
    };
    
    const normalizedAction = normalizeAction(action);
    
    // Check if any user story matches this combination
    return userStories.some(story => {
        if (!story.storyText) { return false; }
        
        const storyText = story.storyText.toLowerCase();
        const roleLower = role.toLowerCase();
        const dataObjectLower = dataObject.toLowerCase();
        
        // Check if story contains the role
        const hasRole = storyText.includes(roleLower) || 
                       storyText.includes(`[${roleLower}]`) ||
                       storyText.includes(`a ${roleLower}`) ||
                       storyText.includes(`as a ${roleLower}`);
        
        // Check if story contains the action
        const hasAction = storyText.includes(normalizedAction);
        
        // Check if story contains the data object (handle plurals and variations)
        const hasDataObject = storyText.includes(dataObjectLower) ||
                             storyText.includes(`${dataObjectLower}s`) ||
                             storyText.includes(`[${dataObjectLower}]`) ||
                             storyText.includes(`a ${dataObjectLower}`) ||
                             storyText.includes(`an ${dataObjectLower}`) ||
                             storyText.includes(`all ${dataObjectLower}`);
        
        return hasRole && hasAction && hasDataObject;
    });
}

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
    
    // Update requirementsFulfillmentData with filtered results
    requirementsFulfillmentData.items = filteredItems;
    requirementsFulfillmentData.totalRecords = filteredItems.length;
    
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
    requirementsFulfillmentData.items = allItems.slice();
    requirementsFulfillmentData.totalRecords = allItems.length;
    
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

// Render the table
function renderTable() {
    const table = document.getElementById("requirementsFulfillmentTable");
    if (!table) {
        console.error("[Webview] Table element not found!");
        return;
    }
    
    console.log("[Webview] Rendering table with", requirementsFulfillmentData.items.length, "items");
    
    // Clear the table
    table.innerHTML = "";
    
    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    // Define table columns (no checkbox column for read-only view)
    const columns = [
        { key: "role", label: "Role", sortable: true },
        { key: "dataObject", label: "Data Object", sortable: true },
        { key: "action", label: "Action", sortable: true },
        { key: "access", label: "Access", sortable: false },
        { key: "userStoryStatus", label: "User Story Status", sortable: false }
    ];
    
    // Create table header cells
    columns.forEach(column => {
        const th = document.createElement("th");
        
        if (column.sortable) {
            th.className = "sortable";
            th.style.cursor = "pointer";
            th.addEventListener("click", () => {
                // Toggle sort order if clicking the same column
                let sortDescending = false;
                if (requirementsFulfillmentData.sortColumn === column.key) {
                    sortDescending = !requirementsFulfillmentData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortRequirementsFulfillment",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (requirementsFulfillmentData.sortColumn === column.key) {
                th.textContent = column.label + (requirementsFulfillmentData.sortDescending ? " ▼" : " ▲");
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
    if (requirementsFulfillmentData.items && requirementsFulfillmentData.items.length > 0) {
        requirementsFulfillmentData.items.forEach((item, index) => {
            const row = document.createElement("tr");
            
            columns.forEach(col => {
                const td = document.createElement("td");
                
                if (col.key === "access") {
                    // Create styled access display (read-only)
                    const accessDisplay = document.createElement("span");
                    accessDisplay.className = "access-display";
                    accessDisplay.textContent = item.access;
                    
                    // Add specific styling based on access level
                    if (item.access === 'Required') {
                        accessDisplay.classList.add('access-required');
                    } else if (item.access === 'Not Allowed') {
                        accessDisplay.classList.add('access-not-allowed');
                    }
                    
                    td.appendChild(accessDisplay);
                } else if (col.key === "userStoryStatus") {
                    // Check if user story exists for this role/action/object combination
                    const userStoryExists = checkUserStoryExists(item.role, item.action, item.dataObject);
                    const statusDisplay = document.createElement("span");
                    statusDisplay.className = "user-story-status";
                    
                    // Determine if this is the desired state
                    let isDesired = false;
                    if (item.access === 'Required' && userStoryExists) {
                        isDesired = true;
                        statusDisplay.textContent = "✓ Story Exists";
                        statusDisplay.classList.add('status-good');
                    } else if (item.access === 'Required' && !userStoryExists) {
                        isDesired = false;
                        statusDisplay.textContent = "✗ Story Missing";
                        statusDisplay.classList.add('status-bad');
                    } else if (item.access === 'Not Allowed' && !userStoryExists) {
                        isDesired = true;
                        statusDisplay.textContent = "✓ No Story";
                        statusDisplay.classList.add('status-good');
                    } else if (item.access === 'Not Allowed' && userStoryExists) {
                        isDesired = false;
                        statusDisplay.textContent = "✗ Story Exists";
                        statusDisplay.classList.add('status-bad');
                    }
                    
                    td.appendChild(statusDisplay);
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
            
            tbody.appendChild(row);
        });
    } else {
        // No items
        const row = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5; // Number of columns including User Story Status
        td.className = "no-data";
        td.textContent = "No requirements fulfillment data found. Requirements marked as 'Required' or 'Not Allowed' will appear here.";
        row.appendChild(td);
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
}

// Render record info
function renderRecordInfo() {
    const recordInfoElement = document.getElementById("record-info");
    if (recordInfoElement) {
        const totalRecords = requirementsFulfillmentData.totalRecords || 0;
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("[Webview] Requirements Fulfillment view DOM loaded");
    
    // Setup filter event listeners
    setupFilterEventListeners();
    
    // Setup refresh button event listener
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            console.log("[Webview] Refresh button clicked");
            showSpinner();
            vscode.postMessage({ command: 'refresh' });
        });
    }
    
    // Tell the extension we're ready
    vscode.postMessage({ command: 'RequirementsFulfillmentWebviewReady' });
    
    // Show spinner while loading
    showSpinner();
});

// Event listeners for messages from the extension
window.addEventListener("message", function(event) {
    const message = event.data;
    console.log("[Webview] Received message:", message.command);
    
    if (message.command === "setRequirementsFulfillmentData") {
        console.log("[Webview] Handling setRequirementsFulfillmentData with", message.data?.items?.length || 0, "items");
        const data = message.data || { items: [], totalRecords: 0, sortColumn: 'role', sortDescending: false, userStories: [] };
        
        // Store all items for filtering
        allItems = data.items || [];
        
        // Store user stories for validation
        userStories = data.userStories || [];
        console.log("[Webview] Stored", userStories.length, "user stories for validation");
        
        // Update requirementsFulfillmentData
        requirementsFulfillmentData = {
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
    }
});
