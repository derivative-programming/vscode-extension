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

// Keep track of page mappings for mapping status validation
let pageMappings = {};

// Keep track of user journey data for journey existence validation  
let userJourneyData = [];

// Function to parse a user story and extract its components
function parseUserStory(storyText) {
    if (!storyText) { return null; }
    
    const text = storyText.toLowerCase();
    
    // Extract role (look for patterns like "as a [role]", "as an [role]", "[role]")
    let role = null;
    const rolePatterns = [
        /as an? ([^,]+)/,
        /\[([^\]]+)\]/,
        /^([^,]+),/
    ];
    
    for (const pattern of rolePatterns) {
        const match = text.match(pattern);
        if (match) {
            role = match[1].trim();
            break;
        }
    }
    
    // Extract action (look for common action verbs)
    let action = null;
    const actionPatterns = [
        /\b(view all)\b/,
        /\b(view)\b/,
        /\b(add)\b/,
        /\b(create)\b/,
        /\b(update)\b/,
        /\b(edit)\b/,
        /\b(delete)\b/,
        /\b(remove)\b/
    ];
    
    for (const pattern of actionPatterns) {
        const match = text.match(pattern);
        if (match) {
            action = match[1];
            // Normalize some actions
            if (action === 'create') { action = 'add'; }
            if (action === 'edit') { action = 'update'; }
            if (action === 'remove') { action = 'delete'; }
            break;
        }
    }
    
    // Extract data objects (look for nouns after common patterns)
    const dataObjects = [];
    const objectPatterns = [
        /(?:view all|view|add|create|update|edit|delete|remove)\s+(?:a\s+|an\s+|the\s+)?([a-z]+(?:\s+[a-z]+)*)/g,
        /(?:of|for)\s+(?:a\s+|an\s+|the\s+)?([a-z]+(?:\s+[a-z]+)*)/g
    ];
    
    for (const pattern of objectPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const obj = match[1].trim();
            if (obj && !dataObjects.includes(obj)) {
                dataObjects.push(obj);
                // Also add singular/plural variants
                if (obj.endsWith('s')) {
                    const singular = obj.slice(0, -1);
                    if (!dataObjects.includes(singular)) {
                        dataObjects.push(singular);
                    }
                } else {
                    const plural = obj + 's';
                    if (!dataObjects.includes(plural)) {
                        dataObjects.push(plural);
                    }
                }
            }
        }
    }
    
    return {
        role,
        action,
        dataObjects,
        originalText: storyText
    };
}

// Function to check if a user story exists for a given role/action/object combination
function checkUserStoryExists(role, action, dataObject) {
    if (!userStories || userStories.length === 0) {
        return false;
    }
    
    const roleLower = role.toLowerCase();
    const actionLower = action.toLowerCase();
    const dataObjectLower = dataObject.toLowerCase();
    
    // Check if any user story matches this combination
    return userStories.some(story => {
        const parsed = parseUserStory(story.storyText);
        if (!parsed) { return false; }
        
        // Check role match
        const roleMatch = parsed.role && (
            parsed.role === roleLower ||
            parsed.role.includes(roleLower) ||
            roleLower.includes(parsed.role)
        );
        
        // Check action match (including view/view all logic)
        let actionMatch = false;
        if (parsed.action) {
            if (actionLower === 'view') {
                // For 'view' requirements, match both 'view' and 'view all'
                actionMatch = parsed.action === 'view' || parsed.action === 'view all';
            } else {
                actionMatch = parsed.action === actionLower;
            }
        }
        
        // Check data object match
        const dataObjectMatch = parsed.dataObjects.some(obj => 
            obj === dataObjectLower ||
            obj === dataObjectLower + 's' ||
            obj === dataObjectLower.replace(/s$/, '')
        );
        
        return roleMatch && actionMatch && dataObjectMatch;
    });
}

// Function to get matching user stories for a given role/action/object combination
function getMatchingUserStories(role, action, dataObject) {
    if (!userStories || userStories.length === 0) {
        return [];
    }
    
    const roleLower = role.toLowerCase();
    const actionLower = action.toLowerCase();
    const dataObjectLower = dataObject.toLowerCase();
    
    // Filter user stories that match this combination
    return userStories.filter(story => {
        const parsed = parseUserStory(story.storyText);
        if (!parsed) { return false; }
        
        // Check role match
        const roleMatch = parsed.role && (
            parsed.role === roleLower ||
            parsed.role.includes(roleLower) ||
            roleLower.includes(parsed.role)
        );
        
        // Check action match (including view/view all logic)
        let actionMatch = false;
        if (parsed.action) {
            if (actionLower === 'view') {
                // For 'view' requirements, match both 'view' and 'view all'
                actionMatch = parsed.action === 'view' || parsed.action === 'view all';
            } else {
                actionMatch = parsed.action === actionLower;
            }
        }
        
        // Check data object match
        const dataObjectMatch = parsed.dataObjects.some(obj => 
            obj === dataObjectLower ||
            obj === dataObjectLower + 's' ||
            obj === dataObjectLower.replace(/s$/, '')
        );
        
        return roleMatch && actionMatch && dataObjectMatch;
    });
}

// Function to check if matching user stories have page mappings
function checkMappingStatus(role, action, dataObject) {
    if (!userStories || userStories.length === 0 || !pageMappings) {
        return { hasMapping: false, mappedCount: 0, totalCount: 0 };
    }
    
    const roleLower = role.toLowerCase();
    const actionLower = action.toLowerCase();
    const dataObjectLower = dataObject.toLowerCase();
    
    // Find matching user stories using the same parsing logic
    const matchingStories = userStories.filter(story => {
        const parsed = parseUserStory(story.storyText);
        if (!parsed) { return false; }
        
        // Check role match
        const roleMatch = parsed.role && (
            parsed.role === roleLower ||
            parsed.role.includes(roleLower) ||
            roleLower.includes(parsed.role)
        );
        
        // Check action match (including view/view all logic)
        let actionMatch = false;
        if (parsed.action) {
            if (actionLower === 'view') {
                // For 'view' requirements, match both 'view' and 'view all'
                actionMatch = parsed.action === 'view' || parsed.action === 'view all';
            } else {
                actionMatch = parsed.action === actionLower;
            }
        }
        
        // Check data object match
        const dataObjectMatch = parsed.dataObjects.some(obj => 
            obj === dataObjectLower ||
            obj === dataObjectLower + 's' ||
            obj === dataObjectLower.replace(/s$/, '')
        );
        
        return roleMatch && actionMatch && dataObjectMatch;
    });
    
    const totalCount = matchingStories.length;
    if (totalCount === 0) {
        return { hasMapping: false, mappedCount: 0, totalCount: 0 };
    }
    
    // Check how many of the matching stories have page mappings and collect mapping details
    let mappedCount = 0;
    const mappingDetails = [];
    
    matchingStories.forEach(story => {
        const storyNumber = story.storyNumber;
        if (storyNumber && pageMappings[storyNumber]) {
            const mapping = pageMappings[storyNumber];
            if (mapping.pageMapping && 
                ((Array.isArray(mapping.pageMapping) && mapping.pageMapping.length > 0) ||
                 (typeof mapping.pageMapping === 'string' && mapping.pageMapping.trim().length > 0))) {
                mappedCount++;
                
                // Collect page mapping details
                const pages = Array.isArray(mapping.pageMapping) ? mapping.pageMapping : [mapping.pageMapping];
                mappingDetails.push({
                    storyNumber: storyNumber,
                    storyText: story.storyText,
                    pages: pages.filter(p => p && p.trim().length > 0)
                });
            }
        }
    });
    
    return { 
        hasMapping: mappedCount > 0, 
        mappedCount: mappedCount, 
        totalCount: totalCount,
        mappingDetails: mappingDetails 
    };
}

// Function to check if user journey exists for requirement's mapped pages
function checkUserJourneyExists(role, action, dataObject) {
    // Get mapping info first to find mapped pages
    const mappingInfo = checkMappingStatus(role, action, dataObject);
    
    if (!mappingInfo.hasMapping || !mappingInfo.mappingDetails || mappingInfo.mappingDetails.length === 0) {
        return { hasJourney: false, journeyCount: 0, totalMappedPages: 0 };
    }
    
    // Extract all unique mapped pages
    const mappedPages = new Set();
    mappingInfo.mappingDetails.forEach(detail => {
        detail.pages.forEach(page => {
            if (page && page.trim().length > 0) {
                mappedPages.add(page.trim());
            }
        });
    });
    
    // Check if any of the mapped pages have user journey data (distance >= 0)
    let journeyCount = 0;
    mappedPages.forEach(page => {
        // Check in userJourneyData for this page with distance >= 0
        const hasJourneyData = userJourneyData.some(item => 
            item.page === page && 
            item.journeyPageDistance !== undefined && 
            item.journeyPageDistance !== null && 
            item.journeyPageDistance >= 0
        );
        
        if (hasJourneyData) {
            journeyCount++;
        }
    });
    
    return {
        hasJourney: journeyCount > 0,
        journeyCount: journeyCount,
        totalMappedPages: mappedPages.size
    };
}

// Function to determine fulfillment status (Pass/Fail)
function checkFulfillmentStatus(role, action, dataObject, access) {
    // Required access: passes if story exists AND journey exists
    if (access === 'Required') {
        const storyExists = checkUserStoryExists(role, action, dataObject);
        if (!storyExists) {
            return { status: 'Fail', reason: 'No user story exists' };
        }
        
        const journeyInfo = checkUserJourneyExists(role, action, dataObject);
        if (!journeyInfo.hasJourney) {
            return { status: 'Fail', reason: 'No user journey exists' };
        }
        
        return { status: 'Pass', reason: 'Story and journey exist' };
    }
    
    // Not Allowed access: passes if no story exists
    if (access === 'Not Allowed') {
        const storyExists = checkUserStoryExists(role, action, dataObject);
        if (!storyExists) {
            return { status: 'Pass', reason: 'No user story exists (as expected)' };
        } else {
            return { status: 'Fail', reason: 'User story exists but not allowed' };
        }
    }
    
    // For other access types, default to Pass
    return { status: 'Pass', reason: 'Access type allows' };
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
    const fulfillmentStatusFilter = document.getElementById('filterFulfillmentStatus')?.value || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesRole = !roleFilter || item.role === roleFilter;
        const matchesDataObject = !dataObjectFilter || (item.dataObject || '').toLowerCase().includes(dataObjectFilter);
        const matchesAction = !actionFilter || item.action === actionFilter;
        const matchesAccess = !accessFilter || item.access === accessFilter;
        
        // Check fulfillment status filter
        let matchesFulfillmentStatus = true;
        if (fulfillmentStatusFilter) {
            const fulfillmentInfo = checkFulfillmentStatus(item.role, item.action, item.dataObject, item.access);
            matchesFulfillmentStatus = fulfillmentInfo.status === fulfillmentStatusFilter;
        }
        
        return matchesRole && matchesDataObject && matchesAction && matchesAccess && matchesFulfillmentStatus;
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
    document.getElementById('filterFulfillmentStatus').value = '';
    
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
        { key: "userStoryStatus", label: "User Story Status", sortable: false },
        { key: "mappingStatus", label: "Mapping Status", sortable: false },
        { key: "userJourneyExists", label: "User Journey Exists", sortable: false },
        { key: "fulfillmentStatus", label: "Fulfillment Status", sortable: false }
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
                    const matchingStories = getMatchingUserStories(item.role, item.action, item.dataObject);
                    const statusDisplay = document.createElement("span");
                    statusDisplay.className = "user-story-status";
                    
                    // Determine if this is the desired state
                    let isDesired = false;
                    if (item.access === 'Required' && userStoryExists) {
                        isDesired = true;
                        statusDisplay.textContent = "✓ Story Exists";
                        statusDisplay.classList.add('status-good');
                        
                        // Add info icon with hover text showing matching stories
                        const infoIcon = document.createElement("span");
                        infoIcon.className = "codicon codicon-info";
                        infoIcon.style.marginLeft = "5px";
                        infoIcon.style.cursor = "help";
                        infoIcon.style.fontSize = "12px";
                        infoIcon.style.color = "var(--vscode-descriptionForeground)";
                        
                        // Create tooltip text
                        const tooltipText = matchingStories.map(story => 
                            `US${story.storyNumber || 'N/A'}: ${(story.storyText || '').substring(0, 100)}${story.storyText && story.storyText.length > 100 ? '...' : ''}`
                        ).join('\n');
                        infoIcon.title = `Found ${matchingStories.length} matching user stor${matchingStories.length === 1 ? 'y' : 'ies'}:\n\n${tooltipText}`;
                        
                        statusDisplay.appendChild(infoIcon);
                        
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
                        
                        // Add info icon with hover text showing matching stories (for "Not Allowed" case)
                        const infoIcon = document.createElement("span");
                        infoIcon.className = "codicon codicon-info";
                        infoIcon.style.marginLeft = "5px";
                        infoIcon.style.cursor = "help";
                        infoIcon.style.fontSize = "12px";
                        infoIcon.style.color = "var(--vscode-descriptionForeground)";
                        
                        // Create tooltip text
                        const tooltipText = matchingStories.map(story => 
                            `US${story.storyNumber || 'N/A'}: ${(story.storyText || '').substring(0, 100)}${story.storyText && story.storyText.length > 100 ? '...' : ''}`
                        ).join('\n');
                        infoIcon.title = `Found ${matchingStories.length} unexpected user stor${matchingStories.length === 1 ? 'y' : 'ies'}:\n\n${tooltipText}`;
                        
                        statusDisplay.appendChild(infoIcon);
                    }
                    
                    td.appendChild(statusDisplay);
                } else if (col.key === "mappingStatus") {
                    // Check mapping status for matching user stories
                    const mappingInfo = checkMappingStatus(item.role, item.action, item.dataObject);
                    const statusDisplay = document.createElement("span");
                    statusDisplay.className = "mapping-status";
                    
                    if (mappingInfo.totalCount === 0) {
                        // No user stories found
                        statusDisplay.textContent = "No Stories";
                        statusDisplay.classList.add('status-bad');
                    } else if (mappingInfo.mappedCount === mappingInfo.totalCount) {
                        // All user stories have mappings
                        statusDisplay.textContent = `✓ ${mappingInfo.mappedCount}/${mappingInfo.totalCount} Mapped`;
                        statusDisplay.classList.add('status-good');
                        
                        // Add info icon with hover text showing mapped pages
                        if (mappingInfo.mappingDetails && mappingInfo.mappingDetails.length > 0) {
                            const infoIcon = document.createElement("span");
                            infoIcon.className = "codicon codicon-info";
                            infoIcon.style.marginLeft = "5px";
                            infoIcon.style.cursor = "help";
                            infoIcon.style.fontSize = "12px";
                            infoIcon.style.color = "var(--vscode-descriptionForeground)";
                            
                            // Create hover text showing all mapped pages
                            let hoverText = "Mapped Pages:\n";
                            mappingInfo.mappingDetails.forEach(detail => {
                                hoverText += `\n"${detail.storyText}":\n`;
                                detail.pages.forEach(page => {
                                    hoverText += `  • ${page}\n`;
                                });
                            });
                            
                            infoIcon.title = hoverText.trim();
                            statusDisplay.appendChild(infoIcon);
                        }
                    } else if (mappingInfo.mappedCount > 0) {
                        // Some user stories have mappings
                        statusDisplay.textContent = `⚠ ${mappingInfo.mappedCount}/${mappingInfo.totalCount} Mapped`;
                        statusDisplay.classList.add('status-bad');
                        
                        // Add info icon with hover text showing mapped pages
                        if (mappingInfo.mappingDetails && mappingInfo.mappingDetails.length > 0) {
                            const infoIcon = document.createElement("span");
                            infoIcon.className = "codicon codicon-info";
                            infoIcon.style.marginLeft = "5px";
                            infoIcon.style.cursor = "help";
                            infoIcon.style.fontSize = "12px";
                            infoIcon.style.color = "var(--vscode-descriptionForeground)";
                            
                            // Create hover text showing mapped pages
                            let hoverText = "Mapped Pages:\n";
                            mappingInfo.mappingDetails.forEach(detail => {
                                hoverText += `\n"${detail.storyText}":\n`;
                                detail.pages.forEach(page => {
                                    hoverText += `  • ${page}\n`;
                                });
                            });
                            
                            infoIcon.title = hoverText.trim();
                            statusDisplay.appendChild(infoIcon);
                        }
                    } else {
                        // No user stories have mappings
                        statusDisplay.textContent = `✗ 0/${mappingInfo.totalCount} Mapped`;
                        statusDisplay.classList.add('status-bad');
                    }
                    
                    td.appendChild(statusDisplay);
                } else if (col.key === "userJourneyExists") {
                    // Check if user journey exists for mapped pages
                    const journeyInfo = checkUserJourneyExists(item.role, item.action, item.dataObject);
                    const statusDisplay = document.createElement("span");
                    statusDisplay.className = "journey-status";
                    
                    if (journeyInfo.totalMappedPages === 0) {
                        // No mapped pages
                        statusDisplay.textContent = "No Mapped Pages";
                        statusDisplay.classList.add('status-neutral');
                    } else if (journeyInfo.hasJourney) {
                        // Has user journey data
                        if (journeyInfo.journeyCount === journeyInfo.totalMappedPages) {
                            statusDisplay.textContent = `✓ ${journeyInfo.journeyCount}/${journeyInfo.totalMappedPages} Journey`;
                            statusDisplay.classList.add('status-good');
                        } else {
                            statusDisplay.textContent = `⚠ ${journeyInfo.journeyCount}/${journeyInfo.totalMappedPages} Journey`;
                            statusDisplay.classList.add('status-bad');
                        }
                    } else {
                        // No user journey data
                        statusDisplay.textContent = `✗ No Journey`;
                        statusDisplay.classList.add('status-bad');
                    }
                    
                    td.appendChild(statusDisplay);
                } else if (col.key === "fulfillmentStatus") {
                    // Check fulfillment status (Pass/Fail)
                    const fulfillmentInfo = checkFulfillmentStatus(item.role, item.action, item.dataObject, item.access);
                    const statusDisplay = document.createElement("span");
                    statusDisplay.className = "fulfillment-status";
                    
                    if (fulfillmentInfo.status === 'Pass') {
                        statusDisplay.textContent = "✓ Pass";
                        statusDisplay.classList.add('status-good');
                    } else {
                        statusDisplay.textContent = "✗ Fail";
                        statusDisplay.classList.add('status-bad');
                    }
                    
                    // Add tooltip with reason
                    statusDisplay.title = fulfillmentInfo.reason;
                    
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
        td.colSpan = 8; // Number of columns including User Story Status, Mapping Status, User Journey Exists, and Fulfillment Status
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
    const filterInputs = ['filterRole', 'filterDataObject', 'filterAction', 'filterAccess', 'filterFulfillmentStatus'];
    
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
        const data = message.data || { items: [], totalRecords: 0, sortColumn: 'role', sortDescending: false, userStories: [], pageMappings: {} };
        
        // Store all items for filtering
        allItems = data.items || [];
        
        // Store user stories for validation
        userStories = data.userStories || [];
        console.log("[Webview] Stored", userStories.length, "user stories for validation");
        
        // Store page mappings for mapping status validation
        pageMappings = data.pageMappings || {};
        console.log("[Webview] Stored", Object.keys(pageMappings).length, "page mappings for validation");
        
        // Store user journey data for journey existence validation
        userJourneyData = data.userJourneyData || [];
        console.log("[Webview] Stored", userJourneyData.length, "user journey items for validation");
        
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
