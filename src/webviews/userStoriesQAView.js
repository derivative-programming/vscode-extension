// Description: Handles the user stories QA webview display with filtering and sorting.
// Created: August 4, 2025

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Keep track of the current state
let userStoriesQAData = {
    items: [],
    totalRecords: 0,
    sortColumn: 'storyNumber',
    sortDescending: false
};

// Keep track of all items for filtering
let allItems = [];

// Keep track of selected items
let selectedItems = new Set();

// Keep track of current chart type (bar or pie)
let currentChartType = 'bar';

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
    const storyNumberFilter = document.getElementById('filterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('filterStoryText')?.value.toLowerCase() || '';
    const qaStatusFilter = document.getElementById('filterQAStatus')?.value || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        const matchesQAStatus = !qaStatusFilter || item.qaStatus === qaStatusFilter;
        
        return matchesStoryNumber && matchesStoryText && matchesQAStatus;
    });
    
    // Update userStoriesQAData with filtered results
    userStoriesQAData.items = filteredItems;
    userStoriesQAData.totalRecords = filteredItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Clear all filters (global function for onclick)
function clearFilters() {
    document.getElementById('filterStoryNumber').value = '';
    document.getElementById('filterStoryText').value = '';
    document.getElementById('filterQAStatus').value = '';
    
    // Reset to show all items
    userStoriesQAData.items = allItems.slice();
    userStoriesQAData.totalRecords = allItems.length;
    
    // Re-render the table
    renderTable();
    renderRecordInfo();
}

// Calculate QA status distribution from current data
function calculateQAStatusDistribution() {
    const distribution = {
        'pending': 0,
        'ready-to-test': 0,
        'started': 0,
        'success': 0,
        'failure': 0
    };
    
    // Count items by status
    allItems.forEach(item => {
        const status = item.qaStatus || 'pending';
        if (distribution.hasOwnProperty(status)) {
            distribution[status]++;
        }
    });
    
    return distribution;
}

// Get semantic color for QA status
function getQAStatusColor(value) {
    const colors = {
        'pending': '#858585',       // Gray
        'ready-to-test': '#0078d4', // Blue
        'started': '#f39c12',        // Orange
        'success': '#28a745',        // Green
        'failure': '#d73a49'         // Red
    };
    return colors[value] || '#858585';
}

// Update QA summary statistics
function updateQASummaryStats(distribution) {
    const totalStories = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const successCount = distribution.success || 0;
    const completedCount = (distribution.success || 0) + (distribution.failure || 0);
    
    const successRate = totalStories > 0 ? ((successCount / totalStories) * 100).toFixed(1) : '0.0';
    const completionRate = totalStories > 0 ? ((completedCount / totalStories) * 100).toFixed(1) : '0.0';
    
    // Update DOM
    const totalStoriesEl = document.getElementById('qa-total-stories');
    const successRateEl = document.getElementById('qa-success-rate');
    const completionRateEl = document.getElementById('qa-completion-rate');
    
    if (totalStoriesEl) {
        totalStoriesEl.textContent = totalStories;
    }
    if (successRateEl) {
        successRateEl.textContent = successRate + '%';
    }
    if (completionRateEl) {
        completionRateEl.textContent = completionRate + '%';
    }
}

// Render QA status distribution histogram
function renderQAStatusDistributionHistogram() {
    console.log('[userStoriesQAView] Rendering QA status distribution histogram');
    
    const vizDiv = document.getElementById('qa-distribution-visualization');
    const loadingDiv = document.getElementById('qa-distribution-loading');
    
    if (!vizDiv) {
        console.warn('[userStoriesQAView] qa-distribution-visualization div not found');
        return;
    }
    
    // Show loading, hide visualization
    if (loadingDiv) {
        loadingDiv.classList.remove('hidden');
    }
    vizDiv.classList.add('hidden');
    
    // Clear previous SVG
    vizDiv.innerHTML = '';
    
    // Calculate distribution
    const distribution = calculateQAStatusDistribution();
    updateQASummaryStats(distribution);
    
    // Fixed status order (workflow-based)
    const statusOrder = ['pending', 'ready-to-test', 'started', 'success', 'failure'];
    const statusLabels = {
        'pending': 'Pending',
        'ready-to-test': 'Ready to Test',
        'started': 'Started',
        'success': 'Success',
        'failure': 'Failure'
    };
    
    // Prepare data array
    const data = statusOrder.map(status => ({
        status: status,
        label: statusLabels[status],
        count: distribution[status] || 0,
        color: getQAStatusColor(status)
    }));
    
    // D3.js rendering
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = Math.max(600, vizDiv.clientWidth - 40) - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select('#qa-distribution-visualization')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    // X scale
    const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.2);
    
    // Y scale
    const maxCount = d3.max(data, d => d.count) || 1;
    const y = d3.scaleLinear()
        .domain([0, maxCount])
        .nice()
        .range([height, 0]);
    
    // X axis
    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')
        .attr('fill', 'var(--vscode-editor-foreground)')
        .style('font-size', '11px');
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .attr('fill', 'var(--vscode-editor-foreground)');
    
    // Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', 'var(--vscode-editor-foreground)')
        .style('font-size', '12px')
        .text('Number of Stories');
    
    // Style axis lines
    svg.selectAll('.domain, .tick line')
        .attr('stroke', 'var(--vscode-panel-border)');
    
    // Create tooltip div if it doesn't exist
    let tooltip = d3.select('.qa-distribution-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'qa-distribution-tooltip')
            .style('opacity', 0);
    }
    
    // Bars
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.label))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.count))
        .attr('height', d => height - y(d.count))
        .attr('fill', d => d.color)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 0.8);
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            const totalStories = data.reduce((sum, item) => sum + item.count, 0);
            const percentage = totalStories > 0 ? ((d.count / totalStories) * 100).toFixed(1) : '0.0';
            
            tooltip.html('<strong>' + d.label + '</strong><br/>Count: ' + d.count + '<br/>Percentage: ' + percentage + '%')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).style('opacity', 1);
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Count labels on bars
    svg.selectAll('.bar-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', d => x(d.label) + x.bandwidth() / 2)
        .attr('y', d => y(d.count) - 5)
        .attr('text-anchor', 'middle')
        .text(d => d.count)
        .attr('fill', 'var(--vscode-editor-foreground)')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');
    
    // Hide loading, show visualization
    if (loadingDiv) {
        loadingDiv.classList.add('hidden');
    }
    vizDiv.classList.remove('hidden');
    
    console.log('[userStoriesQAView] QA status distribution histogram rendered successfully');
}

// Render QA status distribution as pie chart
function renderQAStatusDistributionPieChart() {
    console.log('[userStoriesQAView] Rendering QA status distribution pie chart');
    
    const vizDiv = document.getElementById('qa-distribution-visualization');
    const loadingDiv = document.getElementById('qa-distribution-loading');
    
    if (!vizDiv) {
        console.warn('[userStoriesQAView] qa-distribution-visualization div not found');
        return;
    }
    
    // Show loading, hide visualization
    if (loadingDiv) {
        loadingDiv.classList.remove('hidden');
    }
    vizDiv.classList.add('hidden');
    
    // Clear previous SVG
    vizDiv.innerHTML = '';
    
    // Calculate distribution
    const distribution = calculateQAStatusDistribution();
    updateQASummaryStats(distribution);
    
    // Fixed status order (workflow-based)
    const statusOrder = ['pending', 'ready-to-test', 'started', 'success', 'failure'];
    const statusLabels = {
        'pending': 'Pending',
        'ready-to-test': 'Ready to Test',
        'started': 'Started',
        'success': 'Success',
        'failure': 'Failure'
    };
    
    // Prepare data array - filter out zero values for pie chart
    const data = statusOrder
        .map(status => ({
            status: status,
            label: statusLabels[status],
            count: distribution[status] || 0,
            color: getQAStatusColor(status)
        }))
        .filter(d => d.count > 0); // Only include non-zero slices
    
    if (data.length === 0) {
        vizDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">No data to display</div>';
        if (loadingDiv) {
            loadingDiv.classList.add('hidden');
        }
        vizDiv.classList.remove('hidden');
        return;
    }
    
    // D3.js pie chart rendering
    const width = Math.max(600, vizDiv.clientWidth - 40);
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;
    
    const svg = d3.select('#qa-distribution-visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');
    
    // Create pie layout
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null); // Maintain original order
    
    // Create arc generator
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    // Create arc for hover effect (slightly larger)
    const arcHover = d3.arc()
        .innerRadius(0)
        .outerRadius(radius + 10);
    
    // Create tooltip div if it doesn't exist
    let tooltip = d3.select('.qa-distribution-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'qa-distribution-tooltip')
            .style('opacity', 0);
    }
    
    // Calculate total for percentages
    const totalStories = data.reduce((sum, item) => sum + item.count, 0);
    
    // Create pie slices
    const slices = svg.selectAll('.slice')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'slice');
    
    // Add paths for each slice
    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', 'var(--vscode-editor-background)')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arcHover)
                .style('opacity', 0.8);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            const percentage = ((d.data.count / totalStories) * 100).toFixed(1);
            
            tooltip.html('<strong>' + d.data.label + '</strong><br/>Count: ' + d.data.count + '<br/>Percentage: ' + percentage + '%')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arc)
                .style('opacity', 1);
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Add percentage labels on slices
    slices.append('text')
        .attr('transform', d => {
            const pos = arc.centroid(d);
            return 'translate(' + pos[0] + ',' + pos[1] + ')';
        })
        .attr('text-anchor', 'middle')
        .attr('fill', '#FFFFFF')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
        .style('pointer-events', 'none')
        .each(function(d) {
            const percentage = ((d.data.count / totalStories) * 100).toFixed(1);
            // Only show label if slice is large enough (> 5%)
            if (parseFloat(percentage) > 5) {
                d3.select(this).text(percentage + '%');
            }
        });
    
    // Add legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' + (radius + 20) + ',' + (-radius + 20) + ')');
    
    const legendItems = legend.selectAll('.legend-item')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => 'translate(0,' + (i * 25) + ')');
    
    legendItems.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', d => d.color);
    
    legendItems.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .attr('fill', 'var(--vscode-editor-foreground)')
        .style('font-size', '12px')
        .text(d => d.label + ' (' + d.count + ')');
    
    // Hide loading, show visualization
    if (loadingDiv) {
        loadingDiv.classList.add('hidden');
    }
    vizDiv.classList.remove('hidden');
    
    console.log('[userStoriesQAView] QA status distribution pie chart rendered successfully');
}

// Render QA status distribution based on current chart type
function renderQAStatusDistribution() {
    if (currentChartType === 'pie') {
        renderQAStatusDistributionPieChart();
    } else {
        renderQAStatusDistributionHistogram();
    }
}

// Generate PNG from QA distribution histogram
function generateQADistributionPNG() {
    console.log('[userStoriesQAView] Generating QA distribution PNG');
    
    const svgElement = document.querySelector('#qa-distribution-visualization svg');
    if (!svgElement) {
        console.error('[userStoriesQAView] SVG element not found for PNG generation');
        alert('Please render the histogram first');
        return;
    }
    
    // Clone the SVG and resolve CSS variables
    const svgClone = svgElement.cloneNode(true);
    const computedStyle = getComputedStyle(document.body);
    
    // Get computed colors
    const foregroundColor = computedStyle.getPropertyValue('--vscode-editor-foreground').trim() || '#cccccc';
    const borderColor = computedStyle.getPropertyValue('--vscode-panel-border').trim() || '#666666';
    
    // Replace CSS variables with computed values in all elements
    const elementsWithFill = svgClone.querySelectorAll('[fill*="var(--vscode"]');
    elementsWithFill.forEach(el => {
        el.setAttribute('fill', foregroundColor);
    });
    
    const elementsWithStroke = svgClone.querySelectorAll('[stroke*="var(--vscode"]');
    elementsWithStroke.forEach(el => {
        el.setAttribute('stroke', borderColor);
    });
    
    // Also handle style attributes that might contain CSS variables
    const elementsWithStyle = svgClone.querySelectorAll('[style*="var(--vscode"]');
    elementsWithStyle.forEach(el => {
        let style = el.getAttribute('style');
        if (style) {
            style = style.replace(/var\(--vscode-editor-foreground\)/g, foregroundColor);
            style = style.replace(/var\(--vscode-panel-border\)/g, borderColor);
            el.setAttribute('style', style);
        }
    });
    
    // Serialize the modified SVG
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);
    
    // Add XML declaration if not present
    if (!svgString.startsWith('<?xml')) {
        svgString = '<?xml version="1.0" encoding="UTF-8"?>' + svgString;
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const svgRect = svgElement.getBoundingClientRect();
    canvas.width = svgRect.width * 2; // 2x for better quality
    canvas.height = svgRect.height * 2;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    
    // Fill with white background (not transparent)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, svgRect.width, svgRect.height);
    
    // Create image from SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        
        // Convert canvas to base64 PNG
        const pngDataUrl = canvas.toDataURL('image/png');
        
        // Send to extension
        vscode.postMessage({
            command: 'saveQADistributionPNG',
            data: {
                base64: pngDataUrl
            }
        });
        
        console.log('[userStoriesQAView] PNG data sent to extension');
    };
    
    img.onerror = function(error) {
        console.error('[userStoriesQAView] Error loading SVG for PNG conversion:', error);
        alert('Error generating PNG image');
    };
    
    img.src = url;
}

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
    document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Handle tab-specific logic
    if (tabName === 'analysis') {
        // Render QA status distribution (bar or pie chart based on current selection)
        console.log('[userStoriesQAView] Analysis tab selected - rendering distribution');
        renderQAStatusDistribution();
    } else if (tabName === 'board') {
        // Render Kanban board
        console.log('[userStoriesQAView] Board tab selected - rendering kanban board');
        renderKanbanBoard();
    } else if (tabName === 'details') {
        // Refresh details tab to show latest data
        console.log('[userStoriesQAView] Details tab selected - refreshing table');
        renderTable();
        renderRecordInfo();
    }
}

// Refresh data (global function for onclick)
function refresh() {
    showSpinner();
    vscode.postMessage({
        command: 'refresh'
    });
}

// Toggle board filter section visibility (global function for onclick)
function toggleBoardFilterSection() {
    const filterContent = document.getElementById('boardFilterContent');
    const chevron = document.getElementById('boardFilterChevron');
    
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

// Apply board filters (global function for input events)
function applyBoardFilters() {
    const storyNumberFilter = document.getElementById('boardFilterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('boardFilterStoryText')?.value.toLowerCase() || '';
    
    // Filter is applied during render, so just re-render
    renderKanbanBoard();
}

// Clear board filters (global function for onclick)
function clearBoardFilters() {
    document.getElementById('boardFilterStoryNumber').value = '';
    document.getElementById('boardFilterStoryText').value = '';
    
    // Re-render the board
    renderKanbanBoard();
}

// Render Kanban board
function renderKanbanBoard() {
    console.log('[userStoriesQAView] Rendering Kanban board');
    
    // Apply filters
    const storyNumberFilter = document.getElementById('boardFilterStoryNumber')?.value.toLowerCase() || '';
    const storyTextFilter = document.getElementById('boardFilterStoryText')?.value.toLowerCase() || '';
    
    let filteredItems = allItems.filter(item => {
        const matchesStoryNumber = !storyNumberFilter || (item.storyNumber || '').toLowerCase().includes(storyNumberFilter);
        const matchesStoryText = !storyTextFilter || (item.storyText || '').toLowerCase().includes(storyTextFilter);
        
        return matchesStoryNumber && matchesStoryText;
    });
    
    // Group items by status
    const statusGroups = {
        'pending': [],
        'ready-to-test': [],
        'started': [],
        'success': [],
        'failure': []
    };
    
    filteredItems.forEach(item => {
        const status = item.qaStatus || 'pending';
        if (statusGroups[status]) {
            statusGroups[status].push(item);
        }
    });
    
    // Render each column
    Object.keys(statusGroups).forEach(status => {
        const column = document.getElementById('column-' + status);
        const countElement = document.getElementById('count-' + status);
        
        if (!column || !countElement) {
            return;
        }
        
        const items = statusGroups[status];
        countElement.textContent = items.length;
        
        // Clear column
        column.innerHTML = '';
        
        // Add cards
        items.forEach(item => {
            const card = createKanbanCard(item);
            column.appendChild(card);
        });
    });
    
    console.log('[userStoriesQAView] Kanban board rendered');
}

// Create a Kanban card element
function createKanbanCard(item) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.setAttribute('data-story-id', item.storyId);
    card.setAttribute('data-current-status', item.qaStatus || 'pending');
    
    // Card number
    const cardNumber = document.createElement('div');
    cardNumber.className = 'kanban-card-number';
    cardNumber.textContent = item.storyNumber || '';
    card.appendChild(cardNumber);
    
    // Card text
    const cardText = document.createElement('div');
    cardText.className = 'kanban-card-text';
    cardText.textContent = item.storyText || '';
    cardText.title = item.storyText || ''; // Full text on hover
    card.appendChild(cardText);
    
    // Card footer (optional info)
    const hasNotes = item.qaNotes && item.qaNotes.trim() !== '';
    const hasDate = item.dateVerified && item.dateVerified.trim() !== '';
    
    if (hasNotes || hasDate) {
        const cardFooter = document.createElement('div');
        cardFooter.className = 'kanban-card-footer';
        
        if (hasNotes) {
            const notesIndicator = document.createElement('span');
            notesIndicator.className = 'kanban-card-has-notes';
            notesIndicator.innerHTML = '<i class="codicon codicon-note"></i> Notes';
            notesIndicator.title = item.qaNotes;
            cardFooter.appendChild(notesIndicator);
        }
        
        if (hasDate) {
            const dateIndicator = document.createElement('span');
            dateIndicator.className = 'kanban-card-date';
            dateIndicator.innerHTML = '<i class="codicon codicon-calendar"></i> ' + item.dateVerified;
            cardFooter.appendChild(dateIndicator);
        }
        
        card.appendChild(cardFooter);
    }
    
    // Click event to open modal
    card.addEventListener('click', function(e) {
        // Don't open modal if we're dragging
        if (e.defaultPrevented) {
            return;
        }
        openCardModal(item.storyId);
    });
    
    // Drag event listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    return card;
}

// Handle drag start
function handleDragStart(e) {
    const card = e.target;
    card.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.getAttribute('data-story-id'));
    
    console.log('[userStoriesQAView] Drag started for story:', card.getAttribute('data-story-id'));
}

// Handle drag end
function handleDragEnd(e) {
    const card = e.target;
    card.classList.remove('dragging');
    
    // Remove drag-over class from all columns
    document.querySelectorAll('.kanban-column-content').forEach(column => {
        column.classList.remove('drag-over');
    });
}

// Handle drag over (allow drop)
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const column = e.currentTarget;
    column.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(e) {
    const column = e.currentTarget;
    
    // Only remove if we're actually leaving the column (not entering a child element)
    if (!column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over');
    }
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    
    const column = e.currentTarget;
    column.classList.remove('drag-over');
    
    const storyId = e.dataTransfer.getData('text/plain');
    const newStatus = column.getAttribute('data-status');
    
    if (!storyId || !newStatus) {
        console.error('[userStoriesQAView] Invalid drop: missing storyId or status');
        return;
    }
    
    console.log('[userStoriesQAView] Card dropped - Story:', storyId, 'New Status:', newStatus);
    
    // Find the item and update locally
    const item = allItems.find(i => i.storyId === storyId);
    if (item) {
        const oldStatus = item.qaStatus;
        
        // Don't do anything if status hasn't changed
        if (oldStatus === newStatus) {
            console.log('[userStoriesQAView] Status unchanged, no update needed');
            return;
        }
        
        item.qaStatus = newStatus;
        
        // Set date verified if status is success or failure
        if (newStatus === 'success' || newStatus === 'failure') {
            item.dateVerified = new Date().toISOString().split('T')[0];
        }
        
        // Update in userStoriesQAData as well
        const dataItem = userStoriesQAData.items.find(i => i.storyId === storyId);
        if (dataItem) {
            dataItem.qaStatus = newStatus;
            if (newStatus === 'success' || newStatus === 'failure') {
                dataItem.dateVerified = new Date().toISOString().split('T')[0];
            }
        }
        
        // Re-render the board
        renderKanbanBoard();
        
        // Save the change
        vscode.postMessage({
            command: 'saveQAChange',
            data: {
                storyId: storyId,
                qaStatus: newStatus,
                qaNotes: item.qaNotes || '',
                dateVerified: item.dateVerified || '',
                qaFilePath: item.qaFilePath
            }
        });
        
        console.log('[userStoriesQAView] Card status updated and saved');
    } else {
        console.error('[userStoriesQAView] Item not found:', storyId);
    }
}

// Toggle select all checkboxes (global function for onclick)
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const isChecked = selectAllCheckbox.checked;
    
    // Update selectedItems set
    selectedItems.clear();
    if (isChecked) {
        userStoriesQAData.items.forEach(item => {
            selectedItems.add(item.storyId);
        });
    }
    
    // Update all row checkboxes
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// Handle individual row checkbox change
function handleRowCheckboxChange(storyId, isChecked) {
    if (isChecked) {
        selectedItems.add(storyId);
    } else {
        selectedItems.delete(storyId);
    }
    
    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const totalItems = userStoriesQAData.items.length;
    const selectedCount = selectedItems.size;
    
    if (selectedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedCount === totalItems) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
    
    // Update apply button state
    updateApplyButtonState();
}

// Handle row click to toggle checkbox
function handleRowClick(event, storyId) {
    // Don't toggle if the click was on an interactive element
    const target = event.target;
    if (target.type === 'checkbox' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
    }
    
    // Toggle the checkbox state
    const isCurrentlySelected = selectedItems.has(storyId);
    handleRowCheckboxChange(storyId, !isCurrentlySelected);
    
    // Update the actual checkbox element
    const checkbox = event.currentTarget.querySelector('.row-checkbox');
    if (checkbox) {
        checkbox.checked = !isCurrentlySelected;
    }
}

// Update apply button state based on selections and dropdown value
function updateApplyButtonState() {
    const applyButton = document.getElementById('applyButton');
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    
    if (applyButton && bulkStatusDropdown) {
        const hasSelection = selectedItems.size > 0;
        const hasStatus = bulkStatusDropdown.value !== '';
        applyButton.disabled = !(hasSelection && hasStatus);
    }
}

// Bulk update selected items (global function for onclick)
function bulkUpdateSelected() {
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    const selectedStatus = bulkStatusDropdown.value;
    
    if (selectedItems.size === 0) {
        alert('Please select items to update');
        return;
    }
    
    if (!selectedStatus) {
        alert('Please select a status');
        return;
    }

    console.log(`[Webview] Applying status '${selectedStatus}' to ${selectedItems.size} selected rows`);
    
    // Get first item to find qaFilePath
    const firstItem = userStoriesQAData.items.find(item => selectedItems.has(item.storyId));
    if (!firstItem) {
        return;
    }

    // Update local data immediately for each selected item
    const currentDate = new Date().toISOString().split('T')[0];
    selectedItems.forEach(storyId => {
        // Update in allItems array
        const allItem = allItems.find(item => item.storyId === storyId);
        if (allItem) {
            allItem.qaStatus = selectedStatus;
            if (selectedStatus === 'success' || selectedStatus === 'failure') {
                allItem.dateVerified = currentDate;
            }
        }
        
        // Update in filtered data as well
        const filteredItem = userStoriesQAData.items.find(item => item.storyId === storyId);
        if (filteredItem) {
            filteredItem.qaStatus = selectedStatus;
            if (selectedStatus === 'success' || selectedStatus === 'failure') {
                filteredItem.dateVerified = currentDate;
            }
        }
    });

    // Send bulk update message to save changes
    vscode.postMessage({
        command: 'bulkUpdateQAStatus',
        data: {
            selectedStoryIds: Array.from(selectedItems),
            qaStatus: selectedStatus,
            qaFilePath: firstItem.qaFilePath
        }
    });

    // Reset dropdown and clear selections
    bulkStatusDropdown.value = '';
    selectedItems.clear();
    updateApplyButtonState();
    
    // Re-render the table to show the updated status values immediately
    renderTable();
}

// Export to CSV (global function for onclick)
function exportToCSV() {
    vscode.postMessage({
        command: 'exportToCSV',
        data: {
            items: userStoriesQAData.items
        }
    });
}

// Handle QA status change
function handleQAStatusChange(storyId, newStatus) {
    // Find the item and update locally
    const item = userStoriesQAData.items.find(i => i.storyId === storyId);
    if (item) {
        item.qaStatus = newStatus;
        
        // Set date verified if status is success or failure
        if (newStatus === 'success' || newStatus === 'failure') {
            item.dateVerified = new Date().toISOString().split('T')[0];
            
            // Update the date cell in the current row without re-rendering entire table
            const row = document.querySelector(`#qaTableBody tr[data-story-id="${storyId}"]`);
            if (row) {
                const dateCell = row.querySelector('.date-verified-column');
                if (dateCell) {
                    dateCell.textContent = item.dateVerified;
                }
            }
        }
        
        // Also update in allItems
        const allItem = allItems.find(i => i.storyId === storyId);
        if (allItem) {
            allItem.qaStatus = newStatus;
            if (newStatus === 'success' || newStatus === 'failure') {
                allItem.dateVerified = new Date().toISOString().split('T')[0];
            }
        }
        
        // Don't re-render table - just update the specific cell data
        // The dropdown value is already set by the user interaction
        
        // Save the change
        vscode.postMessage({
            command: 'saveQAChange',
            data: {
                storyId: storyId,
                qaStatus: newStatus,
                qaNotes: item.qaNotes || '',
                dateVerified: item.dateVerified || '',
                qaFilePath: item.qaFilePath
            }
        });
    }
}

// Handle QA notes change
function handleQANotesChange(storyId, newNotes) {
    // Find the item and update locally
    const item = userStoriesQAData.items.find(i => i.storyId === storyId);
    if (item) {
        item.qaNotes = newNotes;
        
        // Also update in allItems
        const allItem = allItems.find(i => i.storyId === storyId);
        if (allItem) {
            allItem.qaNotes = newNotes;
        }
        
        // Save the change
        vscode.postMessage({
            command: 'saveQAChange',
            data: {
                storyId: storyId,
                qaStatus: item.qaStatus || 'pending',
                qaNotes: newNotes,
                dateVerified: item.dateVerified || '',
                qaFilePath: item.qaFilePath
            }
        });
    }
}

// Render the table
function renderTable() {
    const table = document.getElementById("qaTable");
    const thead = document.getElementById("qaTableHead");
    const tbody = document.getElementById("qaTableBody");
    
    if (!table || !thead || !tbody) {
        console.error("Table elements not found");
        return;
    }
    
    // Clear existing content
    thead.innerHTML = "";
    tbody.innerHTML = "";
    
    // Define table columns
    const columns = [
        { key: 'select', label: '', sortable: false, className: 'checkbox-column' },
        { key: 'storyNumber', label: 'Story Number', sortable: true, className: 'story-number-column' },
        { key: 'storyText', label: 'Story Text', sortable: true, className: 'story-text-column' },
        { key: 'qaStatus', label: 'Status', sortable: true, className: 'qa-status-column' },
        { key: 'qaNotes', label: 'Notes', sortable: false, className: 'qa-notes-column' },
        { key: 'dateVerified', label: 'Date Verified', sortable: true, className: 'date-verified-column' }
    ];
    
    // Create table header
    const headerRow = document.createElement("tr");
    columns.forEach(column => {
        const th = document.createElement("th");
        th.className = column.className || '';
        
        if (column.key === 'select') {
            // Select all checkbox in header
            const selectAllCheckbox = document.createElement("input");
            selectAllCheckbox.type = "checkbox";
            selectAllCheckbox.id = "selectAllCheckbox";
            selectAllCheckbox.addEventListener("change", toggleSelectAll);
            th.appendChild(selectAllCheckbox);
        } else if (column.sortable) {
            th.style.cursor = "pointer";
            th.classList.add("sortable");
            th.addEventListener("click", () => {
                // Toggle sort order if clicking the same column
                let sortDescending = false;
                if (userStoriesQAData.sortColumn === column.key) {
                    sortDescending = !userStoriesQAData.sortDescending;
                }
                
                // Request sorted data
                showSpinner();
                vscode.postMessage({
                    command: "sortUserStoriesQA",
                    column: column.key,
                    descending: sortDescending
                });
            });
            
            // Add sort indicator
            if (userStoriesQAData.sortColumn === column.key) {
                th.textContent = column.label + (userStoriesQAData.sortDescending ? " ▼" : " ▲");
            } else {
                th.textContent = column.label;
            }
        } else {
            th.textContent = column.label;
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Create table body
    if (userStoriesQAData.items && userStoriesQAData.items.length > 0) {
        userStoriesQAData.items.forEach(item => {
            const row = document.createElement("tr");
            row.setAttribute("data-story-id", item.storyId); // Add story ID to row for easy identification
            
            // Checkbox column
            const checkboxCell = document.createElement("td");
            checkboxCell.className = "checkbox-column";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "row-checkbox";
            checkbox.checked = selectedItems.has(item.storyId);
            checkbox.addEventListener("change", (e) => {
                handleRowCheckboxChange(item.storyId, e.target.checked);
            });
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
            
            // Story Number
            const storyNumberCell = document.createElement("td");
            storyNumberCell.className = "story-number-column";
            storyNumberCell.textContent = item.storyNumber || '';
            row.appendChild(storyNumberCell);
            
            // Story Text
            const storyTextCell = document.createElement("td");
            storyTextCell.className = "story-text-column";
            storyTextCell.textContent = item.storyText || '';
            row.appendChild(storyTextCell);
            
            // QA Status
            const qaStatusCell = document.createElement("td");
            qaStatusCell.className = "qa-status-column";
            const qaStatusSelect = document.createElement("select");
            qaStatusSelect.className = "qa-status-select";
            
            const statusOptions = [
                { value: 'pending', text: 'Pending' },
                { value: 'ready-to-test', text: 'Ready to Test' },
                { value: 'started', text: 'Started' },
                { value: 'success', text: 'Success' },
                { value: 'failure', text: 'Failure' }
            ];
            
            statusOptions.forEach(option => {
                const optionElement = document.createElement("option");
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                qaStatusSelect.appendChild(optionElement);
            });
            
            // Set the value AFTER adding options
            qaStatusSelect.value = item.qaStatus || 'pending';
            
            qaStatusSelect.addEventListener("change", (e) => {
                handleQAStatusChange(item.storyId, e.target.value);
            });
            
            qaStatusCell.appendChild(qaStatusSelect);
            row.appendChild(qaStatusCell);
            
            // QA Notes
            const qaNotesCell = document.createElement("td");
            qaNotesCell.className = "qa-notes-column";
            const qaNotesTextArea = document.createElement("textarea");
            qaNotesTextArea.className = "qa-notes-input";
            qaNotesTextArea.value = item.qaNotes || '';
            qaNotesTextArea.placeholder = "Enter QA notes...";
            
            qaNotesTextArea.addEventListener("blur", (e) => {
                handleQANotesChange(item.storyId, e.target.value);
            });
            
            qaNotesCell.appendChild(qaNotesTextArea);
            row.appendChild(qaNotesCell);
            
            // Date Verified
            const dateVerifiedCell = document.createElement("td");
            dateVerifiedCell.className = "date-verified-column";
            dateVerifiedCell.textContent = item.dateVerified || '';
            row.appendChild(dateVerifiedCell);
            
            // Add click event listener to toggle checkbox when row is clicked
            row.style.cursor = "pointer";
            row.addEventListener("click", (e) => {
                handleRowClick(e, item.storyId);
            });
            
            tbody.appendChild(row);
        });
    } else {
        // Show empty state
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = columns.length;
        cell.textContent = "No processed user stories found";
        cell.style.textAlign = "center";
        cell.style.padding = "20px";
        cell.style.fontStyle = "italic";
        cell.style.color = "var(--vscode-descriptionForeground)";
        row.appendChild(cell);
        tbody.appendChild(row);
    }
}

// Render record information
function renderRecordInfo() {
    const recordInfo = document.getElementById("record-info");
    if (recordInfo) {
        const totalCount = userStoriesQAData.totalRecords || 0;
        const filteredCount = userStoriesQAData.items ? userStoriesQAData.items.length : 0;
        const selectedCount = selectedItems.size;
        
        let infoText = '';
        if (filteredCount === totalCount) {
            infoText = `${totalCount} processed stories`;
        } else {
            infoText = `${filteredCount} of ${totalCount} processed stories`;
        }
        
        if (selectedCount > 0) {
            infoText += ` (${selectedCount} selected)`;
        }
        
        recordInfo.textContent = infoText;
    }
}

// Keep track of currently opened card in modal
let currentModalStoryId = null;

// Open card detail modal (global function for onclick)
function openCardModal(storyId) {
    const item = allItems.find(i => i.storyId === storyId);
    if (!item) {
        console.error('[userStoriesQAView] Item not found:', storyId);
        return;
    }
    
    currentModalStoryId = storyId;
    
    // Populate modal fields
    document.getElementById('modalStoryNumber').textContent = item.storyNumber || 'N/A';
    document.getElementById('modalStoryText').textContent = item.storyText || 'N/A';
    document.getElementById('modalQAStatus').value = item.qaStatus || 'pending';
    document.getElementById('modalQANotes').value = item.qaNotes || '';
    document.getElementById('modalDateVerified').textContent = item.dateVerified || 'Not yet verified';
    
    // Show modal
    const modal = document.getElementById('cardDetailModal');
    modal.classList.add('active');
    
    // Focus on notes field
    setTimeout(() => {
        document.getElementById('modalQANotes').focus();
    }, 100);
    
    console.log('[userStoriesQAView] Opened modal for story:', storyId);
}

// Close card detail modal (global function for onclick)
function closeCardModal() {
    const modal = document.getElementById('cardDetailModal');
    modal.classList.remove('active');
    currentModalStoryId = null;
    
    console.log('[userStoriesQAView] Closed modal');
}

// Save card detail modal (global function for onclick)
function saveCardModal() {
    if (!currentModalStoryId) {
        console.error('[userStoriesQAView] No story ID for modal save');
        return;
    }
    
    const item = allItems.find(i => i.storyId === currentModalStoryId);
    if (!item) {
        console.error('[userStoriesQAView] Item not found for save:', currentModalStoryId);
        return;
    }
    
    // Get values from modal
    const newStatus = document.getElementById('modalQAStatus').value;
    const newNotes = document.getElementById('modalQANotes').value;
    const oldStatus = item.qaStatus;
    
    // Update item in allItems
    item.qaStatus = newStatus;
    item.qaNotes = newNotes;
    
    // Set date verified if status is success or failure
    if (newStatus === 'success' || newStatus === 'failure') {
        item.dateVerified = new Date().toISOString().split('T')[0];
    }
    
    // Update in userStoriesQAData as well
    const dataItem = userStoriesQAData.items.find(i => i.storyId === currentModalStoryId);
    if (dataItem) {
        dataItem.qaStatus = newStatus;
        dataItem.qaNotes = newNotes;
        if (newStatus === 'success' || newStatus === 'failure') {
            dataItem.dateVerified = new Date().toISOString().split('T')[0];
        }
    }
    
    // Re-render the board (will move card to new column if status changed)
    const boardTab = document.getElementById('board-tab');
    if (boardTab && boardTab.classList.contains('active')) {
        renderKanbanBoard();
    }
    
    // Save the change
    vscode.postMessage({
        command: 'saveQAChange',
        data: {
            storyId: currentModalStoryId,
            qaStatus: newStatus,
            qaNotes: newNotes,
            dateVerified: item.dateVerified || '',
            qaFilePath: item.qaFilePath
        }
    });
    
    console.log('[userStoriesQAView] Saved modal changes for story:', currentModalStoryId);
    
    // Close modal
    closeCardModal();
}

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'setUserStoriesQAData':
            console.log('Received QA data:', message.data);
            hideSpinner();
            
            if (message.data.error) {
                console.error('Error loading QA data:', message.data.error);
                // Show error state
                userStoriesQAData = {
                    items: [],
                    totalRecords: 0,
                    sortColumn: 'storyNumber',
                    sortDescending: false
                };
                allItems = [];
            } else {
                userStoriesQAData = message.data;
                allItems = message.data.items.slice(); // Create a copy for filtering
                selectedItems.clear(); // Clear selection when new data is loaded
            }
            
            renderTable();
            renderRecordInfo();
            updateApplyButtonState();
            
            // Also update kanban board if it's visible
            const boardTab = document.getElementById('board-tab');
            if (boardTab && boardTab.classList.contains('active')) {
                renderKanbanBoard();
            }
            break;
        
        case 'switchToTab':
            // Switch to the specified tab
            if (message.data && message.data.tabName) {
                console.log('[UserStoriesQAView] Received switchToTab command:', message.data.tabName);
                switchTab(message.data.tabName);
            }
            break;
            
        case 'qaChangeSaved':
            console.log('QA change saved:', message.success);
            if (!message.success) {
                console.error('Error saving QA change:', message.error);
                // Could show a notification here
            }
            break;
            
        case 'csvExportReady':
            console.log('CSV export ready');
            if (message.success !== false) {
                // Send CSV content to extension to save to workspace (same pattern as userStoriesView)
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
            console.log('Unknown message:', message);
            break;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('User Stories QA webview loaded');
    
    // Initialize tab functionality
    initializeTabs();
    
    // Setup filter event listeners for auto-apply
    const filterInputs = ['filterStoryNumber', 'filterStoryText', 'filterQAStatus'];
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', applyFilters);
            element.addEventListener('change', applyFilters);
        }
    });
    
    // Setup bulk actions event listeners
    const bulkStatusDropdown = document.getElementById('bulkStatusDropdown');
    const applyButton = document.getElementById('applyButton');
    const exportButton = document.getElementById('exportButton');
    const refreshButton = document.getElementById('refreshButton');
    
    if (bulkStatusDropdown) {
        bulkStatusDropdown.addEventListener('change', () => {
            const hasSelection = selectedItems.size > 0;
            const hasStatus = bulkStatusDropdown.value !== '';
            applyButton.disabled = !(hasSelection && hasStatus);
        });
    }
    
    if (applyButton) {
        applyButton.addEventListener('click', bulkUpdateSelected);
    }
    
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
        // Apply same styling as refresh button
        exportButton.style.background = "none";
        exportButton.style.border = "none";
        exportButton.style.color = "var(--vscode-editor-foreground)";
        exportButton.style.padding = "4px 8px";
        exportButton.style.cursor = "pointer";
        exportButton.style.display = "flex";
        exportButton.style.alignItems = "center";
        exportButton.style.borderRadius = "4px";
        exportButton.style.transition = "background 0.15s";
        // Add hover effect
        exportButton.addEventListener("mouseenter", function() {
            exportButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        exportButton.addEventListener("mouseleave", function() {
            exportButton.style.background = "none";
        });
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', refresh);
        // Setup refresh button icon (following roleRequirementsView pattern exactly)
        refreshButton.innerHTML = '<span class="codicon codicon-refresh" style="font-size:16px;"></span>';
        refreshButton.title = "Refresh";
        refreshButton.style.background = "none";
        refreshButton.style.border = "none";
        refreshButton.style.color = "var(--vscode-editor-foreground)";
        refreshButton.style.padding = "4px 8px";
        refreshButton.style.cursor = "pointer";
        refreshButton.style.display = "flex";
        refreshButton.style.alignItems = "center";
        refreshButton.style.borderRadius = "4px";
        refreshButton.style.transition = "background 0.15s";
        
        // Add hover effect
        refreshButton.addEventListener("mouseenter", function() {
            refreshButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        refreshButton.addEventListener("mouseleave", function() {
            refreshButton.style.background = "none";
        });
    }
    
    // Setup chart type toggle buttons
    const chartTypeBarBtn = document.getElementById('chartTypeBar');
    const chartTypePieBtn = document.getElementById('chartTypePie');
    
    if (chartTypeBarBtn && chartTypePieBtn) {
        chartTypeBarBtn.addEventListener('click', function() {
            if (currentChartType !== 'bar') {
                console.log('[userStoriesQAView] Switching to bar chart');
                currentChartType = 'bar';
                chartTypeBarBtn.classList.add('active');
                chartTypePieBtn.classList.remove('active');
                renderQAStatusDistribution();
            }
        });
        
        chartTypePieBtn.addEventListener('click', function() {
            if (currentChartType !== 'pie') {
                console.log('[userStoriesQAView] Switching to pie chart');
                currentChartType = 'pie';
                chartTypePieBtn.classList.add('active');
                chartTypeBarBtn.classList.remove('active');
                renderQAStatusDistribution();
            }
        });
    }
    
    // Setup histogram refresh button
    const refreshQADistributionButton = document.getElementById('refreshQADistributionButton');
    if (refreshQADistributionButton) {
        refreshQADistributionButton.addEventListener('click', function() {
            console.log('[userStoriesQAView] Refreshing QA distribution');
            
            // Show processing overlay
            const processingOverlay = document.getElementById('qa-distribution-processing');
            if (processingOverlay) {
                processingOverlay.classList.add('active');
            }
            
            // Use setTimeout to allow overlay to show before rendering
            setTimeout(function() {
                renderQAStatusDistribution();
                
                // Hide processing overlay after render
                if (processingOverlay) {
                    processingOverlay.classList.remove('active');
                }
            }, 50);
        });
    }
    
    // Setup PNG generation button
    const generateQADistributionPngBtn = document.getElementById('generateQADistributionPngBtn');
    if (generateQADistributionPngBtn) {
        generateQADistributionPngBtn.addEventListener('click', function() {
            console.log('[userStoriesQAView] Generate PNG button clicked');
            generateQADistributionPNG();
        });
    }
    
    // Setup board filter event listeners
    const boardFilterInputs = ['boardFilterStoryNumber', 'boardFilterStoryText'];
    boardFilterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', applyBoardFilters);
            element.addEventListener('change', applyBoardFilters);
        }
    });
    
    // Setup board action buttons
    const boardExportButton = document.getElementById('boardExportButton');
    const boardRefreshButton = document.getElementById('boardRefreshButton');
    
    if (boardExportButton) {
        boardExportButton.addEventListener('click', exportToCSV);
        // Apply icon button styling
        boardExportButton.style.background = "none";
        boardExportButton.style.border = "none";
        boardExportButton.style.color = "var(--vscode-editor-foreground)";
        boardExportButton.style.padding = "4px 8px";
        boardExportButton.style.cursor = "pointer";
        boardExportButton.style.display = "flex";
        boardExportButton.style.alignItems = "center";
        boardExportButton.style.borderRadius = "4px";
        boardExportButton.style.transition = "background 0.15s";
        boardExportButton.addEventListener("mouseenter", function() {
            boardExportButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        boardExportButton.addEventListener("mouseleave", function() {
            boardExportButton.style.background = "none";
        });
    }
    
    if (boardRefreshButton) {
        boardRefreshButton.addEventListener('click', refresh);
        // Apply icon button styling
        boardRefreshButton.style.background = "none";
        boardRefreshButton.style.border = "none";
        boardRefreshButton.style.color = "var(--vscode-editor-foreground)";
        boardRefreshButton.style.padding = "4px 8px";
        boardRefreshButton.style.cursor = "pointer";
        boardRefreshButton.style.display = "flex";
        boardRefreshButton.style.alignItems = "center";
        boardRefreshButton.style.borderRadius = "4px";
        boardRefreshButton.style.transition = "background 0.15s";
        boardRefreshButton.addEventListener("mouseenter", function() {
            boardRefreshButton.style.background = "var(--vscode-list-hoverBackground)";
        });
        boardRefreshButton.addEventListener("mouseleave", function() {
            boardRefreshButton.style.background = "none";
        });
    }
    
    // Setup drag and drop for kanban columns
    const kanbanColumns = document.querySelectorAll('.kanban-column-content');
    kanbanColumns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
    
    // Check if analysis tab is active on initial load and render distribution
    const analysisTab = document.getElementById('analysis-tab');
    if (analysisTab && analysisTab.classList.contains('active')) {
        console.log('[userStoriesQAView] Analysis tab is active on initial load - rendering distribution');
        setTimeout(function() {
            renderQAStatusDistribution();
        }, 100);
    }
    
    // Check if board tab is active on initial load and render kanban
    const boardTab = document.getElementById('board-tab');
    if (boardTab && boardTab.classList.contains('active')) {
        console.log('[userStoriesQAView] Board tab is active on initial load - rendering kanban board');
        setTimeout(function() {
            renderKanbanBoard();
        }, 100);
    }
    
    // Setup modal close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('cardDetailModal');
            if (modal && modal.classList.contains('active')) {
                closeCardModal();
            }
        }
    });
    
    // Setup modal close on overlay click
    const modalOverlay = document.getElementById('cardDetailModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            // Only close if clicking the overlay itself, not the modal content
            if (e.target === modalOverlay) {
                closeCardModal();
            }
        });
    }
    
    // Send ready message to extension
    vscode.postMessage({
        command: 'UserStoriesQAWebviewReady'
    });
});
