/**
 * File: dataObjectUsageAnalysisView.js
 * Purpose: Data Object Usage Analysis webview interface with two-tab structure
 * Last Modified: 2024-01-09
 */

const vscode = acquireVsCodeApi();

// State management
let currentSummaryData = [];
let currentDetailData = [];
let treemapData = [];
let summarySort = { column: null, direction: 'asc' };
let detailSort = { column: null, direction: 'asc' };
let currentTab = 'summary';

// Initialize the view
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    loadSummaryData();
    setupEventListeners();
});

// Tab switching functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Update buttons
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Update content
    tabContents.forEach(content => {
        if (content.id === tabName + '-tab') {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    currentTab = tabName;
    
    // Load data for the selected tab
    if (tabName === 'summary') {
        loadSummaryData();
    } else if (tabName === 'detail') {
        loadDetailData();
    } else if (tabName === 'treemap') {
        loadTreemapData();
    } else if (tabName === 'bubble') {
        loadBubbleData();
    }
}

// Load summary data
function loadSummaryData() {
    vscode.postMessage({ command: 'getSummaryData' });
}

// Load detail data
function loadDetailData() {
    vscode.postMessage({ command: 'getDetailData' });
}

// Setup event listeners
function setupEventListeners() {
    // Export buttons
    const exportSummaryBtn = document.getElementById('exportSummaryBtn');
    const exportDetailBtn = document.getElementById('exportDetailBtn');
    const refreshSummaryBtn = document.getElementById('refreshSummaryButton');
    const refreshDetailBtn = document.getElementById('refreshDetailButton');
    
    if (exportSummaryBtn) {
        exportSummaryBtn.addEventListener('click', function() {
            console.log('Summary export button clicked, data:', currentSummaryData);
            vscode.postMessage({ command: 'exportToCSV', data: { items: currentSummaryData } });
        });
    }
    
    if (exportDetailBtn) {
        exportDetailBtn.addEventListener('click', function() {
            console.log('Detail export button clicked, data:', currentDetailData);
            vscode.postMessage({ command: 'exportToCSV', data: { items: currentDetailData } });
        });
    }
    
    if (refreshSummaryBtn) {
        refreshSummaryBtn.addEventListener('click', function() {
            showSpinner();
            loadSummaryData();
        });
    }
    
    if (refreshDetailBtn) {
        refreshDetailBtn.addEventListener('click', function() {
            showSpinner();
            loadDetailData();
        });
    }
    
    // Filter inputs
    const summaryFilter = document.getElementById('summaryFilter');
    const detailFilter = document.getElementById('detailFilter');
    const referenceTypeFilter = document.getElementById('filterReferenceType');
    const referencedByFilter = document.getElementById('filterReferencedBy');
    
    if (summaryFilter) {
        summaryFilter.addEventListener('input', function() {
            filterSummaryTable(this.value);
        });
    }
    
    if (detailFilter) {
        detailFilter.addEventListener('input', function() {
            filterDetailTable();
        });
    }
    
    if (referenceTypeFilter) {
        referenceTypeFilter.addEventListener('change', function() {
            filterDetailTable();
        });
    }
    
    if (referencedByFilter) {
        referencedByFilter.addEventListener('input', function() {
            filterDetailTable();
        });
    }
    
    // Event delegation for view details buttons
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('view-details-btn')) {
            const objectName = event.target.getAttribute('data-object-name');
            if (objectName) {
                viewDetails(objectName);
            }
        }
        
        // Handle filter section toggles
        if (event.target.closest('[data-action="toggle-filter"]')) {
            toggleFilterSection();
        }
        
        if (event.target.closest('[data-action="toggle-detail-filter"]')) {
            toggleDetailFilterSection();
        }
        
        // Handle clear filter buttons
        if (event.target.closest('[data-action="clear-filters"]')) {
            clearFilters();
        }
        
        if (event.target.closest('[data-action="clear-detail-filters"]')) {
            clearDetailFilters();
        }
        
        // Handle edit buttons in detail table
        if (event.target.closest('.edit-button')) {
            const button = event.target.closest('.edit-button');
            const itemType = button.getAttribute('data-item-type');
            const itemName = button.getAttribute('data-item-name');
            const referenceType = button.getAttribute('data-reference-type');
            if (itemType && itemName) {
                vscode.postMessage({
                    command: 'viewDetails',
                    data: { itemType: itemType, itemName: itemName, referenceType: referenceType }
                });
            }
        }
        
        // Handle table header sorting
        const sortableHeader = event.target.closest('th[data-sort-column]');
        if (sortableHeader) {
            const column = parseInt(sortableHeader.getAttribute('data-sort-column'));
            const table = sortableHeader.getAttribute('data-table');
            if (!isNaN(column) && table) {
                sortTable(column, table);
            }
        }
    });
}

// Render summary table
function renderSummaryTable(data) {
    currentSummaryData = data;
    const tableBody = document.getElementById('summaryTableBody');
    const loadingElement = document.getElementById('summary-loading');
    const tableContainer = document.getElementById('summary-table-container');
    
    if (!tableBody) {
        return;
    }
    
    // Hide loading message and show table
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (tableContainer) {
        tableContainer.classList.remove('hidden');
    }
    
    tableBody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.dataObjectName)}</td>
            <td class="number-cell">${item.totalReferences}</td>
            <td class="number-cell">${item.formReferences}</td>
            <td class="number-cell">${item.reportReferences}</td>
            <td class="number-cell">${item.flowReferences}</td>
            <td class="number-cell">${item.userStoryReferences || 0}</td>
            <td class="action-cell">
                <button class="view-details-btn" data-object-name="${escapeHtml(item.dataObjectName)}">
                    View Details
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Initialize sort indicators - summary data comes pre-sorted by data object name ascending
    const summaryTable = document.getElementById('summary-table');
    if (summaryTable) {
        summarySort.column = 0; // Data Object Name column
        summarySort.direction = 'asc';
        updateSortIndicators(summaryTable, 0, 'asc');
    }
}

// Render detail table
function renderDetailTable(data) {
    currentDetailData = data;
    const tableBody = document.getElementById('detailTableBody');
    const loadingElement = document.getElementById('detail-loading');
    const tableContainer = document.getElementById('detail-table-container');
    
    if (!tableBody) {
        return;
    }
    
    // Hide loading message and show table
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (tableContainer) {
        tableContainer.classList.remove('hidden');
    }
    
    tableBody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.dataObjectName)}</td>
            <td>${escapeHtml(item.referenceType)}</td>
            <td>${escapeHtml(item.referencedBy)}</td>
            <td class="action-cell">
                <button class="edit-button" data-item-type="${escapeHtml(item.itemType)}" data-item-name="${escapeHtml(item.referencedBy)}" data-reference-type="${escapeHtml(item.referenceType)}" title="Open ${item.itemType} details">
                    <i class="codicon codicon-edit"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Initialize sort indicators - detail data comes pre-sorted by data object name ascending
    const detailTable = document.getElementById('detail-table');
    if (detailTable) {
        detailSort.column = 0; // Data Object Name column
        detailSort.direction = 'asc';
        updateSortIndicators(detailTable, 0, 'asc');
    }
    
    // Populate the reference type dropdown
    populateReferenceTypeDropdown(data);
}

// Populate reference type dropdown with unique values
function populateReferenceTypeDropdown(data) {
    const dropdown = document.getElementById('filterReferenceType');
    if (!dropdown) {
        return;
    }
    
    // Get unique reference types
    const referenceTypes = [...new Set(data.map(item => item.referenceType))].sort();
    
    // Clear existing options except "All Types"
    dropdown.innerHTML = '<option value="">All Types</option>';
    
    // Add reference type options
    referenceTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        dropdown.appendChild(option);
    });
}

// Filter summary table
function filterSummaryTable(filterText) {
    const rows = document.querySelectorAll('#summaryTableBody tr');
    const filter = filterText.toLowerCase();
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let shouldShow = false;
        
        // Check all text cells (skip action cell)
        for (let i = 0; i < cells.length - 1; i++) {
            if (cells[i].textContent.toLowerCase().includes(filter)) {
                shouldShow = true;
                break;
            }
        }
        
        row.style.display = shouldShow ? '' : 'none';
    });
}

// Filter detail table with multiple criteria
function filterDetailTable(filterText) {
    const rows = document.querySelectorAll('#detailTableBody tr');
    
    // Get all filter values
    const dataObjectFilter = document.getElementById('detailFilter')?.value?.toLowerCase() || '';
    const referenceTypeFilter = document.getElementById('filterReferenceType')?.value || '';
    const referencedByFilter = document.getElementById('filterReferencedBy')?.value?.toLowerCase() || '';
    
    // If filterText is provided (from function parameter), use it for data object filter
    const actualDataObjectFilter = filterText ? filterText.toLowerCase() : dataObjectFilter;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) {
            return;
        }
        
        const dataObjectName = cells[0].textContent.toLowerCase();
        const referenceType = cells[1].textContent;
        const referencedBy = cells[2].textContent.toLowerCase();
        
        let shouldShow = true;
        
        // Apply data object filter
        if (actualDataObjectFilter && !dataObjectName.includes(actualDataObjectFilter)) {
            shouldShow = false;
        }
        
        // Apply reference type filter
        if (referenceTypeFilter && referenceType !== referenceTypeFilter) {
            shouldShow = false;
        }
        
        // Apply referenced by filter
        if (referencedByFilter && !referencedBy.includes(referencedByFilter)) {
            shouldShow = false;
        }
        
        row.style.display = shouldShow ? '' : 'none';
    });
}

// View details for specific data object
function viewDetails(dataObjectName) {
    switchTab('detail');
    // Apply filter to show only this data object
    const detailFilter = document.getElementById('detailFilter');
    if (detailFilter) {
        detailFilter.value = dataObjectName;
        filterDetailTable(dataObjectName);
    }
}

// Sort table functionality
function sortTable(columnIndex, tableId) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Get the appropriate sort state for this table
    const sortState = tableId === 'summary-table' ? summarySort : detailSort;
    
    // Determine sort direction
    if (sortState.column === columnIndex) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.direction = 'asc';
        sortState.column = columnIndex;
    }
    
    // Sort rows
    rows.sort((a, b) => {
        const cellA = a.cells[columnIndex].textContent.trim();
        const cellB = b.cells[columnIndex].textContent.trim();
        
        // Check if values are numeric
        const numA = parseFloat(cellA);
        const numB = parseFloat(cellB);
        
        let comparison = 0;
        if (!isNaN(numA) && !isNaN(numB)) {
            comparison = numA - numB;
        } else {
            comparison = cellA.localeCompare(cellB);
        }
        
        return sortState.direction === 'asc' ? comparison : -comparison;
    });
    
    // Clear tbody and re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    
    // Update sort indicators in headers
    updateSortIndicators(table, columnIndex, sortState.direction);
}

// Update sort indicators
function updateSortIndicators(table, sortedColumn, direction) {
    const headers = table.querySelectorAll('th[data-sort-column]');
    
    headers.forEach((header, index) => {
        const indicator = header.querySelector('.sort-indicator');
        if (!indicator) {
            return;
        }
        
        if (index === sortedColumn) {
            // This is the active sorted column
            indicator.classList.add('active');
            indicator.textContent = direction === 'asc' ? '▲' : '▼';
        } else {
            // This is an inactive column
            indicator.classList.remove('active');
            indicator.textContent = '▼';
        }
    });
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Message handling from extension
window.addEventListener('message', event => {
    const message = event.data;
    console.log('Received message:', message);
    
    switch (message.command) {
        case 'summaryData':
            console.log('Rendering summary data:', message.data);
            renderSummaryTable(message.data);
            // Also render treemap if that's the current tab
            if (currentTab === 'treemap') {
                renderTreemap(message.data);
            }
            // Also render bubble chart if that's the current tab
            if (currentTab === 'bubble') {
                renderBubbleChart(message.data);
            }
            hideSpinner();
            break;
            
        case 'detailData':
            console.log('Rendering detail data:', message.data);
            renderDetailTable(message.data);
            hideSpinner();
            break;
            
        case 'exportComplete':
            if (message.success) {
                // Show success message or notification
                console.log('Export completed successfully');
            } else {
                console.error('Export failed:', message.error);
            }
            break;
            
        case 'csvExportReady':
            console.log('CSV export ready');
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

// Clear all summary filters
function clearFilters() {
    const summaryFilter = document.getElementById('summaryFilter');
    if (summaryFilter) {
        summaryFilter.value = '';
        filterSummaryTable('');
    }
}

// Clear all detail filters
function clearDetailFilters() {
    const detailFilter = document.getElementById('detailFilter');
    const referenceTypeFilter = document.getElementById('filterReferenceType');
    const referencedByFilter = document.getElementById('filterReferencedBy');
    
    if (detailFilter) {
        detailFilter.value = '';
    }
    if (referenceTypeFilter) {
        referenceTypeFilter.value = '';
    }
    if (referencedByFilter) {
        referencedByFilter.value = '';
    }
    
    filterDetailTable();
}

// Toggle filter section visibility
function toggleFilterSection() {
    const content = document.getElementById('filterContent');
    const chevron = document.getElementById('filterChevron');
    
    if (content && chevron) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            chevron.classList.remove('codicon-chevron-right');
            chevron.classList.add('codicon-chevron-down');
        } else {
            content.style.display = 'none';
            chevron.classList.remove('codicon-chevron-down');
            chevron.classList.add('codicon-chevron-right');
        }
    }
}

// Toggle detail filter section visibility
function toggleDetailFilterSection() {
    const content = document.getElementById('detailFilterContent');
    const chevron = document.getElementById('detailFilterChevron');
    
    if (content && chevron) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            chevron.classList.remove('codicon-chevron-right');
            chevron.classList.add('codicon-chevron-down');
        } else {
            content.style.display = 'none';
            chevron.classList.remove('codicon-chevron-down');
            chevron.classList.add('codicon-chevron-right');
        }
    }
}

// Show spinner
function showSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.classList.remove("hidden");
        spinnerOverlay.classList.add("show-flex");
    }
}

// Hide spinner
function hideSpinner() {
    const spinnerOverlay = document.getElementById("spinner-overlay");
    if (spinnerOverlay) {
        spinnerOverlay.classList.add("hidden");
        spinnerOverlay.classList.remove("show-flex");
    }
}

// Treemap functionality

// Load treemap data
function loadTreemapData() {
    // Use the same summary data for treemap
    vscode.postMessage({ command: 'getSummaryData' });
}

// Render treemap visualization
function renderTreemap(data) {
    treemapData = data;
    const container = document.getElementById('treemap-visualization');
    const loadingElement = document.getElementById('treemap-loading');
    
    if (!container || !loadingElement) {
        console.error('Treemap container elements not found');
        return;
    }
    
    // Show container and hide loading
    container.classList.remove('hidden');
    loadingElement.classList.add('hidden');
    
    // Clear previous content
    container.innerHTML = '';
    
    // Set up dimensions
    const containerRect = container.getBoundingClientRect();
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = Math.max(800, containerRect.width - margin.left - margin.right);
    const height = 500 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
        
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Prepare data for treemap
    const hierarchyData = {
        name: 'root',
        children: data.map(item => ({
            name: item.dataObjectName,
            value: Math.max(1, item.totalReferences), // Ensure minimum size of 1
            totalReferences: item.totalReferences,
            formReferences: item.formReferences || 0,
            reportReferences: item.reportReferences || 0,
            flowReferences: item.flowReferences || 0,
            userStoryReferences: item.userStoryReferences || 0
        }))
    };
    
    // Create treemap layout
    const treemap = d3.treemap()
        .size([width, height])
        .padding(2)
        .round(true);
    
    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    
    treemap(root);
    
    // Color scale based on usage levels
    const colorScale = d3.scaleThreshold()
        .domain([1, 5, 20])
        .range(['var(--vscode-button-secondaryBackground)', '#28a745', '#f66a0a', '#d73a49']);
    
    // Create tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'treemap-tooltip')
        .style('opacity', 0);
    
    // Create rectangles
    const cell = g.selectAll('g')
        .data(root.leaves())
        .enter().append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);
    
    cell.append('rect')
        .attr('class', 'treemap-rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => getUsageColor(d.data.totalReferences))
        .on('mouseover', function(event, d) {
            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            
            const tooltipContent = `
                <strong>${d.data.name}</strong><br/>
                Total References: ${d.data.totalReferences}<br/>
                Forms: ${d.data.formReferences}<br/>
                Reports: ${d.data.reportReferences}<br/>
                Flows: ${d.data.flowReferences}<br/>
                User Stories: ${d.data.userStoryReferences}
            `;
            
            tooltip.html(tooltipContent)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        })
        .on('click', function(event, d) {
            // Switch to detail tab and filter by this data object
            switchTab('detail');
            const detailFilter = document.getElementById('detailFilter');
            if (detailFilter) {
                detailFilter.value = d.data.name;
                filterDetailTable(d.data.name);
            }
        });
    
    // Add text labels
    cell.append('text')
        .attr('class', 'treemap-text')
        .attr('x', d => (d.x1 - d.x0) / 2)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .text(d => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            // Only show text if rectangle is large enough
            if (width > 60 && height > 20) {
                return d.data.name;
            }
            return '';
        })
        .style('font-size', d => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            const area = width * height;
            return Math.min(14, Math.max(8, Math.sqrt(area) / 8)) + 'px';
        });
}

// Load bubble chart data
function loadBubbleData() {
    // Use the same summary data for bubble chart
    vscode.postMessage({ command: 'getSummaryData' });
}

// Render bubble chart visualization
function renderBubbleChart(data) {
    const container = document.getElementById('bubble-visualization');
    const loadingElement = document.getElementById('bubble-loading');
    
    if (!container || !loadingElement) {
        console.error('Bubble chart container elements not found');
        return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Setup dimensions
    const margin = {top: 20, right: 20, bottom: 60, left: 80};
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Setup scales
    const xExtent = d3.extent(data, d => d.propertyCount);
    const yExtent = d3.extent(data, d => d.totalReferences);
    const sizeExtent = d3.extent(data, d => d.userStoryReferences);
    
    const xScale = d3.scaleLinear()
        .domain([0, Math.max(1, xExtent[1])])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, Math.max(1, yExtent[1])])
        .range([height, 0]);
    
    const sizeScale = d3.scaleSqrt()
        .domain([0, Math.max(1, sizeExtent[1])])
        .range([4, 30]);
    
    // Add quadrant lines
    const xMidpoint = xScale(xExtent[1] / 2);
    const yMidpoint = yScale(yExtent[1] / 2);
    
    // Vertical line (complexity divider)
    g.append('line')
        .attr('x1', xMidpoint)
        .attr('x2', xMidpoint)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5);
    
    // Horizontal line (usage divider)
    g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yMidpoint)
        .attr('y2', yMidpoint)
        .attr('stroke', 'var(--vscode-panel-border)')
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5);
    
    // Add axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', 'var(--vscode-foreground)')
        .style('text-anchor', 'middle')
        .text('Property Count (Complexity)');
    
    g.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -height / 2)
        .attr('fill', 'var(--vscode-foreground)')
        .style('text-anchor', 'middle')
        .text('Total References (Usage)');
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'bubble-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'var(--vscode-editor-hoverHighlightBackground)')
        .style('border', '1px solid var(--vscode-panel-border)')
        .style('border-radius', '3px')
        .style('padding', '8px')
        .style('font-size', '12px')
        .style('z-index', '1000')
        .style('pointer-events', 'none');
    
    // Add bubbles
    g.selectAll('.bubble')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'bubble')
        .attr('cx', d => xScale(d.propertyCount))
        .attr('cy', d => yScale(d.totalReferences))
        .attr('r', d => sizeScale(d.userStoryReferences))
        .attr('fill', d => getBubbleColor(d.propertyCount, d.totalReferences, xExtent[1], yExtent[1]))
        .attr('stroke', 'var(--vscode-foreground)')
        .attr('stroke-width', 1)
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`
                <strong>${d.dataObjectName}</strong><br/>
                Properties: ${d.propertyCount}<br/>
                Total References: ${d.totalReferences}<br/>
                User Stories: ${d.userStoryReferences}<br/>
                Forms: ${d.formReferences}<br/>
                Reports: ${d.reportReferences}<br/>
                Flows: ${d.flowReferences}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.7);
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Hide loading and show visualization
    loadingElement.classList.add('hidden');
    container.classList.remove('hidden');
}

// Get bubble color based on quadrant
function getBubbleColor(complexity, usage, maxComplexity, maxUsage) {
    const isHighComplexity = complexity > (maxComplexity / 2);
    const isHighUsage = usage > (maxUsage / 2);
    
    if (isHighUsage && !isHighComplexity) {
        return '#28a745'; // Green - High usage, low complexity (good design)
    } else if (isHighUsage && isHighComplexity) {
        return '#dc3545'; // Red - High usage, high complexity (needs attention)
    } else if (!isHighUsage && !isHighComplexity) {
        return '#6c757d'; // Gray - Low usage, low complexity (simple utility)
    } else {
        return '#fd7e14'; // Orange - Low usage, high complexity (potential over-engineering)
    }
}

// Get color based on usage level
function getUsageColor(totalReferences) {
    if (totalReferences >= 20) {
        return '#d73a49';  // High usage - red
    }
    if (totalReferences >= 5) {
        return '#f66a0a';   // Medium usage - orange  
    }
    if (totalReferences >= 1) {
        return '#28a745';   // Low usage - green
    }
    return 'var(--vscode-button-secondaryBackground)'; // No usage - gray
}