// Description: Client-side webview interface for data object size analysis with 3-tab layout (summary + details + treemap)
// Created: September 19, 2025
// Updated: September 20, 2025 - Added details tab

(function () {
    const vscode = acquireVsCodeApi();

    // Global state
    let originalSummaryData = [];
    let filteredSummaryData = [];
    let originalDetailsData = [];
    let filteredDetailsData = [];
    let currentSortColumn = 0; // Default to data object name column
    let currentSortDirection = 'asc'; // Default to ascending for name
    let detailsCurrentSortColumn = -1;
    let detailsCurrentSortDirection = 'asc';
    let treemapData = [];

    // DOM Elements
    let summaryFilter, summaryTableBody, summaryRecordInfo, summaryTableContainer, summaryLoading;
    let detailsDataObjectFilter, detailsPropertyFilter, detailsDataTypeFilter;
    let detailsTableBody, detailsRecordInfo, detailsTableContainer, detailsLoading;
    let treemapVisualization, treemapLoading;

    // Initialize the interface
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Data Object Size Analysis View - DOM loaded');
        initializeElements();
        setupEventHandlers();
        loadData();
    });

    function initializeElements() {
        // Summary tab elements
        summaryFilter = document.getElementById('summaryFilter');
        summaryTableBody = document.getElementById('summaryTableBody');
        summaryRecordInfo = document.getElementById('summary-record-info');
        summaryTableContainer = document.getElementById('summary-table-container');
        summaryLoading = document.getElementById('summary-loading');

        // Details tab elements
        detailsDataObjectFilter = document.getElementById('detailsDataObjectFilter');
        detailsPropertyFilter = document.getElementById('detailsPropertyFilter');
        detailsDataTypeFilter = document.getElementById('detailsDataTypeFilter');
        detailsTableBody = document.getElementById('detailsTableBody');
        detailsRecordInfo = document.getElementById('details-record-info');
        detailsTableContainer = document.getElementById('details-table-container');
        detailsLoading = document.getElementById('details-loading');

        // Treemap tab elements
        treemapVisualization = document.getElementById('treemap-visualization');
        treemapLoading = document.getElementById('treemap-loading');
    }

    function setupEventHandlers() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            });
        });

        // Filter functionality
        if (summaryFilter) {
            summaryFilter.addEventListener('input', filterSummaryData);
        }

        // Details filter functionality
        if (detailsDataObjectFilter) {
            detailsDataObjectFilter.addEventListener('input', filterDetailsData);
        }
        if (detailsPropertyFilter) {
            detailsPropertyFilter.addEventListener('input', filterDetailsData);
        }
        if (detailsDataTypeFilter) {
            detailsDataTypeFilter.addEventListener('input', filterDetailsData);
        }

        // Filter actions
        document.addEventListener('click', function(e) {
            const action = e.target.getAttribute('data-action') || e.target.closest('[data-action]')?.getAttribute('data-action');
            
            switch (action) {
                case 'toggle-filter':
                    toggleFilterSection();
                    break;
                case 'clear-filters':
                    clearAllFilters();
                    break;
                case 'toggle-details-filter':
                    toggleDetailsFilterSection();
                    break;
                case 'clear-details-filters':
                    clearAllDetailsFilters();
                    break;
            }
        });

        // Action buttons
        document.getElementById('exportSummaryBtn')?.addEventListener('click', exportSummaryToCSV);
        document.getElementById('refreshSummaryButton')?.addEventListener('click', loadData);
        document.getElementById('exportDetailsBtn')?.addEventListener('click', exportDetailsToCSV);
        document.getElementById('refreshDetailsButton')?.addEventListener('click', loadDetailsData);
        document.getElementById('generateTreemapPngBtn')?.addEventListener('click', generateTreemapPNG);

        // Table sorting
        document.querySelectorAll('th[data-sort-column]').forEach(header => {
            header.addEventListener('click', function() {
                const column = parseInt(this.getAttribute('data-sort-column'));
                const table = this.getAttribute('data-table');
                sortTable(column, table);
            });
        });
    }

    function switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data for specific tabs
        if (tabName === 'details' && originalDetailsData.length === 0) {
            loadDetailsData();
        } else if (tabName === 'details' && originalDetailsData.length > 0) {
            // Refresh the details table if data is already loaded
            filterDetailsData();
        } else if (tabName === 'treemap' && treemapData.length > 0) {
            renderTreemap();
        }
    }

    function loadData() {
        console.log('Loading size analysis data...');
        vscode.postMessage({ command: 'getSummaryData' });
    }

    function toggleFilterSection() {
        const filterContent = document.getElementById('filterContent');
        const chevron = document.getElementById('filterChevron');
        
        filterContent.classList.toggle('collapsed');
        chevron.classList.toggle('codicon-chevron-down');
        chevron.classList.toggle('codicon-chevron-right');
    }

    function clearAllFilters() {
        if (summaryFilter) {
            summaryFilter.value = '';
        }
        filterSummaryData();
    }

    function filterSummaryData() {
        const filterText = summaryFilter ? summaryFilter.value.toLowerCase() : '';
        
        filteredSummaryData = originalSummaryData.filter(item => {
            return item.dataObjectName.toLowerCase().includes(filterText);
        });
        
        // Apply current sort after filtering
        applySummarySort();
        renderSummaryTable();
    }

    function applySummarySort() {
        if (currentSortColumn === -1) {
            return; // No sort applied yet
        }
        
        filteredSummaryData.sort((a, b) => {
            let aVal, bVal;
            
            switch (currentSortColumn) {
                case 0: // Data Object Name
                    aVal = (a.dataObjectName || '').toLowerCase();
                    bVal = (b.dataObjectName || '').toLowerCase();
                    break;
                case 1: // Total Size (Bytes)
                    aVal = a.totalSizeBytes || 0;
                    bVal = b.totalSizeBytes || 0;
                    break;
                case 2: // Total Size (KB)
                    aVal = a.totalSizeKB || 0;
                    bVal = b.totalSizeKB || 0;
                    break;
                case 3: // Total Size (MB)
                    aVal = a.totalSizeMB || 0;
                    bVal = b.totalSizeMB || 0;
                    break;
                case 4: // Property Count
                    aVal = a.propertyCount || 0;
                    bVal = b.propertyCount || 0;
                    break;
                default:
                    return 0;
            }

            if (typeof aVal === 'string') {
                return currentSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
        });
        
        // Update sort indicators
        updateSortIndicators();
    }

    function updateSortIndicators() {
        // Clear all indicators
        document.querySelectorAll(`[data-table="summary-table"] .sort-indicator`).forEach(indicator => {
            indicator.classList.remove('active');
            indicator.textContent = '▼';
        });

        // Set active indicator
        const activeHeader = document.querySelector(`[data-table="summary-table"][data-sort-column="${currentSortColumn}"] .sort-indicator`);
        if (activeHeader) {
            activeHeader.classList.add('active');
            activeHeader.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
        }
    }

    function renderSummaryTable() {
        if (!summaryTableBody) { 
            return; 
        }

        summaryTableBody.innerHTML = '';
        
        filteredSummaryData.forEach((item, index) => {
            // Handle null/undefined values gracefully
            const totalSizeBytes = item.totalSizeBytes || 0;
            const totalSizeKB = item.totalSizeKB || 0;
            const totalSizeMB = item.totalSizeMB || 0;
            const propertyCount = item.propertyCount || 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(item.dataObjectName || 'Unknown')}</td>
                <td>${totalSizeBytes.toLocaleString()}</td>
                <td>${totalSizeKB.toFixed(2)}</td>
                <td>${totalSizeMB.toFixed(4)}</td>
                <td>${propertyCount}</td>
            `;
            summaryTableBody.appendChild(row);
        });

        // Update record count
        if (summaryRecordInfo) {
            const total = originalSummaryData.length;
            const filtered = filteredSummaryData.length;
            if (total === filtered) {
                summaryRecordInfo.textContent = `${total} data objects`;
            } else {
                summaryRecordInfo.textContent = `${filtered} of ${total} data objects`;
            }
        }
    }

    function sortTable(column, tableName) {
        if (tableName === 'summary-table') {
            sortSummaryTable(column);
        } else if (tableName === 'details-table') {
            sortDetailsTable(column);
        }
    }

    function sortSummaryTable(column) {
        // Update sort direction
        if (currentSortColumn === column) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = column;
            // Default direction based on column type
            if (column === 0) {
                currentSortDirection = 'asc'; // Name column defaults to ascending
            } else {
                currentSortDirection = 'desc'; // Size columns default to descending
            }
        }

        // Update sort indicators
        updateSortIndicators();

        // Sort the data
        applySummarySort();

        renderSummaryTable();
    }

    function sortDetailsTable(column) {
        // Update sort direction
        if (detailsCurrentSortColumn === column) {
            detailsCurrentSortDirection = detailsCurrentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            detailsCurrentSortColumn = column;
            detailsCurrentSortDirection = 'asc'; // Default to ascending for details
        }

        // Update sort indicators
        document.querySelectorAll(`[data-table="details-table"] .sort-indicator`).forEach(indicator => {
            indicator.classList.remove('active');
            indicator.textContent = '▼';
        });

        const activeHeader = document.querySelector(`[data-table="details-table"][data-sort-column="${column}"] .sort-indicator`);
        if (activeHeader) {
            activeHeader.classList.add('active');
            activeHeader.textContent = detailsCurrentSortDirection === 'asc' ? '▲' : '▼';
        }

        // Sort the data
        filteredDetailsData.sort((a, b) => {
            let aVal, bVal;
            
            switch (column) {
                case 0: // Data Object Name
                    aVal = (a.dataObjectName || '').toLowerCase();
                    bVal = (b.dataObjectName || '').toLowerCase();
                    break;
                case 1: // Property Name
                    aVal = (a.propName || '').toLowerCase();
                    bVal = (b.propName || '').toLowerCase();
                    break;
                case 2: // Size (Bytes)
                    aVal = a.sizeBytes || 0;
                    bVal = b.sizeBytes || 0;
                    break;
                case 3: // Data Type
                    aVal = (a.dataType || '').toLowerCase();
                    bVal = (b.dataType || '').toLowerCase();
                    break;
                case 4: // Data Type Size
                    aVal = (a.dataTypeSize || '').toLowerCase();
                    bVal = (b.dataTypeSize || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (typeof aVal === 'string') {
                return detailsCurrentSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                return detailsCurrentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
        });

        renderDetailsTable();
    }

    function exportSummaryToCSV() {
        if (filteredSummaryData.length === 0) {
            vscode.postMessage({ 
                command: 'showError', 
                error: 'No data to export. Please load the size analysis first.' 
            });
            return;
        }

        vscode.postMessage({
            command: 'exportToCSV',
            data: {
                items: filteredSummaryData
            }
        });
    }

    function renderTreemap() {
        if (!treemapVisualization || treemapData.length === 0) { return; }

        treemapLoading.classList.add('hidden');
        treemapVisualization.classList.remove('hidden');

        // Clear previous content
        treemapVisualization.innerHTML = '';

        // Set dimensions
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };
        const width = 800 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(treemapVisualization)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('background', 'var(--vscode-editor-background)');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Prepare data for treemap
        const root = d3.hierarchy({ children: treemapData })
            .sum(d => d.totalSizeBytes)
            .sort((a, b) => b.value - a.value);

        // Create treemap
        const treemap = d3.treemap()
            .size([width, height])
            .padding(2);

        treemap(root);

        // Color scale based on size
        const colorScale = d3.scaleOrdinal()
            .domain(['tiny', 'small', 'medium', 'large'])
            .range(['#6c757d', '#28a745', '#f66a0a', '#d73a49']);

        // Create tooltip with explicit styles
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'treemap-tooltip')
            .style('position', 'absolute')
            .style('background', '#1e1e1e')
            .style('border', '1px solid #454545')
            .style('border-radius', '4px')
            .style('padding', '8px')
            .style('font-size', '12px')
            .style('color', '#cccccc')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)')
            .style('opacity', 0);

        // Draw rectangles
        const cell = g.selectAll('.treemap-cell')
            .data(root.leaves())
            .enter().append('g')
            .attr('class', 'treemap-cell')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        cell.append('rect')
            .attr('class', 'treemap-rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => {
                const sizeMB = d.data.totalSizeMB;
                if (sizeMB > 0.1) { return colorScale('large'); }     // >100KB
                if (sizeMB > 0.01) { return colorScale('medium'); }   // 10KB-100KB  
                if (sizeMB > 0.001) { return colorScale('small'); }   // 1KB-10KB
                return colorScale('tiny');                            // <1KB
            })
            .on('mouseover', function(event, d) {
                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                tooltip.html(`
                    <strong>${d.data.dataObjectName}</strong><br/>
                    Total Size: ${d.data.totalSizeBytes.toLocaleString()} bytes<br/>
                    Size (MB): ${d.data.totalSizeMB.toFixed(4)} MB<br/>
                    Properties: ${d.data.propertyCount}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
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
                if (width > 80 && height > 20) {
                    const name = d.data.dataObjectName;
                    return name.length > 12 ? name.substring(0, 12) + '...' : name;
                }
                return '';
            });

    }

    function generateTreemapPNG() {
        try {
            if (!treemapVisualization || treemapData.length === 0) {
                vscode.postMessage({ 
                    command: 'showError', 
                    error: 'No treemap data available. Please load the size analysis first.' 
                });
                return;
            }

            const svg = treemapVisualization.querySelector('svg');
            if (!svg) {
                vscode.postMessage({ 
                    command: 'showError', 
                    error: 'Treemap not rendered yet. Please switch to the treemap tab first.' 
                });
                return;
            }

            // Get SVG dimensions
            const width = parseInt(svg.getAttribute('width')) || 800;
            const height = parseInt(svg.getAttribute('height')) || 600;
            
            // Serialize SVG
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        vscode.postMessage({ command: 'showError', error: 'Canvas conversion failed' });
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const base64 = reader.result;
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const filename = `data-object-size-treemap-${timestamp}.png`;
                        vscode.postMessage({
                            command: 'savePngToWorkspace',
                            data: { base64, filename, type: 'treemap' }
                        });
                    };
                    reader.readAsDataURL(blob);
                }, 'image/png');
            };
            img.onerror = function() {
                vscode.postMessage({ command: 'showError', error: 'Failed to render SVG to image' });
            };
            img.src = url;
        } catch (err) {
            vscode.postMessage({ command: 'showError', error: 'Failed to generate PNG: ' + err.message });
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function loadDetailsData() {
        console.log('Loading details data...');
        vscode.postMessage({ command: 'getDetailsData' });
    }

    function toggleDetailsFilterSection() {
        const filterContent = document.getElementById('detailsFilterContent');
        const chevron = document.getElementById('detailsFilterChevron');
        
        filterContent.classList.toggle('collapsed');
        chevron.classList.toggle('codicon-chevron-down');
        chevron.classList.toggle('codicon-chevron-right');
    }

    function clearAllDetailsFilters() {
        if (detailsDataObjectFilter) {
            detailsDataObjectFilter.value = '';
        }
        if (detailsPropertyFilter) {
            detailsPropertyFilter.value = '';
        }
        if (detailsDataTypeFilter) {
            detailsDataTypeFilter.value = '';
        }
        filterDetailsData();
    }

    function filterDetailsData() {
        const dataObjectText = detailsDataObjectFilter ? detailsDataObjectFilter.value.toLowerCase() : '';
        const propertyText = detailsPropertyFilter ? detailsPropertyFilter.value.toLowerCase() : '';
        const dataTypeText = detailsDataTypeFilter ? detailsDataTypeFilter.value.toLowerCase() : '';
        
        filteredDetailsData = originalDetailsData.filter(item => {
            return (item.dataObjectName || '').toLowerCase().includes(dataObjectText) &&
                   (item.propName || '').toLowerCase().includes(propertyText) &&
                   (item.dataType || '').toLowerCase().includes(dataTypeText);
        });
        
        renderDetailsTable();
    }

    function renderDetailsTable() {
        if (!detailsTableBody) { return; }

        detailsTableBody.innerHTML = '';
        
        filteredDetailsData.forEach(item => {
            // Handle null/undefined values gracefully
            const sizeBytes = item.sizeBytes || 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(item.dataObjectName || 'Unknown')}</td>
                <td>${escapeHtml(item.propName || 'Unknown')}</td>
                <td>${sizeBytes.toLocaleString()}</td>
                <td>${escapeHtml(item.dataType || 'Unknown')}</td>
                <td>${escapeHtml(item.dataTypeSize || '')}</td>
            `;
            detailsTableBody.appendChild(row);
        });

        // Update record count
        if (detailsRecordInfo) {
            const total = originalDetailsData.length;
            const filtered = filteredDetailsData.length;
            if (total === filtered) {
                detailsRecordInfo.textContent = `${total} properties`;
            } else {
                detailsRecordInfo.textContent = `${filtered} of ${total} properties`;
            }
        }
    }

    function exportDetailsToCSV() {
        if (filteredDetailsData.length === 0) {
            vscode.postMessage({ 
                command: 'showError', 
                error: 'No data to export. Please load the details analysis first.' 
            });
            return;
        }

        vscode.postMessage({
            command: 'exportDetailsToCSV',
            data: {
                items: filteredDetailsData
            }
        });
    }

    // Message handling from extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'summaryDataResponse':
                console.log('Received size summary data:', message.data.length, 'items');
                originalSummaryData = message.data || [];
                treemapData = [...originalSummaryData]; // Copy for treemap
                
                // Hide loading, show content
                summaryLoading.classList.add('hidden');
                summaryTableContainer.classList.remove('hidden');
                
                // Filter and render
                filterSummaryData();
                
                // If treemap tab is active, render it
                const treemapTab = document.querySelector('[data-tab="treemap"]');
                if (treemapTab && treemapTab.classList.contains('active')) {
                    renderTreemap();
                }
                break;
                
            case 'detailsDataResponse':
                console.log('Received size details data:', message.data.length, 'items');
                originalDetailsData = message.data || [];
                
                // Hide loading, show content
                detailsLoading.classList.add('hidden');
                detailsTableContainer.classList.remove('hidden');
                
                // Filter and render
                filterDetailsData();
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
                
            default:
                console.log('Unknown message command:', message.command);
        }
    });

})();