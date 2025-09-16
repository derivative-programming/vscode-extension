/**
 * File: dataObjectUsageAnalysisView.js
 * Purpose: Data Object Usage Analysis webview interface with two-tab structure
 * Last Modified: 2024-01-09
 */

const vscode = acquireVsCodeApi();

// State management
let currentSummaryData = [];
let currentDetailData = [];
let currentSortColumn = null;
let currentSortDirection = 'asc';
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
            <td class="action-cell">
                <button class="view-details-btn" data-object-name="${escapeHtml(item.dataObjectName)}">
                    View Details
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
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
            <td>${escapeHtml(item.itemType)}</td>
        `;
        tableBody.appendChild(row);
    });
    
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
        if (cells.length < 4) {
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
    
    // Determine sort direction
    if (currentSortColumn === columnIndex) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDirection = 'asc';
        currentSortColumn = columnIndex;
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
        
        return currentSortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Clear tbody and re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    
    // Update sort indicators in headers
    updateSortIndicators(table, columnIndex, currentSortDirection);
}

// Update sort indicators
function updateSortIndicators(table, sortedColumn, direction) {
    const headers = table.querySelectorAll('th[onclick]');
    
    headers.forEach((header, index) => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (index === sortedColumn) {
            header.classList.add(`sort-${direction}`);
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