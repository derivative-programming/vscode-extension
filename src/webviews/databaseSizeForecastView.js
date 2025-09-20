/**
 * File: databaseSizeForecastView.js
 * Purpose: Database Size Forecast webview interface with Config and Forecast tabs
 * Last Modified: September 20, 2025
 */

const vscode = acquireVsCodeApi();

// State management
let currentDataObjects = [];
let currentConfig = [];
let currentForecast = null;
let currentTab = 'config';
let configSortColumn = null;
let configSortDirection = 'asc';

// Initialize the view
document.addEventListener('DOMContentLoaded', function() {
    console.log('Database Size Forecast View - DOM loaded');
    setupEventListeners();
    loadConfig();
});

// Tab switching functionality
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(tabName)) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Load data for the selected tab
    if (tabName === 'config') {
        loadConfig();
    } else if (tabName === 'forecast') {
        loadForecast();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Message listener for extension communication
    window.addEventListener('message', handleExtensionMessage);
}

// Handle messages from the extension
function handleExtensionMessage(event) {
    const message = event.data;
    console.log('Received message:', message);
    
    switch (message.command) {
        case 'configLoaded':
            console.log('Config data loaded:', message.data);
            currentDataObjects = message.data.dataObjects || [];
            currentConfig = message.data.config || [];
            renderConfigTable();
            break;
            
        case 'configSaved':
            showMessage(message.data.message, 'success');
            break;
            
        case 'forecastCalculated':
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
    const configData = getConfigDataFromTable();
    vscode.postMessage({ 
        command: 'saveConfig', 
        data: configData 
    });
}

// Calculate forecast
function calculateForecast() {
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

// Render the configuration table
function renderConfigTable() {
    const tbody = document.getElementById('config-tbody');
    if (!tbody) {
        console.error('Config table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (currentDataObjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No data objects found.</td></tr>';
        return;
    }
    
    // Sort the data objects if a sort is active
    let sortedDataObjects = [...currentDataObjects];
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
    const forecastContent = document.getElementById('forecast-content');
    if (!forecastContent) {
        console.error('Forecast content div not found');
        return;
    }
    
    if (!currentForecast) {
        forecastContent.innerHTML = `
            <div class="loading">
                <p>No forecast data available. Please configure data objects and calculate forecast.</p>
            </div>
        `;
        return;
    }
    
    // Create summary information
    const summary = currentForecast.summary || {};
    const summaryHtml = `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 2px;">
            <h3>Forecast Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <strong>Initial Size:</strong><br>
                    ${formatBytes(summary.initialSizeKb * 1024)}
                </div>
                <div>
                    <strong>Final Size (5 years):</strong><br>
                    ${formatBytes(summary.finalSizeKb * 1024)}
                </div>
                <div>
                    <strong>Growth Factor:</strong><br>
                    ${(summary.growthFactor || 0).toFixed(2)}x
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
    const canvas = document.getElementById('forecastChart');
    if (!canvas || !currentForecast) {
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Prepare data for the chart
    const months = currentForecast.months || [];
    const labels = months.map(m => m.month);
    const totalSizes = months.map(m => m.totalSize / 1024); // Convert KB to MB
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Database Size (MB)',
                data: totalSizes,
                borderColor: 'var(--vscode-charts-blue)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
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
                        text: 'Size (MB)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Database Size Forecast (5 Years)'
                },
                legend: {
                    display: true
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