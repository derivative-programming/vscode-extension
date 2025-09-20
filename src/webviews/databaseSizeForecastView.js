/**
 * File: databaseSizeForecastView.js
 * Purpose: Database Size Forecast webview interface with Config and Forecast tabs
 * Last Modified: September 20, 2025
 */

const vscode = acquireVsCodeApi();

// State management
let currentDataObjects = [];
let filteredDataObjects = []; // For filtering
let currentConfig = [];
let currentForecast = null;
let currentTab = 'config';
let configSortColumn = null;
let configSortDirection = 'asc';
let selectedPeriodMonths = 60; // Default to 5 years
let forecastChart = null; // Chart.js instance

// Initialize the view
document.addEventListener('DOMContentLoaded', function() {
    console.log('Database Size Forecast View - DOM loaded');
    initializeTabs();
    setupEventListeners();
    loadConfig();
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
    
    currentTab = tabName;
    
    // Load data for the selected tab
    if (tabName === 'config') {
        loadConfig();
    } else if (tabName === 'forecast') {
        loadForecast();
    }
}

// Tab switching functionality (for compatibility with onclick)
function showTab(tabName) {
    switchTab(tabName);
}

// Setup event listeners
function setupEventListeners() {
    // Message listener for extension communication
    window.addEventListener('message', handleExtensionMessage);
    
    // Initialize filter functionality when DOM is ready
    setTimeout(() => {
        initializeFilters();
    }, 100);
}

// Initialize filter functionality
function initializeFilters() {
    // Add event listeners for filter inputs
    const filterInputs = document.querySelectorAll('#filterDataObjectName, #filterParentObject, #filterMinSize, #filterMaxSize');
    filterInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', applyFilters);
        }
    });
}

// Handle messages from the extension
function handleExtensionMessage(event) {
    const message = event.data;
    console.log('Received message:', message);
    
    switch (message.command) {
        case 'configLoaded':
            console.log('Config data loaded:', message.data);
            currentDataObjects = message.data.dataObjects || [];
            filteredDataObjects = [...currentDataObjects]; // Initialize filtered data
            currentConfig = message.data.config || [];
            renderConfigTable();
            break;
            
        case 'configSaved':
            hideProcessing();
            showMessage(message.data.message, 'success');
            break;
            
        case 'forecastCalculated':
            hideProcessing();
            showMessage(message.data.message, 'success');
            currentForecast = message.data.forecast;
            if (currentTab === 'forecast') {
                renderForecastChart();
            }
            break;
            
        case 'forecastLoaded':
            console.log('Forecast data loaded:', message.data);
            currentForecast = message.data.forecast;
            renderForecastChart();
            break;
            
        case 'error':
            hideProcessing();
            showMessage(message.data.message, 'error');
            break;
    }
}

// Load configuration data
function loadConfig() {
    vscode.postMessage({ command: 'loadConfig' });
}

// Save configuration data
function saveConfig() {
    const saveButton = document.querySelector('[onclick="saveConfig()"]');
    showProcessing(saveButton, 'Saving...');
    
    const configData = getConfigDataFromTable();
    vscode.postMessage({ 
        command: 'saveConfig', 
        data: configData 
    });
}

// Calculate forecast
function calculateForecast() {
    const calculateButton = document.querySelector('[onclick="calculateForecast()"]');
    showProcessing(calculateButton, 'Calculating...');
    
    vscode.postMessage({ command: 'calculateForecast' });
}

// Load forecast data
function loadForecast() {
    vscode.postMessage({ command: 'loadForecast' });
}

// Refresh all data
function refreshData() {
    vscode.postMessage({ command: 'refreshData' });
}

// Change forecast period
function changeForecastPeriod() {
    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
        selectedPeriodMonths = parseInt(periodSelect.value);
        // Re-render chart with new period if forecast data is available
        if (currentForecast) {
            renderForecastChart();
        }
    }
}

// Render the configuration table
function renderConfigTable() {
    const tbody = document.getElementById('config-tbody');
    if (!tbody) {
        console.error('Config table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Use filtered data if available, otherwise use all data
    const dataToRender = filteredDataObjects.length > 0 || 
                         (document.getElementById('filterDataObjectName')?.value || 
                          document.getElementById('filterParentObject')?.value ||
                          document.getElementById('filterMinSize')?.value ||
                          document.getElementById('filterMaxSize')?.value) 
                         ? filteredDataObjects : currentDataObjects;
    
    if (dataToRender.length === 0) {
        const message = filteredDataObjects.length === 0 && currentDataObjects.length > 0 
            ? 'No data objects match the current filters.' 
            : 'No data objects found.';
        tbody.innerHTML = `<tr><td colspan="5" class="loading">${message}</td></tr>`;
        return;
    }
    
    // Sort the data objects if a sort is active
    let sortedDataObjects = [...dataToRender];
    if (configSortColumn !== null) {
        sortedDataObjects = sortConfigData(sortedDataObjects, configSortColumn, configSortDirection);
    }
    
    sortedDataObjects.forEach((dataObject, index) => {
        const row = document.createElement('tr');
        
        // Find existing config for this data object
        const existingConfig = currentConfig.find(c => c.dataObjectName === dataObject.name);
        
        row.innerHTML = `
            <td>${dataObject.name}</td>
            <td>
                ${dataObject.calculatedSizeKB} KB
            </td>
            <td>
                ${dataObject.parentObjectName || '-- No Parent --'}
            </td>
            <td>
                <input type="number" 
                       id="instances-${index}" 
                       value="${dataObject.expectedInstances}" 
                       step="1" 
                       min="1" />
            </td>
            <td>
                <input type="number" 
                       id="growth-${index}" 
                       value="${dataObject.growthPercentage}" 
                       step="0.1" 
                       min="0" 
                       max="100" />
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update sort icons
    updateSortIcons();
}

// Get configuration data from the table
function getConfigDataFromTable() {
    const configData = [];
    
    // Get the sorted data objects to match the current table order
    let sortedDataObjects = [...currentDataObjects];
    if (configSortColumn !== null) {
        sortedDataObjects = sortConfigData(sortedDataObjects, configSortColumn, configSortDirection);
    }
    
    sortedDataObjects.forEach((dataObject, index) => {
        const instancesInput = document.getElementById(`instances-${index}`);
        const growthInput = document.getElementById(`growth-${index}`);
        
        if (instancesInput && growthInput) {
            configData.push({
                dataObjectName: dataObject.name,
                dataSizeKb: dataObject.calculatedSizeKB, // Always use calculated value
                parentDataObjectName: dataObject.parentObjectName || null,
                expectedInstances: parseInt(instancesInput.value) || 10,
                growthPercentage: parseFloat(growthInput.value) || 0.0
            });
        }
    });
    
    return configData;
}

// Render the forecast chart
function renderForecastChart() {
    console.log('renderForecastChart called');
    console.log('currentForecast:', currentForecast);
    
    const forecastContent = document.getElementById('forecast-content');
    if (!forecastContent) {
        console.error('Forecast content div not found');
        return;
    }
    
    if (!currentForecast) {
        console.log('No forecast data available');
        forecastContent.innerHTML = `
            <div class="loading">
                <p>No forecast data available. Please configure data objects and calculate forecast.</p>
            </div>
        `;
        return;
    }
    
    // Create summary information
    const summary = currentForecast.summary || {};
    const months = currentForecast.months || [];
    
    // Find the final month within selected period
    const finalMonth = months.find(m => m.month === selectedPeriodMonths) || months[months.length - 1];
    const finalSizeKb = finalMonth ? finalMonth.totalSize : summary.finalSizeKb;
    
    // Calculate period label
    let periodLabel = '';
    if (selectedPeriodMonths === 6) {
        periodLabel = '6 months';
    } else if (selectedPeriodMonths === 12) {
        periodLabel = '1 year';
    } else if (selectedPeriodMonths === 36) {
        periodLabel = '3 years';
    } else if (selectedPeriodMonths === 60) {
        periodLabel = '5 years';
    } else {
        periodLabel = `${selectedPeriodMonths} months`;
    }
    
    const summaryHtml = `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 2px;">
            <h3>Forecast Summary (${periodLabel})</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <strong>Initial Size:</strong><br>
                    ${formatBytes(summary.initialSizeKb * 1024)}
                </div>
                <div>
                    <strong>Final Size (${periodLabel}):</strong><br>
                    ${formatBytes(finalSizeKb * 1024)}
                </div>
                <div>
                    <strong>Growth Factor:</strong><br>
                    ${(finalSizeKb / summary.initialSizeKb || 0).toFixed(2)}x
                </div>
                <div>
                    <strong>Generated:</strong><br>
                    ${new Date(currentForecast.generatedAt).toLocaleString()}
                </div>
            </div>
        </div>
    `;
    
    // Create chart container
    const chartHtml = `
        <div class="chart-container">
            <canvas id="forecastChart"></canvas>
        </div>
    `;
    
    forecastContent.innerHTML = summaryHtml + chartHtml;
    
    // Draw the chart
    drawForecastChart();
}

// Draw the forecast chart using Chart.js
function drawForecastChart() {
    console.log('drawForecastChart called');
    console.log('selectedPeriodMonths:', selectedPeriodMonths);
    
    const canvas = document.getElementById('forecastChart');
    if (!canvas || !currentForecast) {
        console.log('Canvas or currentForecast not available');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (forecastChart) {
        forecastChart.destroy();
        forecastChart = null;
    }
    
    // Prepare data for the chart
    const months = currentForecast.months || [];
    console.log('Total months available:', months.length);
    console.log('First few months data:', months.slice(0, 3));
    console.log('Month values:', months.slice(0, 5).map(m => m.month));
    
    // Filter data based on selected period
    const filteredMonths = months.filter(m => m.month <= selectedPeriodMonths);
    console.log('Filtered months:', filteredMonths.length);
    console.log('selectedPeriodMonths:', selectedPeriodMonths, typeof selectedPeriodMonths);
    
    const labels = filteredMonths.map(m => `Month ${m.month}`);
    const totalSizes = filteredMonths.map(m => m.totalSize / 1024); // Convert KB to MB
    
    console.log('Chart labels:', labels);
    console.log('Chart data:', totalSizes);
    
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Database Size (MB)',
                data: totalSizes,
                borderColor: '#007ACC',
                backgroundColor: 'rgba(0, 122, 204, 0.1)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Size (MB)',
                        color: '#cccccc'
                    },
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Period',
                        color: '#cccccc'
                    },
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Database Size Forecast (${selectedPeriodMonths} months)`,
                    color: '#cccccc'
                },
                legend: {
                    display: true,
                    labels: {
                        color: '#cccccc'
                    }
                }
            }
        }
    });
}

// Format bytes to human readable format
function formatBytes(bytes) {
    if (bytes === 0) {
        return '0 Bytes';
    }
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show messages to the user
function showMessage(message, type = 'info') {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) {
        return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = type;
    messageElement.textContent = message;
    
    messagesDiv.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 5000);
}

// Show processing animation
function showProcessing(button, text) {
    if (button) {
        // Store original content
        button.setAttribute('data-original-content', button.innerHTML);
        
        // Add spinner and text
        button.innerHTML = `<span class="spinner"></span>${text}`;
        button.classList.add('button-processing');
        button.disabled = true;
    }
}

// Hide processing animation
function hideProcessing() {
    // Find all buttons with processing state
    const processingButtons = document.querySelectorAll('.button-processing');
    
    processingButtons.forEach(button => {
        // Restore original content
        const originalContent = button.getAttribute('data-original-content');
        if (originalContent) {
            button.innerHTML = originalContent;
            button.removeAttribute('data-original-content');
        }
        
        button.classList.remove('button-processing');
        button.disabled = false;
    });
}

// Sort configuration table
function sortConfigTable(columnIndex) {
    // Toggle sort direction if clicking the same column
    if (configSortColumn === columnIndex) {
        configSortDirection = configSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        configSortColumn = columnIndex;
        configSortDirection = 'asc';
    }
    
    renderConfigTable();
}

// Sort data array based on column and direction
function sortConfigData(data, columnIndex, direction) {
    return data.sort((a, b) => {
        let valueA, valueB;
        
        switch (columnIndex) {
            case 0: // Data Object Name
                valueA = a.name || '';
                valueB = b.name || '';
                break;
            case 1: // Data Size (KB)
                valueA = a.calculatedSizeKB || 0;
                valueB = b.calculatedSizeKB || 0;
                break;
            case 2: // Parent Data Object
                valueA = a.parentObjectName || '';
                valueB = b.parentObjectName || '';
                break;
            case 3: // Expected Instances
                valueA = a.expectedInstances || 0;
                valueB = b.expectedInstances || 0;
                break;
            case 4: // Growth Percentage
                valueA = a.growthPercentage || 0;
                valueB = b.growthPercentage || 0;
                break;
            default:
                return 0;
        }
        
        // Handle numeric vs string comparison
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return direction === 'asc' ? valueA - valueB : valueB - valueA;
        } else {
            // String comparison
            valueA = String(valueA).toLowerCase();
            valueB = String(valueB).toLowerCase();
            if (direction === 'asc') {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            }
        }
    });
}

// Update sort icons in table headers
function updateSortIcons() {
    // Clear all sort icons
    for (let i = 0; i < 5; i++) {
        const icon = document.getElementById(`sort-icon-${i}`);
        if (icon) {
            icon.className = 'sort-icon';
        }
    }
    
    // Set active sort icon
    if (configSortColumn !== null) {
        const activeIcon = document.getElementById(`sort-icon-${configSortColumn}`);
        if (activeIcon) {
            activeIcon.className = `sort-icon ${configSortDirection}`;
        }
    }
}

// Toggle filter section visibility
function toggleFilterSection() {
    const filterContent = document.getElementById('filterContent');
    const chevron = document.getElementById('filterChevron');
    
    if (filterContent && chevron) {
        const isCollapsed = filterContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            filterContent.classList.remove('collapsed');
            chevron.className = 'codicon codicon-chevron-down';
        } else {
            filterContent.classList.add('collapsed');
            chevron.className = 'codicon codicon-chevron-right';
        }
    }
}

// Apply filters to the data objects
function applyFilters() {
    const nameFilter = document.getElementById('filterDataObjectName')?.value.toLowerCase() || '';
    const parentFilter = document.getElementById('filterParentObject')?.value.toLowerCase() || '';
    const minSize = parseFloat(document.getElementById('filterMinSize')?.value) || 0;
    const maxSize = parseFloat(document.getElementById('filterMaxSize')?.value) || Infinity;
    
    filteredDataObjects = currentDataObjects.filter(dataObject => {
        // Name filter
        if (nameFilter && !dataObject.name.toLowerCase().includes(nameFilter)) {
            return false;
        }
        
        // Parent filter
        const parentName = dataObject.parentObjectName || '';
        if (parentFilter && !parentName.toLowerCase().includes(parentFilter)) {
            return false;
        }
        
        // Size range filter
        const size = dataObject.calculatedSizeKB || 0;
        if (size < minSize || size > maxSize) {
            return false;
        }
        
        return true;
    });
    
    // Re-render the table with filtered data
    renderConfigTable();
}

// Clear all filters
function clearFilters() {
    const filterInputs = document.querySelectorAll('#filterDataObjectName, #filterParentObject, #filterMinSize, #filterMaxSize');
    filterInputs.forEach(input => {
        if (input) {
            input.value = '';
        }
    });
    
    // Reset filtered data and re-render
    filteredDataObjects = [...currentDataObjects];
    renderConfigTable();
}