// Description: Handles the metrics analysis webview display with tabs, filters, and sortable tables.
// Created: September 14, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let currentMetricsData = [];
let historyMetricsData = [];
let allCurrentItems = []; // For filtering
let allHistoryItems = []; // For filtering
let currentSortColumn = 'name';
let currentSortDescending = false;
let historySortColumn = 'date';
let historySortDescending = false;

// Chart-related variables
let metricsChart = null;
let availableMetrics = [];
let selectedMetrics = new Set();
let currentDateRange = 'all'; // Track current date range filter

// Initialize the view when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeTableSorting();
    initializeFilters();
    initializeButtons();
    loadCurrentMetrics();
});

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
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load data if needed
    if (tabName === 'history' && historyMetricsData.length === 0) {
        loadHistoryMetrics();
    }
}

// Initialize table sorting
function initializeTableSorting() {
    // Current metrics table sorting
    const currentHeaders = document.querySelectorAll('#current-metrics-table th');
    currentHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-column');
            sortCurrentMetrics(column);
        });
    });
    
    // History metrics table sorting
    const historyHeaders = document.querySelectorAll('#history-metrics-table th');
    historyHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-column');
            sortHistoryMetrics(column);
        });
    });
}

// Initialize filter functionality
function initializeFilters() {
    // Add event listeners for filter inputs
    const filterInputs = document.querySelectorAll('#filterMetricName, #filterMetricValue');
    filterInputs.forEach(input => {
        input.addEventListener('input', applyFilters);
    });
}

// Initialize button functionality
function initializeButtons() {
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', refresh);
    }
    
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
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

// Apply filters to the current metrics data
function applyFilters() {
    const metricNameFilter = document.getElementById('filterMetricName')?.value.toLowerCase() || '';
    const metricValueFilter = document.getElementById('filterMetricValue')?.value.toLowerCase() || '';
    
    let filteredItems = allCurrentItems.filter(item => {
        const matchesName = !metricNameFilter || (item.name || '').toLowerCase().includes(metricNameFilter);
        const matchesValue = !metricValueFilter || (item.value || '').toLowerCase().includes(metricValueFilter);
        
        return matchesName && matchesValue;
    });
    
    // Update currentMetricsData with filtered results
    currentMetricsData = filteredItems;
    
    // Re-render the table
    renderCurrentMetrics();
    renderCurrentRecordInfo();
}

// Clear all filters (global function for onclick)
function clearFilters() {
    document.getElementById('filterMetricName').value = '';
    document.getElementById('filterMetricValue').value = '';
    
    // Reset to show all items
    currentMetricsData = allCurrentItems.slice();
    
    // Re-render the table
    renderCurrentMetrics();
    renderCurrentRecordInfo();
}

// Refresh data (global function for onclick)
function refresh() {
    showSpinner();
    loadCurrentMetrics();
    if (document.getElementById('history-tab').classList.contains('active')) {
        loadHistoryMetrics();
    }
}

// Export to CSV (global function for onclick)
function exportToCSV() {
    const activeTab = document.querySelector('.tab-content.active');
    const isHistoryTab = activeTab && activeTab.id === 'history-tab';
    
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: isHistoryTab ? historyMetricsData : currentMetricsData,
            type: isHistoryTab ? 'history' : 'current'
        }
    });
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

// Sort current metrics
function sortCurrentMetrics(column) {
    if (currentSortColumn === column) {
        currentSortDescending = !currentSortDescending;
    } else {
        currentSortColumn = column;
        currentSortDescending = false;
    }
    
    currentMetricsData.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';
        
        // Convert to string for comparison
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
        
        let comparison = aVal.localeCompare(bVal);
        return currentSortDescending ? -comparison : comparison;
    });
    
    renderCurrentMetrics();
    updateSortIndicators('current', column, currentSortDescending);
}

// Sort history metrics
function sortHistoryMetrics(column) {
    if (historySortColumn === column) {
        historySortDescending = !historySortDescending;
    } else {
        historySortColumn = column;
        historySortDescending = false;
    }
    
    historyMetricsData.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';
        
        // Convert to string for comparison
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
        
        let comparison = aVal.localeCompare(bVal);
        return historySortDescending ? -comparison : comparison;
    });
    
    renderHistoryMetrics();
    updateSortIndicators('history', column, historySortDescending);
}

// Update sort indicators
function updateSortIndicators(tableType, column, descending) {
    const table = document.getElementById(`${tableType}-metrics-table`);
    const indicators = table.querySelectorAll('.sort-indicator');
    
    // Reset all indicators
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
        indicator.textContent = '▼';
    });
    
    // Set active indicator
    const activeHeader = table.querySelector(`th[data-column="${column}"] .sort-indicator`);
    if (activeHeader) {
        activeHeader.classList.add('active');
        activeHeader.textContent = descending ? '▲' : '▼';
    }
}

// Load current metrics
function loadCurrentMetrics() {
    console.log('Loading current metrics...');
    const loadingEl = document.getElementById('current-loading');
    const containerEl = document.getElementById('current-table-container');
    
    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        loadingEl.classList.add('show-block');
    }
    if (containerEl) {
        containerEl.classList.add('hidden');
        containerEl.classList.remove('show-block');
    }
    
    vscode.postMessage({
        command: 'getCurrentMetrics'
    });
}

// Load history metrics
function loadHistoryMetrics() {
    console.log('Loading history metrics...');
    const loadingEl = document.getElementById('history-loading');
    const containerEl = document.getElementById('history-table-container');
    
    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        loadingEl.classList.add('show-block');
    }
    if (containerEl) {
        containerEl.classList.add('hidden');
        containerEl.classList.remove('show-block');
    }
    
    vscode.postMessage({
        command: 'getHistoryMetrics'
    });
}

// Render current metrics table
function renderCurrentMetrics() {
    const tbody = document.getElementById('current-metrics-body');
    tbody.innerHTML = '';
    
    currentMetricsData.forEach(metric => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(metric.name)}</td>
            <td>${escapeHtml(metric.value)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Show table and hide loading
    const loadingEl = document.getElementById('current-loading');
    const containerEl = document.getElementById('current-table-container');
    
    if (loadingEl) {
        loadingEl.classList.add('hidden');
        loadingEl.classList.remove('show-block');
    }
    if (containerEl) {
        containerEl.classList.remove('hidden');
        containerEl.classList.add('show-block');
    }
}

// Render history metrics table
function renderHistoryMetrics() {
    const tbody = document.getElementById('history-metrics-body');
    tbody.innerHTML = '';
    
    if (historyMetricsData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3" class="empty-state">
                No historical data available
            </td>
        `;
        tbody.appendChild(row);
    } else {
        historyMetricsData.forEach(metric => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(metric.date)}</td>
                <td>${escapeHtml(metric.name)}</td>
                <td>${escapeHtml(metric.value)}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Show table and hide loading
    const loadingEl = document.getElementById('history-loading');
    const containerEl = document.getElementById('history-table-container');
    
    if (loadingEl) {
        loadingEl.classList.add('hidden');
        loadingEl.classList.remove('show-block');
    }
    if (containerEl) {
        containerEl.classList.remove('hidden');
        containerEl.classList.add('show-block');
    }
}

// Render current record information
function renderCurrentRecordInfo() {
    const recordInfo = document.getElementById('current-record-info');
    if (recordInfo) {
        const totalRecords = allCurrentItems.length;
        const filteredRecords = currentMetricsData.length;
        
        if (totalRecords === filteredRecords) {
            recordInfo.textContent = `${totalRecords} record${totalRecords !== 1 ? 's' : ''}`;
        } else {
            recordInfo.textContent = `${filteredRecords} of ${totalRecords} record${totalRecords !== 1 ? 's' : ''}`;
        }
    }
}

// Render history record information
function renderHistoryRecordInfo() {
    const recordInfo = document.getElementById('history-record-info');
    if (recordInfo) {
        const totalRecords = historyMetricsData.length;
        recordInfo.textContent = `${totalRecords} record${totalRecords !== 1 ? 's' : ''}`;
    }
}

// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    console.log('Received message:', message);
    
    switch (message.command) {
        case 'currentMetricsData':
            allCurrentItems = message.data || [];
            currentMetricsData = allCurrentItems.slice(); // Copy for filtering
            renderCurrentMetrics();
            renderCurrentRecordInfo();
            // Initial sort by name
            updateSortIndicators('current', currentSortColumn, currentSortDescending);
            hideSpinner();
            break;
            
        case 'historyMetricsData':
            allHistoryItems = message.data || [];
            historyMetricsData = allHistoryItems.slice(); // Copy for filtering
            
            // Hide loading message and show chart container and date range
            const historyLoading = document.getElementById('history-loading');
            const chartContainer = document.getElementById('chart-container');
            const dateRangeContainer = document.getElementById('date-range-container');
            
            if (historyLoading) {
                historyLoading.classList.add('hidden');
                historyLoading.classList.remove('show-block');
            }
            
            if (chartContainer) {
                chartContainer.classList.remove('hidden');
                chartContainer.classList.add('show-block');
            }
            
            if (dateRangeContainer) {
                dateRangeContainer.classList.remove('hidden');
                dateRangeContainer.classList.add('show-block');
            }
            
            // Add event listener to date range selector
            const dateRangeSelect = document.getElementById('date-range-select');
            if (dateRangeSelect) {
                dateRangeSelect.removeEventListener('change', handleDateRangeChange); // Remove existing listener
                dateRangeSelect.addEventListener('change', handleDateRangeChange);
            }
            
            // Initialize chart and checkboxes
            initializeMetricsChart();
            createMetricsCheckboxes();
            updateChart();
            
            hideSpinner();
            break;
            
        case 'csvExportReady':
            console.log('CSV export ready:', message);
            if (message.success) {
                // Trigger download by sending the content back to extension to save to workspace
                vscode.postMessage({
                    command: 'saveCsvToWorkspace',
                    data: {
                        content: message.csvContent,
                        filename: message.filename
                    }
                });
            } else {
                console.error('CSV export failed:', message.error);
                // Could show an error message to user here
                alert('Failed to export CSV: ' + (message.error || 'Unknown error'));
            }
            break;
    }
});

// Utility function to escape HTML
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Chart-related functions
function initializeMetricsChart() {
    const canvas = document.getElementById('metricsChart');
    if (!canvas) {
        console.error('Chart canvas not found');
        return;
    }
    
    // Check if Chart.js and adapter are loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }
    
    console.log('Chart.js version:', Chart.version);
    console.log('Available adapters:', Chart.registry.adapters);
    
    // Destroy existing chart if it exists
    if (metricsChart) {
        metricsChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    metricsChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Metrics History Over Time',
                    color: getComputedStyle(document.body).getPropertyValue('--vscode-foreground')
                },
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--vscode-foreground')
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: getComputedStyle(document.body).getPropertyValue('--vscode-editorHoverWidget-background'),
                    titleColor: getComputedStyle(document.body).getPropertyValue('--vscode-editorHoverWidget-foreground'),
                    bodyColor: getComputedStyle(document.body).getPropertyValue('--vscode-editorHoverWidget-foreground'),
                    borderColor: getComputedStyle(document.body).getPropertyValue('--vscode-editorHoverWidget-border'),
                    borderWidth: 1,
                    cornerRadius: 4,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            // Format the date more nicely
                            const date = new Date(context[0].parsed.x);
                            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                        },
                        label: function(context) {
                            const metricName = context.dataset.label;
                            const value = context.parsed.y;
                            // Format the value with proper precision
                            const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);
                            return `${metricName}: ${formattedValue}`;
                        },
                        afterBody: function(context) {
                            // Add additional context if there are multiple data points
                            if (context.length > 1) {
                                return ['', 'Click on a metric name in the legend to toggle its visibility'];
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM dd',
                            hour: 'MMM dd HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        color: getComputedStyle(document.body).getPropertyValue('--vscode-foreground')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--vscode-foreground')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--vscode-panel-border')
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value',
                        color: getComputedStyle(document.body).getPropertyValue('--vscode-foreground')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--vscode-foreground')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--vscode-panel-border')
                    }
                }
            }
        }
    });
    
    // Show chart container
    document.getElementById('chart-container').classList.remove('hidden');
}

function createMetricsCheckboxes() {
    // Get unique metric names from history data
    availableMetrics = [...new Set(historyMetricsData.map(item => item.metric_name))].sort();
    
    const checkboxContainer = document.getElementById('metrics-checkboxes');
    if (!checkboxContainer) {
        return;
    }
    
    checkboxContainer.innerHTML = '';
    
    availableMetrics.forEach(metricName => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'metric-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `metric-${metricName.replace(/\s+/g, '-').toLowerCase()}`;
        checkbox.value = metricName;
        
        // Preserve previous selection state
        checkbox.checked = selectedMetrics.has(metricName);
        
        checkbox.addEventListener('change', handleMetricCheckboxChange);
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = metricName;
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        
        // Add click handler to the div to toggle checkbox
        checkboxDiv.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                handleMetricCheckboxChange({ target: checkbox });
            }
        });
        
        checkboxContainer.appendChild(checkboxDiv);
    });
    
    // Show metrics selection container
    document.getElementById('metrics-selection').classList.remove('hidden');
}

function handleMetricCheckboxChange(event) {
    const metricName = event.target.value;
    
    if (event.target.checked) {
        selectedMetrics.add(metricName);
    } else {
        selectedMetrics.delete(metricName);
    }
    
    updateChart();
}

function updateChart() {
    if (!metricsChart) {
        return;
    }
    
    // Clear existing datasets
    metricsChart.data.datasets = [];
    
    // Generate colors for each metric
    const colors = generateColors(selectedMetrics.size);
    let colorIndex = 0;
    
    selectedMetrics.forEach(metricName => {
        // Get data points for this metric
        const metricData = historyMetricsData
            .filter(item => item.metric_name === metricName)
            .map(item => ({
                x: new Date(item.date),
                y: parseFloat(item.value) || 0
            }))
            .sort((a, b) => a.x - b.x);
        
        if (metricData.length > 0) {
            metricsChart.data.datasets.push({
                label: metricName,
                data: metricData,
                borderColor: colors[colorIndex],
                backgroundColor: colors[colorIndex] + '20', // Add transparency
                fill: false,
                tension: 0.1
            });
            colorIndex++;
        }
    });
    
    metricsChart.update();
}

function generateColors(count) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ];
    
    // If we need more colors than available, generate them
    while (colors.length < count) {
        colors.push(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`);
    }
    
    return colors.slice(0, count);
}

// Filter history data by date range
function filterDataByDateRange(data, dateRange) {
    if (dateRange === 'all') {
        return data;
    }
    
    const now = new Date();
    const daysToSubtract = parseInt(dateRange);
    const cutoffDate = new Date(now.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
    
    return data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= cutoffDate;
    });
}

// Handle date range change
function handleDateRangeChange(event) {
    currentDateRange = event.target.value;
    
    // Filter the history data based on selected range
    const filteredData = filterDataByDateRange(allHistoryItems, currentDateRange);
    historyMetricsData = filteredData.slice();
    
    // Get available metrics in the filtered data
    const availableMetricsInRange = [...new Set(historyMetricsData.map(item => item.metric_name))];
    
    // Remove any selected metrics that are no longer available in the filtered range
    const selectedMetricsArray = Array.from(selectedMetrics);
    selectedMetricsArray.forEach(metricName => {
        if (!availableMetricsInRange.includes(metricName)) {
            selectedMetrics.delete(metricName);
        }
    });
    
    // Update checkboxes with available metrics in filtered data
    // (this will now preserve the selection state)
    createMetricsCheckboxes();
    
    // Update chart with filtered data
    updateChart();
}