// eventHandlers.js
// Event handling logic for page flow diagram
// Created: July 13, 2025

"use strict";

// Variables for state management
let selectedRoles = new Set(); // Track selected roles
let currentZoom = 1; // Current zoom level
let tooltip; // Tooltip element

// Initialize event handlers
function initializeEventHandlers(flowData, vscode) {
    // Set global references
    window.pageflowDiagram = {
        flowData: flowData,
        vscode: vscode,
        currentZoom: currentZoom,
        showTooltip: showTooltip,
        hideTooltip: hideTooltip,
        updateTooltipPosition: updateTooltipPosition,
        updateZoomDisplay: updateZoomDisplay
    };

    // Initialize DOM elements
    tooltip = document.getElementById('tooltip');
    
    // Populate role filter
    populateRoleFilter();
    
    // Add search functionality
    document.getElementById('searchPages').addEventListener('input', searchPages);
    
    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateFlowData':
                handleFlowDataUpdate(message.flowData);
                break;
        }
    });
}

// Role filter population
function populateRoleFilter() {
    const roleFilterOptions = document.getElementById('roleFilterOptions');
    const roles = [...new Set(window.pageflowDiagram.flowData.pages.map(page => page.roleRequired).filter(role => role))];
    
    // Add "Public Pages" option for pages without role requirements
    const hasPublicPages = window.pageflowDiagram.flowData.pages.some(page => !page.roleRequired);
    
    if (hasPublicPages) {
        const publicItem = document.createElement('div');
        publicItem.className = 'role-checkbox-item';
        publicItem.innerHTML = 
            '<input type="checkbox" id="role-PUBLIC" checked onchange="window.pageflowHandlers.handleRoleChange(this)">' +
            '<label for="role-PUBLIC">Public Pages</label>';
        roleFilterOptions.appendChild(publicItem);
        selectedRoles.add('PUBLIC');
    }
    
    roles.forEach(role => {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-checkbox-item';
        roleItem.innerHTML = 
            '<input type="checkbox" id="role-' + role + '" checked onchange="window.pageflowHandlers.handleRoleChange(this)">' +
            '<label for="role-' + role + '">' + role + '</label>';
        roleFilterOptions.appendChild(roleItem);
        selectedRoles.add(role);
    });
}

// Role change handler
function handleRoleChange(checkbox) {
    const roleValue = checkbox.id.replace('role-', '');
    
    if (checkbox.checked) {
        selectedRoles.add(roleValue);
    } else {
        selectedRoles.delete(roleValue);
    }
    
    renderDiagram();
}

// Search functionality
function searchPages() {
    const searchText = document.getElementById('searchPages').value.toLowerCase();
    
    // Clear previous search highlights
    clearSearchHighlights();
    
    // If search is empty, just clear highlights and return
    if (!searchText.trim()) {
        renderDiagram();
        return;
    }
    
    let exactMatchNode = null;
    let matchCount = 0;
    
    // Find matching pages and mark them for highlighting
    window.pageflowDiagram.flowData.pages.forEach(page => {
        const pageName = page.name.toLowerCase();
        const pageTitle = (page.titleText || '').toLowerCase();
        
        // Check if page name or title matches
        const nameMatch = pageName.includes(searchText);
        const titleMatch = pageTitle.includes(searchText);
        
        if (nameMatch || titleMatch) {
            matchCount++;
            
            // Check for exact match vs partial match
            if (pageName === searchText || pageTitle === searchText) {
                // Exact match - use bright green
                page.searchHighlight = true;
                page.searchPartial = false;
                if (!exactMatchNode) {
                    exactMatchNode = page;
                }
            } else {
                // Partial match - use light green
                page.searchHighlight = false;
                page.searchPartial = true;
            }
        } else {
            // No match
            page.searchHighlight = false;
            page.searchPartial = false;
        }
    });
    
    console.log('[DEBUG] Search results:', {
        searchText,
        matchCount,
        exactMatch: exactMatchNode ? exactMatchNode.name : 'none'
    });
    
    // Re-render the diagram to apply search highlighting
    renderDiagram();
}

function clearSearchHighlights() {
    window.pageflowDiagram.flowData.pages.forEach(page => {
        page.searchHighlight = false;
        page.searchPartial = false;
    });
}

// Flow data update handler
function handleFlowDataUpdate(newFlowData) {
    // Update the flow data and re-render
    Object.assign(window.pageflowDiagram.flowData, newFlowData);
    console.log('[DEBUG] Received updated flow data:', window.pageflowDiagram.flowData);
    
    // Re-populate role filter with new data
    const roleFilterOptions = document.getElementById('roleFilterOptions');
    roleFilterOptions.innerHTML = '';
    selectedRoles.clear();
    populateRoleFilter();
    
    // Re-render the diagram with new data
    renderDiagram();
    
    // Remove refresh notification and show success
    const refreshNotification = document.getElementById('refreshNotification');
    if (refreshNotification && refreshNotification.parentNode) {
        refreshNotification.parentNode.removeChild(refreshNotification);
    }
    
    // Show success notification
    const successNotification = document.createElement('div');
    successNotification.style.position = 'fixed';
    successNotification.style.top = '10px';
    successNotification.style.right = '10px';
    successNotification.style.backgroundColor = 'var(--vscode-notifications-background)';
    successNotification.style.color = 'var(--vscode-notifications-foreground)';
    successNotification.style.padding = '8px 12px';
    successNotification.style.borderRadius = '4px';
    successNotification.style.border = '1px solid var(--vscode-notifications-border)';
    successNotification.style.zIndex = '1000';
    successNotification.style.fontSize = '12px';
    successNotification.textContent = 'Diagram refreshed successfully';
    
    document.body.appendChild(successNotification);
    
    // Remove success notification after 2 seconds
    setTimeout(() => {
        if (successNotification.parentNode) {
            successNotification.parentNode.removeChild(successNotification);
        }
    }, 2000);
}

// Tooltip functions
function showTooltip(event, data) {
    if (!tooltip) {
        return;
    }
    
    // Build tooltip content
    let content = '<div class="tooltip-title">' + data.titleText + '</div>';
    content += '<div class="tooltip-content">';
    content += '<div class="tooltip-section"><strong>Type:</strong> ' + data.type.charAt(0).toUpperCase() + data.type.slice(1) + '</div>';
    content += '<div class="tooltip-section"><strong>Object:</strong> ' + data.objectName + '</div>';
    
    if (data.type === 'report' && data.visualizationType) {
        content += '<div class="tooltip-section"><strong>Visualization:</strong> ' + data.visualizationType + '</div>';
    }
    
    if (data.roleRequired) {
        content += '<div class="tooltip-section"><strong>Role Required:</strong> ' + data.roleRequired + '</div>';
    } else {
        content += '<div class="tooltip-section"><strong>Access:</strong> Public</div>';
    }
    
    if (data.buttons && data.buttons.length > 0) {
        content += '<div class="tooltip-section"><strong>Buttons (' + data.buttons.length + '):</strong>';
        data.buttons.forEach(button => {
            content += '<br>&nbsp;&nbsp;• ' + (button.buttonText || button.buttonName) + ' → ' + button.destinationTargetName;
        });
        content += '</div>';
    }
    
    content += '</div>';
    
    tooltip.innerHTML = content;
    tooltip.classList.add('visible');
    
    updateTooltipPosition(event);
}

function hideTooltip() {
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

function updateTooltipPosition(event) {
    if (!tooltip) {
        return;
    }
    
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let left = event.clientX + 10;
    let top = event.clientY + 10;
    
    // Adjust if tooltip would go off screen
    if (left + tooltipRect.width > windowWidth) {
        left = event.clientX - tooltipRect.width - 10;
    }
    if (top + tooltipRect.height > windowHeight) {
        top = event.clientY - tooltipRect.height - 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

// Zoom display update
function updateZoomDisplay() {
    const zoomDisplay = document.getElementById('zoomLevel');
    if (zoomDisplay) {
        zoomDisplay.textContent = Math.round(window.pageflowDiagram.currentZoom * 100) + '%';
    }
}

// Main render diagram function
function renderDiagram() {
    // Clear previous content
    window.pageflowRenderer.clearDiagram();
    
    // Filter pages by selected roles
    let filteredPages = window.pageflowDiagram.flowData.pages;
    if (selectedRoles.size > 0) {
        filteredPages = window.pageflowDiagram.flowData.pages.filter(page => {
            // Check if page matches any selected role
            if (selectedRoles.has('PUBLIC') && !page.roleRequired) {
                return true; // Show public pages
            }
            return page.roleRequired && selectedRoles.has(page.roleRequired);
        });
    }
    // If no roles are selected, show all pages (this is the default behavior)
    
    // Check if there are any pages to display
    if (filteredPages.length === 0) {
        showEmptyState();
        updateStatistics([], []);
        return;
    }
    
    // Filter connections to only include filtered pages
    const filteredConnections = window.pageflowDiagram.flowData.connections.filter(conn => 
        filteredPages.some(page => page.name === conn.from) &&
        filteredPages.some(page => page.name === conn.to)
    );
    
    // Prepare data for D3
    const nodes = filteredPages.map(page => ({
        id: page.name,
        ...page,
        x: Math.random() * 800 + 100,
        y: Math.random() * 600 + 100
    }));
    
    const links = filteredConnections.map(conn => ({
        source: conn.from,
        target: conn.to,
        ...conn
    }));
    
    // Always use force-directed layout
    window.pageflowRenderer.renderForceDirectedLayout(nodes, links);
    
    // Update statistics
    updateStatistics(filteredPages, filteredConnections);
}

// Empty state display
function showEmptyState() {
    const container = document.getElementById('flowContainer');
    const totalPages = window.pageflowDiagram.flowData.pages ? window.pageflowDiagram.flowData.pages.length : 'undefined';
    const selectedRolesArray = Array.from(selectedRoles);
    const roleFilter = selectedRolesArray.length > 0 ? selectedRolesArray.join(', ') : 'All Roles';
    
    container.innerHTML = '<div class="empty-state">' +
        '<h3>No Pages Found</h3>' +
        '<p>No pages match the current filter criteria.</p>' +
        '<p><strong>Total pages in model:</strong> ' + totalPages + '</p>' +
        '<p><strong>Selected roles:</strong> ' + roleFilter + '</p>' +
        '<p>Try adjusting the role filter or search criteria.</p>' +
        '</div>';
}

// Statistics update
function updateStatistics(pages, connections) {
    // Update stats in the info panel
    const statsContainer = document.querySelector('.stats');
    if (statsContainer) {
        statsContainer.innerHTML = 
            '<div class="stat">' +
                '<div class="stat-number">' + pages.length + '</div>' +
                '<div class="stat-label">Pages</div>' +
            '</div>' +
            '<div class="stat">' +
                '<div class="stat-number">' + connections.length + '</div>' +
                '<div class="stat-label">Connections</div>' +
            '</div>';
    }
}

// Export functions for global access
window.pageflowHandlers = {
    initializeEventHandlers,
    handleRoleChange,
    renderDiagram,
    searchPages,
    showTooltip,
    hideTooltip,
    updateTooltipPosition,
    updateZoomDisplay
};
