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
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
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
    
    if (exportSummaryBtn) {
        exportSummaryBtn.addEventListener('click', function() {
            vscode.postMessage({ command: 'exportToCSV', data: { type: 'summary', data: currentSummaryData } });
        });
    }
    
    if (exportDetailBtn) {
        exportDetailBtn.addEventListener('click', function() {
            vscode.postMessage({ command: 'exportToCSV', data: { type: 'detail', data: currentDetailData } });
        });
    }
    
    // Filter inputs
    const summaryFilter = document.getElementById('summaryFilter');
    const detailFilter = document.getElementById('detailFilter');
    
    if (summaryFilter) {
        summaryFilter.addEventListener('input', function() {
            filterSummaryTable(this.value);
        });
    }
    
    if (detailFilter) {
        detailFilter.addEventListener('input', function() {
            filterDetailTable(this.value);
        });
    }
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
            <td class="number-cell">${item.workflowReferences}</td>
            <td class="action-cell">
                <button class="view-details-btn" onclick="viewDetails('${escapeHtml(item.dataObjectName)}')">
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
            <td>${escapeHtml(item.itemName)}</td>
        `;
        tableBody.appendChild(row);
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

// Filter detail table
function filterDetailTable(filterText) {
    const rows = document.querySelectorAll('#detailTableBody tr');
    const filter = filterText.toLowerCase();
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let shouldShow = false;
        
        cells.forEach(cell => {
            if (cell.textContent.toLowerCase().includes(filter)) {
                shouldShow = true;
            }
        });
        
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
            break;
            
        case 'detailData':
            console.log('Rendering detail data:', message.data);
            renderDetailTable(message.data);
            break;
            
        case 'exportComplete':
            if (message.success) {
                // Show success message or notification
                console.log('Export completed successfully');
            } else {
                console.error('Export failed:', message.error);
            }
            break;
    }
});