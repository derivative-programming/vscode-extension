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
    
    // Keep track of current chart type for size distribution (bar or pie)
    let sizeChartType = 'bar';

    // DOM Elements
    let summaryFilter, summaryTableBody, summaryRecordInfo, summaryTableContainer, summaryLoading;
    let detailsDataObjectFilter, detailsPropertyFilter, detailsDataTypeFilter;
    let detailsTableBody, detailsRecordInfo, detailsTableContainer, detailsLoading;
    let treemapVisualization, treemapLoading;
    let dotplotVisualization, dotplotLoading;

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

        // Dot plot tab elements
        dotplotVisualization = document.getElementById('dotplot-visualization');
        dotplotLoading = document.getElementById('dotplot-loading');
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
        document.getElementById('refreshSummaryButton')?.addEventListener('click', function() {
            showSpinner();
            loadData();
        });
        document.getElementById('exportDetailsBtn')?.addEventListener('click', exportDetailsToCSV);
        document.getElementById('refreshDetailsButton')?.addEventListener('click', function() {
            showSpinner();
            loadDetailsData();
        });
        document.getElementById('generateTreemapPngBtn')?.addEventListener('click', generateTreemapPNG);
        document.getElementById('refreshTreemapButton')?.addEventListener('click', function() {
            showSpinner();
            loadData();
        });
        
        // Setup size chart type toggle buttons
        const sizeChartTypeBarBtn = document.getElementById('sizeChartTypeBar');
        const sizeChartTypePieBtn = document.getElementById('sizeChartTypePie');
        
        if (sizeChartTypeBarBtn) {
            sizeChartTypeBarBtn.addEventListener('click', function() {
                if (sizeChartType === 'bar') {
                    return; // Already in bar mode
                }
                
                sizeChartType = 'bar';
                
                // Update button states
                sizeChartTypeBarBtn.classList.add('active');
                sizeChartTypePieBtn.classList.remove('active');
                
                // Re-render the distribution
                renderSizeDistribution();
            });
        }
        
        if (sizeChartTypePieBtn) {
            sizeChartTypePieBtn.addEventListener('click', function() {
                if (sizeChartType === 'pie') {
                    return; // Already in pie mode
                }
                
                sizeChartType = 'pie';
                
                // Update button states
                sizeChartTypePieBtn.classList.add('active');
                sizeChartTypeBarBtn.classList.remove('active');
                
                // Re-render the distribution
                renderSizeDistribution();
            });
        }
        
        document.getElementById('generateHistogramPngBtn')?.addEventListener('click', generateHistogramPNG);
        document.getElementById('refreshHistogramButton')?.addEventListener('click', function() {
            showSpinner();
            loadData();
        });
        document.getElementById('generateDotplotPngBtn')?.addEventListener('click', generateDotplotPNG);
        document.getElementById('refreshDotplotButton')?.addEventListener('click', function() {
            showSpinner();
            loadData();
        });

        // Table sorting
        document.querySelectorAll('th[data-sort-column]').forEach(header => {
            header.addEventListener('click', function() {
                const column = parseInt(this.getAttribute('data-sort-column'));
                const table = this.getAttribute('data-table');
                sortTable(column, table);
            });
        });

        // Event delegation for edit data object buttons and view details buttons
        document.addEventListener('click', function(event) {
            if (event.target.closest('.edit-data-object-btn')) {
                const button = event.target.closest('.edit-data-object-btn');
                const objectName = button.getAttribute('data-object-name');
                if (objectName) {
                    vscode.postMessage({
                        command: 'viewDetails',
                        data: { itemType: 'dataObject', itemName: objectName }
                    });
                }
            }
            
            if (event.target.closest('.view-details-btn')) {
                const button = event.target.closest('.view-details-btn');
                const objectName = button.getAttribute('data-object-name');
                if (objectName) {
                    viewDetails(objectName);
                }
            }
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
        } else if (tabName === 'histogram' && originalSummaryData.length > 0) {
            renderSizeDistribution();
        } else if (tabName === 'dotplot' && originalSummaryData.length > 0) {
            renderDotplot();
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
                <td class="action-cell">
                    <button class="edit-data-object-btn" data-object-name="${escapeHtml(item.dataObjectName || '')}" title="Edit data object">
                        <i class="codicon codicon-edit"></i>
                    </button>
                    <button class="view-details-btn" data-object-name="${escapeHtml(item.dataObjectName || '')}" title="View details">
                        View Details
                    </button>
                </td>
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

    // View details for specific data object
    function viewDetails(dataObjectName) {
        switchTab('details');
        // Apply filter to show only this data object
        if (detailsDataObjectFilter) {
            detailsDataObjectFilter.value = dataObjectName;
            filterDetailsData();
        }
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

    // Message handling from extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'switchToTab':
                if (message.tabName && typeof switchTab === 'function') {
                    switchTab(message.tabName);
                }
                break;
                
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
                
                // If histogram tab is active, render it
                const histogramTab = document.querySelector('[data-tab="histogram"]');
                if (histogramTab && histogramTab.classList.contains('active')) {
                    renderSizeDistribution();
                }
                
                hideSpinner();
                break;
                
            case 'detailsDataResponse':
                console.log('Received size details data:', message.data.length, 'items');
                originalDetailsData = message.data || [];
                
                // Hide loading, show content
                detailsLoading.classList.add('hidden');
                detailsTableContainer.classList.remove('hidden');
                
                // Filter and render
                filterDetailsData();
                
                hideSpinner();
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

    // Histogram functionality
    function renderHistogram() {
        const histogramVisualization = document.getElementById('histogram-visualization');
        const histogramLoading = document.getElementById('histogram-loading');
        
        if (!histogramVisualization || !histogramLoading || originalSummaryData.length === 0) {
            return;
        }
        
        // Clear any existing content
        histogramVisualization.innerHTML = '';
        
        // Calculate size distribution
        const distribution = calculateSizeDistribution(originalSummaryData);
        
        // Setup dimensions
        const margin = {top: 20, right: 20, bottom: 80, left: 60};
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select(histogramVisualization)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Setup scales
        const categories = ['Tiny Size', 'Small Size', 'Medium Size', 'Large Size'];
        const values = [distribution.tinySize, distribution.smallSize, distribution.mediumSize, distribution.largeSize];
        const colors = ['#6c757d', '#28a745', '#f66a0a', '#d73a49'];
        
        const xScale = d3.scaleBand()
            .domain(categories)
            .range([0, width])
            .padding(0.1);
        
        const yScale = d3.scaleLinear()
            .domain([0, Math.max(...values)])
            .range([height, 0]);
        
        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'histogram-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'var(--vscode-editor-hoverHighlightBackground)')
            .style('border', '1px solid var(--vscode-panel-border)')
            .style('border-radius', '3px')
            .style('padding', '8px')
            .style('font-size', '12px')
            .style('z-index', '1000')
            .style('pointer-events', 'none');
        
        // Add bars
        g.selectAll('.histogram-bar')
            .data(categories)
            .enter()
            .append('rect')
            .attr('class', 'histogram-bar')
            .attr('x', d => xScale(d))
            .attr('y', d => yScale(values[categories.indexOf(d)]))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(values[categories.indexOf(d)]))
            .attr('fill', (d, i) => colors[i])
            .attr('stroke', 'var(--vscode-foreground)')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                const value = values[categories.indexOf(d)];
                const percentage = originalSummaryData.length > 0 ? ((value / originalSummaryData.length) * 100).toFixed(1) : '0.0';
                
                // Map category to full description
                const descriptions = {
                    'Tiny Size': 'Tiny Size (<1KB)',
                    'Small Size': 'Small Size (1KB-10KB)', 
                    'Medium Size': 'Medium Size (10KB-100KB)',
                    'Large Size': 'Large Size (>100KB)'
                };
                
                d3.select(this).attr('opacity', 0.8);
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                tooltip.html(`
                    <strong>${descriptions[d]}</strong><br/>
                    Count: ${value}<br/>
                    Percentage: ${percentage}%
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
        // Add value labels on top of bars
        g.selectAll('.histogram-value')
            .data(categories)
            .enter()
            .append('text')
            .attr('class', 'histogram-value')
            .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(values[categories.indexOf(d)]) - 5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--vscode-foreground)')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(d => values[categories.indexOf(d)]);
        
        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('fill', 'var(--vscode-foreground)')
            .style('text-anchor', 'middle')
            .style('font-size', '11px');
        
        g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .attr('fill', 'var(--vscode-foreground)');
        
        // Add axis labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -height / 2)
            .attr('fill', 'var(--vscode-foreground)')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Number of Data Objects');
        
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height + 60)
            .attr('fill', 'var(--vscode-foreground)')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Size Categories');
        
        // Hide loading and show visualization
        histogramLoading.classList.add('hidden');
        histogramVisualization.classList.remove('hidden');
    }

    // Render size distribution as a pie chart
    function renderSizePieChart() {
        const histogramVisualization = document.getElementById('histogram-visualization');
        const histogramLoading = document.getElementById('histogram-loading');
        
        if (!histogramVisualization || !histogramLoading || originalSummaryData.length === 0) {
            return;
        }
        
        // Clear any existing content
        histogramVisualization.innerHTML = '';
        
        // Calculate size distribution
        const distribution = calculateSizeDistribution(originalSummaryData);
        
        // Prepare data for pie chart
        const pieData = [
            { category: 'Tiny', count: distribution.tinySize, color: '#6c757d', description: 'Tiny Size (<1KB)' },
            { category: 'Small', count: distribution.smallSize, color: '#28a745', description: 'Small Size (1KB-10KB)' },
            { category: 'Medium', count: distribution.mediumSize, color: '#f66a0a', description: 'Medium Size (10KB-100KB)' },
            { category: 'Large', count: distribution.largeSize, color: '#d73a49', description: 'Large Size (>100KB)' }
        ];
        
        // Filter out categories with zero count
        const filteredData = pieData.filter(d => d.count > 0);
        
        if (filteredData.length === 0) {
            histogramVisualization.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground);">No data available</div>';
            return;
        }
        
        // Calculate total for percentages
        const totalObjects = filteredData.reduce((sum, d) => sum + d.count, 0);
        
        // Setup dimensions
        const width = 600;
        const height = 400;
        const radius = Math.min(width, height) / 2 - 40;
        
        // Create SVG
        const svg = d3.select(histogramVisualization)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        const g = svg.append('g')
            .attr('transform', `translate(${width / 2 - 100},${height / 2})`);
        
        // Create pie layout
        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);
        
        // Create arc generator
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);
        
        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'histogram-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'var(--vscode-editor-hoverHighlightBackground)')
            .style('border', '1px solid var(--vscode-panel-border)')
            .style('border-radius', '3px')
            .style('padding', '8px')
            .style('font-size', '12px')
            .style('z-index', '1000')
            .style('pointer-events', 'none');
        
        // Create pie slices
        const slices = g.selectAll('.pie-slice')
            .data(pie(filteredData))
            .enter()
            .append('g')
            .attr('class', 'pie-slice');
        
        // Add paths for slices
        slices.append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', 'var(--vscode-foreground)')
            .attr('stroke-width', 2)
            .style('opacity', 1)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.9);
                
                const percentage = ((d.data.count / totalObjects) * 100).toFixed(1);
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                tooltip.html(`
                    <strong>${d.data.description}</strong><br/>
                    Objects: ${d.data.count}<br/>
                    Percentage: ${percentage}%
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
        // Add percentage labels on slices (only for slices > 5%)
        slices.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('fill', 'white')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => {
                const percentage = (d.data.count / totalObjects) * 100;
                return percentage > 5 ? `${Math.round(percentage)}%` : '';
            });
        
        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 160}, 20)`);
        
        const legendItems = legend.selectAll('.legend-item')
            .data(filteredData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);
        
        legendItems.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => d.color)
            .attr('stroke', 'var(--vscode-foreground)')
            .attr('stroke-width', 1);
        
        legendItems.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '0.35em')
            .style('fill', 'var(--vscode-foreground)')
            .style('font-size', '12px')
            .text(d => `${d.category} Size`);
        
        legendItems.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '0.35em')
            .attr('dx', '85px')
            .style('fill', 'var(--vscode-descriptionForeground)')
            .style('font-size', '11px')
            .text(d => {
                const percentage = ((d.count / totalObjects) * 100).toFixed(1);
                return `(${d.count}, ${percentage}%)`;
            });
        
        // Hide loading and show visualization
        histogramLoading.classList.add('hidden');
        histogramVisualization.classList.remove('hidden');
    }

    // Unified function to render size distribution (bar or pie)
    function renderSizeDistribution() {
        if (sizeChartType === 'pie') {
            renderSizePieChart();
        } else {
            renderHistogram();
        }
    }

    // Calculate size distribution from data
    function calculateSizeDistribution(data) {
        const distribution = {
            tinySize: 0,
            smallSize: 0,
            mediumSize: 0,
            largeSize: 0
        };
        
        data.forEach(item => {
            const sizeMB = item.totalSizeMB;
            if (sizeMB > 0.1) {          // >100KB
                distribution.largeSize++;
            } else if (sizeMB > 0.01) {  // 10KB-100KB
                distribution.mediumSize++;
            } else if (sizeMB > 0.001) { // 1KB-10KB
                distribution.smallSize++;
            } else {                     // <1KB
                distribution.tinySize++;
            }
        });
        
        return distribution;
    }

    // Generate histogram PNG export
    function generateHistogramPNG() {
        try {
            const histogramContainer = document.getElementById('histogram-visualization');
            if (!histogramContainer || histogramContainer.classList.contains('hidden')) {
                alert('Load histogram before exporting PNG');
                return;
            }
            
            const svgElement = histogramContainer.querySelector('svg');
            if (!svgElement) {
                alert('Histogram SVG not found');
                return;
            }
            
            // Clone and inline styles
            const cloned = svgElement.cloneNode(true);
            
            // Inline rect styles
            cloned.querySelectorAll('rect').forEach(rect => {
                const cs = window.getComputedStyle(rect);
                const fill = rect.getAttribute('fill') || cs.fill || '#4c78a8';
                const stroke = rect.getAttribute('stroke') || cs.stroke || '#333333';
                rect.setAttribute('fill', fill.startsWith('var(') ? '#4c78a8' : fill);
                rect.setAttribute('stroke', stroke.startsWith('var(') ? '#333333' : stroke);
                rect.setAttribute('stroke-width', rect.getAttribute('stroke-width') || '1');
            });
            
            // Inline text styles
            cloned.querySelectorAll('text').forEach(text => {
                const cs = window.getComputedStyle(text);
                const fill = text.getAttribute('fill') || cs.fill || '#333333';
                text.setAttribute('fill', fill.startsWith('var(') ? '#333333' : fill);
            });
            
            // Convert SVG to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(cloned);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            
            // Convert to PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        alert('Canvas conversion failed');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const base64 = reader.result;
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const filename = `data-object-size-histogram-${timestamp}.png`;
                        vscode.postMessage({
                            command: 'savePngToWorkspace',
                            data: { base64, filename, type: 'histogram' }
                        });
                    };
                    reader.readAsDataURL(blob);
                }, 'image/png');
            };
            
            img.onerror = function() {
                alert('Failed to render SVG to image');
            };
            
            img.src = url;
        } catch (err) {
            alert('Failed to generate PNG: ' + err.message);
        }
    }

    // Dot plot functionality
    function renderDotplot() {
        const dotplotVisualization = document.getElementById('dotplot-visualization');
        const dotplotLoading = document.getElementById('dotplot-loading');
        
        if (!dotplotVisualization || !dotplotLoading || originalSummaryData.length === 0) {
            return;
        }
        
        // Clear any existing content
        dotplotVisualization.innerHTML = '';
        
        // Setup dimensions
        const margin = {top: 20, right: 20, bottom: 80, left: 80};
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select(dotplotVisualization)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Setup scales
        const maxSize = d3.max(originalSummaryData, d => d.totalSizeBytes);
        const maxProps = d3.max(originalSummaryData, d => d.propertyCount);
        
        const xScale = d3.scaleLinear()
            .domain([0, maxProps])
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, maxSize])
            .range([height, 0]);
        
        // Color scale based on size categories
        const colorScale = d3.scaleOrdinal()
            .domain(['tiny', 'small', 'medium', 'large'])
            .range(['#6c757d', '#28a745', '#f66a0a', '#d73a49']);
        
        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'dotplot-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'var(--vscode-editor-hoverHighlightBackground)')
            .style('border', '1px solid var(--vscode-panel-border)')
            .style('border-radius', '3px')
            .style('padding', '8px')
            .style('font-size', '12px')
            .style('z-index', '1000')
            .style('pointer-events', 'none');
        
        // Add circles for each data object
        g.selectAll('.dotplot-circle')
            .data(originalSummaryData)
            .enter()
            .append('circle')
            .attr('class', 'dotplot-circle')
            .attr('cx', d => xScale(d.propertyCount))
            .attr('cy', d => yScale(d.totalSizeBytes))
            .attr('r', 6)
            .attr('fill', d => {
                const sizeBytes = d.totalSizeBytes;
                if (sizeBytes > 102400) { return colorScale('large'); }     // >100KB
                if (sizeBytes > 10240) { return colorScale('medium'); }     // 10KB-100KB  
                if (sizeBytes > 1024) { return colorScale('small'); }       // 1KB-10KB
                return colorScale('tiny');                                  // <1KB
            })
            .attr('fill-opacity', 0.7)
            .attr('stroke', 'var(--vscode-foreground)')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.7)
            .on('mouseover', function(event, d) {
                // Highlight circle
                d3.select(this)
                    .attr('stroke-width', 2)
                    .attr('stroke-opacity', 1);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                tooltip.html(`
                    <strong>${escapeHtml(d.dataObjectName)}</strong><br/>
                    Total Size: ${d.totalSizeBytes.toLocaleString()} bytes<br/>
                    Size (KB): ${d.totalSizeKB.toFixed(2)} KB<br/>
                    Properties: ${d.propertyCount}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                // Reset circle
                d3.select(this)
                    .attr('stroke-width', 1)
                    .attr('stroke-opacity', 0.7);
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .on('click', function(event, d) {
                // Allow clicking to view object details
                vscode.postMessage({
                    command: 'viewDetails',
                    data: { itemType: 'dataObject', itemName: d.dataObjectName }
                });
            });
        
        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('fill', 'var(--vscode-foreground)')
            .style('text-anchor', 'middle')
            .style('font-size', '11px');
        
        g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .attr('fill', 'var(--vscode-foreground)');
        
        // Add axis labels
        g.append('text')
            .attr('class', 'dotplot-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', -50)
            .attr('x', -height / 2)
            .attr('fill', 'var(--vscode-foreground)')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Total Size (Bytes)');
        
        g.append('text')
            .attr('class', 'dotplot-axis-label')
            .attr('x', width / 2)
            .attr('y', height + 50)
            .attr('fill', 'var(--vscode-foreground)')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Property Count');
        
        // Hide loading and show visualization
        dotplotLoading.classList.add('hidden');
        dotplotVisualization.classList.remove('hidden');
    }

    // Generate dot plot PNG export
    function generateDotplotPNG() {
        try {
            const dotplotContainer = document.getElementById('dotplot-visualization');
            if (!dotplotContainer || dotplotContainer.classList.contains('hidden')) {
                alert('Load dot plot before exporting PNG');
                return;
            }
            
            const svgElement = dotplotContainer.querySelector('svg');
            if (!svgElement) {
                alert('Dot plot SVG not found');
                return;
            }
            
            // Clone and inline styles
            const cloned = svgElement.cloneNode(true);
            
            // Inline circle styles
            cloned.querySelectorAll('circle').forEach(circle => {
                const cs = window.getComputedStyle(circle);
                const fill = circle.getAttribute('fill') || cs.fill || '#4c78a8';
                const stroke = circle.getAttribute('stroke') || cs.stroke || '#333333';
                circle.setAttribute('fill', fill.startsWith('var(') ? '#4c78a8' : fill);
                circle.setAttribute('stroke', stroke.startsWith('var(') ? '#333333' : stroke);
            });
            
            // Inline text styles
            cloned.querySelectorAll('text').forEach(text => {
                const cs = window.getComputedStyle(text);
                const fill = text.getAttribute('fill') || cs.color || '#333333';
                text.setAttribute('fill', fill.startsWith('var(') ? '#333333' : fill);
            });
            
            // Inline path styles (for axes)
            cloned.querySelectorAll('path').forEach(path => {
                const cs = window.getComputedStyle(path);
                const stroke = path.getAttribute('stroke') || cs.stroke || '#333333';
                path.setAttribute('stroke', stroke.startsWith('var(') ? '#333333' : stroke);
            });
            
            const svgString = new XMLSerializer().serializeToString(cloned);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = cloned.getAttribute('width');
                canvas.height = cloned.getAttribute('height');
                const ctx = canvas.getContext('2d');
                
                // White background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                
                canvas.toBlob(blob => {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const base64 = reader.result;
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const filename = `data-object-size-dotplot-${timestamp}.png`;
                        vscode.postMessage({
                            command: 'savePngToWorkspace',
                            data: { base64, filename, type: 'dotplot' }
                        });
                    };
                    reader.readAsDataURL(blob);
                }, 'image/png');
            };
            
            img.onerror = function() {
                alert('Failed to render SVG to image');
            };
            
            img.src = url;
        } catch (err) {
            alert('Failed to generate PNG: ' + err.message);
        }
    }

})();